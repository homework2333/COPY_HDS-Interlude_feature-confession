import assert from 'node:assert/strict'
import test from 'node:test'
import { aggregateTokenUsages, computeTokenCost, formatTokenUsageLine, isOffPeakMoment, offPeakDiscountMultiplier, parseTokenUsage, ProviderOffPeakPricing, TokenUsageRecord } from '../src/narrator'
import { estimateTokenCost } from '../src/ops/runtime'

test('parseTokenUsage reads OpenAI and DeepSeek cache shapes and ignores unknown ones', () => {
  assert.deepEqual(
    parseTokenUsage({ prompt_tokens: 1000, completion_tokens: 250, prompt_tokens_details: { cached_tokens: 640 } }),
    { inputTokens: 1000, outputTokens: 250, cachedInputTokens: 640 },
  )
  assert.deepEqual(
    parseTokenUsage({ prompt_tokens: 900, completion_tokens: 100, prompt_cache_hit_tokens: 333 }),
    { inputTokens: 900, outputTokens: 100, cachedInputTokens: 333 },
  )
  assert.deepEqual(parseTokenUsage({ usage: 'nonsense' }), {})
  assert.deepEqual(parseTokenUsage(undefined), {})
})

test('aggregateTokenUsages sums attempts and keeps the final attempt identity and pricing', () => {
  const records: TokenUsageRecord[] = [
    { task: '主叙事', providerLabel: 'A', model: 'm-a', inputTokens: 100, outputTokens: 20, priceInput: 2 },
    { task: '主叙事', providerLabel: 'B', model: 'm-b', inputTokens: 1500, outputTokens: 300, cachedInputTokens: 1200, priceInput: 1, priceOutput: 4, priceCachedInput: 0.2 },
  ]
  const total = aggregateTokenUsages(records)!
  assert.equal(total.inputTokens, 1600)
  assert.equal(total.outputTokens, 320)
  assert.equal(total.cachedInputTokens, 1200)
  assert.equal(total.providerLabel, 'B')
  assert.equal(total.model, 'm-b')
  assert.equal(total.priceInput, 1)
  assert.equal(aggregateTokenUsages([]), undefined)
})

test('computeTokenCost bills cached tokens at the cache price and reports savings', () => {
  const cost = computeTokenCost({
    task: '主叙事', providerLabel: 'B', model: 'm-b',
    inputTokens: 1_000_000, outputTokens: 100_000, cachedInputTokens: 800_000,
    priceInput: 2, priceOutput: 8, priceCachedInput: 0.5,
  })!
  // non-cached 200k × ¥2 + cached 800k × ¥0.5 + output 100k × ¥8, all per 1M
  assert.equal(cost.inputCost, 0.8)
  assert.equal(cost.outputCost, 0.8)
  assert.ok(Math.abs(cost.total - 1.6) < 1e-9)
  assert.ok(Math.abs(cost.saved - 1.2) < 1e-9)
})

test('computeTokenCost is undefined without prices and falls back to the input price', () => {
  const base = { task: '主叙事', providerLabel: 'A', model: 'm', inputTokens: 1000, outputTokens: 100 }
  assert.equal(computeTokenCost({ ...base }), undefined)
  const fallback = computeTokenCost({ ...base, priceInput: 3, priceCachedInput: 0 })!
  assert.equal(fallback.inputCost, 0.003)
})

test('formatTokenUsageLine renders usage, hit rate and optional billing', () => {
  const line = formatTokenUsageLine({
    task: '主叙事', providerLabel: 'B', model: 'm-b',
    inputTokens: 1600, outputTokens: 320, cachedInputTokens: 1200,
    priceInput: 1, priceOutput: 4, priceCachedInput: 0.2,
  })
  assert.match(line, /输入=1600（缓存 1200，命中率 75\.0%）/)
  assert.match(line, /输出=320/)
  assert.match(line, /计费合计=/)
  const unpriced = formatTokenUsageLine({ task: '主叙事', providerLabel: 'A', model: 'm-a', inputTokens: 10, outputTokens: 2 })
  assert.doesNotMatch(unpriced, /计费合计/)
  assert.match(unpriced, /输入=10/)
})

/* ── DeepSeek 峰谷价（错峰优惠）────────────────────────────────────── */

test('isOffPeakMoment judges the Beijing-time off-peak window (default 00:30–08:30)', () => {
  const pricing: ProviderOffPeakPricing = { enabled: true }
  // UTC 17:00 = 北京 01:00 → 窗口内
  assert.equal(isOffPeakMoment(new Date('2026-11-19T17:00:00Z'), pricing), true)
  // 北京 00:29 → 未到窗口；00:30 → 窗口开始（左闭）
  assert.equal(isOffPeakMoment(new Date('2026-11-19T16:29:00Z'), pricing), false)
  assert.equal(isOffPeakMoment(new Date('2026-11-19T16:30:00Z'), pricing), true)
  // 北京 08:29 → 窗口内；08:30 → 窗口结束（右开）
  assert.equal(isOffPeakMoment(new Date('2026-11-20T00:29:00Z'), pricing), true)
  assert.equal(isOffPeakMoment(new Date('2026-11-20T00:30:00Z'), pricing), false)
  // 北京 10:00 → 窗口外
  assert.equal(isOffPeakMoment(new Date('2026-11-20T02:00:00Z'), pricing), false)
  // 未启用一律不命中
  assert.equal(isOffPeakMoment(new Date('2026-11-19T17:00:00Z'), { enabled: false }), false)
  assert.equal(isOffPeakMoment(new Date('2026-11-19T17:00:00Z'), undefined), false)
})

