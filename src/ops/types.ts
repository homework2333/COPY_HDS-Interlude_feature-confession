/**
 * 运维套件（ops suite）类型：调试事件流、每日运营日报、白名单申请。
 * 对应 Console【运行 16】配置节与“调试 / 名单”两个页面。
 */

/** 每日运营日报（复刻 AstrBot 时代 daily-report.py 的行为）。 */
export interface DailyReportConfig {
  enabled: boolean
  /** 接收报告的 QQ；留空时取 sharedStory.managerAccounts[0]，再退化为不发。 */
  receiver: string
  /** 报告时刻（故事时区），默认 0 点整。 */
  hour: number
  minute: number
  /** 附带宿主机状态段（读取 data/hds-interlude/host-status.json，采集由宿主 cron 完成）。 */
  includeHostStatus: boolean
}

/** 陌生人私聊 → 记录申请 → 通知管理员 → 授权后自动进白名单。 */
export interface AccessRequestConfig {
  enabled: boolean
  /** 每会话每天回复一次礼貌提示（与 AstrBot whitelistpro 的频率控制一致）。 */
  autoReply: boolean
  replyText: string
  /** 新申请出现时私聊通知管理员（附授权/拒绝命令）。 */
  notifyManagers: boolean
}

/** Console 调试事件流（实时剧本续写 + warn/error）。 */
export interface DebugStreamConfig {
  enabled: boolean
  /** 是否把主叙事剧本文本推入事件流（含剧情内容，Console 已有登录门控）。 */
  scriptPreview: boolean
  /** 环形缓冲条数上限。 */
  maxEvents: number
  /** warn 及以上级别落库（interlude_ops_log），供日报聚合。 */
  persistErrors: boolean
}

/** 人设周报：四指标（口头禅/长度/主动响应/虚构监测）+ 对话抽样。 */
export interface PersonaWeeklyConfig {
  enabled: boolean
  /** 接收人 QQ；留空时取 sharedStory.managerAccounts[0]。 */
  receiver: string
  /** 发送日（故事时区，0=周日…6=周六）。 */
  weekday: number
  /** 发送时刻（故事时区）。 */
  hour: number
  minute: number
  /** 随报附带的对话轮次抽样条数；0 = 不抽样。 */
  sampleCount: number
}

export interface OpsConfig {
  dailyReport?: DailyReportConfig
  accessRequests?: AccessRequestConfig
  debugStream?: DebugStreamConfig
  personaWeekly?: PersonaWeeklyConfig
}

export type OpsEventKind = 'log' | 'usage' | 'narrative' | 'access'

export interface OpsLogEvent {
  kind: 'log'
  seq: number
  ts: number
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  phase: string
  protagonist: string
}

export interface OpsUsageEvent {
  kind: 'usage'
  seq: number
  ts: number
  task: string
  providerLabel: string
  model: string
  inputTokens: number
  outputTokens: number
  cachedInputTokens: number
  cost: number
}

export interface OpsNarrativeEvent {
  kind: 'narrative'
  seq: number
  ts: number
  phase: string
  storyId: string
  /** 续写正文（受 debugStream.scriptPreview 门控，可能为空串）。 */
  script: string
  /** 模型决定的交互摘要（回复/延迟/沉默等），供调试页速览。 */
  decision: string
}

export interface OpsAccessEvent {
  kind: 'access'
  seq: number
  ts: number
  qq: string
  displayName: string
  source: string
  status: string
}

export type OpsEvent = OpsLogEvent | OpsUsageEvent | OpsNarrativeEvent | OpsAccessEvent

export interface OpsStreamStats {
  sinceBoot: number
  counts: { log: number, usage: number, narrative: number, access: number }
  levels: { error: number, warn: number, info: number, debug: number }
  dropped: number
}
