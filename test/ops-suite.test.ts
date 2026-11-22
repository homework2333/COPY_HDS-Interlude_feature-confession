import assert from 'node:assert/strict'
import test from 'node:test'
import { Context } from 'koishi'
import { SQLiteDriver } from '@minatojs/driver-sqlite'
import { registerTables } from '../src/database'
import { resolveProactiveOffUsers } from '../src/session-platform'
import { OpsEventBus } from '../src/ops/events'
import {
  digestIssues, localDayRange, nextDailyRun, renderDailyReport, usageRowsToAgg,
} from '../src/ops/daily-report'
import { estimateTokenCost, noteAccessRequest, recordAccessDecision } from '../src/ops/runtime'
import { bucketUsageRows, gatherUsageAnalytics, usageRangeBounds } from '../src/ops/usage-analytics'
import type { AccessRequestRow, OpsLogRow, UsageLogRow } from '../src/ops/tables'

/* ── 按用户主动消息策略（补丁 v2 源码化） ─────────────────────────── */

test('主动消息策略：默认全放行；按账号关闭；四种模式叠加正确', () => {
  const accounts = [
    { qq: '10001', label: '', enabled: true },
    { qq: '10002', label: '', enabled: true, proactive: false },
    { qq: '10003', label: '', enabled: false },
  ]
  const base = { onebot: { userAccounts: accounts } }
  assert.deepEqual([...resolveProactiveOffUsers(base)].sort(), ['10002'])
  assert.deepEqual([...resolveProactiveOffUsers({ ...base, sharedStory: { proactiveContacts: { mode: 'none' } } })].sort(), ['10001', '10002'])
  assert.deepEqual([...resolveProactiveOffUsers({ ...base, sharedStory: { proactiveContacts: { mode: 'blacklist', list: ['10001'] } } })].sort(), ['10001', '10002'])
  assert.deepEqual([...resolveProactiveOffUsers({ ...base, sharedStory: { proactiveContacts: { mode: 'whitelist', list: ['10001'] } } })].sort(), ['10002'])
  // 未启用账号永不进入任何名单（被拒收者谈不上主动消息）。
  assert.equal([...resolveProactiveOffUsers({ ...base, sharedStory: { proactiveContacts: { mode: 'none' } } })].includes('10003'), false)
})

/* ── 定时与日界（故事时区） ───────────────────────────────────────── */

test('nextDailyRun：上海 0 点在 UTC 是前一天 16 点；不会返回过去', () => {
  const now = new Date('2026-11-22T10:00:00Z') // 上海 18:00
  const next = nextDailyRun(now, 'Asia/Shanghai', 0, 0)
  assert.equal(next.toISOString(), '2026-11-22T16:00:00.000Z') // 上海 11-23 00:00
  const midnightJustPassed = new Date('2026-11-22T16:00:30Z') // 上海 00:00:30
  const next2 = nextDailyRun(midnightJustPassed, 'Asia/Shanghai', 0, 0)
  assert.equal(next2.toISOString(), '2026-11-23T16:00:00.000Z')
})

test('localDayRange：以上海日界切分，跨 UTC 日也能对齐', () => {
  const anchor = new Date('2026-11-22T18:30:00Z') // 上海 11-23 02:30
  const range = localDayRange(anchor, 'Asia/Shanghai')
  assert.equal(range.label, '2026-11-23')
  assert.equal(new Date(range.start).toISOString(), '2026-11-22T16:00:00.000Z')
  assert.equal(range.end - range.start, 86_400_000)
})

/* ── 事件总线 ─────────────────────────────────────────────────────── */

test('OpsEventBus：环形缓冲封顶丢弃、统计与订阅', () => {
  const bus = new OpsEventBus(5)
  let seen = 0
  bus.subscribe(() => { seen += 1 })
  for (let index = 0; index < 8; index += 1) bus.publish({ kind: 'log', level: 'warn', message: `m${index}`, phase: 'x', protagonist: 'HDSI' })
  assert.equal(seen, 8)
  assert.equal(bus.recent(10).length, 5)
  assert.equal(bus.snapshot().dropped, 3)
  assert.equal(bus.snapshot().levels.warn, 8)
  assert.equal(bus.recent(3)[0].seq, 8)
})

/* ── 日报聚合与渲染 ───────────────────────────────────────────────── */

function usageRow(task: string, model: string, input: number, output: number, cached = 0): UsageLogRow {
  return { id: 0, ts: new Date(), task, providerLabel: 'p', model, inputTokens: input, outputTokens: output, cachedInputTokens: cached, cost: 0.01 }
}

