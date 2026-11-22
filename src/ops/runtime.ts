/**
 * 运维套件编排层：service 侧薄封装（与 inbound-gate 相同的 svc:any 注入风格）。
 * - persistUsageRecord / persistOpsLog：落库（日报数据源）
 * - scheduleDailyReport / runDailyReport：故事时区 0 点日报链
 * - noteAccessRequest / noteFriendRequest / recordAccessDecision：白名单申请
 * - readHostStatusSnapshot：宿主机采集 JSON（可选，采集由宿主 cron 完成）
 */
import { resolve } from 'node:path'
import type { Session } from 'koishi'
import type { AccessRequestRow, OpsLogRow, UsageLogRow } from './tables'
import type { DailyReportConfig } from './types'
import type { DailyReportInput, HostStatusSnapshot } from './daily-report'
import { localDayRange, nextDailyRun, renderDailyReport, usageRowsToAgg } from './daily-report'
import { isOneBotPlatform, normalizeAccountId } from '../session-platform'
import { peakValleyMultiplier, type ProviderPeakValleyPricing } from '../narrator'
import { HDS_INTERLUDE_VERSION } from '../meta'

/** 日报覆盖“刚结束的这一天”：触发时刻回退一分钟取上一个自然日。 */
const DAY_BACKOFF_MS = 60_000

function opsConfig(svc: any) {
  return ((svc.config as any).ops ?? {}) as {
    dailyReport?: Partial<DailyReportConfig>
    accessRequests?: { enabled?: boolean, autoReply?: boolean, replyText?: string, notifyManagers?: boolean }
    debugStream?: { enabled?: boolean, scriptPreview?: boolean, maxEvents?: number, persistErrors?: boolean }
  }
}

export function dailyReportConfig(svc: any): DailyReportConfig {
  const raw = opsConfig(svc).dailyReport ?? {}
  return {
    enabled: raw.enabled === true,
    receiver: String(raw.receiver ?? '').trim(),
    hour: Number.isFinite(raw.hour) ? Math.min(23, Math.max(0, Number(raw.hour))) : 0,
    minute: Number.isFinite(raw.minute) ? Math.min(59, Math.max(0, Number(raw.minute))) : 0,
    includeHostStatus: raw.includeHostStatus !== false,
  }
}

export function storyTimezone(svc: any) {
  return (svc.config?.storyDefaults?.timezone as string) || 'Asia/Shanghai'
}

/** 每会话每天一次礼貌回复（进程内；与 AstrBot whitelistpro 的频率口径一致）。 */
const dailyReplyCache = new Map<string, string>()

function shouldAutoReply(qq: string, dayKey: string): boolean {
  if (dailyReplyCache.get(qq) === dayKey) return false
  dailyReplyCache.set(qq, dayKey)
  if (dailyReplyCache.size > 500) {
    // 粗暴防泄漏：满 500 条时清掉非今天的键。
    for (const [key, value] of dailyReplyCache) if (value !== dayKey) dailyReplyCache.delete(key)
  }
  return true
}

/* ── 发送 ─────────────────────────────────────────────────────────── */

/** 内部统一出口：优先 svc.sendOpsPrivate 覆写（测试/桥接注入），否则走真实 bot。
 * 供日报与人设周报两条定时链共用。 */
export async function deliverPrivate(svc: any, qq: string, text: string): Promise<boolean> {
  if (typeof svc?.sendOpsPrivate === 'function') return svc.sendOpsPrivate(qq, text)
  return sendOpsPrivate(svc, qq, text)
}

export async function sendOpsPrivate(svc: any, qq: string, text: string): Promise<boolean> {
  const target = normalizeAccountId(qq)
  if (!target) return false
  for (const bot of svc.ctx.bots as any[]) {
    if (!isOneBotPlatform(bot.platform)) continue
    try {
      // Koishi 4.x 通用 API：OneBot 适配器把 "private:<qq>" 通道译成 send_private_msg。
      // Bot 基类没有 sendPrivateMsg（那是 OneBot internal 的方法名），误用会抛 TypeError。
      await bot.sendMessage(`private:${target}`, text)
      return true
    } catch (error) {
      // 失败要可见：通知静默丢失是运维套件的隐蔽故障模式。
      svc.reportStandalone?.('warn', '私聊发送失败 目标=%s 错误=%s',
        target, error instanceof Error ? error.message : String(error))
    }
  }
  return false
}

function managerTargets(svc: any): string[] {
  const managers = (svc.sharedStoryConfig?.managerAccounts ?? []) as string[]
  return managers.map(normalizeAccountId).filter(Boolean)
}

