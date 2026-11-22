/**
 * 运维套件 Console RPC：
 * - hdsi/ops/recent      调试事件流（环形缓冲最近事件 + 统计；authority=1）
 * - hdsi/lists/read      名单页合并视图（白名单 + 群聊 + 申请 + 参与者状态）
 * - hdsi/lists/save      保存私聊用户/群聊白名单（经配置中心管线持久化）
 * - hdsi/lists/decide    审批白名单申请（approve 时同步写入 onebot.userAccounts）
 * - hdsi/ops/report      日报预览（authority=3，与 interlude.日报 同源）
 *
 * 调试页刷新采用轮询（客户端 2s 拉 hdsi/ops/recent）：本版 @koishijs/plugin-console
 * 无通用 broadcast 通道，DataService 全量推送在事件密集时开销过大。
 */
import type { Context, Schema } from 'koishi';
import type { InterludeService } from '../service';
import type { AccessRequestRow } from '../ops/tables';
import type { OpsEvent, OpsStreamStats } from '../ops/types';
export interface ListsUserRow {
    qq: string;
    label: string;
    personId: string;
    profile: string;
    relationship: string;
    enabled: boolean;
    proactive: boolean;
    /** 参与者运行态（可选）：入组时间/最近活跃。 */
    joinedAt?: string;
    lastActiveAt?: string;
    displayName?: string;
    pendingRequest?: boolean;
}
export interface ListsGroupRow {
    groupId: string;
    label: string;
    enabled: boolean;
    responseMode?: string;
    collectionScope?: string;
    immediateTrigger?: string;
    backgroundParticipation?: string;
    purpose: string;
    characterRole: string;
}
export interface ListsReadResult {
    ok: boolean;
    error?: string;
    onebotEnabled: boolean;
    users: ListsUserRow[];
    groups: ListsGroupRow[];
    botAccounts: Array<{
        qq: string;
        label: string;
        enabled: boolean;
    }>;
    managers: string[];
    requests: Array<AccessRequestRow & {
        qq: string;
    }>;
    proactive: {
        mode: string;
        list: string[];
    };
}
export interface ListsSaveResult {
    ok: boolean;
    error?: string;
}
export interface OpsRecentResult {
    ok: boolean;
    events: OpsEvent[];
    stats: OpsStreamStats;
}
declare module '@koishijs/console' {
    interface Events {
        'hdsi/ops/recent'(payload: {
            limit?: number;
        }): Promise<OpsRecentResult>;
        'hdsi/lists/read'(): Promise<ListsReadResult>;
        'hdsi/lists/save'(payload: {
            users?: unknown[];
            groups?: unknown[];
        }): Promise<ListsSaveResult>;
        'hdsi/lists/decide'(payload: {
            qq: string;
            approve: boolean;
            note?: string;
        }): Promise<ListsSaveResult & {
            request?: AccessRequestRow;
        }>;
        'hdsi/ops/report'(payload: {
            date?: string;
        }): Promise<{
            ok: boolean;
            text?: string;
            error?: string;
        }>;
    }
}
export declare function installOpsRpc(ctx: Context, host: InterludeService, configSchema: Schema): void;