test('digestIssues：error 优先于 warn；同级按频次；标签正确', () => {
  const errors: OpsLogRow[] = [
    { id: 1, ts: new Date('2026-11-22T01:00:00Z'), level: 'error', phase: 'advance', message: '模型超时 A' },
    { id: 2, ts: new Date('2026-11-22T05:00:00Z'), level: 'error', phase: 'advance', message: '模型超时 A' },
  ]
  const warns: OpsLogRow[] = [
    { id: 3, ts: new Date('2026-11-22T02:00:00Z'), level: 'warn', phase: 'weather', message: '天气拉取失败 B'.repeat(1) },
    { id: 4, ts: new Date('2026-11-22T03:00:00Z'), level: 'warn', phase: 'weather', message: '天气拉取失败 B' },
    { id: 5, ts: new Date('2026-11-22T04:00:00Z'), level: 'warn', phase: 'weather', message: '天气拉取失败 B' },
  ]
  const issues = digestIssues(errors, warns)
  assert.equal(issues[0].level, 'error')
  assert.equal(issues[0].count, 2)
  assert.equal(issues[1].count, 3)
})

test('usageRowsToAgg + renderDailyReport：聚合按模型、缓存命中率与昨日对比', () => {
  const agg = usageRowsToAgg([
    usageRow('main', 'deepseek-chat', 1000, 500, 400),
    usageRow('main', 'deepseek-chat', 2000, 1000, 800),
    usageRow('compaction', 'glm-flash', 500, 100),
  ])
  assert.equal(agg.length, 2)
  assert.equal(agg[0].model, 'deepseek-chat')
  assert.equal(agg[0].calls, 2)
  assert.equal(agg[0].cachedInputTokens, 1200)
  const text = renderDailyReport({
    dayLabel: '2026-11-22',
    usage: agg,
    yesterdayTotalTokens: 1000,
    errors: [{ id: 1, ts: new Date(), level: 'error', phase: 'x', message: 'boom' }],
    warns: [],
    health: { successes: 10, retries: 1, failures: 0, avgLatencyMs: 3200 },
    uptimeSeconds: 90_000,
    version: 'test',
    pendingAccessRequests: 1,
  })
  assert.match(text, /【今日用量】5\.1k tokens · 3 次 · 命中率 34%/)
  assert.match(text, /较昨日 \+410%/)
  assert.match(text, /【报错】今日 error 1 条 · warn 0 条/)
  assert.match(text, /✗ ×1 boom/)
  assert.match(text, /【待审批】白名单申请 1 条/)
  assert.match(text, /【健康】成功 10 · 重试 1 · 失败 0/)
})

test('estimateTokenCost：未命中 + 缓存 + 输出三段计价', () => {
  const cost = estimateTokenCost({ inputTokens: 1_000_000, cachedInputTokens: 400_000, outputTokens: 200_000, priceInput: 2, priceOutput: 8, priceCachedInput: 0.2 })
  // 600k*2 + 400k*0.2 + 200k*8 = 1.2M + 80k + 1.6M = 2.88
  assert.ok(Math.abs(cost - 2.88) < 1e-9)
})

/* ── 白名单申请（真库） ───────────────────────────────────────────── */

function fakeSvc(ctx: any) {
  const sent: Array<{ qq: string, text: string }> = []
  const svc: any = Object.create(null)
  svc.ctx = ctx
  svc.config = {
    storyDefaults: { timezone: 'Asia/Shanghai' },
    onebot: { enabled: true, userAccounts: [] },
    sharedStory: { managerAccounts: ['2812476708'] },
    ops: { accessRequests: { enabled: true, autoReply: true } },
  }
  svc.sharedStoryConfig = svc.config.sharedStory
  svc.bootedAt = Date.now()
  svc.opsBus = new OpsEventBus()
  svc.dbGet = (table: string, query: any) => ctx.database.get(table, query)
  svc.dbCreate = (table: string, row: any) => ctx.database.create(table, row)
  svc.dbSet = (table: string, query: any, update: any) => ctx.database.set(table, query, update)
  svc.reportStandalone = () => undefined
  svc.reportStandaloneOperation = () => undefined
  svc.sendOpsPrivate = undefined // runtime 使用 sendOpsPrivate(svc,...)，注入桩：
  ;(svc as any).__sent = sent
  return { svc, sent }
}