test('isOffPeakMoment supports cross-midnight windows and weekend all-day valley pricing', () => {
  const crossMidnight: ProviderOffPeakPricing = { enabled: true, start: '23:00', end: '08:30' }
  // UTC 15:30 = 北京 23:30 → 跨午夜窗口内；北京 21:00 → 窗口外
  assert.equal(isOffPeakMoment(new Date('2026-11-20T15:30:00Z'), crossMidnight), true)
  assert.equal(isOffPeakMoment(new Date('2026-11-20T13:00:00Z'), crossMidnight), false)
  // 2026-11-21 是周六：weekendAllDay 全日按错峰计，否则按窗口判定
  const weekend: ProviderOffPeakPricing = { enabled: true, weekendAllDay: true }
  assert.equal(isOffPeakMoment(new Date('2026-11-21T06:00:00Z'), weekend), true)
  assert.equal(isOffPeakMoment(new Date('2026-11-21T06:00:00Z'), { enabled: true }), false)
})

test('offPeakDiscountMultiplier returns the clamped discount inside the window and 1 outside', () => {
  const inWindow = new Date('2026-11-19T17:00:00Z')
  const outWindow = new Date('2026-11-20T02:00:00Z')
  assert.equal(offPeakDiscountMultiplier({ enabled: true }, inWindow), 0.5)
  assert.equal(offPeakDiscountMultiplier({ enabled: true, discount: 0.25 }, inWindow), 0.25)
  // 折扣夹取：>1 拉回 1（不打折变涨价），0 拉回 0.01（防止零价刷库）
  assert.equal(offPeakDiscountMultiplier({ enabled: true, discount: 3 }, inWindow), 1)
  assert.equal(offPeakDiscountMultiplier({ enabled: true, discount: 0 }, inWindow), 0.01)
  assert.equal(offPeakDiscountMultiplier({ enabled: true }, outWindow), 1)
  assert.equal(offPeakDiscountMultiplier(undefined, inWindow), 1)
})

test('computeTokenCost applies the DeepSeek off-peak discount and flags it', () => {
  const record = {
    task: '主叙事', providerLabel: 'B', model: 'm-b',
    inputTokens: 1_000_000, outputTokens: 100_000, cachedInputTokens: 800_000,
    priceInput: 2, priceOutput: 8, priceCachedInput: 0.5,
    priceOffPeak: { enabled: true, discount: 0.5 } as ProviderOffPeakPricing,
  }
  const cost = computeTokenCost(record, new Date('2026-11-19T17:00:00Z'))!
  assert.equal(cost.offPeak, true)
  assert.equal(cost.inputCost, 0.4)
  assert.equal(cost.outputCost, 0.4)
  assert.ok(Math.abs(cost.total - 0.8) < 1e-9)
  // 窗口外按原价
  const normal = computeTokenCost(record, new Date('2026-11-20T02:00:00Z'))!
  assert.equal(normal.offPeak, false)
  assert.ok(Math.abs(normal.total - 1.6) < 1e-9)
})

test('aggregateTokenUsages forwards the off-peak pricing of the priced attempt', () => {
  const total = aggregateTokenUsages([
    { task: '主叙事', providerLabel: 'A', model: 'm-a', inputTokens: 100, outputTokens: 20 },
    { task: '主叙事', providerLabel: 'B', model: 'm-b', inputTokens: 100, outputTokens: 20, priceInput: 1, priceOutput: 4, priceOffPeak: { enabled: true, discount: 0.5 } },
  ])!
  assert.equal(total.priceInput, 1)
  assert.equal(total.priceOffPeak?.enabled, true)
})

test('estimateTokenCost halves the bill inside the off-peak window and keeps it outside', () => {
  const base = { inputTokens: 1_000_000, cachedInputTokens: 400_000, outputTokens: 200_000, priceInput: 2, priceOutput: 8, priceCachedInput: 0.2 }
  // 600k×2 + 400k×0.2 + 200k×8 = 2.88
  assert.ok(Math.abs(estimateTokenCost(base) - 2.88) < 1e-9)
  assert.ok(Math.abs(estimateTokenCost({ ...base, priceOffPeak: { enabled: true, discount: 0.5 } }, new Date('2026-11-19T17:00:00Z')) - 1.44) < 1e-9)
  assert.ok(Math.abs(estimateTokenCost({ ...base, priceOffPeak: { enabled: true, discount: 0.5 } }, new Date('2026-11-20T02:00:00Z')) - 2.88) < 1e-9)
})
