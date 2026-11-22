/**
 * 人设周报：四指标周汇总（口头禅重复率 / 消息长度分布 / 主动消息响应率 /
 * 虚构回归监测）+ 对话轮次抽样，私聊发给接收人。定时链与 scheduleDailyReport
 * 同款（arm → 触发 → 重新武装）；配置在 ops.personaWeekly（Schema 见 index.ts
 * 【运维 23】）。数据源 interlude_script_entry（occurredAt 有索引）。
 */
import type { PersonaWeeklyConfig } from './types'
import { localDayRange } from './daily-report'
import { aggregatePersonaMetrics, type MetricEntry, type PersonaMetricsInput } from './persona-metrics'
import { deliverPrivate } from './runtime'

const DAY = 86_400_000

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(max, Math.max(min, Math.round(numeric)))
}

export function personaWeeklyConfig(svc: any): PersonaWeeklyConfig {
  const raw = ((svc.config as any).ops ?? {}).personaWeekly ?? {}
  return {
    enabled: raw.enabled === true,
    receiver: String(raw.receiver ?? '').trim(),
    weekday: clampNumber(raw.weekday, 0, 0, 6),
    hour: clampNumber(raw.hour, 20, 0, 23),
    minute: clampNumber(raw.minute, 0, 0, 59),
    sampleCount: clampNumber(raw.sampleCount, 10, 0, 30),
  }
}

/** 故事时区里下一次「weekday hh:mm」出现时刻（weekday: 0=周日…6=周六）。
 * localDayRange 给出本地日界的 UTC ms；固定偏移时区直接加 hh:mm 即目标时刻。 */
export function nextWeeklyRun(now: Date, timezone: string, weekday: number, hour: number, minute: number): Date {
  for (let delta = 0; delta <= 7; delta++) {
    const range = localDayRange(new Date(now.getTime() + delta * DAY), timezone)
    const [year, month, day] = range.label.split('-').map(Number)
    const weekdayOfLabel = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
    if (weekdayOfLabel !== weekday) continue
    const target = range.start + (hour * 60 + minute) * 60_000
    if (target > now.getTime()) return new Date(target)
  }
  return new Date(now.getTime() + DAY)
}

export interface PersonaWeeklyInput {
  weekLabel: string
  timezone: string
  metrics: PersonaMetricsInput
  /** 最近的对话轮次（新→旧）。 */
  samples: Array<{ at: number, user: string, character: string[] }>
}

/** 过去 7 个本地日（截至 anchor 所在日）的脚本条目 → 四指标聚合。 */
export async function gatherPersonaWeeklyInput(svc: any, anchor = new Date()): Promise<PersonaWeeklyInput> {
  const timezone = (svc.config?.storyDefaults?.timezone as string) || 'Asia/Shanghai'
  const end = localDayRange(anchor, timezone).end
  const start = end - 7 * DAY
  const rows = await svc.dbGet('interlude_script_entry', {
    occurredAt: { $gte: new Date(start), $lt: new Date(end) },
  }) as MetricEntry[]
  const metrics = aggregatePersonaMetrics(rows)
  const config = personaWeeklyConfig(svc)
  const labelOf = (time: number) => localDayRange(new Date(time), timezone).label
  return {
    weekLabel: `${labelOf(start).slice(5)} ~ ${labelOf(Math.min(end - 1, Date.now())).slice(5)}`,
    timezone,
    metrics,
    samples: metrics.rounds.slice(-config.sampleCount).reverse(),
  }
}