test('白名单申请：记录、通知、每日一次礼貌回复、审批落库', async () => {
  const app = new Context()
  app.plugin(SQLiteDriver, { path: ':memory:' })
  let finished!: (value?: unknown) => void
  const done = new Promise(resolve => { finished = resolve })
  app.inject(['database'], async ctx => {
    try {
      registerTables(ctx)
      const { svc } = fakeSvc(ctx)
      // 出站桩：经 svc.sendOpsPrivate 注入（runtime 的 deliverPrivate 会优先使用）。
      const sent: Array<{ qq: string, text: string }> = []
      svc.sendOpsPrivate = async (qq: string, text: string) => { sent.push({ qq, text }); return true }
      const session: any = {
        platform: 'onebot', userId: '999888777', username: '小未知', content: '你好呀',
      }
      const runtime = await import('../src/ops/runtime')
      await runtime.noteAccessRequest(svc, session)
      await runtime.noteAccessRequest(svc, session) // 同日第二次：不再自动回复
      const rows = await ctx.database.get('interlude_access_request', {}) as AccessRequestRow[]
      assert.equal(rows.length, 1)
      assert.equal(rows[0].qq, '999888777')
      assert.equal(rows[0].status, 'pending')
      assert.equal(rows[0].attempts, 2)
      // 通知管理员 2 次（每次陌生消息都通知），礼貌回复只 1 次（每日一次）。
      assert.equal(sent.filter(item => item.qq === '2812476708').length, 2)
      assert.equal(sent.filter(item => item.qq === '999888777').length, 1)
      // 审批：未申请过的 QQ 直接授权也建行。
      const decided = await runtime.recordAccessDecision(svc, '999888777', true, '朋友')
      assert.equal(decided?.status, 'approved')
      const direct = await runtime.recordAccessDecision(svc, '111222333', true)
      assert.equal(direct?.status, 'approved')
      const all = await ctx.database.get('interlude_access_request', {}) as AccessRequestRow[]
      assert.equal(all.length, 2)
      finished()
    } catch (error) {
      finished(error)
    }
  })
  try {
    await app.start()
    const error = await done
    if (error) throw error
  } finally {
    await app.stop()
  }
})

/* ── 调用分析（usage-analytics） ──────────────────────────────────── */

test('usageRangeBounds：今日/昨日/近 7 天的边界与分桶粒度', () => {
  const tz = 'Asia/Shanghai'
  const now = new Date('2026-11-22T06:30:00Z') // 上海 14:30
  const today = usageRangeBounds('today', tz, now)
  assert.equal(today.bucketMode, 'hour')
  assert.equal(new Date(today.from).toISOString(), '2026-11-21T16:00:00.000Z')
  assert.equal(today.to - today.from, 86_400_000)
  const yday = usageRangeBounds('yesterday', tz, now)
  assert.equal(yday.to, today.from)
  assert.equal(yday.from, today.from - 86_400_000)
  const week = usageRangeBounds('7d', tz, now)
  assert.equal(week.bucketMode, 'day')
  assert.equal(week.to - week.from, 7 * 86_400_000)
  assert.equal(week.to, today.to)
})

test('bucketUsageRows：小时档 24 格索引归桶、天档本地日期键、空数据也有完整时间轴', () => {
  const tz = 'Asia/Shanghai'
  const now = new Date('2026-11-22T06:30:00Z') // 上海 14:30
  const bounds = usageRangeBounds('today', tz, now)
  const rowAt = (iso: string, id = 1): UsageLogRow => ({
    id, ts: new Date(iso), task: '主叙事', providerLabel: 'p', model: 'deepseek-flash',
    inputTokens: 100, outputTokens: 10, cachedInputTokens: 40, cost: 0.01,
  })
  const rows = [
    rowAt('2026-11-22T06:10:00Z', 1), // 上海 14:10
    rowAt('2026-11-22T07:50:00Z', 2), // 上海 15:50
    rowAt('2026-11-22T06:59:00Z', 3), // 上海 14:59
  ]
  const hourly = bucketUsageRows(rows, 'hour', tz, bounds)
  assert.equal(hourly.length, 24)
  assert.equal(hourly[0].label, '00:00')
  assert.equal(hourly.find(bucket => bucket.label === '14:00')?.calls, 2)
  assert.equal(hourly.find(bucket => bucket.label === '15:00')?.calls, 1)
  assert.equal(hourly.reduce((acc, bucket) => acc + bucket.calls, 0), 3)
  assert.equal(hourly.find(bucket => bucket.label === '14:00')?.inputTokens, 200)
  // 坏时间戳不炸、不计入。
  const broken = bucketUsageRows([{ ...rowAt('2026-11-22T06:00:00Z'), ts: new Date('not-a-date') as any }], 'hour', tz, bounds)
  assert.equal(broken.reduce((acc, bucket) => acc + bucket.calls, 0), 0)
  // 天档：空数据也返回 7 格；行按本地日期归桶。
  const weekBounds = usageRangeBounds('7d', tz, now)
  const daily = bucketUsageRows([rowAt('2026-11-21T10:00:00Z')], 'day', tz, weekBounds)
  assert.equal(daily.length, 7)
  assert.equal(daily[6].label, '11-22')
  assert.equal(daily[5].label, '11-21')
  assert.equal(daily[5].calls, 1)
  assert.equal(daily[6].calls, 0)
  const emptyDay = bucketUsageRows([], 'day', tz, weekBounds)
  assert.equal(emptyDay.length, 7)
})