/* ── 用量 / 错误落库 ──────────────────────────────────────────────── */

/** 按连接价格字段（每百万 token）估算单次调用费用；填写单价按空闲价计，
 * record.pricePeakValley 启用且 now（北京时间）处于官方高峰时段时按系数放大。 */
export function estimateTokenCost(record: {
  inputTokens?: number, outputTokens?: number, cachedInputTokens?: number,
  priceInput?: number, priceOutput?: number, priceCachedInput?: number,
  pricePeakValley?: ProviderPeakValleyPricing,
}, now: Date = new Date()): number {
  const input = record.inputTokens ?? 0
  const output = record.outputTokens ?? 0
  const cached = record.cachedInputTokens ?? 0
  const uncached = Math.max(0, input - cached)
  const base = (uncached * (record.priceInput ?? 0) + cached * (record.priceCachedInput ?? 0) + output * (record.priceOutput ?? 0)) / 1_000_000
  return base * peakValleyMultiplier(record.pricePeakValley, now)
}

export function persistUsageRecord(svc: any, record: {
  task: string, providerLabel: string, model: string,
  inputTokens?: number, outputTokens?: number, cachedInputTokens?: number,
  priceInput?: number, priceOutput?: number, priceCachedInput?: number,
  pricePeakValley?: ProviderPeakValleyPricing,
}): void {
  if (typeof svc?.dbCreate !== 'function') return
  const now = new Date()
  void svc.dbCreate('interlude_usage_log', {
    ts: now, task: String(record.task ?? 'unknown').slice(0, 63),
    providerLabel: String(record.providerLabel ?? '').slice(0, 127),
    model: String(record.model ?? '').slice(0, 127),
    inputTokens: record.inputTokens ?? 0, outputTokens: record.outputTokens ?? 0,
    cachedInputTokens: record.cachedInputTokens ?? 0, cost: estimateTokenCost(record, now),
  }).catch((error: unknown) => {
    svc.reportStandalone?.('warn', '用量落库失败 错误=%s', error)
  })
}

export function persistOpsLog(svc: any, level: 'error' | 'warn', phase: string, message: string): void {
  if (opsConfig(svc).debugStream?.persistErrors === false) return
  if (typeof svc?.dbCreate !== 'function') return
  void svc.dbCreate('interlude_ops_log', {
    ts: new Date(), level, phase: String(phase ?? 'system').slice(0, 63),
    message: String(message ?? '').slice(0, 2_000),
  }).catch((): undefined => undefined)
}

/* ── 宿主机状态 ───────────────────────────────────────────────────── */

export function readHostStatusSnapshot(baseDir: string): HostStatusSnapshot | null {
  const file = resolve(baseDir, 'data/hds-interlude/host-status.json')
  try {
    // 同步读：日报路径低频，且避免 async 传染 gatherDailyReportInput 签名。
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const text = require('node:fs').readFileSync(file, 'utf-8') as string
    const parsed = JSON.parse(text) as HostStatusSnapshot
    if (typeof parsed?.ts === 'number') return parsed
    return null
  } catch {
    return null
  }
}

/* ── 日报 ─────────────────────────────────────────────────────────── */

export async function gatherDailyReportInput(svc: any, anchor = new Date(Date.now() - DAY_BACKOFF_MS)): Promise<DailyReportInput & { label: string }> {
  const timezone = storyTimezone(svc)
  const range = localDayRange(anchor, timezone)
  const dayStart = new Date(range.start)
  const dayEnd = new Date(range.end)
  const [usageRows, errorRows, warnRows] = await Promise.all([
    svc.dbGet('interlude_usage_log', { ts: { $gte: dayStart, $lt: dayEnd } }) as Promise<UsageLogRow[]>,
    svc.dbGet('interlude_ops_log', { ts: { $gte: dayStart, $lt: dayEnd }, level: 'error' }) as Promise<OpsLogRow[]>,
    svc.dbGet('interlude_ops_log', { ts: { $gte: dayStart, $lt: dayEnd }, level: 'warn' }) as Promise<OpsLogRow[]>,
  ])
  const ydayRows = await svc.dbGet('interlude_usage_log', { ts: { $gte: new Date(range.start - 86_400_000), $lt: dayStart } }) as UsageLogRow[]
  const ydayAgg = usageRowsToAgg(ydayRows).reduce((acc, row) => acc + row.inputTokens + row.outputTokens, 0)
  const pending = await svc.dbGet('interlude_access_request', { status: 'pending' }) as AccessRequestRow[]
  let health = { successes: 0, retries: 0, failures: 0, avgLatencyMs: 0 }
  try {
    const snapshots = svc.health?.all?.() ?? {}
    for (const snap of Object.values<any>(snapshots)) {
      health.successes += snap.narrativeTotal ?? 0
      health.failures += snap.narrativeFailed ?? 0
      health.retries += snap.recoverySaved ?? 0
      health.avgLatencyMs = Math.max(health.avgLatencyMs, snap.medianLatencyMs ?? 0)
    }
  } catch { /* 健康面板缺失时保持 0 值 */ }
  return {
    dayLabel: range.label,
    usage: usageRowsToAgg(usageRows),
    yesterdayTotalTokens: ydayAgg,
    errors: errorRows,
    warns: warnRows,
    health,
    uptimeSeconds: (Date.now() - (svc.bootedAt ?? Date.now())) / 1000,
    version: HDS_INTERLUDE_VERSION,
    hostStatus: dailyReportConfig(svc).includeHostStatus ? readHostStatusSnapshot(svc.ctx?.baseDir ?? '.') : null,
    pendingAccessRequests: pending.length,
    label: range.label,
  }
}

