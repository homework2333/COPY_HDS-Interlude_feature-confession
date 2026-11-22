<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { store } from '../store'

defineOptions({ name: 'DebugPage' })

interface OpsEventView {
  kind: 'log' | 'usage' | 'narrative' | 'access'
  seq: number
  ts: number
  level?: string
  message?: string
  phase?: string
  protagonist?: string
  task?: string
  model?: string
  providerLabel?: string
  inputTokens?: number
  outputTokens?: number
  cachedInputTokens?: number
  cost?: number
  storyId?: string
  script?: string
  decision?: string
  qq?: string
  status?: string
}

const events = ref<OpsEventView[]>([])
const stats = ref<any>(null)
const failed = ref('')
const live = ref(true)
const autoScroll = ref(true)
const levelFilter = ref<'all' | 'warn' | 'error'>('all')
const kindFilter = ref<'all' | 'log' | 'narrative' | 'usage' | 'access'>('all')
const search = ref('')
const expanded = ref<Set<number>>(new Set())
const logPane = ref<HTMLElement | null>(null)
let timer: number | undefined
let fetching = false

const maxSeq = computed(() => events.value.reduce((acc, item) => Math.max(acc, item.seq), 0))

const filtered = computed(() => events.value.filter(item => {
  if (kindFilter.value !== 'all' && item.kind !== kindFilter.value) return false
  if (item.kind === 'log') {
    if (levelFilter.value === 'warn' && !['warn', 'error'].includes(String(item.level))) return false
    if (levelFilter.value === 'error' && item.level !== 'error') return false
  }
  if (search.value.trim()) {
    const needle = search.value.trim().toLowerCase()
    const haystack = [item.message, item.script, item.model, item.phase, item.protagonist, item.qq, item.decision]
      .filter(Boolean).join(' ').toLowerCase()
    if (!haystack.includes(needle)) return false
  }
  return true
}))

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString('zh-CN', { hour12: false })
}

