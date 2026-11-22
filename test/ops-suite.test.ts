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
