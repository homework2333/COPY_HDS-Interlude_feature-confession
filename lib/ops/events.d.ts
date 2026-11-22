/**
 * 运维事件总线：环形缓冲 + 订阅推送。
 * service 在日志/用量/叙事/申请四个挂点调用 publish；Console 调试页经
 * RPC 拉取缓冲、经 broadcast 通道接收实时事件。
 */
import type { OpsEvent, OpsStreamStats } from './types';
/** 分布式 Omit：联合类型逐成员剔除键，避免塌缩成公共键子集。 */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type OpsEventInput = DistributiveOmit<OpsEvent, 'seq' | 'ts'> & {
    ts?: number;
};
export declare class OpsEventBus {
    private readonly capacity;
    private readonly buffer;
    private readonly listeners;
    private seq;
    private readonly stats;
    constructor(capacity?: number);
    publish(event: OpsEventInput): OpsEvent | undefined;
    subscribe(listener: (event: OpsEvent) => void): () => void;
    /** 最近的缓冲（新→旧），供调试页初次加载。 */
    recent(limit?: number): OpsEvent[];
    snapshot(): OpsStreamStats;
}
/** ANSI 转义剥离：日志行进入 Console 事件流前去掉颜色码。 */
export declare function stripAnsi(text: string): string;
