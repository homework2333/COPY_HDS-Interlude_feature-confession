/**
 * 运维套件 Console RPC：
 * - hdsi/ops/recent      调试事件流（环形缓冲最近事件 + 统计；authority=1）
 * - hdsi/lists/read      名单页合并视图（白名单 + 群聊 + 申请 + 参与者状态）
 * - hdsi/lists/save      保存私聊用户/群聊白名单（经配置中心管线持久化）
 * - hdsi/lists/decide    审批白名单申请（approve 时同步写入 onebot.userAccounts）
 * - hdsi/ops/report      日报预览（authority=3，与 interlude.日报 同源）
 * - hdsi/ops/usage       调用分析：用量汇总/趋势分桶/最近流水（authority=1，30s 轮询）
 *
 * 调试页刷新采用轮询（客户端 2s 拉 hdsi/ops/recent）：本版 @koishijs/plugin-console
 * 无通用 broadcast 通道，DataService 全量推送在事件密集时开销过大。
 */
import type { Context, Schema } from 'koishi'
import type { InterludeService } from '../service'
import { applyConfigSectionPatch } from './config-center'
import type { AccessRequestRow } from '../ops/tables'
import { listAccessRequests, recordAccessDecision, gatherDailyReportInput, renderDailyReport } from '../ops/runtime'
import { gatherUsageAnalytics, type UsageAnalyticsResult, type UsagePreset } from '../ops/usage-analytics'
import type { OpsEvent, OpsStreamStats } from '../ops/types'

export interface ListsUserRow {
  qq: string
  label: string
  personId: string
  profile: string
  relationship: string
  enabled: boolean
  proactive: boolean
  /** 参与者运行态（可选）：入组时间/最近活跃。 */
  joinedAt?: string
  lastActiveAt?: string
  displayName?: string
  pendingRequest?: boolean
}

export interface ListsGroupRow {
  groupId: string
  label: string
  enabled: boolean
  responseMode?: string
  collectionScope?: string
  immediateTrigger?: string
  backgroundParticipation?: string
  purpose: string
  characterRole: string
}

export interface ListsReadResult {
  ok: boolean
  error?: string
  onebotEnabled: boolean
  users: ListsUserRow[]
  groups: ListsGroupRow[]
  botAccounts: Array<{ qq: string, label: string, enabled: boolean }>
  managers: string[]
  requests: Array<AccessRequestRow & { qq: string }>
  proactive: { mode: string, list: string[] }
}

export interface ListsSaveResult {
  ok: boolean
  error?: string
}

export interface OpsRecentResult {
  ok: boolean
  events: OpsEvent[]
  stats: OpsStreamStats
}

declare module '@koishijs/console' {
  interface Events {
    'hdsi/ops/recent'(payload: { limit?: number }): Promise<OpsRecentResult>
    'hdsi/lists/read'(): Promise<ListsReadResult>
    'hdsi/lists/save'(payload: { users?: unknown[], groups?: unknown[] }): Promise<ListsSaveResult>
    'hdsi/lists/decide'(payload: { qq: string, approve: boolean, note?: string }): Promise<ListsSaveResult & { request?: AccessRequestRow }>
    'hdsi/ops/report'(payload: { date?: string }): Promise<{ ok: boolean, text?: string, error?: string }>
    'hdsi/ops/usage'(payload: { preset?: string, limit?: number }): Promise<UsageAnalyticsResult>
  }
}

function sanitizeAccountRow(value: unknown): { qq: string, label: string, enabled: boolean, proactive?: boolean, personId?: string, profile?: string, relationship?: string } {
  const row = (value ?? {}) as Record<string, unknown>
  return {
    qq: String(row.qq ?? '').trim(),
    label: String(row.label ?? '').slice(0, 255),
    enabled: row.enabled !== false,
    ...(row.proactive !== undefined ? { proactive: row.proactive === true } : {}),
    ...(typeof row.personId === 'string' ? { personId: row.personId.slice(0, 255) } : {}),
    ...(typeof row.profile === 'string' ? { profile: row.profile.slice(0, 8_000) } : {}),
    ...(typeof row.relationship === 'string' ? { relationship: row.relationship.slice(0, 8_000) } : {}),
  }
}

