<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { store } from '../store'

defineOptions({ name: 'ListsPage' })

interface UserRow {
  qq: string
  label: string
  personId: string
  profile: string
  relationship: string
  enabled: boolean
  proactive: boolean
  joinedAt?: string
  lastActiveAt?: string
  displayName?: string
  pendingRequest?: boolean
}

interface GroupRow {
  groupId: string
  label: string
  enabled: boolean
  responseMode?: string
  collectionScope?: string
  purpose: string
  characterRole: string
}

interface RequestRow {
  id: number
  qq: string
  displayName: string
  source: string
  attempts: number
  status: string
  note: string
  firstRequestAt: string
  lastRequestAt: string
}

const tab = ref<'requests' | 'users' | 'groups'>('requests')
const loading = ref(true)
const failed = ref('')
const users = ref<UserRow[]>([])
const groups = ref<GroupRow[]>([])
const requests = ref<RequestRow[]>([])
const onebotEnabled = ref(true)
const managers = ref<string[]>([])
const proactiveMode = ref('all')
const proactiveList = ref<string[]>([])
const dirty = ref(false)
const saving = ref(false)
const message = ref('')
const search = ref('')

const requestFilter = computed(() => requests.value.filter(row => row.status === 'pending'))
const filteredUsers = computed(() => {
  const needle = search.value.trim().toLowerCase()
  if (!needle) return users.value
  return users.value.filter(row => [row.qq, row.label, row.displayName, row.personId].filter(Boolean).join(' ').toLowerCase().includes(needle))
})

async function load() {
  loading.value = true
  failed.value = ''
  try {
    const result = await store.listsRead()
    if (!result?.ok) throw new Error(result?.error ?? '读取失败')
    users.value = result.users ?? []
    groups.value = result.groups ?? []
    requests.value = result.requests ?? []
    onebotEnabled.value = result.onebotEnabled
    managers.value = result.managers ?? []
    proactiveMode.value = result.proactive?.mode ?? 'all'
    proactiveList.value = result.proactive?.list ?? []
    dirty.value = false
  } catch (error: any) {
    failed.value = error?.message ?? String(error)
  } finally {
    loading.value = false
  }
}

function markDirty() { dirty.value = true; message.value = '' }

function addUser() {
  const qq = window.prompt('要添加的 QQ 号（5-12 位数字）')
  if (!qq || !/^\d{5,12}$/.test(qq.trim()) || users.value.some(row => row.qq === qq.trim())) return
  users.value.push({ qq: qq.trim(), label: '', personId: '', profile: '', relationship: '', enabled: true, proactive: true })
  markDirty()
}

function removeUser(index: number) {
  const row = users.value[index]
  if (!window.confirm(`从私聊白名单移除 ${row.qq}${row.label ? `（${row.label}）` : ''}？\n（参与者与历史剧本保留，仅停止接收其私聊）`)) return
  users.value.splice(index, 1)
  markDirty()
}

function addGroup() {
  const gid = window.prompt('要添加的 QQ 群号（5-12 位数字）')
  if (!gid || !/^\d{5,12}$/.test(gid.trim()) || groups.value.some(row => row.groupId === gid.trim())) return
  groups.value.push({ groupId: gid.trim(), label: '', enabled: true, responseMode: 'mention-only', collectionScope: 'directed', purpose: '', characterRole: '' })
  markDirty()
}

function removeGroup(index: number) {
  const row = groups.value[index]
  if (!window.confirm(`从群聊白名单移除 ${row.groupId}${row.label ? `（${row.label}）` : ''}？`)) return
  groups.value.splice(index, 1)
  markDirty()
}

async function save() {
  saving.value = true
  message.value = ''
  try {
    const result = await store.listsSave({ users: users.value, groups: groups.value })
    if (!result?.ok) throw new Error(result?.error ?? '保存失败')
    message.value = '已保存（写入 koishi.yml 并热更新）。'
    await load()
  } catch (error: any) {
    message.value = `保存失败：${error?.message ?? String(error)}`
  } finally {
    saving.value = false
  }
}