function fmtTokens(n?: number) {
  if (!n) return '0'
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}k` : String(n)
}

function kindLabel(kind: string) {
  return ({ log: '日志', narrative: '续写', usage: '用量', access: '申请' } as Record<string, string>)[kind] ?? kind
}

function toggleExpand(seq: number) {
  const next = new Set(expanded.value)
  if (next.has(seq)) next.delete(seq)
  else next.add(seq)
  expanded.value = next
}

async function refresh() {
  if (fetching) return
  fetching = true
  try {
    const result = await store.opsRecent(240)
    if (result?.ok) {
      events.value = result.events ?? []
      stats.value = result.stats ?? null
      failed.value = ''
    }
  } catch (error: any) {
    failed.value = error?.message ?? String(error)
  } finally {
    fetching = false
    if (autoScroll.value) requestAnimationFrame(() => {
      if (logPane.value) logPane.value.scrollTop = 0
    })
  }
}

function clearView() {
  events.value = []
}

onMounted(() => {
  void refresh()
  timer = window.setInterval(() => { if (live.value) void refresh() }, 2_000)
})
onUnmounted(() => { if (timer) window.clearInterval(timer) })
</script>

<template>
  <div>
    <div class="pg-head">
      <div>
        <h2>调试</h2>
        <div class="sub">主叙事剧本续写、模型用量与 warn/error 的实时事件流（2 秒轮询）。剧本文本受 ops.debugStream.scriptPreview 门控。</div>
      </div>
      <div class="head-stats" v-if="stats">
        <span class="chip" title="自本次进程启动">启动 {{ new Date(stats.sinceBoot).toLocaleTimeString('zh-CN', { hour12: false }) }}</span>
        <span class="chip err" title="error / warn 落库前计数">✗ {{ stats.levels.error }} / ⚠ {{ stats.levels.warn }}</span>
        <span class="chip" title="续写/用量/申请事件计数">✎ {{ stats.counts.narrative }} · ◇ {{ stats.counts.usage }} · ✉ {{ stats.counts.access }}</span>
        <span class="chip" title="环形缓冲溢出丢弃数">丢弃 {{ stats.dropped }}</span>
      </div>
    </div>

    <div class="controls">
      <button :class="{ on: live }" @click="live = !live">{{ live ? '● 实时' : '○ 已暂停' }}</button>
      <label class="mini"><input type="checkbox" v-model="autoScroll" /> 自动置顶</label>
      <select v-model="kindFilter" title="事件类型">
        <option value="all">全部类型</option>
        <option value="narrative">续写</option>
        <option value="log">日志</option>
        <option value="usage">用量</option>
        <option value="access">申请</option>
      </select>
      <select v-model="levelFilter" title="日志级别（仅日志类型生效）">
        <option value="all">全部级别</option>
        <option value="warn">warn 及以上</option>
        <option value="error">仅 error</option>
      </select>
      <input class="search" v-model="search" placeholder="过滤关键字（消息/模型/相位…）" />
      <button @click="clearView">清屏</button>
      <button @click="refresh()">立即刷新</button>
      <span v-if="failed" class="fail">刷新失败：{{ failed }}</span>
    </div>

    <div class="log-pane" ref="logPane">
      <div v-if="!filtered.length" class="empty">
        暂无事件。发一条私聊消息、等一次自动推进，或把级别过滤器调回"全部"。
      </div>
      <div v-for="event in filtered" :key="event.seq" class="ev" :class="[event.kind, event.level]">
        <div class="ev-head" @click="event.kind === 'narrative' && toggleExpand(event.seq)">
          <span class="seq">#{{ event.seq }}</span>
          <span class="time">{{ fmtTime(event.ts) }}</span>
          <span class="kind" :class="event.kind">{{ kindLabel(event.kind) }}</span>
          <template v-if="event.kind === 'log'">
            <span class="lvl" :class="event.level">{{ String(event.level).toUpperCase() }}</span>
            <span class="who">{{ event.protagonist }}{{ event.phase ? ` · ${event.phase}` : '' }}</span>
            <span class="msg">{{ event.message }}</span>
          </template>
          <template v-else-if="event.kind === 'narrative'">
            <span class="who">{{ event.phase }}</span>
            <span class="msg">{{ event.decision }}</span>
            <span class="hint">{{ expanded.has(event.seq) ? '收起' : (event.script ? `展开 ${event.script.length} 字` : '（剧本预览已关闭）') }}</span>
          </template>
          <template v-else-if="event.kind === 'usage'">
            <span class="who">{{ event.task }} · {{ event.model }}</span>
            <span class="msg">入 {{ fmtTokens(event.inputTokens) }}（缓存 {{ fmtTokens(event.cachedInputTokens) }}） 出 {{ fmtTokens(event.outputTokens) }}{{ event.cost ? ` ≈${event.cost.toFixed(4)}` : '' }}</span>
          </template>
          <template v-else>
            <span class="who">{{ event.qq }}</span>
            <span class="msg">{{ event.status }}</span>
          </template>
        </div>
        <pre v-if="event.kind === 'narrative' && expanded.has(event.seq) && event.script" class="script">{{ event.script }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pg-head { margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
.pg-head h2 { font-size: 19px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
.pg-head h2::before { content: ""; width: 10px; height: 10px; background: var(--fg3, #3b82f6); transform: rotate(45deg); }
.sub { opacity: .55; font-size: 12.5px; padding-left: 20px; }
.head-stats { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.chip { font-size: 11.5px; border: 1px solid var(--bg3, rgba(128,128,128,.25)); padding: 3px 9px; opacity: .8; white-space: nowrap; }
.chip.err { border-color: #b4530966; color: #d97706; }
.controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }
.controls button, .controls select, .controls .search { font: inherit; font-size: 12.5px; padding: 6px 12px; background: transparent; border: 1px solid var(--k-color-divider, #8884); color: inherit; }
.controls button { cursor: pointer; }
.controls button.on { border-color: #16a34a; color: #16a34a; }
.controls .search { flex: 1; min-width: 180px; }
.controls .mini { font-size: 12.5px; opacity: .75; display: flex; align-items: center; gap: 4px; }
.fail { color: #d97706; font-size: 12.5px; }
.log-pane { border: 1px solid var(--bg3, rgba(128,128,128,.15)); background: var(--bg1, rgba(128,128,128,.05)); max-height: calc(100vh - 300px); min-height: 320px; overflow-y: auto; padding: 6px 0; font-size: 12.5px; font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace; }
.empty { padding: 40px; text-align: center; opacity: .5; font-family: system-ui, sans-serif; }
.ev { border-bottom: 1px solid var(--bg3, rgba(128,128,128,.08)); padding: 4px 12px; }
.ev-head { display: flex; gap: 10px; align-items: baseline; min-width: 0; cursor: default; }
.ev.narrative .ev-head { cursor: pointer; }
.seq { opacity: .4; font-size: 11px; flex-shrink: 0; }
.time { opacity: .55; flex-shrink: 0; }
.kind { flex-shrink: 0; font-size: 11px; border: 1px solid var(--bg3, #8884); padding: 0 6px; border-radius: 2px; }
.kind.narrative { color: #8b5cf6; border-color: #8b5cf655; }
.kind.usage { color: #0ea5e9; border-color: #0ea5e955; }
.kind.access { color: #d97706; border-color: #d9770655; }
.lvl { flex-shrink: 0; font-weight: 700; font-size: 11px; }
.lvl.error { color: #dc2626; }
.lvl.warn { color: #d97706; }
.lvl.info { color: #64748b; }
.lvl.debug { color: #94a3b8; }
.who { opacity: .7; flex-shrink: 0; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.msg { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ev.error .msg { color: #f87171; }
.hint { opacity: .5; font-size: 11px; flex-shrink: 0; }
.script { margin: 6px 0 8px 52px; padding: 10px 12px; background: rgba(139,92,246,.06); border-left: 2px solid #8b5cf688; white-space: pre-wrap; word-break: break-word; font-size: 12px; line-height: 1.7; max-height: 420px; overflow-y: auto; }
</style>
