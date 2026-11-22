<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { store, type UsageAnalyticsView } from '../store'

defineOptions({ name: 'UsagePage' })

const preset = ref<'today' | 'yesterday' | '7d'>('today')
const data = ref<UsageAnalyticsView | null>(null)
const failed = ref('')
const loading = ref(true)
const live = ref(true)
let timer: number | undefined
let fetching = false

async function refresh() {
  if (fetching) return
  fetching = true
  try {
    const result = await store.opsUsage(preset.value)
    if (result?.ok) {
      data.value = result
      failed.value = ''
    } else {
      failed.value = result?.error || '读取失败'
    }
  } catch (error: any) {
    failed.value = error?.message ?? String(error)
  } finally {
    fetching = false
    loading.value = false
  }
}

function pick(next: 'today' | 'yesterday' | '7d') {
  if (preset.value === next) return
  preset.value = next
  loading.value = true
  void refresh()
}

const totals = computed(() => data.value?.totals ?? { calls: 0, inputTokens: 0, outputTokens: 0, cachedInputTokens: 0, cost: 0 })
const hitRate = computed(() => totals.value.inputTokens ? Math.round(totals.value.cachedInputTokens / totals.value.inputTokens * 100) : 0)
const maxBucketTokens = computed(() => Math.max(1, ...(data.value?.buckets ?? []).map(bucket => bucket.inputTokens + bucket.outputTokens)))

function hitRateOf(row: { inputTokens: number, cachedInputTokens: number }) {
  return row.inputTokens ? Math.round(row.cachedInputTokens / row.inputTokens * 100) : 0
}

function barHeight(bucket: { inputTokens: number, outputTokens: number }) {
  const tokens = bucket.inputTokens + bucket.outputTokens
  if (!tokens) return '0%'
  return `${Math.max(3, Math.round(tokens / maxBucketTokens.value * 100))}%`
}

function cachedShare(bucket: { inputTokens: number, cachedInputTokens: number, outputTokens: number }) {
  const tokens = bucket.inputTokens + bucket.outputTokens
  return tokens ? `${Math.round(bucket.cachedInputTokens / tokens * 100)}%` : '0%'
}

function labelVisible(index: number) {
  return data.value?.bucketMode === 'day' || index % 3 === 0
}

function fmtTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(Math.round(n))
}

function fmtCost(n: number) {
  return n >= 1 ? n.toFixed(2) : n.toFixed(4)
}

function fmtTime(ms: number) {
  const date = new Date(ms)
  const pad = (value: number) => String(value).padStart(2, '0')
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  return preset.value === '7d' ? `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${time.slice(0, 5)}` : time
}

onMounted(() => {
  void refresh()
  // SSR/内存渲染测试环境无 window，跳过定时器只验证首帧渲染。
  if (typeof window === 'undefined') return
  timer = window.setInterval(() => { if (live.value) void refresh() }, 30_000)
})
onUnmounted(() => { if (timer) window.clearInterval(timer) })
</script>