export function installOpsRpc(ctx: Context, host: InterludeService, configSchema: Schema): void {
  const READ = 1
  const WRITE = 3

  ctx.console.addListener('hdsi/ops/recent', payload => Promise.resolve(((): OpsRecentResult => {
    const limit = Math.min(500, Math.max(20, Number(payload?.limit) || 200))
    return { ok: true, events: host.opsBus.recent(limit), stats: host.opsBus.snapshot() }
  })()), { authority: READ })

  ctx.console.addListener('hdsi/lists/read', () => Promise.resolve((async (): Promise<ListsReadResult> => {
    const onebot = host.config.onebot
    const requests = await listAccessRequests(host).catch(() => [] as AccessRequestRow[])
    const pendingQqs = new Set(requests.filter(row => row.status === 'pending').map(row => String(row.qq)))
    // 参与者运行态（按 QQ 建索引；无活跃故事时为空）。
    const participantsByUserId = new Map<string, { joinedAt?: string, lastActiveAt?: string, displayName?: string }>()
    try {
      const rows = await ctx.database.get('interlude_participant', { status: 'active' }) as Array<{
        userId: string, displayName: string, createdAt: Date, updatedAt: Date,
      }>
      for (const participant of rows) {
        const existing = participantsByUserId.get(participant.userId)
        const candidate = {
          displayName: participant.displayName || undefined,
          joinedAt: participant.createdAt ? new Date(participant.createdAt).toISOString() : undefined,
          lastActiveAt: participant.updatedAt ? new Date(participant.updatedAt).toISOString() : undefined,
        }
        if (!existing || (candidate.lastActiveAt ?? '') > (existing.lastActiveAt ?? '')) {
          participantsByUserId.set(participant.userId, candidate)
        }
      }
    } catch { /* 无故事或查询失败时仅展示配置面 */ }
    const users: ListsUserRow[] = (onebot?.userAccounts ?? []).map(row => {
      const account = sanitizeAccountRow(row)
      const runtime = participantsByUserId.get(account.qq)
      return {
        qq: account.qq,
        label: account.label,
        personId: account.personId ?? '',
        profile: account.profile ?? '',
        relationship: account.relationship ?? '',
        enabled: account.enabled,
        proactive: account.proactive !== false,
        ...runtime,
        pendingRequest: pendingQqs.has(account.qq),
      }
    })
    const groups: ListsGroupRow[] = (onebot?.groupChats ?? []).map(rule => ({
      groupId: String((rule as any).groupId ?? ''),
      label: String((rule as any).label ?? ''),
      enabled: (rule as any).enabled !== false,
      responseMode: (rule as any).responseMode,
      collectionScope: (rule as any).collectionScope,
      immediateTrigger: (rule as any).immediateTrigger,
      backgroundParticipation: (rule as any).backgroundParticipation,
      purpose: String((rule as any).purpose ?? ''),
      characterRole: String((rule as any).characterRole ?? ''),
    }))
    return {
      ok: true,
      onebotEnabled: onebot?.enabled === true,
      users,
      groups,
      botAccounts: (onebot?.botAccounts ?? []).map(row => {
        const account = sanitizeAccountRow(row)
        return { qq: account.qq, label: account.label, enabled: account.enabled }
      }),
      managers: [...(host.config.sharedStory?.managerAccounts ?? [])],
      requests: requests.map(row => ({ ...row, qq: String(row.qq) })),
      proactive: {
        mode: String((host.config.sharedStory as any)?.proactiveContacts?.mode ?? 'all'),
        list: Array.isArray((host.config.sharedStory as any)?.proactiveContacts?.list)
          ? (host.config.sharedStory as any).proactiveContacts.list.map((item: unknown) => String(item)) : [],
      },
    }
  })()), { authority: READ })

  ctx.console.addListener('hdsi/lists/save', payload => Promise.resolve((async (): Promise<ListsSaveResult> => {
    const patch: Record<string, unknown> = {}
    if (Array.isArray(payload?.users)) {
      const seen = new Set<string>()
      const rows = payload.users.map(sanitizeAccountRow).filter(row => {
        if (!/^\d{5,12}$/.test(row.qq)) return false
        if (seen.has(row.qq)) return false
        seen.add(row.qq)
        return true
      })
      if (rows.length > 200) return { ok: false, error: '白名单用户数超出上限（200）。' }
      patch.userAccounts = rows.map(row => ({
        qq: row.qq, label: row.label, enabled: row.enabled,
        ...(row.personId ? { personId: row.personId } : {}),
        ...(row.profile ? { profile: row.profile } : {}),
        ...(row.relationship ? { relationship: row.relationship } : {}),
        ...(row.proactive !== undefined ? { proactive: row.proactive } : {}),
      }))
    }
    if (Array.isArray(payload?.groups)) {
      const seen = new Set<string>()
      const rows = (payload.groups as Record<string, unknown>[]).map(rule => rule).filter(rule => {
        const groupId = String((rule as any).groupId ?? '').trim()
        if (!/^\d{5,12}$/.test(groupId)) return false
        if (seen.has(groupId)) return false
        seen.add(groupId)
        return true
      })
      if (rows.length > 100) return { ok: false, error: '群聊白名单数超出上限（100）。' }
      // 群规则字段以现有行为基线：只保留页面可见的子集，其余交给配置中心完整表单。
      patch.groupChats = rows.map(rule => ({
        groupId: String((rule as any).groupId ?? '').trim(),
        label: String((rule as any).label ?? '').slice(0, 255),
        enabled: (rule as any).enabled !== false,
        ...(typeof (rule as any).purpose === 'string' ? { purpose: (rule as any).purpose.slice(0, 4_000) } : {}),
        ...(typeof (rule as any).characterRole === 'string' ? { characterRole: (rule as any).characterRole.slice(0, 4_000) } : {}),
        ...(typeof (rule as any).responseMode === 'string' ? { responseMode: (rule as any).responseMode } : {}),
      }))
    }
    if (!Object.keys(patch).length) return { ok: false, error: '没有可保存的变更（users/groups 均缺）。' }
    const result = applyConfigSectionPatch(host, configSchema, 'onebot', patch)
    if (!result.ok) return result
    host.opsBus.publish({ kind: 'log', level: 'info', message: `名单已更新（${Object.keys(patch).join('、')}）`, phase: 'lists', protagonist: 'HDSI' })
    return { ok: true }
  })()), { authority: WRITE })

  ctx.console.addListener('hdsi/lists/decide', payload => Promise.resolve((async (): Promise<ListsSaveResult & { request?: AccessRequestRow }> => {
    const qq = String(payload?.qq ?? '').trim()
    if (!/^\d{5,12}$/.test(qq)) return { ok: false, error: 'QQ 号无效。' }
    const approve = payload?.approve === true
    if (approve) {
      const accounts = host.config.onebot?.userAccounts ?? []
      if (!host.config.onebot?.enabled) return { ok: false, error: '当前未启用 OneBot 白名单（onebot.enabled=false）。' }
      if (!accounts.some(account => String(account.qq).trim() === qq)) {
        const result = applyConfigSectionPatch(host, configSchema, 'onebot', {
          userAccounts: [...accounts, { qq, label: '', enabled: true }],
        })
        if (!result.ok) return result
      }
    }
    const request = await recordAccessDecision(host, qq, approve, payload?.note ?? '')
    return { ok: true, request: request ?? undefined }
  })()), { authority: WRITE })

  ctx.console.addListener('hdsi/ops/report', payload => Promise.resolve((async () => {
    let anchor: Date | undefined
    const date = String(payload?.date ?? '').trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      anchor = new Date(`${date}T12:00:00`)
      if (Number.isNaN(anchor.getTime())) anchor = undefined
    }
    const input = await gatherDailyReportInput(host, anchor)
    return { ok: true, text: renderDailyReport(input) }
  })()), { authority: WRITE })

  ctx.console.addListener('hdsi/ops/usage', payload => Promise.resolve((async (): Promise<UsageAnalyticsResult> => {
    const preset: UsagePreset = payload?.preset === 'yesterday' || payload?.preset === '7d' ? payload.preset : 'today'
    const limit = Math.min(200, Math.max(10, Number(payload?.limit) || 50))
    try {
      return await gatherUsageAnalytics(host, preset, limit)
    } catch (error: any) {
      return { ok: false, error: error?.message ?? String(error), preset, range: { from: 0, to: 0 }, bucketMode: preset === '7d' ? 'day' : 'hour', totals: { calls: 0, inputTokens: 0, outputTokens: 0, cachedInputTokens: 0, cost: 0 }, byTask: [], buckets: [], recent: [] }
    }
  })()), { authority: READ })
}
