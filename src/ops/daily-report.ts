/**
 * 每日运营日报：聚合 token 用量、按优先级排序的报错摘要、健康与宿主机状态。
 * 行为基准是旧 AstrBot 栈的 ops/daily-report.py（主人 QQ 每日 0 点收到），
 * 数据源改为 HDSI 自身的 interlude_usage_log / interlude_ops_log 落库。
 */
import type { UsageLogRow, OpsLogRow } from './tables'
import { resolveTimezone } from '../time'

export interface UsageAggRow {
  task: string
  model: string
  calls: number
  inputTokens: number
  outputTokens: number
  cachedInputTokens: number
  cost: number
}

export interface DailyReportInput {
  dayLabel: string
  usage: UsageAggRow[]
  yesterdayTotalTokens: number
  errors: OpsLogRow[]
  warns: OpsLogRow[]
  health: { successes: number, retries: number, failures: number, avgLatencyMs: number }
  uptimeSeconds: number
  version: string
  hostStatus?: HostStatusSnapshot | null
  pendingAccessRequests?: number
}

/** 宿主机采集器（ops/deploy/host-status.py 每 5 分钟写一次）的 JSON 形状。 */
export interface HostStatusSnapshot {
  ts: number
  uptime: number
  load: number[]
  cores: number
  cpu_pct: number
  mem: { total_mb: number, avail_mb: number, pct: number }
  swap: { total_mb: number, used_mb: number }
  disk: { total_gb: number, used_gb: number, pct: number }
  containers?: Array<{ name: string, mem: string, cpu: string }>
}

function humanTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(Math.round(n))
}

function uptimeText(seconds: number): string {
  const sec = Math.max(0, Math.floor(seconds))
  const days = Math.floor(sec / 86_400)
  const hours = Math.floor((sec % 86_400) / 3_600)
  const minutes = Math.floor((sec % 3_600) / 60)
  if (days) return `${days}天${hours}小时`
  if (hours) return `${hours}小时${minutes}分`
  return `${minutes}分钟`
}

function hostAgeText(ts: number): string {
  const age = Date.now() - ts
  if (!Number.isFinite(age) || age < 0) return '未知'
  if (age < 120_000) return '刚刚'
  return `${Math.floor(age / 60_000)} 分钟前`
}

/** 按优先级聚合报错：error 优先于 warn，同级别按出现次数降序，再按最近时间。 */
export function digestIssues(errors: OpsLogRow[], warns: OpsLogRow[], limit = 8): Array<{ level: 'error' | 'warn', count: number, lastAt: Date, message: string }> {
  const buckets = new Map<string, { level: 'error' | 'warn', count: number, lastAt: Date, message: string }>()
  for (const [rows, level] of [[errors, 'error'], [warns, 'warn']] as const) {
    for (const row of rows) {
      const message = (row.message ?? '').replace(/\s+/g, ' ').trim().slice(0, 160) || '(空)'
      const key = `${level}:${message.slice(0, 80)}`
      const bucket = buckets.get(key)
      if (bucket) {
        bucket.count += 1
        if (row.ts && new Date(row.ts) > bucket.lastAt) bucket.lastAt = new Date(row.ts)
      } else {
        buckets.set(key, { level, count: 1, lastAt: row.ts ? new Date(row.ts) : new Date(0), message })
      }
    }
  }
  return Array.from(buckets.values())
    .sort((a, b) => (a.level === b.level ? b.count - a.count || b.lastAt.getTime() - a.lastAt.getTime() : a.level === 'error' ? -1 : 1))
    .slice(0, limit)
}

export function aggregateUsageTotals(rows: UsageAggRow[]) {
  return rows.reduce((acc, row) => ({
    calls: acc.calls + row.calls,
    inputTokens: acc.inputTokens + row.inputTokens,
    outputTokens: acc.outputTokens + row.outputTokens,
    cachedInputTokens: acc.cachedInputTokens + row.cachedInputTokens,
    cost: acc.cost + row.cost,
  }), { calls: 0, inputTokens: 0, outputTokens: 0, cachedInputTokens: 0, cost: 0 })
}

export function usageRowsToAgg(rows: UsageLogRow[]): UsageAggRow[] {
  const map = new Map<string, UsageAggRow>()
  for (const row of rows) {
    const key = `${row.task}|${row.model}`
    const agg = map.get(key) ?? { task: row.task, model: row.model, calls: 0, inputTokens: 0, outputTokens: 0, cachedInputTokens: 0, cost: 0 }
    agg.calls += 1
    agg.inputTokens += row.inputTokens ?? 0
    agg.outputTokens += row.outputTokens ?? 0
    agg.cachedInputTokens += row.cachedInputTokens ?? 0
    agg.cost += row.cost ?? 0
    map.set(key, agg)
  }
  return Array.from(map.values()).sort((a, b) => (b.inputTokens + b.outputTokens) - (a.inputTokens + a.outputTokens))
}

