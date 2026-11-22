/**
 * 人设指标引擎（零模型调用）：从 interlude_script_entry / interlude_intent
 * 聚合“像不像”的四类指标——口头禅重复率、消息长度分布、主动消息响应率、
 * 虚构回归监测。纯 SQL 读取 + 内存聚合，供人设周报（persona-report）与
 * 后续 Console tab 复用；规则门先报命中给人审，不做自动裁决。
 *
 * 脚本条目形状（见 src/types.ts ScriptEntry / 2026-11-22 快照实测）：
 * - kind: script(narrator) / character-message / user-message / world-event /
 *   redacted / participant-joined / setup
 * - actor: narrator / character / system / user
 * - metadata: { phase?, eventKind?, causedByEventIds?, platform?, messageId?, ... }
 */
import type { ScriptEntry } from '../types'

/** dbGet 返回的条目可能是 Date/string 混合形状，这里统一到 ScriptEntry 视图。 */
export type MetricEntry = Partial<ScriptEntry> & {
  occurredAt?: Date | number | string
  metadata?: Record<string, unknown> | string | null
}

function entryTime(entry: MetricEntry): number {
  const raw = entry.occurredAt
  if (raw instanceof Date) return raw.getTime()
  const time = new Date(raw as unknown as number | string ?? 0).getTime()
  return Number.isFinite(time) ? time : 0
}

function entryMetadata(entry: MetricEntry): Record<string, unknown> {
  const raw = entry.metadata
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {}
    } catch {
      return {}
    }
  }
  return {}
}

function entryContent(entry: MetricEntry): string {
  return String(entry.content ?? '')
}

/** 主角可见消息（她的台词气泡）。 */
export function characterMessages(rows: MetricEntry[]): MetricEntry[] {
  return rows.filter(row => row.kind === 'character-message').sort((a, b) => entryTime(a) - entryTime(b))
}

/* ── 指标 1：口头禅重复率 ─────────────────────────────────────────── */

/** 单条消息内语气词/口头禅连用判定词表：出现 ≥ threshold 次即记一次命中。 */
const FILLER_WORDS = ['呀', '呢', '诶', '嗯嗯', '啦', '哦', '喔', '哇', '嘛', '吧', '～', '☆', '♪'] as const

export interface CatchphraseReport {
  /** 单条消息内同一语气词 ≥3 次的命中（word/消息数/最重样例）。 */
  overusedFillers: Array<{ word: string, messages: number, sample: string }>
  /** 同一开头词（语气词或前 2 字）时间连续 ≥streakLen 条（句式定型信号）。 */
  openingStreaks: Array<{ key: string, length: number, firstAt: number, lastAt: number }>
  /** 每条消息平均语气词个数（总体口头禅密度）。 */
  fillerPerMessage: number
  messages: number
}

/** 开头词：优先取消息开头的语气词（“嗯嗯”“对了”式起手），否则取前 2 字。 */
function leadKey(text: string): string {
  const stripped = text.replace(/[\s　]+/g, '')
  const lead = (FILLER_WORDS as readonly string[]).slice().sort((a, b) => b.length - a.length)
    .find(word => stripped.startsWith(word))
  return lead ?? stripped.slice(0, 2)
}

export function catchphraseRepetition(rows: MetricEntry[], threshold = 3, streakLen = 3): CatchphraseReport {
  const messages = characterMessages(rows)
  const overused = new Map<string, { word: string, messages: number, sample: string }>()
  let fillerTotal = 0
  const openings: Array<{ key: string, at: number }> = []
  for (const message of messages) {
    const text = entryContent(message)
    if (!text) continue
    let perMessageMax = 0
    let perMessageWord = ''
    for (const word of FILLER_WORDS) {
      const count = text.split(word).length - 1
      if (count > 0) fillerTotal += count
      if (count >= threshold && count > perMessageMax) {
        perMessageMax = count
        perMessageWord = word
      }
    }
    if (perMessageMax >= threshold) {
      const bucket = overused.get(perMessageWord) ?? { word: perMessageWord, messages: 0, sample: '' }
      bucket.messages += 1
      if (!bucket.sample) bucket.sample = text.slice(0, 60)
      overused.set(perMessageWord, bucket)
    }
    openings.push({ key: leadKey(text), at: entryTime(message) })
  }
  const streaks: CatchphraseReport['openingStreaks'] = []
  let run: { key: string, length: number, firstAt: number, lastAt: number } | null = null
  for (const item of openings) {
    if (run && run.key === item.key) {
      run.length += 1
      run.lastAt = item.at
    } else {
      if (run && run.length >= streakLen) streaks.push(run)
      run = { key: item.key, length: 1, firstAt: item.at, lastAt: item.at }
    }
  }
  if (run && run.length >= streakLen) streaks.push(run)
  return {
    overusedFillers: Array.from(overused.values()).sort((a, b) => b.messages - a.messages),
    openingStreaks: streaks.sort((a, b) => b.length - a.length),
    fillerPerMessage: messages.length ? fillerTotal / messages.length : 0,
    messages: messages.length,
  }
}

