import type { Session } from 'koishi';
import type { AccessRequestRow } from './tables';
import type { DailyReportConfig } from './types';
import type { DailyReportInput, HostStatusSnapshot } from './daily-report';
import { renderDailyReport } from './daily-report';
export declare function dailyReportConfig(svc: any): DailyReportConfig;
export declare function storyTimezone(svc: any): string;
export declare function sendOpsPrivate(svc: any, qq: string, text: string): Promise<boolean>;
/** 按连接价格字段（每百万 token）估算单次调用费用。 */
export declare function estimateTokenCost(record: {
    inputTokens?: number;
    outputTokens?: number;
    cachedInputTokens?: number;
    priceInput?: number;
    priceOutput?: number;
    priceCachedInput?: number;
}): number;
export declare function persistUsageRecord(svc: any, record: {
    task: string;
    providerLabel: string;
    model: string;
    inputTokens?: number;
    outputTokens?: number;
    cachedInputTokens?: number;
    priceInput?: number;
    priceOutput?: number;
    priceCachedInput?: number;
}): void;
export declare function persistOpsLog(svc: any, level: 'error' | 'warn', phase: string, message: string): void;
export declare function readHostStatusSnapshot(baseDir: string): HostStatusSnapshot | null;
export declare function gatherDailyReportInput(svc: any, anchor?: Date): Promise<DailyReportInput & {
    label: string;
}>;
export declare function runDailyReport(svc: any): Promise<boolean>;
/** 定时链：每次触发后重新武装；配置变更在下一轮生效。 */
export declare function scheduleDailyReport(svc: any): void;
/** 用量表保留 60 天、错误表保留 30 天（与备份保留口径对齐）。 */
export declare function cleanupOpsTables(svc: any): Promise<void>;
/** 陌生人私聊：记录申请 + 每天一次礼貌回复。返回 true = 已消费该消息。 */
export declare function noteAccessRequest(svc: any, session: Session): Promise<boolean>;
/** 好友申请：记录 + 通知管理员（附 flag）。 */
export declare function noteFriendRequest(svc: any, session: Session): Promise<void>;
export declare function listAccessRequests(svc: any, status?: string): Promise<AccessRequestRow[]>;
/** 审批落库（配置写入由调用方负责：命令在 index.ts，页面在 console/ops.ts）。 */
export declare function recordAccessDecision(svc: any, qq: string, approve: boolean, note?: string): Promise<AccessRequestRow | null>;
export { renderDailyReport };