async function decide(qq: string, approve: boolean) {
  saving.value = true
  message.value = ''
  try {
    const result = await store.listsDecide(qq, approve)
    if (!result?.ok) throw new Error(result?.error ?? '操作失败')
    message.value = approve ? `已授权 ${qq}（写入白名单）。` : `已拒绝 ${qq}。`
    await load()
  } catch (error: any) {
    message.value = `操作失败：${error?.message ?? String(error)}`
  } finally {
    saving.value = false
  }
}

function fmtShort(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
}

function modeSummary(row: GroupRow) {
  const parts = [row.collectionScope ?? row.responseMode ?? '—']
  if (row.backgroundParticipation && row.backgroundParticipation !== 'off') parts.push(`后台:${row.backgroundParticipation}`)
  return parts.join(' · ')
}

onMounted(load)
</script>

<template>
  <div>
    <div class="pg-head">
      <div>
        <h2>名单</h2>
        <div class="sub">私聊用户与群聊白名单的统一管理；陌生人的申请在此审批。写操作经配置中心管线持久化到 koishi.yml。</div>
      </div>
      <div class="head-info">
        <span class="chip" :class="{ off: !onebotEnabled }">{{ onebotEnabled ? 'OneBot 白名单：启用' : 'OneBot 白名单：未启用（全部放行）' }}</span>
        <span class="chip" title="sharedStory.managerAccounts">管理员 {{ managers.length || '（全部授权用户）' }}</span>
        <span class="chip" title="主动消息名单策略">主动消息：{{ proactiveMode }}<template v-if="proactiveList.length">（{{ proactiveList.length }}）</template></span>
      </div>
    </div>

    <div class="tabs-row">
      <button :class="{ on: tab === 'requests' }" @click="tab = 'requests'">申请<span v-if="requestFilter.length" class="badge">{{ requestFilter.length }}</span></button>
      <button :class="{ on: tab === 'users' }" @click="tab = 'users'">私聊用户（{{ users.length }}）</button>
      <button :class="{ on: tab === 'groups' }" @click="tab = 'groups'">群聊（{{ groups.length }}）</button>
      <span class="flex-fill" />
      <input v-if="tab === 'users'" class="search" v-model="search" placeholder="搜索 QQ / 昵称 / 备注…" />
      <button v-if="tab === 'users'" @click="addUser">+ 添加用户</button>
      <button v-if="tab === 'groups'" @click="addGroup">+ 添加群</button>
      <button class="primary" :disabled="!dirty || saving" @click="save">{{ saving ? '保存中…' : dirty ? '保存名单' : '无变更' }}</button>
      <button @click="load">刷新</button>
    </div>
    <div v-if="message" class="notice info">{{ message }}</div>
    <div v-if="failed" class="notice warn">读取失败：{{ failed }}</div>

    <div v-if="loading" class="notice info">读取名单中……</div>

    <template v-else-if="tab === 'requests'">
      <div v-if="!requestFilter.length" class="empty">没有待审批申请。陌生人的私聊与好友申请会自动出现在这里。</div>
      <div v-else class="table">
        <div class="thead">
          <div class="col qq">QQ</div><div class="col name">昵称</div><div class="col src">来源</div>
          <div class="col num">尝试</div><div class="col time">最近申请</div><div class="col note">备注</div><div class="col ops">操作</div>
        </div>
        <div v-for="row in requestFilter" :key="row.id" class="trow">
          <div class="col qq mono">{{ row.qq }}</div>
          <div class="col name">{{ row.displayName || '—' }}</div>
          <div class="col src">{{ row.source === 'friend-request' ? '好友申请' : row.source === 'private' ? '私聊' : row.source }}</div>
          <div class="col num">{{ row.attempts }}</div>
          <div class="col time">{{ fmtShort(row.lastRequestAt) }}</div>
          <div class="col note" :title="row.note">{{ row.note || '—' }}</div>
          <div class="col ops">
            <button class="primary" :disabled="saving" @click="decide(row.qq, true)">授权</button>
            <button :disabled="saving" @click="decide(row.qq, false)">拒绝</button>
          </div>
        </div>
      </div>
      <details class="history">
        <summary>历史记录（{{ requests.length - requestFilter.length }} 条已处理）</summary>
        <div class="table slim">
          <div v-for="row in requests.filter(r => r.status !== 'pending')" :key="row.id" class="trow">
            <div class="col qq mono">{{ row.qq }}</div>
            <div class="col name">{{ row.displayName || '—' }}</div>
            <div class="col src"><span class="tag" :class="row.status">{{ row.status === 'approved' ? '已通过' : '已拒绝' }}</span></div>
            <div class="col num">{{ row.attempts }}</div>
            <div class="col time">{{ fmtShort(row.decidedAt || row.lastRequestAt) }}</div>
            <div class="col note" :title="row.note">{{ row.note || '—' }}</div>
            <div class="col ops"><button class="primary" :disabled="saving" @click="decide(row.qq, true)" v-if="row.status !== 'approved'">改为授权</button></div>
          </div>
        </div>
      </details>
    </template>

    <template v-else-if="tab === 'users'">
      <div class="table">
        <div class="thead">
          <div class="col qq">QQ</div><div class="col name">称呼 / 昵称</div><div class="col st">私聊</div><div class="col st">主动</div>
          <div class="col time">最近活跃</div><div class="col time">加入</div><div class="col ops">操作</div>
        </div>
        <div v-for="(row, index) in filteredUsers" :key="row.qq" class="trow" :class="{ off: !row.enabled }">
          <div class="col qq mono">{{ row.qq }}<span v-if="row.pendingRequest" class="badge" title="有待审批申请">申请</span></div>
          <div class="col name">
            <input v-model="row.label" placeholder="称呼（留空用平台昵称）" @input="markDirty" />
            <div class="subname" v-if="row.displayName && row.displayName !== row.label">{{ row.displayName }}</div>
          </div>
          <div class="col st"><input type="checkbox" v-model="row.enabled" @change="markDirty" /></div>
          <div class="col st"><input type="checkbox" v-model="row.proactive" @change="markDirty" /></div>
          <div class="col time">{{ row.lastActiveAt ? fmtShort(row.lastActiveAt) : '未入组' }}</div>
          <div class="col time">{{ fmtShort(row.joinedAt) }}</div>
          <div class="col ops">
            <button @click="removeUser(index)">移除</button>
          </div>
        </div>
      </div>
      <div class="hint-line">称呼与档案的完整编辑（profile / relationship / personId）请到 配置中心 → QQ 接入；本页覆盖开关、称呼与增删。</div>
    </template>

    <template v-else>
      <div v-if="!groups.length" class="empty">还没有启用任何群聊。添加群号后，默认"仅@触发 + 定向采集"。</div>
      <div v-else class="table">
        <div class="thead">
          <div class="col qq">群号</div><div class="col name">备注</div><div class="col st">启用</div>
          <div class="col mode">模式</div><div class="col time">用途</div><div class="col ops">操作</div>
        </div>
        <div v-for="(row, index) in groups" :key="row.groupId" class="trow" :class="{ off: !row.enabled }">
          <div class="col qq mono">{{ row.groupId }}</div>
          <div class="col name"><input v-model="row.label" placeholder="群备注" @input="markDirty" /></div>
          <div class="col st"><input type="checkbox" v-model="row.enabled" @change="markDirty" /></div>
          <div class="col mode">{{ modeSummary(row) }}</div>
          <div class="col time ellip" :title="row.purpose">{{ row.purpose || '—' }}</div>
          <div class="col ops"><button @click="removeGroup(index)">移除</button></div>
        </div>
      </div>
      <div class="hint-line">群规则的高级维度（意愿档位、冷却、表情包采集等）请到 配置中心 → QQ 接入 → 群聊白名单。</div>
    </template>
  </div>
