/** 运维套件数据表行类型。 */
import type { HostStatusSnapshot } from './daily-report';
export interface UsageLogRow {
    id: number;
    ts: Date;
    task: string;
    providerLabel: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cachedInputTokens: number;
    /** 按连接价格字段估算的费用（价格单位/百万 token）。 */
    cost: number;
}
export interface OpsLogRow {
    id: number;
    ts: Date;
    /** error | warn */
    level: string;
    phase: string;
    message: string;
}
export interface AccessRequestRow {
    id: number;
    qq: string;
    displayName: string;
    /** private | friend-request | group | console */
    source: string;
    firstRequestAt: Date;
    lastRequestAt: Date;
    attempts: number;
    /** pending | approved | rejected */
    status: string;
    decidedAt?: Date;
    note: string;
    /** 好友申请事件携带的 OneBot flag——好友同意/拒绝命令靠它回执 QQ 侧。 */
    flag?: string;
}
export type { HostStatusSnapshot };