export function renderPersonaWeeklyReport(input: PersonaWeeklyInput): string {
  const { metrics } = input
  const lines = [`🎭 HDSI 人设周报 · ${input.weekLabel}`, '']
  const length = metrics.length
  if (!length.messages) {
    lines.push('【她的台词】本周没有角色可见消息')
  } else {
    lines.push(`【她的台词】${length.messages} 条 · 平均 ${length.meanLength.toFixed(1)} 字 / 中位 ${length.medianLength} 字`)
    lines.push(`└ 分布：${length.buckets.map(bucket => `${bucket.label}字 ${bucket.count}`).join(' · ')}`)
  }

  const catchphrase = metrics.catchphrase
  lines.push('')
  lines.push(`【口头禅】密度 ${catchphrase.fillerPerMessage.toFixed(2)} 个/条 · 单条超限 ${catchphrase.overusedFillers.length} 词 · 句式连开 ${catchphrase.openingStreaks.length} 段`)
  for (const item of catchphrase.overusedFillers.slice(0, 3)) lines.push(`· “${item.word}” ${item.messages} 条 样例：${item.sample}`)
  for (const streak of catchphrase.openingStreaks.slice(0, 3)) lines.push(`· 连开 ×${streak.length} 开头“${streak.key.slice(0, 8)}”`)
  if (!catchphrase.overusedFillers.length && !catchphrase.openingStreaks.length) lines.push('（干净）')

  const proactive = metrics.proactive
  lines.push('')
  lines.push(`【主动消息】发起 ${proactive.sent} · ${proactive.windowMinutes} 分钟内回复 ${proactive.responded}（${proactive.rate == null ? '无样本' : `${Math.round(proactive.rate * 100)}%`}）· 中位响应 ${proactive.medianResponseMinutes ?? '—'} 分钟`)

  const fabrication = metrics.fabrication
  lines.push('')
  lines.push(`【虚构监测】扫描 ${fabrication.scanned} 条 · 命中 ${fabrication.hits.length} 处${fabrication.hits.length ? '（需人工复核）' : ''}`)
  const stamp = new Intl.DateTimeFormat('zh-CN', { timeZone: input.timezone, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  for (const hit of fabrication.hits.slice(0, 5)) lines.push(`⚠ ${stamp.format(new Date(hit.at))} ${hit.detail.slice(0, 90)}`)

  if (input.samples.length) {
    lines.push('')
    lines.push(`【对话抽样】最近 ${input.samples.length} 轮`)
    for (const round of input.samples) {
      lines.push(`· ${stamp.format(new Date(round.at))} 你：${round.user.slice(0, 40) || '（无文本）'}`)
      for (const speech of round.character.slice(0, 2)) lines.push(`  她：${speech.slice(0, 40)}`)
    }
  }
  return lines.join('\n')
}

/** 生成并发送一份周报；enabled=false 时不动作。 */
export async function runPersonaWeeklyReport(svc: any): Promise<boolean> {
  const config = personaWeeklyConfig(svc)
  if (!config.enabled) return false
  const input = await gatherPersonaWeeklyInput(svc)
  const text = renderPersonaWeeklyReport(input)
  const managers = (svc.sharedStoryConfig?.managerAccounts ?? []) as string[]
  const receiver = config.receiver || managers[0] || ''
  if (!receiver) {
    svc.reportStandalone?.('warn', '人设周报未发送：未配置接收人（ops.personaWeekly.receiver 或 managerAccounts）')
    return false
  }
  const ok = await deliverPrivate(svc, receiver, text)
  svc.reportStandaloneOperation?.('standard', ok ? 'info' : 'warn', '人设周报 %s 接收人=%s', ok ? '已发送' : '发送失败', receiver)
  return ok
}

/** 定时链：每次触发后重新武装；配置变更随插件重载生效。enabled=false 时不挂定时器。 */
export function schedulePersonaWeekly(svc: any): void {
  const arm = () => {
    const config = personaWeeklyConfig(svc)
    if (!config.enabled) return
    const timezone = (svc.config?.storyDefaults?.timezone as string) || 'Asia/Shanghai'
    const next = nextWeeklyRun(new Date(), timezone, config.weekday, config.hour, config.minute)
    svc.ctx.setTimeout(() => {
      void runPersonaWeeklyReport(svc).catch(error => svc.reportStandalone?.('error', '人设周报执行失败 错误=%s', error)).finally(arm)
    }, Math.max(1_000, next.getTime() - Date.now()))
  }
  arm()
}