/* ── 指标 2：消息长度/分段分布 ────────────────────────────────────── */

export interface LengthDistribution {
  /** 桶界 [10, 25, 50, 100]：≤10 / 11–25 / 26–50 / 51–100 / >100 字。 */
  buckets: Array<{ label: string, count: number }>
  meanLength: number
  medianLength: number
  messages: number
}

export function messageLengthDistribution(rows: MetricEntry[]): LengthDistribution {
  const lengths = characterMessages(rows).map(row => Array.from(entryContent(row)).length).filter(length => length > 0)
  const bounds = [10, 25, 50, 100]
  const labels = ['≤10', '11–25', '26–50', '51–100', '>100']
  const counts = new Array<number>(labels.length).fill(0)
  let sum = 0
  for (const length of lengths) {
    sum += length
    const index = bounds.findIndex(bound => length <= bound)
    counts[index === -1 ? labels.length - 1 : index] += 1
  }
  const sorted = [...lengths].sort((a, b) => a - b)
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0
  return {
    buckets: labels.map((label, index) => ({ label, count: counts[index] })),
    meanLength: lengths.length ? sum / lengths.length : 0,
    medianLength: median,
    messages: lengths.length,
  }
}

/* ── 指标 3：主动消息响应率 ───────────────────────────────────────── */

export interface ProactiveSend {
  at: number
  content: string
  responded: boolean
  responseMinutes: number | null
}

export interface ProactiveResponseReport {
  sent: number
  responded: number
  /** responded / sent；无主动消息时为 null。 */
  rate: number | null
  medianResponseMinutes: number | null
  windowMinutes: number
  samples: ProactiveSend[]
}

/** 自主发起的出站消息判定：明确标记 outgoing-message 且没有 causedByEventIds
 *（被用户事件引起的是回复，不算主动）。metadata 缺 eventKind 的旧条目一律
 * 不计，防止把无标注的历史消息误判成主动。causedByEventIds 可能为数组或字符串。 */
function isAutonomousOutgoing(entry: MetricEntry): boolean {
  if (entry.kind !== 'character-message') return false
  const metadata = entryMetadata(entry)
  if (metadata.eventKind !== 'outgoing-message') return false
  const caused = metadata.causedByEventIds
  if (caused == null) return true
  if (Array.isArray(caused)) return caused.length === 0
  if (typeof caused === 'string') {
    try {
      const parsed = JSON.parse(caused)
      return Array.isArray(parsed) ? parsed.length === 0 : false
    } catch {
      return false
    }
  }
  return false
}

export function proactiveResponseRate(rows: MetricEntry[], windowMinutes = 120): ProactiveResponseReport {
  const outgoing = rows.filter(row => isAutonomousOutgoing(row)).map(row => ({ at: entryTime(row), content: entryContent(row) }))
  const inbound = rows.filter(row => row.kind === 'user-message').map(row => entryTime(row)).sort((a, b) => a - b)
  const windowMs = windowMinutes * 60_000
  const samples: ProactiveSend[] = outgoing.map(send => {
    // 找主动消息之后、窗口内的第一条用户消息（二分首个 >= at）。
    let low = 0
    let high = inbound.length
    while (low < high) {
      const mid = (low + high) >> 1
      if (inbound[mid] < send.at) low = mid + 1
      else high = mid
    }
    const response = low < inbound.length && inbound[low] - send.at <= windowMs ? inbound[low] : null
    return {
      at: send.at,
      content: send.content.slice(0, 60),
      responded: response != null,
      responseMinutes: response != null ? Math.round((response - send.at) / 60_000 * 10) / 10 : null,
    }
  })
  const responses = samples.filter(item => item.responseMinutes != null).map(item => item.responseMinutes as number).sort((a, b) => a - b)
  return {
    sent: samples.length,
    responded: samples.filter(item => item.responded).length,
    rate: samples.length ? samples.filter(item => item.responded).length / samples.length : null,
    medianResponseMinutes: responses.length ? responses[Math.floor(responses.length / 2)] : null,
    windowMinutes,
    samples: samples.sort((a, b) => b.at - a.at),
  }
}

