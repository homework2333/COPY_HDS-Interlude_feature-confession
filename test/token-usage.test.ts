import assert from 'node:assert/strict'
import test from 'node:test'
import { aggregateTokenUsages, computeTokenCost, formatTokenUsageLine, isPeakMoment, parseTokenUsage, ProviderPeakValleyPricing, TokenUsageRecord, peakValleyMultiplier } from '../src/narrator'
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

/* ── DeepSeek 峰谷价（官方规则：工作日 9–12/14–18 高峰，其余空闲）──────── */

test('isPeakMoment judges the official peak windows (weekday 9:00–12:00 & 14:00–18:00, Beijing)', () => {
  const pricing: ProviderPeakValleyPricing = { enabled: true }
  // 2026-11-20 是周五：UTC 01:00 = 北京 09:00 → 高峰开始（左闭）；00:59 → 未开始
  assert.equal(isPeakMoment(new Date('2026-11-20T01:00:00Z'), pricing), true)
  assert.equal(isPeakMoment(new Date('2026-11-20T00:59:00Z'), pricing), false)
  // 午休 12:00–14:00：11:59 仍高峰；12:00 结束（右开）；13:00 空闲
  assert.equal(isPeakMoment(new Date('2026-11-20T03:59:00Z'), pricing), true)
  assert.equal(isPeakMoment(new Date('2026-11-20T04:00:00Z'), pricing), false)
  assert.equal(isPeakMoment(new Date('2026-11-20T05:00:00Z'), pricing), false)
  // 下午段：14:00 → 高峰；17:59 → 高峰；18:00 结束（右开）
  assert.equal(isPeakMoment(new Date('2026-11-20T06:00:00Z'), pricing), true)
  assert.equal(isPeakMoment(new Date('2026-11-20T09:59:00Z'), pricing), true)
  assert.equal(isPeakMoment(new Date('2026-11-20T10:00:00Z'), pricing), false)
  // 夜间与凌晨均为空闲
  assert.equal(isPeakMoment(new Date('2026-11-20T17:00:00Z'), pricing), false)
  // 2026-11-21 是周六：周末全天空闲
  assert.equal(isPeakMoment(new Date('2026-11-21T02:00:00Z'), pricing), false)
  // 未启用一律不命中
  assert.equal(isPeakMoment(new Date('2026-11-20T01:00:00Z'), { enabled: false }), false)
  assert.equal(isPeakMoment(new Date('2026-11-20T01:00:00Z'), undefined), false)
})

test('isPeakMoment excludes statutory holidays (all-day off-peak)', () => {
  const holidays: ProviderPeakValleyPricing = { enabled: true, holidays: ['2027-01-01', '2027-02-09'] }
  // 2027-02-09 是周二（春节放假段）：命中节假日 → 全天空闲
  assert.equal(isPeakMoment(new Date('2027-02-09T01:00:00Z'), holidays), false)
  // 同一时刻不在节假日列表 → 周二 09:00 正常高峰
  assert.equal(isPeakMoment(new Date('2027-02-09T01:00:00Z'), { enabled: true }), true)
  // 列表外的日期不受影响：2027-02-02（周二，工作日）→ 高峰
  assert.equal(isPeakMoment(new Date('2027-02-02T01:00:00Z'), holidays), true)
})

test('peakValleyMultiplier returns the clamped peak multiplier and 1 off-peak', () => {
  const peak = new Date('2026-11-20T01:00:00Z')
  const valley = new Date('2026-11-20T17:00:00Z')
  assert.equal(peakValleyMultiplier({ enabled: true }, peak), 2)
  assert.equal(peakValleyMultiplier({ enabled: true, peakMultiplier: 3 }, peak), 3)
  // 夹取：<1 拉回 1（高峰不能比空闲便宜），>10 封顶
  assert.equal(peakValleyMultiplier({ enabled: true, peakMultiplier: 0.5 }, peak), 1)
  assert.equal(peakValleyMultiplier({ enabled: true, peakMultiplier: 15 }, peak), 10)
  assert.equal(peakValleyMultiplier({ enabled: true }, valley), 1)
  assert.equal(peakValleyMultiplier(undefined, peak), 1)
})

test('computeTokenCost doubles peak-window billing and flags it', () => {
  const record = {
    task: '主叙事', providerLabel: 'B', model: 'm-b',
    inputTokens: 1_000_000, outputTokens: 100_000, cachedInputTokens: 800_000,
    priceInput: 2, priceOutput: 8, priceCachedInput: 0.5,
    pricePeakValley: { enabled: true, peakMultiplier: 2 } as ProviderPeakValleyPricing,
  }
  // 高峰（周五 09:00，×2）：未命中 200k×4 + 缓存 800k×1 + 输出 100k×16
  const cost = computeTokenCost(record, new Date('2026-11-20T01:00:00Z'))!
  assert.equal(cost.peak, true)
  assert.equal(cost.inputCost, 1.6)
  assert.equal(cost.outputCost, 1.6)
  assert.ok(Math.abs(cost.total - 3.2) < 1e-9)
  // 空闲（周五 22:00）：按填写单价原样计
  const normal = computeTokenCost(record, new Date('2026-11-20T14:00:00Z'))!
  assert.equal(normal.peak, false)
  assert.ok(Math.abs(normal.total - 1.6) < 1e-9)
})

test('aggregateTokenUsages forwards the peak-valley pricing of the priced attempt', () => {
  const total = aggregateTokenUsages([
    { task: '主叙事', providerLabel: 'A', model: 'm-a', inputTokens: 100, outputTokens: 20 },
    { task: '主叙事', providerLabel: 'B', model: 'm-b', inputTokens: 100, outputTokens: 20, priceInput: 1, priceOutput: 4, pricePeakValley: { enabled: true, peakMultiplier: 2 } },
  ])!
  assert.equal(total.priceInput, 1)
  assert.equal(total.pricePeakValley?.enabled, true)
})

test('estimateTokenCost doubles peak billing and keeps valley rates elsewhere (official table)', () => {
  // 用官方 deepseek-flash 空闲价列（1 / 4 / 0.02）验证：高峰 ×2 应精确得到高峰价列（2 / 8 / 0.04）的金额
  const base = { inputTokens: 1_000_000, cachedInputTokens: 400_000, outputTokens: 200_000, priceInput: 1, priceOutput: 4, priceCachedInput: 0.02 }
  // 空闲：600k×1 + 400k×0.02 + 200k×4 = 1.408
  assert.ok(Math.abs(estimateTokenCost(base) - 1.408) < 1e-9)
  // 高峰（周五 09:00）：×2 = 2.816
  assert.ok(Math.abs(estimateTokenCost({ ...base, pricePeakValley: { enabled: true, peakMultiplier: 2 } }, new Date('2026-11-20T01:00:00Z')) - 2.816) < 1e-9)
  // 周六全天空闲
  assert.ok(Math.abs(estimateTokenCost({ ...base, pricePeakValley: { enabled: true } }, new Date('2026-11-21T01:00:00Z')) - 1.408) < 1e-9)
})
