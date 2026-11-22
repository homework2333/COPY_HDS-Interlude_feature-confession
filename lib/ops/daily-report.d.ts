/**
 * 每日运营日报：聚合 token 用量、按优先级排序的报错摘要、健康与宿主机状态。
 * 行为基准是旧 AstrBot 栈的 ops/daily-report.py（主人 QQ 每日 0 点收到），
 * 数据源改为 HDSI 自身的 interlude_usage_log / interlude_ops_log 落库。
 */
import type { UsageLogRow, OpsLogRow } from './tables';
export interface UsageAggRow {
    task: string;
    model: string;
    calls: number;
    inputTokens: number;
    outputTokens: number;
    cachedInputTokens: number;
    cost: number;
}
export interface DailyReportInput {
    dayLabel: string;
    usage: UsageAggRow[];
    yesterdayTotalTokens: number;
    errors: OpsLogRow[];
    warns: OpsLogRow[];
    health: {
        successes: number;
        retries: number;
        failures: number;
        avgLatencyMs: number;
    };
    uptimeSeconds: number;
    version: string;
    hostStatus?: HostStatusSnapshot | null;
    pendingAccessRequests?: number;
}
/** 宿主机采集器（ops/deploy/host-status.py 每 5 分钟写一次）的 JSON 形状。 */
export interface HostStatusSnapshot {
    ts: number;
    uptime: number;
    load: number[];
    cores: number;
    cpu_pct: number;
    mem: {
        total_mb: number;
        avail_mb: number;
        pct: number;
    };
    swap: {
        total_mb: number;
        used_mb: number;
    };
    disk: {
        total_gb: number;
        used_gb: number;
        pct: number;
    };
    containers?: Array<{
        name: string;
        mem: string;
        cpu: string;
    }>;
}
/** 按优先级聚合报错：error 优先于 warn，同级别按出现次数降序，再按最近时间。 */
export declare function digestIssues(errors: OpsLogRow[], warns: OpsLogRow[], limit?: number): Array<{
    level: 'error' | 'warn';
    count: number;
    lastAt: Date;
    message: string;
}>;
export declare function aggregateUsageTotals(rows: UsageAggRow[]): {
    calls: number;
    inputTokens: number;
    outputTokens: number;
    cachedInputTokens: number;
    cost: number;
};
export declare function usageRowsToAgg(rows: UsageLogRow[]): UsageAggRow[];
export declare function renderDailyReport(input: DailyReportInput): string;
/** 故事时区里的“当天 hh:mm”下一次出现时刻（UTC ms）。
 * 用逐步逼近法：先按 UTC 偏移猜一个候选，再用格式化结果校验并修正。 */
export declare function nextDailyRun(now: Date, timezone: string, hour: number, minute: number): Date;
/** 故事时区里某一天 [00:00, 次日 00:00) 的 UTC ms 边界。 */
export declare function localDayRange(anchor: Date, timezone: string): {
    start: number;
    end: number;
    label: string;
};