<template>
  <div>
    <div class="pg-head">
      <div>
        <h2>调用分析</h2>
        <div class="sub">模型调用的 token 用量、缓存命中与费用 · 数据源 interlude_usage_log（保留 60 天）· 30 秒自动刷新</div>
      </div>
    </div>

    <div class="tabs-row">
      <button :class="{ on: preset === 'today' }" @click="pick('today')">今日</button>
      <button :class="{ on: preset === 'yesterday' }" @click="pick('yesterday')">昨日</button>
      <button :class="{ on: preset === '7d' }" @click="pick('7d')">近 7 天</button>
      <span class="flex-fill"></span>
      <button :class="{ primary: live }" @click="live = !live">{{ live ? '暂停刷新' : '继续刷新' }}</button>
      <button @click="loading = true; refresh()">立即刷新</button>
    </div>

    <div v-if="failed" class="notice warn">读取失败：{{ failed }}</div>
    <div v-if="loading && !data" class="notice info">读取中……</div>

    <template v-if="data">
      <div v-if="!totals.calls" class="empty">该时段没有模型调用记录。</div>
      <template v-else>
        <div class="cards">
          <div class="card"><div class="k">调用次数</div><div class="v">{{ totals.calls }}</div></div>
          <div class="card"><div class="k">总 tokens</div><div class="v">{{ fmtTokens(totals.inputTokens + totals.outputTokens) }}</div><div class="s">输入 {{ fmtTokens(totals.inputTokens) }} · 输出 {{ fmtTokens(totals.outputTokens) }}</div></div>
          <div class="card"><div class="k">缓存命中率</div><div class="v">{{ hitRate }}%</div><div class="s">命中 {{ fmtTokens(totals.cachedInputTokens) }}</div></div>
          <div class="card"><div class="k">估算费用</div><div class="v">¥{{ fmtCost(totals.cost) }}</div><div class="s">按连接价格字段</div></div>
        </div>

        <div class="section-title">趋势（{{ data.bucketMode === 'hour' ? '按小时' : '按天' }}，深色为缓存命中部分）</div>
        <div class="chart">
          <div v-for="(bucket, index) in data.buckets" :key="bucket.label" class="bar-col"
            :title="`${bucket.label} · ${bucket.calls} 次 · ${fmtTokens(bucket.inputTokens + bucket.outputTokens)} tok · 命中 ${hitRateOf(bucket)}%`">
            <div class="bar" :style="{ height: barHeight(bucket) }">
              <div class="seg cached" :style="{ height: cachedShare(bucket) }"></div>
            </div>
            <div class="bar-label" :class="{ dim: !labelVisible(index) }">{{ bucket.label }}</div>
          </div>
        </div>

        <div class="section-title">按任务汇总</div>
        <div class="table">
          <div class="thead">
            <div class="col task">任务</div><div class="col model">模型</div><div class="col num">次数</div>
            <div class="col num">输入</div><div class="col num">命中</div><div class="col num">命中率</div>
            <div class="col num">输出</div><div class="col num">费用</div>
          </div>
          <div v-for="row in data.byTask" :key="row.task + '|' + row.model" class="trow">
            <div class="col task">{{ row.task }}</div>
            <div class="col model mono">{{ row.model }}</div>
            <div class="col num">{{ row.calls }}</div>
            <div class="col num mono">{{ fmtTokens(row.inputTokens) }}</div>
            <div class="col num mono">{{ fmtTokens(row.cachedInputTokens) }}</div>
            <div class="col num">{{ hitRateOf(row) }}%</div>
            <div class="col num mono">{{ fmtTokens(row.outputTokens) }}</div>
            <div class="col num mono">¥{{ fmtCost(row.cost) }}</div>
          </div>
        </div>

        <div class="section-title">最近调用（最新 {{ data.recent.length }} 条）</div>
        <div class="table">
          <div class="thead">
            <div class="col time">时间</div><div class="col task">任务</div><div class="col model">模型</div>
            <div class="col num">输入</div><div class="col num">命中</div><div class="col num">输出</div><div class="col num">费用</div>
          </div>
          <div v-for="row in data.recent" :key="row.id" class="trow">
            <div class="col time mono">{{ fmtTime(row.ts) }}</div>
            <div class="col task">{{ row.task }}</div>
            <div class="col model mono">{{ row.model }}</div>
            <div class="col num mono">{{ fmtTokens(row.inputTokens) }}</div>
            <div class="col num mono">{{ fmtTokens(row.cachedInputTokens) }}</div>
            <div class="col num mono">{{ fmtTokens(row.outputTokens) }}</div>
            <div class="col num mono">¥{{ fmtCost(row.cost) }}</div>
          </div>
        </div>
        <div class="hint-line">缓存命中率 = cachedInputTokens / inputTokens。命中率受前缀稳定性影响：人设与事实段是稳定前缀，重启或配置变更会使缓存失效一次。费用为按连接价格字段的估算值。</div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.pg-head { margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
.pg-head h2 { font-size: 19px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
.pg-head h2::before { content: ""; width: 10px; height: 10px; background: var(--fg3, #3b82f6); transform: rotate(45deg); }
.sub { opacity: .55; font-size: 12.5px; padding-left: 20px; }
.tabs-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }
.tabs-row button { font: inherit; font-size: 12.5px; padding: 6px 14px; background: transparent; border: 1px solid var(--k-color-divider, #8884); color: inherit; cursor: pointer; }
.tabs-row button.on { border-color: var(--k-color-primary, #3b82f6); color: var(--k-color-primary, #3b82f6); }
.tabs-row button.primary:not(:disabled) { border-color: var(--k-color-primary, #3b82f6); color: var(--k-color-primary, #3b82f6); }
.flex-fill { flex: 1; }
.notice { border-left: 3px solid; padding: 10px 14px; font-size: 12.5px; margin-bottom: 10px; }
.notice.info { border-color: var(--fg3, #3b82f6); background: rgba(59,130,246,.08); }
.notice.warn { border-color: #b45309; background: rgba(180,83,9,.08); }
.empty { padding: 40px; text-align: center; opacity: .55; border: 1px dashed var(--bg3, #8884); font-size: 13px; }
.cards { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.card { flex: 1; min-width: 150px; border: 1px solid var(--bg3, rgba(128,128,128,.15)); padding: 12px 16px; }
.card .k { font-size: 11.5px; opacity: .55; letter-spacing: .5px; }
.card .v { font-size: 21px; font-weight: 700; margin-top: 4px; }
.card .s { font-size: 11px; opacity: .5; margin-top: 3px; }
.section-title { font-size: 13px; font-weight: 600; margin: 18px 0 8px; opacity: .8; }
.chart { display: flex; align-items: flex-end; gap: 3px; height: 120px; padding: 10px 12px 6px; border: 1px solid var(--bg3, rgba(128,128,128,.15)); }
.bar-col { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; }
.bar { width: 100%; max-width: 26px; background: rgba(59,130,246,.35); position: relative; border-radius: 2px 2px 0 0; }
.seg.cached { position: absolute; bottom: 0; left: 0; width: 100%; background: rgba(16,163,74,.6); border-radius: 0 0 2px 2px; }
.bar-label { font-size: 9.5px; opacity: .7; margin-top: 4px; white-space: nowrap; }
.bar-label.dim { visibility: hidden; }
.table { border: 1px solid var(--bg3, rgba(128,128,128,.15)); font-size: 12.5px; }
.thead { display: flex; gap: 10px; padding: 8px 14px; background: var(--bg1, rgba(128,128,128,.08)); font-size: 11px; opacity: .6; letter-spacing: .5px; }
.trow { display: flex; gap: 10px; align-items: center; padding: 8px 14px; border-top: 1px solid var(--bg3, rgba(128,128,128,.1)); }
.col { min-width: 0; }
.col.task { width: 110px; flex-shrink: 0; }
.col.model { flex: 1; min-width: 120px; opacity: .8; }
.col.num { width: 76px; flex-shrink: 0; text-align: right; }
.col.time { width: 110px; flex-shrink: 0; opacity: .75; }
.mono { font-family: ui-monospace, Consolas, monospace; }
.hint-line { margin-top: 10px; font-size: 11.5px; opacity: .5; }
</style>