export async function runDailyReport(svc: any): Promise<boolean> {
  const config = dailyReportConfig(svc)
  if (!config.enabled) return false
  const input = await gatherDailyReportInput(svc)
  const text = renderDailyReport(input)
  const receiver = config.receiver || managerTargets(svc)[0] || ''
  if (!receiver) {
    svc.reportStandalone?.('warn', '日报未发送：未配置接收人（ops.dailyReport.receiver 或 managerAccounts）')
    return false
  }
  const ok = await deliverPrivate(svc, receiver, text)
  svc.reportStandaloneOperation?.('standard', ok ? 'info' : 'warn', '每日日报 %s 接收人=%s', ok ? '已发送' : '发送失败', receiver)
  void cleanupOpsTables(svc).catch((): undefined => undefined)
  return ok
}

/** 定时链：每次触发后重新武装；配置变更在下一轮生效。 */
export function scheduleDailyReport(svc: any): void {
  const arm = () => {
    const config = dailyReportConfig(svc)
    const next = nextDailyRun(new Date(), storyTimezone(svc), config.hour, config.minute)
    svc.ctx.setTimeout(() => {
      void runDailyReport(svc).catch(error => svc.reportStandalone?.('error', '每日日报执行失败 错误=%s', error)).finally(arm)
    }, Math.max(1_000, next.getTime() - Date.now()))
  }
  arm()
}

/** 用量表保留 60 天、错误表保留 30 天（与备份保留口径对齐）。 */
export async function cleanupOpsTables(svc: any): Promise<void> {
  const now = Date.now()
  await svc.dbRemove?.('interlude_usage_log', { ts: { $lt: new Date(now - 60 * 86_400_000) } })
  await svc.dbRemove?.('interlude_ops_log', { ts: { $lt: new Date(now - 30 * 86_400_000) } })
}

/* ── 白名单申请 ───────────────────────────────────────────────────── */

async function upsertAccessRequest(svc: any, qq: string, displayName: string, source: string, note: string, flag?: string): Promise<AccessRequestRow> {
  const now = new Date()
  const rows = await svc.dbGet('interlude_access_request', { qq }) as AccessRequestRow[]
  if (rows.length) {
    const row = rows[0]
    const { id: _omit, ...rest } = row
    const updated = {
      ...rest, lastRequestAt: now, attempts: (row.attempts ?? 0) + 1,
      displayName: displayName || row.displayName,
      status: row.status === 'approved' ? 'approved' : 'pending',
      note: note || row.note,
      ...(flag ? { flag } : {}),
    }
    await svc.dbSet('interlude_access_request', { id: row.id }, updated)
    return { ...updated, id: row.id }
  }
  const created = await svc.dbCreate('interlude_access_request', {
    qq, displayName, source, firstRequestAt: now, lastRequestAt: now,
    attempts: 1, status: 'pending', note, ...(flag ? { flag } : {}),
  }) as AccessRequestRow
  svc.opsBus?.publish({ kind: 'access', qq, displayName, source, status: 'pending' })
  return Array.isArray(created) ? created[0] : created
}

export async function notifyManagers(svc: any, text: string): Promise<void> {
  if (opsConfig(svc).accessRequests?.notifyManagers === false) return
  for (const target of managerTargets(svc)) {
    const ok = await deliverPrivate(svc, target, text)
    if (!ok) svc.reportStandalone?.('warn', '申请通知发送失败 目标=%s', target)
  }
}

