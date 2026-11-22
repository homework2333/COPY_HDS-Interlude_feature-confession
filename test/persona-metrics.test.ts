import assert from 'node:assert/strict'
import test from 'node:test'
import { aggregatePersonaMetrics, catchphraseRepetition, conversationRounds, fabricationWatch, messageLengthDistribution, proactiveResponseRate, type MetricEntry } from '../src/ops/persona-metrics'
import { nextWeeklyRun, renderPersonaWeeklyReport } from '../src/ops/persona-report'

let seq = 0
function entry(overrides: Partial<MetricEntry> & { kind: string, content: string }): MetricEntry {
  seq += 1
  return {
    id: seq,
    kind: overrides.kind,
    actor: overrides.actor ?? (overrides.kind === 'user-message' ? 'user' : overrides.kind === 'character-message' ? 'character' : 'narrator'),
    content: overrides.content,
    occurredAt: overrides.occurredAt ?? Date.UTC(2026, 10, 20, 8, seq),
    metadata: overrides.metadata ?? {},
    participantId: overrides.participantId ?? 'p1',
  }
}

test('catchphraseRepetition flags overused fillers and opening streaks', () => {
  const rows: MetricEntry[] = [
    entry({ kind: 'character-message', content: '好呀好呀好呀 一起吧' }),
    entry({ kind: 'character-message', content: '嗯嗯 我在的', occurredAt: Date.UTC(2026, 10, 20, 9, 1) }),
    entry({ kind: 'character-message', content: '嗯嗯 我听着呢', occurredAt: Date.UTC(2026, 10, 20, 9, 2) }),
    entry({ kind: 'character-message', content: '嗯嗯 那就这么定了', occurredAt: Date.UTC(2026, 10, 20, 9, 3) }),
    entry({ kind: 'character-message', content: '今天风很大，谱子被吹翻了一页', occurredAt: Date.UTC(2026, 10, 20, 9, 4) }),
  ]
  const report = catchphraseRepetition(rows)
  const ya = report.overusedFillers.find(item => item.word === '呀')
  assert.ok(ya, '单条内 “呀” 连用 3 次被记录')
  assert.equal(ya.messages, 1)
  assert.ok(report.openingStreaks.some(streak => streak.key === '嗯嗯' && streak.length >= 3), '相同开头词连开 ≥3 被记录')
  assert.ok(report.fillerPerMessage > 0)
  // 干净样本：单条消息、无连开
  const clean = catchphraseRepetition([entry({ kind: 'character-message', content: '今天天气不错' })])
  assert.equal(clean.overusedFillers.length, 0)
  assert.equal(clean.openingStreaks.length, 0)
})

test('messageLengthDistribution buckets by character count', () => {
  const rows: MetricEntry[] = [
    entry({ kind: 'character-message', content: '12345' }), // 5 字
    entry({ kind: 'character-message', content: '一'.repeat(20) }), // 20
    entry({ kind: 'character-message', content: '一'.repeat(40) }), // 40
    entry({ kind: 'character-message', content: '一'.repeat(80) }), // 80
    entry({ kind: 'character-message', content: '一'.repeat(120) }), // 120
  ]
  const report = messageLengthDistribution(rows)
  assert.deepEqual(report.buckets.map(bucket => bucket.count), [1, 1, 1, 1, 1])
  assert.equal(report.medianLength, 40)
  assert.ok(Math.abs(report.meanLength - 53) < 1e-9)
})

test('proactiveResponseRate counts only autonomous outgoing and in-window replies', () => {
  const base = Date.UTC(2026, 10, 20, 10, 0, 0)
  const rows: MetricEntry[] = [
    // 主动消息（无 causedByEventIds）→ 40 分钟后得到回复
    entry({ kind: 'character-message', content: '谱子练完啦，你那边怎么样', occurredAt: base, metadata: { eventKind: 'outgoing-message' } }),
    entry({ kind: 'user-message', content: '刚忙完', occurredAt: base + 40 * 60_000, metadata: { platform: 'onebot', messageId: 'm1' } }),
    // 有 causedByEventIds → 是回复，不算主动
    entry({ kind: 'character-message', content: '辛苦啦', occurredAt: base + 42 * 60_000, metadata: { eventKind: 'outgoing-message', causedByEventIds: ['commit:x:e1'] } }),
    // 主动消息但窗口（120 分钟）外无回复
    entry({ kind: 'character-message', content: '先去练歌啦', occurredAt: base + 60 * 60_000, metadata: { eventKind: 'outgoing-message' } }),
  ]
  const report = proactiveResponseRate(rows, 120)
  assert.equal(report.sent, 2)
  assert.equal(report.responded, 1)
  assert.ok(Math.abs(report.rate! - 0.5) < 1e-9)
  assert.equal(report.medianResponseMinutes, 40)
  assert.equal(report.samples[0].content, '先去练歌啦')
})

