import type { Context } from 'koishi';
export type WeatherProvider = 'open-meteo' | 'qweather';
export interface WeatherConfig {
    enabled: boolean;
    /** 手动观测点(经纬度);autoFromLocation 开启时仅作回退 */
    latitude: number;
    longitude: number;
    /** 从 story.setting.location 自动解析观测点(地理编码),失败回退经纬度 */
    autoFromLocation: boolean;
    /** 手动开关:架空世界(异世界/精灵/架空)跳过天气注入 */
    skipFantasyWorld: boolean;
    cadenceMinutes: number;
    /** 数据源;缺省视为 open-meteo(向后兼容旧配置与直接构造的调用方) */
    provider?: WeatherProvider;
    /** 和风天气专属 API Host(控制台项目设置提供,如 xxx.re.qweatherapi.com) */
    qweatherHost?: string;
    /** 认证方式:ed25519=自动签发 JWT;apikey=固定 API Key */
    qweatherAuth?: 'ed25519' | 'apikey';
    qweatherApiKey?: string;
    qweatherKid?: string;
    qweatherSub?: string;
    qweatherIss?: string;
    qweatherJwtTtlMinutes?: number;
    /** Ed25519 私钥(PEM);resolveWeatherConfig 会统一剥掉 \r */
    qweatherPrivateKey?: string;
}
export declare const DEFAULT_WEATHER_CONFIG: WeatherConfig;
export declare function resolveWeatherConfig(value: unknown): WeatherConfig;
export interface WeatherSnapshot {
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    condition: string;
    fetchedAt: number;
    /** 注入文本:"环境：22°C 小毛毛雨。" */
    text: string;
}
export declare function fetchWeatherSnapshot(ctx: Context, config: WeatherConfig, locationHint?: string): Promise<WeatherSnapshot | undefined>;
/** 架空世界判定(手动开关语义下与 weatherSweep 共用的唯一权威拷贝)：
 * 命中即跳过实况天气注入;播种器据此反过来保留天气播种(那些世界里模型
 * 即兴是唯一的天气来源)。 */
export declare function isFantasyStory(world: unknown, location: unknown): boolean;
/** 获取最近一次成功快照(不触发拉取)——供播种器 payload 协同用 */
export declare function lastWeatherSnapshot(): WeatherSnapshot | undefined;