/** 陌生人私聊：记录申请 + 每天一次礼貌回复。返回 true = 已消费该消息。 */
export async function noteAccessRequest(svc: any, session: Session): Promise<boolean> {
  const config = opsConfig(svc).accessRequests
  if (config?.enabled === false) return false
  if (!isOneBotPlatform(session.platform)) return false
  if (!(svc.config?.onebot as any)?.enabled) return false
  const qq = normalizeAccountId(session.userId)
  if (!qq) return false
  const displayName = String(session.username || session.author?.nickname || qq).slice(0, 255)
  const dayKey = localDayRange(new Date(), storyTimezone(svc)).label
  await upsertAccessRequest(svc, qq, displayName, 'private', '')
  const preview = (session.content ?? '').replace(/\s+/g, ' ').trim().slice(0, 60)
  await notifyManagers(svc, [
    '【HDSI 白名单申请】',
    `申请人：${displayName}(${qq})`,
    preview ? `消息预览：${preview}` : '（无文本）',
    '',
    `同意：interlude.授权 ${qq}`,
    `拒绝：interlude.拒绝 ${qq}`,
  ].join('\n'))
  if (config?.autoReply !== false && shouldAutoReply(qq, dayKey)) {
    const text = config?.replyText?.trim() || '珈珈现在还不认识你哦～要先经过主人同意，才能和我聊天w（已把你的申请告诉主人啦）'
    await deliverPrivate(svc, qq, text)
  }
  return true
}

/** 好友申请：记录（含 flag）+ 通知管理员。同意好友后白名单自动生效。 */
export async function noteFriendRequest(svc: any, session: Session): Promise<void> {
  const config = opsConfig(svc).accessRequests
  if (config?.enabled === false) return
  const qq = normalizeAccountId(session.userId)
  if (!qq) return
  const displayName = String(session.username || session.author?.nickname || qq).slice(0, 255)
  const comment = String(session.content ?? '').replace(/\s+/g, ' ').trim().slice(0, 100)
  const flag = String(session.messageId ?? '')
  await upsertAccessRequest(svc, qq, displayName, 'friend-request', comment, flag)
  await notifyManagers(svc, [
    '【收到好友申请】',
    `申请人：${displayName}(${qq})`,
    `验证消息：${comment || '(无)'}`,
    '',
    `同意好友（自动进白名单）：interlude.好友同意 ${flag}`,
    `拒绝好友：interlude.好友拒绝 ${flag}`,
  ].join('\n'))
}

/** 好友同意/拒绝命令：用通知里的 flag 找回对应申请（QQ 号、昵称、验证消息）。 */
export async function findAccessRequestByFlag(svc: any, flag: string): Promise<AccessRequestRow | null> {
  const target = String(flag ?? '').trim()
  if (!target) return null
  try {
    const rows = await svc.dbGet('interlude_access_request', { flag: target }) as AccessRequestRow[]
    return rows?.[0] ?? null
  } catch {
    return null
  }
}

export async function listAccessRequests(svc: any, status?: string): Promise<AccessRequestRow[]> {
  const query = status ? { status } : {}
  return svc.dbGet('interlude_access_request', query) as Promise<AccessRequestRow[]>
}

/** 审批落库（配置写入由调用方负责：命令在 index.ts，页面在 console/ops.ts）。 */
export async function recordAccessDecision(svc: any, qq: string, approve: boolean, note = ''): Promise<AccessRequestRow | null> {
  const target = normalizeAccountId(qq)
  if (!target) return null
  const rows = await svc.dbGet('interlude_access_request', { qq: target }) as AccessRequestRow[]
  if (!rows.length) {
    // 未申请过的 QQ 也可以直接授权（如把 AstrBot 白名单迁移回来）。
    const now = new Date()
    const created = await svc.dbCreate('interlude_access_request', {
      qq: target, displayName: '', source: 'console', firstRequestAt: now, lastRequestAt: now,
      attempts: 0, status: approve ? 'approved' : 'rejected', decidedAt: now, note,
    }) as AccessRequestRow
    svc.opsBus?.publish({ kind: 'access', qq: target, displayName: '', source: 'console', status: approve ? 'approved' : 'rejected' })
    return Array.isArray(created) ? created[0] : created
  }
  const row = rows[0]
  const now = new Date()
  const { id: _omit, ...rest } = row
  const updated = { ...rest, status: approve ? 'approved' : 'rejected', decidedAt: now, note: note || row.note }
  await svc.dbSet('interlude_access_request', { id: row.id }, updated)
  svc.opsBus?.publish({ kind: 'access', qq: target, displayName: row.displayName, source: row.source, status: updated.status })
  return { ...updated, id: row.id }
}

export { renderDailyReport }
