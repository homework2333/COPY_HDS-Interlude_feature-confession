/**
 * 运维事件总线：环形缓冲 + 订阅推送。
 * service 在日志/用量/叙事/申请四个挂点调用 publish；Console 调试页经
 * RPC 拉取缓冲、经 broadcast 通道接收实时事件。
 */
import type { OpsEvent, OpsStreamStats } from './types'

/** 分布式 Omit：联合类型逐成员剔除键，避免塌缩成公共键子集。 */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never
export type OpsEventInput = DistributiveOmit<OpsEvent, 'seq' | 'ts'> & { ts?: number }

export class OpsEventBus {
  private readonly buffer: OpsEvent[] = []
  private readonly listeners = new Set<(event: OpsEvent) => void>()
  private seq = 0
  private readonly stats: OpsStreamStats = {
    sinceBoot: Date.now(),
    counts: { log: 0, usage: 0, narrative: 0, access: 0 },
    levels: { error: 0, warn: 0, info: 0, debug: 0 },
    dropped: 0,
  }

  constructor(private readonly capacity = 800) {}

  publish(event: OpsEventInput): OpsEvent | undefined {
    const enriched = { ...event, seq: ++this.seq, ts: event.ts ?? Date.now() } as OpsEvent
    this.stats.counts[enriched.kind] += 1
    if (enriched.kind === 'log') this.stats.levels[enriched.level] += 1
    if (this.buffer.length >= this.capacity) {
      this.buffer.shift()
      this.stats.dropped += 1
    }
    this.buffer.push(enriched)
    for (const listener of this.listeners) {
      try { listener(enriched) } catch { /* 订阅方异常不进入事件链 */ }
    }
    return enriched
  }

  subscribe(listener: (event: OpsEvent) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** 最近的缓冲（新→旧），供调试页初次加载。 */
  recent(limit = 200): OpsEvent[] {
    return this.buffer.slice(-limit).reverse()
  }

  snapshot(): OpsStreamStats {
    return {
      sinceBoot: this.stats.sinceBoot,
      counts: { ...this.stats.counts },
      levels: { ...this.stats.levels },
      dropped: this.stats.dropped,
    }
  }
}

/** ANSI 转义剥离：日志行进入 Console 事件流前去掉颜色码。 */
export function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, '')
}