test('gatherUsageAnalytics：dbGet 视图聚合出 totals/byTask/buckets/recent', async () => {
  const rows: UsageLogRow[] = [
    { id: 2, ts: new Date('2026-11-22T06:20:00Z'), task: '主叙事', providerLabel: 'p', model: 'deepseek-flash', inputTokens: 200, outputTokens: 20, cachedInputTokens: 100, cost: 0.02 },
    { id: 1, ts: new Date('2026-11-22T06:10:00Z'), task: '压缩', providerLabel: 'p', model: 'deepseek-flash', inputTokens: 100, outputTokens: 10, cachedInputTokens: 0, cost: 0.01 },
  ]
  const svc: any = {
    config: { storyDefaults: { timezone: 'Asia/Shanghai' } },
    dbGet: async (table: string, query: any) => table === 'interlude_usage_log' && query?.ts?.$gte ? rows : [],
  }
  const result = await gatherUsageAnalytics(svc, 'today', 50)
  assert.equal(result.ok, true)
  assert.equal(result.bucketMode, 'hour')
  assert.equal(result.totals.calls, 2)
  assert.equal(result.totals.inputTokens, 300)
  assert.equal(result.totals.cachedInputTokens, 100)
  assert.equal(result.buckets.length, 24)
  // recent 按 id 倒序。
  assert.deepEqual(result.recent.map(item => item.id), [2, 1])
  assert.equal(result.byTask.length, 2)
  const main = result.byTask.find(row => row.task === '主叙事')!
  assert.equal(main.calls, 1)
  assert.equal(main.cachedInputTokens, 100)
})

/* ── sendOpsPrivate 回归：必须用通用 sendMessage API ──────────────── */

test('sendOpsPrivate：走 bot.sendMessage("private:<qq>")（Bot 基类没有 sendPrivateMsg）', async () => {
  const runtime = await import('../src/ops/runtime')
  const calls: Array<{ bot: string, channelId: string, text: string }> = []
  // 两个 bot：前者模拟真实 Koishi（只有 sendMessage），后者抛错验证降级。
  const bots = [
    { platform: 'onebot', sendMessage: async (channelId: string, content: string) => { calls.push({ bot: 'a', channelId, text: content }); return ['1'] } },
    { platform: 'onebot', sendMessage: async () => { throw new Error('bot b offline') } },
  ]
  const warns: string[] = []
  const captureWarn = (level: string, msg: string, ...rest: unknown[]) => warns.push(`${level}:${msg} ${rest.join(' ')}`)
  const svc: any = {
    ctx: { bots },
    reportStandalone: captureWarn,
  }
  // 好路径：命中第一个 bot，通道带 private: 前缀。
  assert.equal(await runtime.sendOpsPrivate(svc, '2812476708', '测试'), true)
  assert.deepEqual(calls, [{ bot: 'a', channelId: 'private:2812476708', text: '测试' }])
  // 坏路径：所有 bot 都抛错 → 返回 false，且错误进了 ops 告警（不再静默）。
  const failing: any = { ctx: { bots: [bots[1]] }, reportStandalone: captureWarn }
  assert.equal(await runtime.sendOpsPrivate(failing, '2812476708', '测试'), false)
  assert.equal(warns.some(item => item.includes('私聊发送失败') && item.includes('bot b offline')), true)
  // 非 OneBot 平台的 bot 不尝试。
  const otherOnly: any = { ctx: { bots: [{ platform: 'discord', sendMessage: async () => { throw new Error('wrong platform') } }] }, reportStandalone: () => undefined }
  assert.equal(await runtime.sendOpsPrivate(otherOnly, '2812476708', '测试'), false)
  // 目标无法归一化 → 直接 false。
  assert.equal(await runtime.sendOpsPrivate(svc, '', '测试'), false)
})