/* ── 指标 4：虚构回归监测（规则门，命中交人工复核）───────────────── */

export interface FabricationHit {
  type: 'suspect-inbound' | 'quoted-speech'
  at: number
  detail: string
}

/** advance/follow-up 类相位的识别：metadata.phase 命中这些前缀即视为“无来言窗口”。 */
const AUTONOMOUS_PHASES = ['advance', 'follow', 'due-intent', 'due_intent']

/** 引语归因模式：引号内容 + 说/道/问/答 类动词（narrator 代他人开口的信号）。 */
const QUOTE_ATTRIBUTION = /(「[^」]{1,40}」|『[^』]{1,40}』)\s*[^。]{0,10}(说|道|问|答|回|接话|嘀咕)|(说|道|问|答|回)[^。]{0,8}(「[^」]{1,40}」|『[^』]{1,40}』)/g

export function fabricationWatch(rows: MetricEntry[]): { hits: FabricationHit[], scanned: number } {
  const hits: FabricationHit[] = []
  let scanned = 0
  for (const row of rows) {
    const time = entryTime(row)
    const metadata = entryMetadata(row)
    const phase = String(metadata.phase ?? '')
    // a) 可疑来言：user-message 缺真实平台痕迹（真实条目必有 platform/messageId）。
    if (row.kind === 'user-message') {
      scanned += 1
      if (!metadata.platform || !metadata.messageId) {
        hits.push({ type: 'suspect-inbound', at: time, detail: `user-message 缺 platform/messageId（phase=${phase || '无'}）content=${entryContent(row).slice(0, 40)}` })
      }
      continue
    }
    // b) 无来言窗口内的引语归因：narrator 剧本 + 自主相位 + 引号+动词模式。
    if (row.kind === 'script' && row.actor === 'narrator') {
      const autonomous = AUTONOMOUS_PHASES.some(prefix => phase.startsWith(prefix))
      if (!autonomous) continue
      scanned += 1
      const text = entryContent(row)
      const matches = text.match(QUOTE_ATTRIBUTION)
      if (matches) {
        hits.push({ type: 'quoted-speech', at: time, detail: `phase=${phase} 命中引语归因：${matches[0].slice(0, 50)} 上下文=${text.slice(0, 40)}` })
      }
    }
  }
  return { hits, scanned }
}

/* ── 周窗口的统一入口 ─────────────────────────────────────────────── */

export interface PersonaMetricsInput {
  /** 参与者本方与主角消息交错轮次，用于周报抽样。 */
  rounds: Array<{ at: number, user: string, character: string[] }>
  catchphrase: CatchphraseReport
  length: LengthDistribution
  proactive: ProactiveResponseReport
  fabrication: { hits: FabricationHit[], scanned: number }
  entryCount: number
}

/** 把交错消息组织成“轮次”：用户消息开启新轮；角色气泡归入当前轮（她连续
 * 发的多条气泡算一轮）。窗口开头她先开口、尚无用户轮时，开一个 user 为空串
 * 的主动轮。 */
export function conversationRounds(rows: MetricEntry[]): Array<{ at: number, user: string, character: string[] }> {
  const messages = rows
    .filter(row => row.kind === 'user-message' || row.kind === 'character-message')
    .sort((a, b) => entryTime(a) - entryTime(b))
  const rounds: Array<{ at: number, user: string, character: string[] }> = []
  for (const row of messages) {
    if (row.kind === 'user-message') {
      rounds.push({ at: entryTime(row), user: entryContent(row).slice(0, 80), character: [] })
      continue
    }
    const last = rounds[rounds.length - 1]
    if (last) {
      last.character.push(entryContent(row).slice(0, 80))
    } else {
      rounds.push({ at: entryTime(row), user: '', character: [entryContent(row).slice(0, 80)] })
    }
  }
  return rounds
}

/** 一个观察窗口（如过去 7 天）的完整指标聚合。 */
export function aggregatePersonaMetrics(rows: MetricEntry[]): PersonaMetricsInput {
  return {
    rounds: conversationRounds(rows),
    catchphrase: catchphraseRepetition(rows),
    length: messageLengthDistribution(rows),
    proactive: proactiveResponseRate(rows),
    fabrication: fabricationWatch(rows),
    entryCount: rows.length,
  }
}