test('fabricationWatch flags suspect inbound and advance-phase quoted speech', () => {
  const rows: MetricEntry[] = [
    // 可疑来言：缺 platform/messageId
    entry({ kind: 'user-message', content: '（虚构的来言）', occurredAt: Date.UTC(2026, 10, 20, 9, 0), metadata: { phase: 'advance' } }),
    // advance 相位 narrator 代他人开口
    entry({ kind: 'script', actor: 'narrator', content: '她想起主人说过的话。「今晚早点休息」主人这样说着。', occurredAt: Date.UTC(2026, 10, 20, 9, 5), metadata: { phase: 'advance' } }),
    // 正常用户回合的引语不命中（phase 非 advance）
    entry({ kind: 'script', actor: 'narrator', content: '屏幕上停着那句「我是chiro」。', occurredAt: Date.UTC(2026, 10, 20, 9, 10), metadata: { phase: 'turn' } }),
    // 正常来言（有 platform/messageId）不命中
    entry({ kind: 'user-message', content: '我是chiro', occurredAt: Date.UTC(2026, 10, 20, 9, 11), metadata: { platform: 'onebot', messageId: 'm2' } }),
  ]
  const { hits } = fabricationWatch(rows)
  assert.equal(hits.filter(hit => hit.type === 'suspect-inbound').length, 1)
  assert.equal(hits.filter(hit => hit.type === 'quoted-speech').length, 1)
  assert.ok(hits.some(hit => hit.detail.includes('主人这样说着')))
})

test('conversationRounds groups character bubbles under the preceding user message', () => {
  const rows: MetricEntry[] = [
    entry({ kind: 'character-message', content: '先说的一句', occurredAt: Date.UTC(2026, 10, 20, 8, 0) }),
    entry({ kind: 'user-message', content: '我是chiro', occurredAt: Date.UTC(2026, 10, 20, 8, 1) }),
    entry({ kind: 'character-message', content: '嗯嗯 我在的', occurredAt: Date.UTC(2026, 10, 20, 8, 2) }),
    entry({ kind: 'character-message', content: '对了 你那边现在叫什么名字呀', occurredAt: Date.UTC(2026, 10, 20, 8, 3) }),
  ]
  const rounds = conversationRounds(rows)
  assert.equal(rounds.length, 2)
  assert.equal(rounds[0].character.length, 1)
  assert.equal(rounds[1].user, '我是chiro')
  assert.equal(rounds[1].character.length, 2)
})

test('aggregatePersonaMetrics assembles all four indicators', () => {
  const rows: MetricEntry[] = [
    entry({ kind: 'user-message', content: '在吗', metadata: { platform: 'onebot', messageId: 'm3' } }),
    entry({ kind: 'character-message', content: '嗯嗯 在的呀' }),
  ]
  const metrics = aggregatePersonaMetrics(rows)
  assert.equal(metrics.length.messages, 1)
  assert.equal(metrics.proactive.sent, 0)
  assert.equal(metrics.fabrication.hits.length, 0)
  assert.equal(metrics.entryCount, 2)
})

test('nextWeeklyRun finds the next configured weekday hh:mm in story timezone', () => {
  // 2026-11-22 是周日：UTC 11:00 = 北京 19:00 → 当天 20:00
  const sameDay = nextWeeklyRun(new Date('2026-11-22T11:00:00Z'), 'Asia/Shanghai', 0, 20, 0)
  assert.equal(sameDay.toISOString(), '2026-11-22T12:00:00.000Z')
  // 北京 21:00 已过 → 下周日 20:00
  const nextWeek = nextWeeklyRun(new Date('2026-11-22T13:00:00Z'), 'Asia/Shanghai', 0, 20, 0)
  assert.equal(nextWeek.toISOString(), '2026-11-29T12:00:00.000Z')
  // 周三（2026-11-25）问周日的报 → 最近的下一个周日
  const fromWednesday = nextWeeklyRun(new Date('2026-11-25T06:00:00Z'), 'Asia/Shanghai', 0, 20, 0)
  assert.equal(fromWednesday.toISOString(), '2026-11-29T12:00:00.000Z')
})

test('renderPersonaWeeklyReport renders all sections and samples', () => {
  const rows: MetricEntry[] = [
    entry({ kind: 'user-message', content: '我是chiro', occurredAt: Date.UTC(2026, 10, 20, 8, 1), metadata: { platform: 'onebot', messageId: 'm4' } }),
    entry({ kind: 'character-message', content: '嗯嗯 我在的', occurredAt: Date.UTC(2026, 10, 20, 8, 2) }),
  ]
  const metrics = aggregatePersonaMetrics(rows)
  const text = renderPersonaWeeklyReport({
    weekLabel: '11-16 ~ 11-22',
    timezone: 'Asia/Shanghai',
    metrics,
    samples: metrics.rounds.slice(-5).reverse(),
  })
  assert.match(text, /人设周报 · 11-16 ~ 11-22/)
  assert.match(text, /【她的台词】/)
  assert.match(text, /【口头禅】/)
  assert.match(text, /【主动消息】/)
  assert.match(text, /【虚构监测】/)
  assert.match(text, /你：我是chiro/)
  assert.match(text, /她：嗯嗯 我在的/)
})