export function renderDailyReport(input: DailyReportInput): string {
  const totals = aggregateUsageTotals(input.usage)
  const totalTokens = totals.inputTokens + totals.outputTokens
  const lines = [`🌸 HDSI 日报 · ${input.dayLabel}`, '']
  lines.push(`⏱ 运行 ${uptimeText(input.uptimeSeconds)} · v${input.version}`)

  if (!totals.calls) {
    lines.push('【今日用量】没有模型调用记录')
  } else {
    const hitRate = totals.inputTokens ? Math.round(totals.cachedInputTokens / totals.inputTokens * 100) : 0
    lines.push(`【今日用量】${humanTokens(totalTokens)} tokens · ${totals.calls} 次 · 命中率 ${hitRate}%`)
    lines.push(`├ 输入 ${humanTokens(totals.inputTokens)}（缓存 ${humanTokens(totals.cachedInputTokens)}）`)
    lines.push(`└ 输出 ${humanTokens(totals.outputTokens)}`)
    if (totals.cost > 0) lines.push(`估算费用 ${totals.cost.toFixed(2)}（按连接价格字段）`)
    for (const row of input.usage.slice(0, 5)) {
      lines.push(`· ${row.task}/${row.model} ${row.calls} 次 ${humanTokens(row.inputTokens + row.outputTokens)} tok`)
    }
    if (input.yesterdayTotalTokens > 0) {
      const delta = totalTokens - input.yesterdayTotalTokens
      const pct = Math.abs(delta) / input.yesterdayTotalTokens * 100
      lines.push(`较昨日 ${delta >= 0 ? '+' : '-'}${pct.toFixed(0)}%`)
    }
  }

  lines.push('')
  lines.push(`【健康】成功 ${input.health.successes} · 重试 ${input.health.retries} · 失败 ${input.health.failures} · 均延迟 ${Math.round(input.health.avgLatencyMs)}ms`)
  if (typeof input.pendingAccessRequests === 'number' && input.pendingAccessRequests > 0) {
    lines.push(`【待审批】白名单申请 ${input.pendingAccessRequests} 条（interlude.授权 <QQ>）`)
  }

  const issues = digestIssues(input.errors, input.warns)
  lines.push('')
  lines.push(`【报错】今日 error ${input.errors.length} 条 · warn ${input.warns.length} 条`)
  for (const issue of issues) {
    const tag = issue.level === 'error' ? '✗' : '⚠'
    lines.push(`${tag} ×${issue.count} ${issue.message}`)
  }
  if (!issues.length) lines.push('（无）')

  const host = input.hostStatus
  if (host) {
    lines.push('')
    lines.push(`【宿主机】${hostAgeText(host.ts)}更新 · ${uptimeText(host.uptime)} · 负载 ${host.load?.[0] ?? '?'}`)
    lines.push(`CPU ${host.cpu_pct}%/${host.cores}核 · 内存 ${host.mem.total_mb - host.mem.avail_mb}/${host.mem.total_mb}M(${host.mem.pct}%) · 磁盘 ${host.disk.used_gb}/${host.disk.total_gb}G(${host.disk.pct}%)`)
    for (const box of host.containers ?? []) {
      lines.push(`📦 ${box.name} ${box.mem} · ${box.cpu}`)
    }
  }
  return lines.join('\n')
}

/** 故事时区里的“当天 hh:mm”下一次出现时刻（UTC ms）。
 * 用逐步逼近法：先按 UTC 偏移猜一个候选，再用格式化结果校验并修正。 */
export function nextDailyRun(now: Date, timezone: string, hour: number, minute: number): Date {
  const tz = resolveTimezone(timezone)
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  })
  const partsOf = (date: Date) => {
    const parts = fmt.formatToParts(date)
    const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(item => item.type === type)?.value ?? '0')
    return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') }
  }
  // 候选 = 当前本地时刻推到目标 hh:mm，加 0/1 天；时区规则差异由校验循环兜底。
  // 偏移猜测必须包含秒（否则刚过整点时会得到带秒偏移的候选）。
  const local = partsOf(now)
  const offsetGuess = now.getTime() - Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second)
  for (const dayDelta of [0, 1, 2]) {
    const candidateLocal = Date.UTC(local.year, local.month - 1, local.day + dayDelta, hour, minute, 0)
    const candidate = new Date(candidateLocal + offsetGuess)
    const check = partsOf(candidate)
    if (check.hour === hour && check.minute === minute && candidate.getTime() > now.getTime()) {
      return candidate
    }
  }
  // 兜底：24 小时后再试，调度器会继续逼近。
  return new Date(now.getTime() + Time.day)
}

/** 故事时区里某一天 [00:00, 次日 00:00) 的 UTC ms 边界。 */
export function localDayRange(anchor: Date, timezone: string): { start: number, end: number, label: string } {
  const tz = resolveTimezone(timezone)
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
  const dayKey = fmt.format(anchor)
  const [year, month, day] = dayKey.split('-').map(Number)
  // 与 nextDailyRun 相同的偏移猜测 + 校验。
  const probe = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(probe)
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(item => item.type === type)?.value ?? '0')
  const offset = probe.getTime() - Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), 0, 0)
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) + offset)
  return { start: start.getTime(), end: start.getTime() + Time.day, label: dayKey }
}

// cordis Time 常量在纯函数模块里直接引用会引入运行时依赖方向问题，
// 这里用本地等价常量。
const Time = { day: 86_400_000 }
