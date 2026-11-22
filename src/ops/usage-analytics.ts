/**
 * 调用分析页（Console「调用分析」）的纯函数与聚合入口。
 * 数据源仍是 interlude_usage_log（60 天保留），按 任务|模型 的聚合复用
 * daily-report.ts 的 usageRowsToAgg / aggregateUsageTotals；本模块只补
 * “任意时间档区间 + 趋势分桶（小时/天）”，供 hdsi/ops/usage RPC 使用。
 */
import type { UsageLogRow } from './tables'
import { aggregateUsageTotals, localDayRange, usageRowsToAgg, type UsageAggRow } from './daily-report'
import { resolveTimezone } from '../time'
import { storyTimezone } from './runtime'

export type UsagePreset = 'today' | 'yesterday' | '7d'

export interface UsageBucket {
  /** 小时档为 "HH:00"，天档为 "MM-DD"。 */
  label: string
  calls: number
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  cost: number
}

export interface UsageRecentItem {
  id: number
  /** epoch ms，前端按本地时区格式化。 */
  ts: number
  task: string
  model: string
  inputTokens: number
  outputTokens: number
  cachedInputTokens: number
  cost: number
}

export interface UsageAnalyticsResult {
  ok: boolean
  error?: string
  preset: UsagePreset
  range: { from: number, to: number }
  bucketMode: 'hour' | 'day'
  totals: { calls: number, inputTokens: number, outputTokens: number, cachedInputTokens: number, cost: number }
  byTask: UsageAggRow[]
  buckets: UsageBucket[]
  recent: UsageRecentItem[]
}

/** preset → [from, to)（UTC ms）+ 分桶粒度。7d = 今天 00:00 回溯 6 天到明天 00:00。 */
export function usageRangeBounds(preset: UsagePreset, timezone: string, now = new Date()): { from: number, to: number, bucketMode: 'hour' | 'day' } {
  const today = localDayRange(now, timezone)
  if (preset === '7d') return { from: today.start - 6 * 86_400_000, to: today.end, bucketMode: 'day' }
  if (preset === 'yesterday') return { from: today.start - 86_400_000, to: today.start, bucketMode: 'hour' }
  return { from: today.start, to: today.end, bucketMode: 'hour' }
}

function timeOf(row: UsageLogRow): number | null {
  const time = row?.ts instanceof Date ? row.ts.getTime() : new Date((row?.ts as unknown as number | string) ?? 0).getTime()
  return Number.isFinite(time) ? time : null
}

function addInto(bucket: UsageBucket, row: UsageLogRow): void {
  bucket.calls += 1
  bucket.inputTokens += row.inputTokens ?? 0
  bucket.cachedInputTokens += row.cachedInputTokens ?? 0
  bucket.outputTokens += row.outputTokens ?? 0
  bucket.cost += row.cost ?? 0
}

/** 按本地小时/天分桶；空数据也返回完整时间轴（hour 档 24 格、day 档 7 格），
 * 前端可以直接画空趋势。小时档用索引算术（对 :30 偏移时区也稳），
 * 天档按本地日期键归桶（DST 天可能少一格，固定偏移时区无此问题）。 */
export function bucketUsageRows(rows: UsageLogRow[], mode: 'hour' | 'day', timezone: string, bounds: { from: number, to: number }): UsageBucket[] {
  const tz = resolveTimezone(timezone)
  if (mode === 'hour') {
    const step = 3_600_000
    const count = Math.max(1, Math.round((bounds.to - bounds.from) / step))
    const hourFmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', hourCycle: 'h23' })
    const buckets: UsageBucket[] = []
    for (let index = 0; index < count; index++) {
      const localHour = Number(hourFmt.format(new Date(bounds.from + index * step)))
      buckets.push({ label: `${String(localHour).padStart(2, '0')}:00`, calls: 0, inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, cost: 0 })
    }
    for (const row of rows) {
      const time = timeOf(row)
      if (time == null) continue
      const index = Math.min(count - 1, Math.max(0, Math.floor((time - bounds.from) / step)))
      addInto(buckets[index], row)
    }
    return buckets
  }
  const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
  const buckets: UsageBucket[] = []
  const indexByKey = new Map<string, number>()
  for (let time = bounds.from; time < bounds.to; time += 86_400_000) {
    const key = dayFmt.format(new Date(time))
    if (indexByKey.has(key)) continue
    indexByKey.set(key, buckets.length)
    buckets.push({ label: key.slice(5), calls: 0, inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, cost: 0 })
  }
  for (const row of rows) {
    const time = timeOf(row)
    if (time == null) continue
    const index = indexByKey.get(dayFmt.format(new Date(time)))
    if (index != null) addInto(buckets[index], row)
  }
  return buckets
}

/** hdsi/ops/usage 的服务端聚合：区间查询 → 汇总/分桶/最近流水。svc 为
 * InterludeService（any 视图，与 gatherDailyReportInput 同一访问面）。 */
export async function gatherUsageAnalytics(svc: any, preset: UsagePreset, limit: number): Promise<UsageAnalyticsResult> {
  const timezone = storyTimezone(svc)
  const bounds = usageRangeBounds(preset, timezone)
  const rows = await svc.dbGet('interlude_usage_log', {
    ts: { $gte: new Date(bounds.from), $lt: new Date(bounds.to) },
  }) as UsageLogRow[]
  const byTask = usageRowsToAgg(rows)
  const ordered = [...rows].sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
  return {
    ok: true,
    preset,
    range: { from: bounds.from, to: bounds.to },
    bucketMode: bounds.bucketMode,
    totals: aggregateUsageTotals(byTask),
    byTask,
    buckets: bucketUsageRows(rows, bounds.bucketMode, timezone, bounds),
    recent: ordered.slice(0, limit).map((row): UsageRecentItem => ({
      id: row.id ?? 0,
      ts: timeOf(row) ?? 0,
      task: String(row.task ?? ''),
      model: String(row.model ?? ''),
      inputTokens: row.inputTokens ?? 0,
      outputTokens: row.outputTokens ?? 0,
      cachedInputTokens: row.cachedInputTokens ?? 0,
      cost: row.cost ?? 0,
    })),
  }
}