</template>

<style scoped>
.pg-head { margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
.pg-head h2 { font-size: 19px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
.pg-head h2::before { content: ""; width: 10px; height: 10px; background: var(--fg3, #3b82f6); transform: rotate(45deg); }
.sub { opacity: .55; font-size: 12.5px; padding-left: 20px; }
.head-info { display: flex; gap: 8px; flex-wrap: wrap; }
.chip { font-size: 11.5px; border: 1px solid var(--bg3, rgba(128,128,128,.25)); padding: 3px 9px; opacity: .8; white-space: nowrap; }
.chip.off { color: #d97706; border-color: #d9770655; }
.tabs-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }
.tabs-row button { font: inherit; font-size: 12.5px; padding: 6px 14px; background: transparent; border: 1px solid var(--k-color-divider, #8884); color: inherit; cursor: pointer; }
.tabs-row button.on { border-color: var(--k-color-primary, #3b82f6); color: var(--k-color-primary, #3b82f6); }
.tabs-row button.primary:not(:disabled) { border-color: var(--k-color-primary, #3b82f6); color: var(--k-color-primary, #3b82f6); }
.tabs-row .search { flex: 1; min-width: 160px; max-width: 260px; }
.flex-fill { flex: 1; }
.badge { display: inline-block; margin-left: 6px; padding: 0 6px; font-size: 10.5px; border-radius: 8px; background: #d97706; color: #fff; }
.notice { border-left: 3px solid; padding: 10px 14px; font-size: 12.5px; margin-bottom: 10px; }
.notice.info { border-color: var(--fg3, #3b82f6); background: rgba(59,130,246,.08); }
.notice.warn { border-color: #b45309; background: rgba(180,83,9,.08); }
.empty { padding: 40px; text-align: center; opacity: .55; border: 1px dashed var(--bg3, #8884); font-size: 13px; }
.table { border: 1px solid var(--bg3, rgba(128,128,128,.15)); font-size: 12.5px; }
.thead { display: flex; gap: 10px; padding: 8px 14px; background: var(--bg1, rgba(128,128,128,.08)); font-size: 11px; opacity: .6; letter-spacing: .5px; }
.trow { display: flex; gap: 10px; align-items: center; padding: 8px 14px; border-top: 1px solid var(--bg3, rgba(128,128,128,.1)); }
.trow.off { opacity: .5; }
.col { min-width: 0; }
.col.qq { width: 130px; flex-shrink: 0; }
.col.name { flex: 1.4; min-width: 140px; }
.col.name input { width: 100%; font: inherit; background: transparent; border: 1px solid transparent; border-bottom: 1px dashed var(--bg3, #8884); color: inherit; padding: 2px 4px; }
.col.name input:focus { border-color: var(--k-color-primary, #3b82f6); outline: none; }
.subname { opacity: .5; font-size: 11px; margin-top: 2px; }
.col.src { width: 90px; flex-shrink: 0; }
.col.num { width: 48px; flex-shrink: 0; text-align: right; }
.col.time { width: 120px; flex-shrink: 0; opacity: .75; }
.col.st { width: 52px; flex-shrink: 0; text-align: center; }
.col.mode { width: 150px; flex-shrink: 0; opacity: .75; }
.col.note, .col.time.ellip { flex: 1; min-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.col.ops { width: 150px; flex-shrink: 0; display: flex; gap: 6px; justify-content: flex-end; }
.col.ops button { font: inherit; font-size: 11.5px; padding: 3px 10px; background: transparent; border: 1px solid var(--k-color-divider, #8884); color: inherit; cursor: pointer; }
.col.ops button.primary { border-color: #16a34a; color: #16a34a; }
.mono { font-family: ui-monospace, Consolas, monospace; }
.tag { font-size: 11px; padding: 1px 7px; border-radius: 8px; }
.tag.approved { background: rgba(22,163,74,.15); color: #16a34a; }
.tag.rejected { background: rgba(220,38,38,.12); color: #dc2626; }
.history { margin-top: 14px; font-size: 12.5px; }
.history summary { cursor: pointer; opacity: .6; }
.table.slim { margin-top: 8px; }
.hint-line { margin-top: 10px; font-size: 11.5px; opacity: .5; }
</style>
