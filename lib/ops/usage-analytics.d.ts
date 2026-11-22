/**
 * 调用分析页（Console「调用分析」）的纯函数与聚合入口。
 * 数据源仍是 interlude_usage_log（60 天保留），按 任务|模型 的聚合复用
 * daily-report.ts 的 usageRowsToAgg / aggregateUsageTotals；本模块只补
 * “任意时间档区间 + 趋势分桶（小时/天）”，供 hdsi/ops/usage RPC 使用。
 */
import type { UsageLogRow } from './tables';
import { type UsageAggRow } from './daily-report';
export type UsagePreset = 'today' | 'yesterday' | '7d';
export interface UsageBucket {
    /** 小时档为 "HH:00"，天档为 "MM-DD"。 */
    label: string;
    calls: number;
    inputTokens: number;
    cachedInputTokens: number;
    outputTokens: number;
    cost: number;
}
export interface UsageRecentItem {
    id: number;
    /** epoch ms，前端按本地时区格式化。 */
    ts: number;
    task: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cachedInputTokens: number;
    cost: number;
}
export interface UsageAnalyticsResult {
    ok: boolean;
    error?: string;
    preset: UsagePreset;
    range: {
        from: number;
        to: number;
    };
    bucketMode: 'hour' | 'day';
    totals: {
        calls: number;
        inputTokens: number;
        outputTokens: number;
        cachedInputTokens: number;
        cost: number;
    };
    byTask: UsageAggRow[];
    buckets: UsageBucket[];
    recent: UsageRecentItem[];
}
/** preset → [from, to)（UTC ms）+ 分桶粒度。7d = 今天 00:00 回溯 6 天到明天 00:00。 */
export declare function usageRangeBounds(preset: UsagePreset, timezone: string, now?: Date): {
    from: number;
    to: number;
    bucketMode: 'hour' | 'day';
};
/** 按本地小时/天分桶；空数据也返回完整时间轴（hour 档 24 格、day 档 7 格），
 * 前端可以直接画空趋势。小时档用索引算术（对 :30 偏移时区也稳），
 * 天档按本地日期键归桶（DST 天可能少一格，固定偏移时区无此问题）。 */
export declare function bucketUsageRows(rows: UsageLogRow[], mode: 'hour' | 'day', timezone: string, bounds: {
    from: number;
    to: number;
}): UsageBucket[];
/** hdsi/ops/usage 的服务端聚合：区间查询 → 汇总/分桶/最近流水。svc 为
 * InterludeService（any 视图，与 gatherDailyReportInput 同一访问面）。 */
export declare function gatherUsageAnalytics(svc: any, preset: UsagePreset, limit: number): Promise<UsageAnalyticsResult>;
