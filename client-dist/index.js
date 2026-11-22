import { defineComponent as X, h as ce, defineAsyncComponent as se, computed as z, ref as y, onUnmounted as oe, onMounted as ne, resolveComponent as de, openBlock as t, createBlock as G, withCtx as fe, createElementVNode as e, createElementBlock as s, Fragment as N, renderList as H, createVNode as L, normalizeClass as E, createTextVNode as V, toDisplayString as a, createCommentVNode as k, resolveDynamicComponent as we, useId as be, withKeys as re, withModifiers as ve, unref as ie, normalizeStyle as me, nextTick as Ce, withDirectives as ee, vModelText as he, reactive as Se, vModelCheckbox as pe, createStaticVNode as ue, vModelSelect as ye } from "vue";
import { send as K, icons as xe, SchemaBase as Me, Schema as qe } from "@koishijs/client";
import { useRoute as Ie, onBeforeRouteLeave as ke, onBeforeRouteUpdate as _e } from "vue-router";
const W = {
  /** 拉取 hdsi-overview DataService 快照。 */
  async overview() {
    return K("hdsi-overview/get");
  },
  /** 读取一节配置（authority=1）。无活跃故事时 story 节返回空 values。 */
  async readConfig(u) {
    return K("hdsi/config/read", u);
  },
  /** 提交一节配置（authority=3）。白名单外的键由服务端静默忽略。 */
  async saveConfig(u, f) {
    return K("hdsi/config/save", { section: u, values: f });
  },
  /** 配置中心：读取菜单树（无参）或某开放节（authority=1）。 */
  async readConfigCenter(u) {
    return u ? K("hdsi/config-center/read", u) : K("hdsi/config-center/read");
  },
  /** 配置中心：按节提交 patch（authority=3）——服务端合并、预校验后
   * scope.update 持久化写回 koishi.yml 并热更新。 */
  async saveConfigCenter(u, f, o = {}) {
    return K("hdsi/config-center/save", { section: u, patch: f, ...o });
  },
  /** 通信动作只读视图：账本/计划派生的动作列表（authority=1，游标分页）。 */
  async actionsList(u, f = 20) {
    return K("hdsi/actions/list", { cursor: u, limit: f });
  },
  /** 通信动作详情（按动作 ID 惰性读取，含分段与原文摘录）。 */
  async actionDetail(u) {
    return K("hdsi/actions/get", { id: u });
  },
  /** 取消未来计划/未执行分段（authority=3；服务端幂等）。 */
  async cancelAction(u) {
    return K("hdsi/actions/cancel", { id: u });
  },
  /** unknown 分段人工核实（authority=3）。 */
  async verifyAction(u, f) {
    return K("hdsi/actions/verify", { id: u, outcome: f });
  },
  /** 运维套件：调试事件流（最近事件 + 统计；authority=1，2s 轮询）。 */
  async opsRecent(u = 200) {
    return K("hdsi/ops/recent", { limit: u });
  },
  /** 名单页合并视图（authority=1）。 */
  async listsRead() {
    return K("hdsi/lists/read");
  },
  /** 保存私聊用户/群聊白名单（authority=3，经配置中心管线持久化）。 */
  async listsSave(u) {
    return K("hdsi/lists/save", u);
  },
  /** 审批白名单申请（authority=3）。 */
  async listsDecide(u, f, o) {
    return K("hdsi/lists/decide", { qq: u, approve: f, note: o });
  },
  /** 日报预览（authority=3）。 */
  async opsReport(u) {
    return K("hdsi/ops/report", { date: u });
  },
  /** 调用分析：用量汇总/趋势分桶/最近流水（authority=1，30s 轮询）。 */
  async opsUsage(u = "today", f = 50) {
    return K("hdsi/ops/usage", { preset: u, limit: f });
  }
}, ge = {
  overview: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zm0 6a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z",
  desk: "M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zm9.1 15.6L15.5 15.5M7.5 10.5h6M10.5 7.5v6",
  density: "M4 20v-6M9.3 20V9M14.6 20V4M20 20v-9",
  config: "M4 7.5h7M15 7.5h5M15 4.5v6M4 16.5h3M11 16.5h9M9 13.5v6",
  actions: "M4 5h16v11H9l-5 4V5zm4 4h8M8 12h5",
  center: "M4 7h4.5M11.5 7H20M4 17h9.5M16.5 17H20M7.2 4.4v5.2M13.2 14.4v5.2",
  debug: "M5 5h14v14H5zM8.5 9h7M8.5 12.5h4.5M8.5 16h6",
  usage: "M5 19v-8M10 19V6M15 19v-5M20 19V9M3 13.5l5-5 4 3 7-7.5",
  lists: "M9 5.5h11M9 12h11M9 18.5h11M4.2 5.5h.01M4.2 12h.01M4.2 18.5h.01"
}, Te = X({
  name: "IconSet",
  props: { name: { type: String, required: !0 } },
  render() {
    return ce("path", { d: ge[this.name] ?? ge.overview });
  }
}), Pe = { class: "hdsi-host-title" }, Ne = { class: "hdsi-shell" }, Ae = { class: "topbar" }, Oe = { class: "tabs" }, Ve = {
  class: "glyph",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "1.7",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
  "aria-hidden": "true"
}, De = { class: "main" }, je = {
  key: 0,
  class: "notice info"
}, Le = {
  key: 1,
  class: "notice warn"
}, Ee = {
  key: 0,
  class: "snapshot-actions"
}, Ue = {
  key: 0,
  class: "notice warn"
}, Re = ["disabled"], Be = /* @__PURE__ */ X({
  name: "HdsiApp",
  __name: "HdsiApp",
  setup(u) {
    const f = [
      { id: "overview", path: "/hdsi/overview", label: "概览", group: "运行", icon: "overview", component: se(() => Promise.resolve().then(() => dt)) },
      { id: "config-center", path: "/hdsi/config-center", label: "配置中心", group: "配置", icon: "center", component: se(() => Promise.resolve().then(() => At)) },
      { id: "config", path: "/hdsi/config", label: "当前故事", group: "配置", icon: "config", component: se(() => Promise.resolve().then(() => ta)) },
      { id: "desk", path: "/hdsi/desk", label: "考据案头", group: "观测", icon: "desk", component: se(() => Promise.resolve().then(() => da)) },
      { id: "actions", path: "/hdsi/actions", label: "通信动作", group: "观测", icon: "actions", component: se(() => Promise.resolve().then(() => Da)) },
      { id: "density", path: "/hdsi/density", label: "上下文预算", group: "观测", icon: "density", component: se(() => Promise.resolve().then(() => za)) },
      { id: "debug", path: "/hdsi/debug", label: "调试", group: "观测", icon: "debug", component: se(() => Promise.resolve().then(() => ms)) },
      { id: "usage", path: "/hdsi/usage", label: "调用分析", group: "观测", icon: "usage", component: se(() => Promise.resolve().then(() => tl)) },
      { id: "lists", path: "/hdsi/lists", label: "名单", group: "配置", icon: "lists", component: se(() => Promise.resolve().then(() => on)) }
    ], o = Ie(), _ = z(() => {
      const S = o.params.page, x = Array.isArray(S) ? S[0] : S;
      return f.some((g) => g.id === x) ? x : "overview";
    }), m = z(() => !["config", "config-center", "actions", "debug", "usage", "lists"].includes(_.value)), b = y(null), w = y(!0), v = y("");
    let r = 0, C = !1;
    oe(() => {
      C = !0, r++;
    });
    async function h() {
      if (C) return;
      const S = ++r, x = () => !C && S === r;
      w.value = !0, v.value = "";
      try {
        const g = await W.overview();
        if (!x()) return;
        if (!g) throw new Error("Console 连接尚未就绪，请重试。");
        b.value = g;
      } catch (g) {
        x() && (v.value = (g == null ? void 0 : g.message) ?? String(g));
      } finally {
        x() && (w.value = !1);
      }
    }
    return ne(h), (S, x) => {
      const g = de("router-link"), A = de("k-layout");
      return t(), G(A, { main: "hdsi-layout" }, {
        header: fe(() => {
          var q;
          return [
            e("span", Pe, [
              x[0] || (x[0] = V("HDSI ", -1)),
              e("small", null, a(((q = b.value) == null ? void 0 : q.version) ?? "写作工作台"), 1)
            ])
          ];
        }),
        default: fe(() => [
          e("div", Ne, [
            e("header", Ae, [
              e("nav", Oe, [
                (t(), s(N, null, H(f, (q) => L(g, {
                  key: q.id,
                  to: q.path,
                  class: E(["tab", { on: _.value === q.id }])
                }, {
                  default: fe(() => [
                    (t(), s("svg", Ve, [
                      L(Te, {
                        name: q.icon
                      }, null, 8, ["name"])
                    ])),
                    V(" " + a(q.label), 1)
                  ]),
                  _: 2
                }, 1032, ["to", "class"])), 64))
              ])
            ]),
            e("main", De, [
              m.value && !b.value ? (t(), s(N, { key: 0 }, [
                w.value ? (t(), s("div", je, "正在连接 HDSI 数据服务……")) : (t(), s("div", Le, [
                  V(" 数据服务不可用：" + a(v.value) + " ", 1),
                  e("button", {
                    class: "refresh",
                    onClick: h
                  }, "重试")
                ]))
              ], 64)) : (t(), s(N, { key: 1 }, [
                m.value ? (t(), s("div", Ee, [
                  v.value ? (t(), s("span", Ue, "刷新失败：" + a(v.value) + "，当前展示上次快照。", 1)) : k("", !0),
                  e("button", {
                    class: "refresh",
                    disabled: w.value,
                    onClick: h
                  }, a(w.value ? "刷新中……" : "刷新概览"), 9, Re)
                ])) : k("", !0),
                (t(), G(we(f.find((q) => q.id === _.value).component), { overview: b.value }, null, 8, ["overview"]))
              ], 64))
            ])
          ])
        ]),
        _: 1
      });
    };
  }
}), Y = (u, f) => {
  const o = u.__vccOpts || u;
  for (const [_, m] of f)
    o[_] = m;
  return o;
}, Fe = /* @__PURE__ */ Y(Be, [["__scopeId", "data-v-3bbcad2a"]]);
function cn(u) {
  xe.register("hdsi", {
    render: () => ce("svg", {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": 1.8,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      width: 24,
      height: 24,
      style: "width:24px;height:24px;max-width:100%;display:block;margin:auto;flex:none"
    }, [
      ce("rect", { x: "4", y: "4", width: "10", height: "10", transform: "rotate(45 9 9)" }),
      ce("path", { d: "M20 11v9h-9" }),
      ce("circle", { cx: "20", cy: "8", r: "2" })
    ])
  }), u.page({
    id: "hdsi",
    path: "/hdsi/:page*",
    name: "HDS Interlude",
    icon: "hdsi",
    order: 600,
    component: Fe
  });
}
const ze = ["aria-expanded", "aria-describedby", "onKeydown"], Je = ["id"], He = { key: 0 }, Qe = {
  key: 1,
  class: "tip-range"
}, Ke = /* @__PURE__ */ X({
  name: "InfoDot",
  __name: "InfoDot",
  props: {
    info: {},
    range: {}
  },
  setup(u) {
    const f = y(!1), o = y(null), _ = be();
    let m = 0;
    ne(() => {
      typeof window < "u" && window.addEventListener("scroll", v, !0);
    }), oe(() => {
      typeof window < "u" && window.removeEventListener("scroll", v, !0);
    });
    const b = y({ left: "0px", top: "0px", maxWidth: "320px" });
    async function w(r) {
      const h = r.currentTarget.getBoundingClientRect(), S = Math.min(320, window.innerWidth - 32), x = window.innerHeight - h.bottom > 140;
      b.value = {
        left: `${Math.max(16, Math.min(h.left, window.innerWidth - S - 16))}px`,
        top: `${x ? h.bottom + 8 : Math.max(16, h.top - 140)}px`,
        maxWidth: `${S}px`
      }, f.value = !0;
      const g = ++m;
      if (await Ce(), !f.value || g !== m || !o.value) return;
      const A = o.value.getBoundingClientRect().height;
      b.value.top = `${Math.max(8, Math.min(Number.parseFloat(b.value.top), window.innerHeight - A - 8))}px`;
    }
    function v() {
      f.value = !1, m++;
    }
    return (r, C) => (t(), s("button", {
      type: "button",
      class: "info-dot",
      "aria-label": "查看说明（悬停或按住）",
      "aria-expanded": f.value,
      "aria-describedby": f.value ? ie(_) : void 0,
      onMouseenter: w,
      onMouseleave: v,
      onPointerdown: ve(w, ["stop"]),
      onPointerup: v,
      onPointercancel: v,
      onFocus: w,
      onBlur: v,
      onClick: ve(v, ["stop"]),
      onKeydown: [
        re(v, ["esc"]),
        re(ve(w, ["prevent"]), ["space"]),
        re(ve(w, ["prevent"]), ["enter"])
      ],
      onKeyup: [
        re(v, ["space"]),
        re(v, ["enter"])
      ]
    }, [
      C[0] || (C[0] = e("svg", {
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "1.8",
        "aria-hidden": "true"
      }, [
        e("circle", {
          cx: "12",
          cy: "12",
          r: "9"
        }),
        e("path", { d: "M12 11v5" }),
        e("circle", {
          cx: "12",
          cy: "7.5",
          r: ".8",
          fill: "currentColor",
          stroke: "none"
        })
      ], -1)),
      f.value ? (t(), s("span", {
        key: 0,
        id: ie(_),
        ref_key: "tooltip",
        ref: o,
        class: "hdsi-tip",
        role: "tooltip",
        style: me(b.value)
      }, [
        u.info ? (t(), s("span", He, a(u.info), 1)) : k("", !0),
        u.range ? (t(), s("span", Qe, "范围：" + a(u.range), 1)) : k("", !0)
      ], 12, Je)) : k("", !0)
    ], 40, ze));
  }
}), $e = /* @__PURE__ */ Y(Ke, [["__scopeId", "data-v-d68b18ae"]]), We = {
  name: "DataRow",
  components: { InfoDot: $e },
  props: {
    label: { type: String, required: !0 },
    value: { type: [String, Number, Boolean], default: "—" },
    state: { type: String, default: "" },
    // 'ok' | 'warn' | 'acc'
    info: { type: String, default: "" },
    range: { type: String, default: "" }
  }
}, Ge = { class: "row" }, Ye = { class: "k" };
function Xe(u, f, o, _, m, b) {
  const w = de("InfoDot");
  return t(), s("div", Ge, [
    e("span", Ye, [
      V(a(o.label) + " ", 1),
      o.info || o.range ? (t(), G(w, {
        key: 0,
        info: o.info,
        range: o.range
      }, null, 8, ["info", "range"])) : k("", !0)
    ]),
    e("span", {
      class: E(["v", o.state || void 0])
    }, a(o.value), 3)
  ]);
}
const D = /* @__PURE__ */ Y(We, [["render", Xe], ["__scopeId", "data-v-4e9413bc"]]), Ze = { key: 0 }, et = {
  key: 0,
  class: "notice info"
}, tt = {
  key: 1,
  class: "notice"
}, at = { class: "grid" }, st = { class: "card" }, lt = { class: "card" }, nt = { class: "card" }, ot = { class: "card" }, it = /* @__PURE__ */ X({
  name: "OverviewPage",
  __name: "OverviewPage",
  props: {
    overview: {}
  },
  setup(u) {
    const f = u, o = { active: "活动中", paused: "已暂停", archived: "已归档" }, _ = { asleep: "睡眠", resting: "休息", occupied: "忙碌", available: "空闲", normal: "日常", active: "活跃", "phone-focused": "关注消息", focused: "专注" }, m = z(() => {
      var v, r, C, h;
      return _[(r = (v = f.overview) == null ? void 0 : v.story) == null ? void 0 : r.rhythm] ?? ((h = (C = f.overview) == null ? void 0 : C.story) == null ? void 0 : h.rhythm) ?? "未建立";
    }), b = { main: "主叙事", compaction: "记忆整理", timeline: "时间导演", alter: "情绪分析", embedding: "向量检索", stickers: "表情包描述", vision: "视觉理解", research: "考据检索" }, w = {
      allowProactiveMessages: "主角可主动发起可见消息（非回复式）",
      urge: "依据生活节奏和对话密度安排后台补写；人物是否联系他人由主叙事形成动作",
      sceneConditions: "设备、隐私和负荷的有效场景证据；缺失或过期时显示未知",
      deliveryPolicy: "管理员设置的主动出站运行额度和间隔；人物动机由主叙事决定",
      research: "考据 Agent：人物形成查证动作后，后台核实并写入考据案头，供后续写作参考",
      jev: "生活推进前的外部考据判定；命中时先检索资料，再继续写作"
    };
    return (v, r) => {
      var C;
      return u.overview ? (t(), s("div", Ze, [
        r[6] || (r[6] = e("div", { class: "pg-head" }, [
          e("div", null, [
            e("h2", null, "概览"),
            e("div", { class: "sub" }, "当前故事 · 模型用途 · 运行边界 · 考据状态")
          ])
        ], -1)),
        (C = u.overview.story) != null && C.found ? (t(), s("div", et, [
          e("b", null, a(u.overview.story.characterName), 1),
          V(" · " + a(o[u.overview.story.status] ?? u.overview.story.status) + " · 当前节奏 " + a(m.value) + "。剧情时间 ", 1),
          e("code", null, a(u.overview.story.cursorLocal), 1),
          r[0] || (r[0] = V("，共 ", -1)),
          e("b", null, a(u.overview.story.entryCount), 1),
          r[1] || (r[1] = V(" 条剧本记录。 ", -1))
        ])) : (t(), s("div", tt, "当前还没有故事。先在配置中心填写故事档案和模型，再从聊天启动故事。")),
        e("div", at, [
          e("div", st, [
            r[2] || (r[2] = e("h3", null, [
              e("span", { class: "sq" }),
              V("故事状态")
            ], -1)),
            L(D, {
              label: "主角",
              value: u.overview.story.characterName || "—",
              info: "主角姓名，出现在全部叙事中",
              range: "任意非空中文/英文"
            }, null, 8, ["value"]),
            L(D, {
              label: "关系人数",
              value: u.overview.story.participantCount,
              info: "已登记的参与者（跨会话共享同一故事）"
            }, null, 8, ["value"]),
            L(D, {
              label: "故事状态",
              value: o[u.overview.story.status] ?? u.overview.story.status,
              state: u.overview.story.status === "active" ? "ok" : "",
              info: "active=活动 / paused=暂停 / archived=归档"
            }, null, 8, ["value", "state"]),
            L(D, {
              label: "节奏",
              value: m.value,
              state: "acc",
              info: "主角当前的生活节奏/注意力，由时间与近况推得"
            }, null, 8, ["value"])
          ]),
          e("div", lt, [
            r[3] || (r[3] = e("h3", null, [
              e("span", { class: "sq" }),
              V("模型连接")
            ], -1)),
            (t(!0), s(N, null, H(u.overview.models, (h) => (t(), G(D, {
              key: h.task,
              label: b[h.task] ?? h.task,
              value: `${h.provider} · ${h.model}`,
              state: h.available ? "ok" : h.reason === "disabled" ? "" : "warn",
              info: "按模型中心的用途配置解析出的连接与模型；该状态表示配置匹配，不表示网络探活成功"
            }, null, 8, ["label", "value", "state"]))), 128))
          ]),
          e("div", nt, [
            r[4] || (r[4] = e("h3", null, [
              e("span", { class: "sq" }),
              V("系统开关")
            ], -1)),
            (t(!0), s(N, null, H(u.overview.switches, (h) => (t(), G(D, {
              key: h.key,
              label: h.label,
              value: h.value,
              state: h.ok === !0 ? "ok" : h.ok === !1 ? "warn" : "",
              info: w[h.key]
            }, null, 8, ["label", "value", "state", "info"]))), 128))
          ]),
          e("div", ot, [
            r[5] || (r[5] = e("h3", null, [
              e("span", { class: "sq" }),
              V("考据 Agent")
            ], -1)),
            L(D, {
              label: "状态",
              value: u.overview.research.enabled ? "开启" : "关闭",
              state: u.overview.research.enabled ? "ok" : "",
              info: "考据总开关，可在配置中心的「考据 Agent」中修改"
            }, null, 8, ["value", "state"]),
            L(D, {
              label: "搜索后端",
              value: u.overview.research.backend,
              state: "acc",
              info: "考据检索的网络后端",
              range: "auto/tavily/bocha/searxng/duckduckgo-html"
            }, null, 8, ["value"]),
            L(D, {
              label: "案头条目",
              value: u.overview.research.deskEntries,
              info: "在架的核实事实数（稳定+易变，TTL 过期淘汰）",
              range: "案头容量 2-32"
            }, null, 8, ["value"]),
            L(D, {
              label: "写入 / 复用",
              value: `${u.overview.research.counters.offered} / ${u.overview.research.counters.reused}`,
              info: "累计写入案头 / 复用已有条目（重载归零）"
            }, null, 8, ["value"]),
            L(D, {
              label: "Jev 门控",
              value: u.overview.research.jev.enabled ? u.overview.research.jev.keyConfigured ? `判定 ${u.overview.research.jev.calls} / 触发 ${u.overview.research.jev.triggered}` : "已开启 · 待配置密钥" : "未启用",
              state: u.overview.research.jev.enabled ? u.overview.research.jev.keyConfigured ? "ok" : "warn" : "",
              info: "判定=门控调用次数，触发=判定 TRUE 放行先查后写"
            }, null, 8, ["value", "state"])
          ])
        ])
      ])) : k("", !0);
    };
  }
}), ut = /* @__PURE__ */ Y(it, [["__scopeId", "data-v-870eac41"]]), dt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ut
}, Symbol.toStringTag, { value: "Module" })), rt = { class: "cc" }, ct = ["disabled"], vt = {
  key: 1,
  class: "hint"
}, ft = { class: "layout" }, ht = {
  class: "menu",
  "aria-label": "配置分类"
}, pt = { class: "search" }, mt = {
  key: 0,
  class: "menu-summary"
}, yt = { class: "group" }, gt = ["aria-current", "disabled", "onClick"], bt = {
  key: 1,
  class: "hint"
}, kt = { class: "content" }, _t = {
  key: 0,
  class: "hint"
}, $t = {
  key: 1,
  class: "card"
}, wt = { class: "hint" }, Ct = { class: "actions" }, St = {
  class: "save-state",
  role: "status"
}, xt = ["disabled"], Mt = ["disabled"], qt = ["disabled"], It = {
  key: 2,
  class: "hint"
}, Tt = {
  key: 3,
  class: "hint"
}, Pt = /* @__PURE__ */ X({
  name: "ConfigCenterPage",
  __name: "ConfigCenterPage",
  props: {
    overview: {}
  },
  setup(u) {
    const f = {
      blindMode: ["enabled"]
    }, o = y(""), _ = y([]), m = y(""), b = y(null), w = y(null), v = y({}), r = y({}), C = y([]), h = y(!1), S = y(!1), x = y(!1), g = y(!1), A = y(""), q = y("ok"), B = y("");
    let O = 0, T = !1;
    oe(() => {
      T = !0, O++;
    });
    const j = z(() => _.value.flatMap(($) => $.sections.filter((M) => M.stage === 1))), n = z(() => B.value === m.value && JSON.stringify(v.value) !== JSON.stringify(r.value)), c = z(() => _.value.map(($) => ({ ...$, sections: $.sections.filter((M) => `${M.label} ${M.id} ${M.description}`.toLowerCase().includes(o.value.trim().toLowerCase())) })).filter(($) => $.sections.length)), l = () => !n.value || window.confirm("配置中心有未保存的修改。离开此页面？");
    ke(l), _e(($, M) => $.path === M.path || l());
    async function R($) {
      $ === m.value || g.value || n.value && !window.confirm("本节有尚未保存的修改。切换配置节将重新读取，继续切换？") || await d($);
    }
    async function I() {
      h.value || g.value || !m.value || n.value && !window.confirm("重新读取将以已保存配置替换本节的未保存修改。继续？") || await d(m.value);
    }
    function Q($, M, U = "") {
      return Object.keys($).flatMap((J) => {
        const Z = U ? `${U}.${J}` : J;
        if (!(J in M)) return [Z];
        const F = $[J], te = M[J];
        return F && te && typeof F == "object" && typeof te == "object" && !Array.isArray(F) && !Array.isArray(te) ? Q(F, te, Z) : [];
      });
    }
    function P($) {
      for (const M of _.value) {
        const U = M.sections.find((J) => J.id === $);
        if (U) return U;
      }
    }
    async function p() {
      if (!(T || S.value)) {
        S.value = !0, x.value = !1, A.value = "";
        try {
          const $ = await W.readConfigCenter();
          if (T) return;
          if (!($ != null && $.ok) || !Array.isArray($.menu)) throw new Error(($ == null ? void 0 : $.error) ?? "菜单读取失败");
          _.value = $.menu;
          const M = j.value.find((U) => U.id === "runtime") ?? j.value[0];
          M && await d(M.id);
        } catch ($) {
          T || (x.value = !0, A.value = `配置菜单读取失败：${($ == null ? void 0 : $.message) ?? String($)}`, q.value = "warn");
        } finally {
          T || (S.value = !1);
        }
      }
    }
    async function d($, M = !1) {
      const U = P($);
      if (T || !U || U.stage !== 1) return;
      const J = ++O, Z = () => !T && J === O && m.value === $;
      m.value = $, b.value = U, B.value = "", w.value = null, v.value = {}, r.value = {}, C.value = [], h.value = !0, M || (A.value = "");
      try {
        const F = await W.readConfigCenter($);
        if (!Z()) return;
        if (!F.ok) throw new Error(F.error ?? "读取失败");
        if (!F.schema) throw new Error("配置结构读取失败");
        w.value = new qe(F.schema);
        const te = F.values ?? {};
        v.value = JSON.parse(JSON.stringify(te)), r.value = JSON.parse(JSON.stringify(te)), C.value = F.maskedFields ?? [], B.value = $;
      } catch (F) {
        Z() && (A.value = `${M ? "配置已保存，重新读取失败：" : ""}${(F == null ? void 0 : F.message) ?? String(F)}`, q.value = "warn");
      } finally {
        Z() && (h.value = !1);
      }
    }
    function i() {
      return (f[m.value] ?? []).filter((M) => JSON.stringify(v.value[M]) !== JSON.stringify(r.value[M]));
    }
    async function ae($ = !1) {
      if (T || g.value || h.value || !m.value || B.value !== m.value) return;
      const M = m.value, U = O, J = () => !T && U === O && m.value === M, Z = JSON.stringify(v.value), F = JSON.parse(Z), te = i();
      if (!(te.length && !window.confirm(`本次保存将修改影响排障能力的字段：${te.join("、")}。
盲区模式开启后将关闭管理指令并隐藏运行日志，恢复需在 Koishi 配置中关闭该开关并重载。

确认继续？`))) {
        g.value = !0, A.value = "";
        try {
          const le = await W.saveConfigCenter(M, F, { reload: $, unset: Q(r.value, F) });
          if (!J()) return;
          if (!le.ok) throw new Error(le.error ?? "未知错误");
          A.value = $ ? "已保存，并已请求重载 HDSI。" : "已保存到 koishi.yml；配置更新已提交，插件将按需自动重载。", q.value = "ok", JSON.stringify(v.value) === Z ? await d(M, !0) : r.value = JSON.parse(Z);
        } catch (le) {
          J() && (A.value = `保存失败：${(le == null ? void 0 : le.message) ?? String(le)}`, q.value = "warn");
        } finally {
          T || (g.value = !1);
        }
      }
    }
    return ne(p), ($, M) => (t(), s("div", rt, [
      M[8] || (M[8] = e("div", { class: "pg-head" }, [
        e("div", null, [
          e("h2", null, "配置中心"),
          e("div", { class: "sub" }, "按用途管理故事档案、模型、上下文与运行能力。修改仅在保存后写入配置文件。")
        ])
      ], -1)),
      A.value ? (t(), s("div", {
        key: 0,
        class: E(["notice", q.value]),
        role: "status"
      }, [
        V(a(A.value) + " ", 1),
        x.value ? (t(), s("button", {
          key: 0,
          class: "save",
          disabled: S.value,
          onClick: p
        }, "重试", 8, ct)) : k("", !0)
      ], 2)) : k("", !0),
      S.value && !_.value.length ? (t(), s("div", vt, "读取配置菜单……")) : k("", !0),
      e("div", ft, [
        e("aside", ht, [
          e("label", pt, [
            M[5] || (M[5] = e("span", null, "查找配置", -1)),
            ee(e("input", {
              "onUpdate:modelValue": M[0] || (M[0] = (U) => o.value = U),
              type: "search",
              placeholder: "名称或字段，如 runtime",
              "aria-label": "查找配置节"
            }, null, 512), [
              [he, o.value]
            ])
          ]),
          _.value.length ? (t(), s("div", mt, a(j.value.length) + " 个配置节 · 全部可编辑", 1)) : k("", !0),
          (t(!0), s(N, null, H(c.value, (U) => (t(), s(N, {
            key: U.id
          }, [
            e("div", yt, a(U.label), 1),
            (t(!0), s(N, null, H(U.sections, (J) => (t(), s("button", {
              key: J.id,
              type: "button",
              class: E(["item", { on: m.value === J.id }]),
              "aria-current": m.value === J.id ? "page" : void 0,
              disabled: g.value,
              onClick: (Z) => R(J.id)
            }, a(J.label), 11, gt))), 128))
          ], 64))), 128)),
          o.value && !c.value.length ? (t(), s("div", bt, "没有匹配的配置节。")) : k("", !0)
        ]),
        e("main", kt, [
          h.value ? (t(), s("div", _t, "读取中……")) : b.value && w.value ? (t(), s("div", $t, [
            e("h3", null, [
              M[6] || (M[6] = e("span", { class: "sq" }, null, -1)),
              V(a(b.value.label), 1)
            ]),
            e("div", wt, [
              V(a(b.value.description), 1),
              C.value.length ? (t(), s(N, { key: 0 }, [
                V(" 密钥已隐藏，保持占位值可保留原密钥；填写新值可替换。")
              ], 64)) : k("", !0)
            ]),
            (t(), G(ie(Me).Form, {
              onSubmit: M[1] || (M[1] = ve(() => {
              }, ["prevent"])),
              key: B.value,
              inert: g.value || void 0,
              "aria-busy": g.value,
              schema: w.value,
              "model-value": v.value,
              initial: r.value,
              "onUpdate:modelValue": M[2] || (M[2] = (U) => v.value = U)
            }, null, 8, ["inert", "aria-busy", "schema", "model-value", "initial"])),
            e("div", Ct, [
              e("span", St, a(g.value ? "正在写入配置…" : n.value ? "有未保存的修改" : "与已读取配置一致"), 1),
              e("button", {
                class: "secondary",
                type: "button",
                disabled: g.value || h.value,
                onClick: I
              }, "重新读取", 8, xt),
              e("button", {
                class: "save",
                type: "button",
                disabled: g.value || h.value || B.value !== m.value,
                onClick: M[3] || (M[3] = (U) => ae(!1))
              }, a(g.value ? "保存中……" : "保存本节"), 9, Mt),
              e("button", {
                class: "secondary",
                type: "button",
                disabled: g.value || h.value || B.value !== m.value,
                onClick: M[4] || (M[4] = (U) => ae(!0))
              }, "保存并重载", 8, qt)
            ])
          ])) : !h.value && m.value ? (t(), s("div", It, [
            M[7] || (M[7] = V("本节读取失败。", -1)),
            e("button", {
              class: "secondary",
              onClick: I
            }, "重新读取")
          ])) : !h.value && _.value.length ? (t(), s("div", Tt, "选择配置节以查看和编辑。")) : k("", !0)
        ])
      ])
    ]));
  }
}), Nt = /* @__PURE__ */ Y(Pt, [["__scopeId", "data-v-10c1f819"]]), At = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Nt
}, Symbol.toStringTag, { value: "Module" })), Ot = {
  name: "EditField",
  components: { InfoDot: $e },
  props: {
    label: { type: String, required: !0 },
    modelValue: { type: [String, Number, Boolean], default: "" },
    type: { type: String, default: "text" },
    // text | number | boolean | select
    options: { type: Array, default: () => [] },
    placeholder: { type: String, default: "" },
    info: { type: String, default: "" },
    range: { type: String, default: "" },
    min: { type: Number },
    max: { type: Number },
    textarea: { type: Boolean, default: !1 },
    secret: { type: Boolean, default: !1 }
  },
  emits: ["update:modelValue"],
  setup() {
    return { inputId: be() };
  },
  data() {
    return { visible: !1 };
  },
  computed: {
    currentValue: {
      get() {
        return this.modelValue;
      },
      set(u) {
        this.$emit("update:modelValue", u);
      }
    }
  },
  methods: {
    onBool() {
      this.$emit("update:modelValue", !this.modelValue);
    }
  }
}, Vt = { class: "field" }, Dt = ["for"], jt = { class: "field-input" }, Lt = ["id", "value", "placeholder"], Et = ["id", "value"], Ut = ["value"], Rt = ["id", "aria-checked", "aria-label"], Bt = ["id", "value", "min", "max"], Ft = ["id", "type", "value", "placeholder"];
function zt(u, f, o, _, m, b) {
  const w = de("InfoDot");
  return t(), s("div", Vt, [
    e("label", {
      class: "field-label",
      for: _.inputId
    }, [
      V(a(o.label) + " ", 1),
      o.info || o.range ? (t(), G(w, {
        key: 0,
        info: o.info,
        range: o.range
      }, null, 8, ["info", "range"])) : k("", !0)
    ], 8, Dt),
    e("div", jt, [
      o.textarea ? (t(), s("textarea", {
        key: 0,
        id: _.inputId,
        value: String(o.modelValue ?? ""),
        placeholder: o.placeholder,
        class: "input area",
        onInput: f[0] || (f[0] = (v) => u.$emit("update:modelValue", v.target.value))
      }, null, 40, Lt)) : o.type === "select" ? (t(), s("select", {
        key: 1,
        id: _.inputId,
        value: String(o.modelValue),
        class: "input",
        onChange: f[1] || (f[1] = (v) => u.$emit("update:modelValue", v.target.value))
      }, [
        (t(!0), s(N, null, H(o.options, (v) => (t(), s("option", {
          key: v.value,
          value: v.value
        }, a(v.label), 9, Ut))), 128))
      ], 40, Et)) : o.type === "boolean" ? (t(), s("button", {
        key: 2,
        id: _.inputId,
        type: "button",
        role: "switch",
        "aria-checked": !!o.modelValue,
        "aria-label": o.label,
        class: E(["toggle", { on: o.modelValue }]),
        onClick: f[2] || (f[2] = (...v) => b.onBool && b.onBool(...v))
      }, [...f[6] || (f[6] = [
        e("span", { class: "toggle-dot" }, null, -1)
      ])], 10, Rt)) : o.type === "number" ? (t(), s("input", {
        key: 3,
        id: _.inputId,
        type: "number",
        value: Number(o.modelValue),
        min: o.min,
        max: o.max,
        class: "input",
        onInput: f[3] || (f[3] = (v) => u.$emit("update:modelValue", Number(v.target.value)))
      }, null, 40, Bt)) : (t(), s("input", {
        key: 4,
        id: _.inputId,
        type: o.secret && !m.visible ? "password" : "text",
        value: String(o.modelValue ?? ""),
        placeholder: o.placeholder,
        class: "input",
        onInput: f[4] || (f[4] = (v) => u.$emit("update:modelValue", v.target.value))
      }, null, 40, Ft)),
      o.secret ? (t(), s("button", {
        key: 5,
        type: "button",
        class: "reveal",
        onClick: f[5] || (f[5] = (v) => m.visible = !m.visible)
      }, a(m.visible ? "隐藏" : "显示"), 1)) : k("", !0)
    ])
  ]);
}
const Jt = /* @__PURE__ */ Y(Ot, [["render", zt], ["__scopeId", "data-v-47b39beb"]]), Ht = {
  key: 1,
  class: "notice warn"
}, Qt = { class: "card" }, Kt = { class: "hint" }, Wt = {
  key: 0,
  class: "hint"
}, Gt = { class: "actions" }, Yt = ["disabled"], Xt = ["disabled"], Zt = /* @__PURE__ */ X({
  name: "ConfigPage",
  __name: "ConfigPage",
  props: {
    overview: {}
  },
  setup(u) {
    const f = [
      {
        id: "story",
        label: "故事设定",
        hint: "保存后更新当前故事，跨重启保留。",
        fields: [
          { key: "character.name", label: "主角姓名", type: "text", info: "主角姓名，出现在全部叙事中", range: "任意非空中文/英文" },
          { key: "character.profile", label: "人设描述", type: "text", textarea: !0, info: "主角的人设正文", range: "自由文本" },
          { key: "character.traits", label: "性格特质", type: "text", textarea: !0, info: "每行一条，落库为数组", range: "换行分隔文本" },
          { key: "world", label: "世界观", type: "text", textarea: !0, info: "世界观描述", range: "自由文本（≤4000 字）" },
          { key: "location", label: "主要地点", type: "text", info: "故事发生的核心场景" },
          { key: "supportingCast", label: "配角", type: "text", textarea: !0, info: "围绕主角的次要人物" },
          { key: "style", label: "叙事文风", type: "text", textarea: !0, info: "模型据此选择叙事措辞与节奏", range: "自由文本" },
          { key: "perspective", label: "主角视角层", type: "text", textarea: !0, info: "用于写作的主角感知、关注方式和表达习惯；作为独立视角层参与叙事" },
          { key: "defaultRelationship", label: "初始关系", type: "text", info: "新参与者与主角的默认关系" },
          { key: "timezone", label: "时区", type: "text", info: "IANA 时区", range: "如 Asia/Shanghai / America/New_York", placeholder: "Asia/Shanghai" }
        ]
      }
    ], o = y("story"), _ = () => f.find((j) => j.id === o.value), m = Se({}), b = y(!1), w = y(!1), v = y(""), r = y("ok"), C = y(""), h = z(() => !!g.value && JSON.stringify(m) !== C.value), S = () => !h.value || window.confirm("当前故事有未保存的修改。离开此页面？");
    ke(S), _e((j, n) => j.path === n.path || S());
    async function x() {
      h.value && !window.confirm("重新读取将使用服务器上的故事设定替换当前修改。继续？") || await B(o.value);
    }
    const g = y("");
    let A = 0, q = !1;
    oe(() => {
      q = !0, A++;
    });
    async function B(j) {
      var R;
      const n = f.find((I) => I.id === j);
      if (q || !n) return;
      const c = ++A, l = () => !q && c === A && o.value === j;
      o.value = j, g.value = "";
      for (const I of Object.keys(m)) delete m[I];
      b.value = !0, v.value = "";
      try {
        const I = await W.readConfig(j);
        if (!I) throw new Error("Console 连接尚未就绪");
        if (!I.ok) throw new Error(I.error ?? "读取失败");
        if (!l()) return;
        for (const Q of n.fields) {
          const P = (R = I.values) == null ? void 0 : R[Q.key];
          m[Q.key] = Q.type === "boolean" ? P === !0 : P ?? (Q.type === "number" ? 0 : "");
        }
        C.value = JSON.stringify(m), g.value = j;
      } catch (I) {
        l() && (v.value = (I == null ? void 0 : I.message) ?? String(I), r.value = "warn");
      } finally {
        l() && (b.value = !1);
      }
    }
    async function O() {
      if (q || w.value || b.value || g.value !== o.value) return;
      const j = o.value, n = A, c = () => !q && n === A && o.value === j, l = {};
      for (const I of _().fields) l[I.key] = m[I.key];
      const R = JSON.parse(JSON.stringify(l));
      w.value = !0, v.value = "";
      try {
        const I = await W.saveConfig(j, R);
        if (!c()) return;
        if (!I.ok) throw new Error(I.error ?? "未知错误");
        C.value = JSON.stringify(R), v.value = `已写入 ${I.applied ?? 0} 项。${j === "story" ? "已保存到当前故事，后续写作立即使用。" : "已写入 koishi.yml，插件热更新生效。"}`, r.value = "ok";
      } catch (I) {
        c() && (v.value = `保存失败：${(I == null ? void 0 : I.message) ?? String(I)}`, r.value = "warn");
      } finally {
        q || (w.value = !1);
      }
    }
    const T = () => o.value === "story" && g.value === "story" && !m["character.name"] && !b.value;
    return ne(() => B("story")), (j, n) => {
      const c = de("router-link");
      return t(), s("div", null, [
        n[2] || (n[2] = e("div", { class: "pg-head" }, [
          e("div", null, [
            e("h2", null, "当前故事"),
            e("div", { class: "sub" }, "编辑当前故事的设定，保存到故事数据库。新故事的默认档案在配置中心设置。")
          ])
        ], -1)),
        L(c, {
          to: "/hdsi/config-center",
          class: "redirect-card"
        }, {
          default: fe(() => [...n[0] || (n[0] = [
            V("模型、上下文预算、运行时与考据设置 → 配置中心", -1)
          ])]),
          _: 1
        }),
        v.value ? (t(), s("div", {
          key: 0,
          class: E(["notice", r.value]),
          role: "status"
        }, a(v.value), 3)) : k("", !0),
        T() ? (t(), s("div", Ht, "当前没有活跃故事——先在聊天里用 interlude.story.start 启动，再回来编辑故事设定。")) : k("", !0),
        e("div", Qt, [
          e("h3", null, [
            n[1] || (n[1] = e("span", { class: "sq" }, null, -1)),
            V(a(_().label), 1)
          ]),
          e("div", Kt, a(_().hint), 1),
          b.value ? (t(), s("div", Wt, "读取中……")) : g.value === o.value && !T() ? (t(), s(N, { key: 1 }, [
            (t(!0), s(N, null, H(_().fields, (l) => (t(), G(Jt, {
              key: l.key,
              modelValue: m[l.key],
              "onUpdate:modelValue": (R) => m[l.key] = R,
              label: l.label,
              type: l.type,
              options: l.options,
              info: l.info,
              range: l.range,
              min: l.min,
              max: l.max,
              textarea: l.textarea,
              secret: l.secret,
              placeholder: l.placeholder
            }, null, 8, ["modelValue", "onUpdate:modelValue", "label", "type", "options", "info", "range", "min", "max", "textarea", "secret", "placeholder"]))), 128)),
            e("div", Gt, [
              e("button", {
                class: "refresh",
                disabled: b.value || w.value,
                onClick: x
              }, "重新读取", 8, Yt),
              e("button", {
                class: "save",
                disabled: w.value || b.value || g.value !== o.value,
                onClick: O
              }, a(w.value ? "写入中……" : "保存故事设定"), 9, Xt)
            ])
          ], 64)) : (t(), s("button", {
            key: 2,
            type: "button",
            class: "save",
            onClick: x
          }, "重新读取"))
        ])
      ]);
    };
  }
}), ea = /* @__PURE__ */ Y(Zt, [["__scopeId", "data-v-8946789c"]]), ta = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ea
}, Symbol.toStringTag, { value: "Module" })), aa = { key: 0 }, sa = { class: "grid" }, la = { class: "card" }, na = { class: "card" }, oa = {
  key: 0,
  class: "notice info",
  style: { "margin-top": "8px" }
}, ia = /* @__PURE__ */ X({
  name: "DeskPage",
  __name: "DeskPage",
  props: {
    overview: {}
  },
  setup(u) {
    return (f, o) => u.overview ? (t(), s("div", aa, [
      o[2] || (o[2] = e("div", { class: "pg-head" }, [
        e("div", null, [
          e("h2", null, "考据案头"),
          e("div", { class: "sub" }, "经核实的写作参考；资料可供作者使用，主角知情范围由剧情证据决定。")
        ])
      ], -1)),
      e("div", sa, [
        e("div", la, [
          o[0] || (o[0] = e("h3", null, [
            e("span", { class: "sq" }),
            V("案头概况")
          ], -1)),
          L(D, {
            label: "在架条目",
            value: u.overview.research.deskEntries,
            info: "在架的核实事实数（稳定+易变，TTL 过期淘汰）",
            range: "案头容量 2-32，默认 8"
          }, null, 8, ["value"]),
          L(D, {
            label: "搜索后端",
            value: u.overview.research.backend,
            state: "acc",
            info: "考据检索的网络后端",
            range: "auto/tavily/bocha/searxng/duckduckgo-html"
          }, null, 8, ["value"]),
          L(D, {
            label: "查询缓存",
            value: `${u.overview.research.cache.size} 条（命中 ${u.overview.research.cache.hits} / 未命中 ${u.overview.research.cache.misses}）`,
            info: "搜索查询结果缓存——命中可省一次网络检索"
          }, null, 8, ["value"]),
          L(D, {
            label: "累计写入 / 复用 / 淘汰",
            value: `${u.overview.research.counters.offered} / ${u.overview.research.counters.reused} / ${u.overview.research.counters.evicted}`,
            info: "写入案头 / 复用已有条目 / 容量与 TTL 淘汰（重载归零）"
          }, null, 8, ["value"])
        ]),
        e("div", na, [
          o[1] || (o[1] = e("h3", null, [
            e("span", { class: "sq" }),
            V("Jev 决策门控")
          ], -1)),
          L(D, {
            label: "状态",
            value: u.overview.research.jev.enabled ? u.overview.research.jev.keyConfigured ? "已启用" : "已开启 · 待配置密钥" : "未启用",
            state: u.overview.research.jev.enabled ? u.overview.research.jev.keyConfigured ? "ok" : "warn" : "",
            info: "自动生活推进前的考据判定；同时受考据总开关控制"
          }, null, 8, ["value", "state"]),
          L(D, {
            label: "判定 / 触发",
            value: `${u.overview.research.jev.calls} / ${u.overview.research.jev.triggered}`,
            info: "判定=门控调用次数，触发=判定 TRUE 放行先查后写（重载归零）"
          }, null, 8, ["value"]),
          u.overview.research.jev.enabled ? k("", !0) : (t(), s("div", oa, "如需在生活推进前判定是否查证，可在配置中心的「考据 Agent」中配置 Jev 密钥并启用门控。"))
        ])
      ]),
      o[3] || (o[3] = e("div", {
        class: "notice info",
        style: { "margin-top": "12px" }
      }, "当前页展示案头数量、缓存与门控的汇总状态；资料的使用情况可结合写作记录和考据日志核对。", -1))
    ])) : k("", !0);
  }
}), ua = /* @__PURE__ */ Y(ia, [["__scopeId", "data-v-9c6e59c1"]]), da = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ua
}, Symbol.toStringTag, { value: "Module" })), ra = { class: "pg-head" }, ca = { class: "sub" }, va = ["disabled"], fa = {
  key: 0,
  class: "error",
  role: "alert"
}, ha = {
  key: 1,
  class: "notice",
  role: "status"
}, pa = {
  key: 2,
  class: "empty"
}, ma = {
  key: 3,
  class: "empty"
}, ya = { class: "list" }, ga = ["aria-expanded", "disabled", "onClick"], ba = ["data-kind"], ka = { class: "target" }, _a = { class: "head" }, $a = ["data-status"], wa = { class: "time" }, Ca = {
  key: 0,
  class: "detail"
}, Sa = { key: 0 }, xa = {
  key: 4,
  class: "quote"
}, Ma = {
  key: 5,
  class: "ops"
}, qa = {
  key: 0,
  class: "verify-hint"
}, Ia = ["disabled"], Ta = ["disabled"], Pa = ["disabled"], Na = ["onClick"], Aa = ["disabled"], Oa = /* @__PURE__ */ X({
  name: "ActionsPage",
  __name: "ActionsPage",
  setup(u) {
    const f = y([]), o = y(0), _ = y(void 0), m = y(!1), b = y(""), w = y(""), v = y(""), r = y(null), C = y(!1), h = y(!1);
    let S = !1, x = 0, g = 0;
    const A = { action: "当前动作", plan: "人物计划", "fixed-delay": "确定延迟" }, q = {
      pending: "待执行",
      delivered: "已送达",
      partial: "部分送达",
      failed: "失败",
      cancelled: "已取消",
      unknown: "待核实",
      "pending-plan": "计划待处理"
    }, B = z(() => r.value ? r.value.kind !== "action" ? !0 : r.value.segments.some((P) => P.status === "pending" || P.status === "unknown") : !1), O = z(() => {
      var P;
      return !!((P = r.value) != null && P.segments.some((p) => p.status === "unknown"));
    }), T = {
      "plan-cancelled": "计划已取消",
      "segments-cancelled": "分段已取消",
      "nothing-pending": "没有待取消的分段",
      "nothing-unknown": "没有待核实的分段",
      "verified-delivered": "已核实为送达",
      "verified-not-sent": "已核实为未发送",
      "already-cancelled": "已是取消状态",
      "already-completed": "已完成，无需取消",
      "not-found": "记录已移除或不存在",
      "no-story": "没有活跃故事"
    }, j = {
      "console-cancel": "管理员取消后续",
      "manual-verified-delivered": "管理员已核实送达",
      "manual-verified-not-sent": "管理员已核实未发送",
      "policy-daily-cap": "滚动 24 小时额度已满",
      "policy-run-interval": "尚在最短运行间隔内",
      "policy-deferral-expired": "延期已超过有效期",
      "delivery-target-unavailable": "投递目标当前不可用",
      "delivery-source-unavailable": "消息来源当前不可用",
      "endpoint-registry-unavailable": "通信端点登记当前不可用",
      "delivery-generation-obsolete": "任务已由较新的运行状态接替",
      "delivery-unconfirmed-retry-scheduled": "投递尚未确认，已安排重试",
      "group-not-allowed": "当前群聊未获发送许可"
    };
    function n(P) {
      return j[P] ? `${j[P]}（${P}）` : P;
    }
    async function c(P) {
      if (h.value) return;
      const p = v.value;
      h.value = !0, w.value = "", b.value = "";
      try {
        const d = await P();
        if (S) return;
        if (!d.ok) throw new Error(T[d.reason] ?? d.reason ?? "操作失败");
        w.value = T[d.reason] ?? (d.changed ? "操作已完成。" : "状态已经更新，本次无需变更。"), d.changed > 0 && (await R(!0), !S && v.value === p && await l(p));
      } catch (d) {
        S || (b.value = d instanceof Error ? d.message : String(d));
      } finally {
        S || (h.value = !1);
      }
    }
    async function l(P) {
      b.value = "";
      const p = ++g;
      C.value = !0, r.value = null;
      try {
        const d = await W.actionDetail(P);
        if (S || p !== g || v.value !== P) return;
        if (!d) throw new Error("该动作已不在当前记录中，请刷新列表。");
        r.value = d;
      } catch (d) {
        !S && p === g && (b.value = d instanceof Error ? d.message : String(d));
      } finally {
        !S && p === g && (C.value = !1);
      }
    }
    async function R(P = !0) {
      const p = ++x;
      m.value = !0, b.value = "";
      try {
        const d = await W.actionsList(P ? void 0 : _.value);
        if (!d) throw new Error("Console 连接尚未就绪");
        if (S || p !== x) return;
        f.value = P ? d.rows : [...f.value, ...d.rows], o.value = d.total, _.value = d.cursor, P && v.value && !f.value.some((i) => i.id === v.value) && (v.value = "", r.value = null, g++, C.value = !1);
      } catch (d) {
        !S && p === x && (b.value = String(d));
      } finally {
        !S && p === x && (m.value = !1);
      }
    }
    async function I(P) {
      if (!h.value) {
        if (b.value = "", w.value = "", v.value === P) {
          v.value = "", r.value = null, g++, C.value = !1;
          return;
        }
        v.value = P, await l(P);
      }
    }
    function Q(P) {
      if (!P) return "—";
      const p = new Date(P);
      return Number.isNaN(p.getTime()) ? "—" : p.toLocaleString();
    }
    return ne(() => void R()), oe(() => {
      S = !0, x++, g++;
    }), (P, p) => (t(), s("div", null, [
      e("div", ra, [
        e("div", null, [
          p[5] || (p[5] = e("h2", null, "通信动作", -1)),
          e("div", ca, "查看作者动作、投递结果与未来计划；管理员可取消后续分段或核实未知回执。当前窗口共 " + a(o.value) + " 条。", 1)
        ]),
        e("button", {
          class: "refresh",
          disabled: m.value,
          onClick: p[0] || (p[0] = (d) => R(!0))
        }, "刷新", 8, va)
      ]),
      b.value ? (t(), s("div", fa, a(b.value), 1)) : k("", !0),
      w.value ? (t(), s("div", ha, a(w.value), 1)) : k("", !0),
      m.value && !f.value.length ? (t(), s("div", pa, "正在读取通信动作…")) : k("", !0),
      !m.value && !f.value.length && !b.value ? (t(), s("div", ma, "暂无动作记录。")) : k("", !0),
      e("div", ya, [
        (t(!0), s(N, null, H(f.value, (d) => (t(), s("div", {
          key: d.id,
          class: E(["row", { open: v.value === d.id }])
        }, [
          e("button", {
            type: "button",
            class: "row-main",
            "aria-expanded": v.value === d.id,
            disabled: h.value,
            onClick: (i) => I(d.id)
          }, [
            e("span", {
              class: "kind",
              "data-kind": d.kind
            }, a(A[d.kind] ?? d.kind), 9, ba),
            e("span", ka, a(d.target), 1),
            e("span", _a, a(d.head), 1),
            e("span", {
              class: "status",
              "data-status": d.status
            }, [
              V(a(q[d.status] ?? d.status), 1),
              d.segmentCount ? (t(), s(N, { key: 0 }, [
                V("（" + a(d.deliveredCount) + "/" + a(d.segmentCount) + "）", 1)
              ], 64)) : k("", !0)
            ], 8, $a),
            e("span", wa, a(Q(d.updatedAt)), 1)
          ], 8, ga),
          v.value === d.id ? (t(), s("div", Ca, [
            C.value ? (t(), s("div", Sa, "读取中…")) : r.value ? (t(), s(N, { key: 1 }, [
              L(D, {
                label: "动作",
                value: r.value.id
              }, null, 8, ["value"]),
              L(D, {
                label: "渠道",
                value: r.value.channel === "group" ? "群聊" : "私聊"
              }, null, 8, ["value"]),
              r.value.dueAt ? (t(), G(D, {
                key: 0,
                label: "到期",
                value: Q(r.value.dueAt)
              }, null, 8, ["value"])) : k("", !0),
              r.value.expiresAt ? (t(), G(D, {
                key: 1,
                label: "失效",
                value: Q(r.value.expiresAt)
              }, null, 8, ["value"])) : k("", !0),
              r.value.reason ? (t(), G(D, {
                key: 2,
                label: "原因",
                value: n(r.value.reason)
              }, null, 8, ["value"])) : k("", !0),
              r.value.segments.length ? (t(), G(D, {
                key: 3,
                label: "分段",
                value: r.value.segments.map((i) => `第 ${i.index + 1} 段：${q[i.status] ?? i.status}${i.reason ? `（${n(i.reason)}）` : ""}`).join("；") || "—"
              }, null, 8, ["value"])) : k("", !0),
              r.value.quote ? (t(), s("div", xa, "原文：" + a(r.value.quote), 1)) : k("", !0),
              B.value || O.value ? (t(), s("div", Ma, [
                O.value ? (t(), s("p", qa, "根据平台实际记录核实；确认送达后，该结果会作为后续写作依据。")) : k("", !0),
                B.value ? (t(), s("button", {
                  key: 1,
                  disabled: h.value,
                  onClick: p[1] || (p[1] = (i) => c(() => ie(W).cancelAction(r.value.id)))
                }, a(h.value ? "处理中…" : "取消后续"), 9, Ia)) : k("", !0),
                O.value ? (t(), s("button", {
                  key: 2,
                  disabled: h.value,
                  class: "ok",
                  onClick: p[2] || (p[2] = (i) => c(() => ie(W).verifyAction(r.value.id, "delivered")))
                }, "核实已送达", 8, Ta)) : k("", !0),
                O.value ? (t(), s("button", {
                  key: 3,
                  disabled: h.value,
                  onClick: p[3] || (p[3] = (i) => c(() => ie(W).verifyAction(r.value.id, "not-sent")))
                }, "核实未发送", 8, Pa)) : k("", !0)
              ])) : k("", !0)
            ], 64)) : (t(), s("button", {
              key: 2,
              class: "refresh",
              onClick: (i) => l(d.id)
            }, "重试读取详情", 8, Na))
          ])) : k("", !0)
        ], 2))), 128))
      ]),
      _.value ? (t(), s("button", {
        key: 4,
        class: "more",
        disabled: m.value,
        onClick: p[4] || (p[4] = (d) => R(!1))
      }, a(m.value ? "读取中…" : "加载更多"), 9, Aa)) : k("", !0)
    ]));
  }
}), Va = /* @__PURE__ */ Y(Oa, [["__scopeId", "data-v-7c409614"]]), Da = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Va
}, Symbol.toStringTag, { value: "Module" })), ja = { key: 0 }, La = { class: "scope-controls" }, Ea = { class: "grid" }, Ua = { class: "card" }, Ra = { class: "card" }, Ba = /* @__PURE__ */ X({
  name: "DensityPage",
  __name: "DensityPage",
  props: {
    overview: {}
  },
  setup(u) {
    const f = u, o = y("private"), _ = { burst: "极高密度", high: "高密度", normal: "日常", low: "低密度", advance: "自动推进" }, m = z(() => {
      var r, C, h, S, x, g, A, q;
      const v = (S = (h = (C = (r = f.overview) == null ? void 0 : r.density) == null ? void 0 : C.scopes) == null ? void 0 : h[o.value]) == null ? void 0 : S.mode;
      return v && v !== "inherit" ? v : ((g = (x = f.overview) == null ? void 0 : x.density) == null ? void 0 : g.globalMode) ?? ((q = (A = f.overview) == null ? void 0 : A.density) == null ? void 0 : q.mode) ?? "fixed";
    }), b = z(() => {
      var C, h, S;
      const v = ((C = f.overview) == null ? void 0 : C.density) ?? {}, r = ((S = (h = v.scopes) == null ? void 0 : h[o.value]) == null ? void 0 : S.tiers) ?? {};
      return [
        { label: "极高密度", tier: "burst", limit: r.burst, info: "近 5 分钟至少 4 条消息" },
        { label: "高密度", tier: "high", limit: r.high, info: "近 5 分钟至少 2 条，或近 15 分钟至少 4 条消息" },
        { label: "日常", tier: "normal", limit: v.anchor, info: "使用 contextEntryLimit 作为日常档锚点" },
        { label: "低密度", tier: "low", limit: r.low, info: "近 30 分钟没有新消息" },
        { label: "自动推进", tier: "advance", limit: r.advance, info: "自动生活推进回合使用的档位" }
      ];
    }), w = z(() => {
      var r, C, h;
      const v = m.value === "fixed" ? (C = (r = f.overview) == null ? void 0 : r.density) == null ? void 0 : C.anchor : (h = b.value.find((S) => {
        var x, g;
        return S.tier === ((g = (x = f.overview) == null ? void 0 : x.density) == null ? void 0 : g.tier);
      })) == null ? void 0 : h.limit;
      return m.value === "auto" && v != null ? Math.max(4, Math.min(200, Math.floor(v))) : v;
    });
    return (v, r) => {
      const C = de("router-link");
      return u.overview ? (t(), s("div", ja, [
        r[5] || (r[5] = e("div", { class: "pg-head" }, [
          e("div", null, [
            e("h2", null, "上下文预算"),
            e("div", { class: "sub" }, "近期原始剧本的保留预算。密度统计按当前故事计算，私聊与群聊可分别设置模式和档位。")
          ])
        ], -1)),
        e("div", La, [
          e("button", {
            class: E({ on: o.value === "private" }),
            onClick: r[0] || (r[0] = (h) => o.value = "private")
          }, "私聊预算", 2),
          e("button", {
            class: E({ on: o.value === "group" }),
            onClick: r[1] || (r[1] = (h) => o.value = "group")
          }, "群聊预算", 2),
          L(C, { to: "/hdsi/config-center" }, {
            default: fe(() => [...r[2] || (r[2] = [
              V("在配置中心调整 →", -1)
            ])]),
            _: 1
          })
        ]),
        e("div", Ea, [
          e("div", Ua, [
            r[3] || (r[3] = e("h3", null, [
              e("span", { class: "sq" }),
              V("当前档位")
            ], -1)),
            L(D, {
              label: "模式",
              value: m.value === "auto" ? "随密度自适应" : "固定预算",
              state: "acc",
              info: "fixed 使用锚点与时间窗；auto 按本页档位动态选择",
              range: "fixed | auto"
            }, null, 8, ["value"]),
            L(D, {
              label: "档位",
              value: `${m.value === "auto" ? _[u.overview.density.tier] ?? u.overview.density.tier : "固定"} → ${w.value ?? "—"} 条`,
              info: "当前密度对应的用户回合预算；fixed 可额外合并时间窗，auto 使用至少 4 条的档位硬上限。自动推进回合使用推进档。"
            }, null, 8, ["value"]),
            L(D, {
              label: "近 5 分钟",
              value: `${u.overview.density.counts.count5} 条消息`,
              info: "入站消息计数——密度信号源之一（burst 判定窗）"
            }, null, 8, ["value"]),
            L(D, {
              label: "近 15 分钟",
              value: `${u.overview.density.counts.count15} 条消息`,
              info: "入站消息计数——high 判定窗"
            }, null, 8, ["value"]),
            L(D, {
              label: "近 30 分钟",
              value: `${u.overview.density.counts.count30} 条消息`,
              info: "入站消息计数——low 判定窗（轨迹重载归零）"
            }, null, 8, ["value"])
          ]),
          e("div", Ra, [
            r[4] || (r[4] = e("h3", null, [
              e("span", { class: "sq" }),
              V("档位表")
            ], -1)),
            (t(!0), s(N, null, H(b.value, (h) => (t(), G(D, {
              key: h.label,
              class: E(["row", { on: m.value === "auto" && u.overview.density.tier === h.tier }]),
              label: h.label,
              value: h.limit == null ? "未提供配置" : `${h.limit} 条`,
              info: h.info
            }, null, 8, ["class", "label", "value", "info"]))), 128))
          ])
        ])
      ])) : k("", !0);
    };
  }
}), Fa = /* @__PURE__ */ Y(Ba, [["__scopeId", "data-v-f55a4e87"]]), za = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Fa
}, Symbol.toStringTag, { value: "Module" })), Ja = { class: "pg-head" }, Ha = {
  key: 0,
  class: "head-stats"
}, Qa = {
  class: "chip",
  title: "自本次进程启动"
}, Ka = {
  class: "chip err",
  title: "error / warn 落库前计数"
}, Wa = {
  class: "chip",
  title: "续写/用量/申请事件计数"
}, Ga = {
  class: "chip",
  title: "环形缓冲溢出丢弃数"
}, Ya = { class: "controls" }, Xa = { class: "mini" }, Za = {
  key: 0,
  class: "fail"
}, es = {
  key: 0,
  class: "empty"
}, ts = ["onClick"], as = { class: "seq" }, ss = { class: "time" }, ls = { class: "who" }, ns = { class: "msg" }, os = { class: "who" }, is = { class: "msg" }, us = { class: "hint" }, ds = { class: "who" }, rs = { class: "msg" }, cs = { class: "who" }, vs = { class: "msg" }, fs = {
  key: 0,
  class: "script"
}, hs = /* @__PURE__ */ X({
  name: "DebugPage",
  __name: "DebugPage",
  setup(u) {
    const f = y([]), o = y(null), _ = y(""), m = y(!0), b = y(!0), w = y("all"), v = y("all"), r = y(""), C = y(/* @__PURE__ */ new Set()), h = y(null);
    let S, x = !1;
    z(() => f.value.reduce((n, c) => Math.max(n, c.seq), 0));
    const g = z(() => f.value.filter((n) => {
      if (v.value !== "all" && n.kind !== v.value || n.kind === "log" && (w.value === "warn" && !["warn", "error"].includes(String(n.level)) || w.value === "error" && n.level !== "error"))
        return !1;
      if (r.value.trim()) {
        const c = r.value.trim().toLowerCase();
        if (![n.message, n.script, n.model, n.phase, n.protagonist, n.qq, n.decision].filter(Boolean).join(" ").toLowerCase().includes(c)) return !1;
      }
      return !0;
    }));
    function A(n) {
      return new Date(n).toLocaleTimeString("zh-CN", { hour12: !1 });
    }
    function q(n) {
      return n ? n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(n) : "0";
    }
    function B(n) {
      return { log: "日志", narrative: "续写", usage: "用量", access: "申请" }[n] ?? n;
    }
    function O(n) {
      const c = new Set(C.value);
      c.has(n) ? c.delete(n) : c.add(n), C.value = c;
    }
    async function T() {
      if (!x) {
        x = !0;
        try {
          const n = await W.opsRecent(240);
          n != null && n.ok && (f.value = n.events ?? [], o.value = n.stats ?? null, _.value = "");
        } catch (n) {
          _.value = (n == null ? void 0 : n.message) ?? String(n);
        } finally {
          x = !1, b.value && requestAnimationFrame(() => {
            h.value && (h.value.scrollTop = 0);
          });
        }
      }
    }
    function j() {
      f.value = [];
    }
    return ne(() => {
      T(), S = window.setInterval(() => {
        m.value && T();
      }, 2e3);
    }), oe(() => {
      S && window.clearInterval(S);
    }), (n, c) => (t(), s("div", null, [
      e("div", Ja, [
        c[6] || (c[6] = e("div", null, [
          e("h2", null, "调试"),
          e("div", { class: "sub" }, "主叙事剧本续写、模型用量与 warn/error 的实时事件流（2 秒轮询）。剧本文本受 ops.debugStream.scriptPreview 门控。")
        ], -1)),
        o.value ? (t(), s("div", Ha, [
          e("span", Qa, "启动 " + a(new Date(o.value.sinceBoot).toLocaleTimeString("zh-CN", { hour12: !1 })), 1),
          e("span", Ka, "✗ " + a(o.value.levels.error) + " / ⚠ " + a(o.value.levels.warn), 1),
          e("span", Wa, "✎ " + a(o.value.counts.narrative) + " · ◇ " + a(o.value.counts.usage) + " · ✉ " + a(o.value.counts.access), 1),
          e("span", Ga, "丢弃 " + a(o.value.dropped), 1)
        ])) : k("", !0)
      ]),
      e("div", Ya, [
        e("button", {
          class: E({ on: m.value }),
          onClick: c[0] || (c[0] = (l) => m.value = !m.value)
        }, a(m.value ? "● 实时" : "○ 已暂停"), 3),
        e("label", Xa, [
          ee(e("input", {
            type: "checkbox",
            "onUpdate:modelValue": c[1] || (c[1] = (l) => b.value = l)
          }, null, 512), [
            [pe, b.value]
          ]),
          c[7] || (c[7] = V(" 自动置顶", -1))
        ]),
        ee(e("select", {
          "onUpdate:modelValue": c[2] || (c[2] = (l) => v.value = l),
          title: "事件类型"
        }, [...c[8] || (c[8] = [
          ue('<option value="all" data-v-b749075a>全部类型</option><option value="narrative" data-v-b749075a>续写</option><option value="log" data-v-b749075a>日志</option><option value="usage" data-v-b749075a>用量</option><option value="access" data-v-b749075a>申请</option>', 5)
        ])], 512), [
          [ye, v.value]
        ]),
        ee(e("select", {
          "onUpdate:modelValue": c[3] || (c[3] = (l) => w.value = l),
          title: "日志级别（仅日志类型生效）"
        }, [...c[9] || (c[9] = [
          e("option", { value: "all" }, "全部级别", -1),
          e("option", { value: "warn" }, "warn 及以上", -1),
          e("option", { value: "error" }, "仅 error", -1)
        ])], 512), [
          [ye, w.value]
        ]),
        ee(e("input", {
          class: "search",
          "onUpdate:modelValue": c[4] || (c[4] = (l) => r.value = l),
          placeholder: "过滤关键字（消息/模型/相位…）"
        }, null, 512), [
          [he, r.value]
        ]),
        e("button", { onClick: j }, "清屏"),
        e("button", {
          onClick: c[5] || (c[5] = (l) => T())
        }, "立即刷新"),
        _.value ? (t(), s("span", Za, "刷新失败：" + a(_.value), 1)) : k("", !0)
      ]),
      e("div", {
        class: "log-pane",
        ref_key: "logPane",
        ref: h
      }, [
        g.value.length ? k("", !0) : (t(), s("div", es, ' 暂无事件。发一条私聊消息、等一次自动推进，或把级别过滤器调回"全部"。 ')),
        (t(!0), s(N, null, H(g.value, (l) => (t(), s("div", {
          key: l.seq,
          class: E(["ev", [l.kind, l.level]])
        }, [
          e("div", {
            class: "ev-head",
            onClick: (R) => l.kind === "narrative" && O(l.seq)
          }, [
            e("span", as, "#" + a(l.seq), 1),
            e("span", ss, a(A(l.ts)), 1),
            e("span", {
              class: E(["kind", l.kind])
            }, a(B(l.kind)), 3),
            l.kind === "log" ? (t(), s(N, { key: 0 }, [
              e("span", {
                class: E(["lvl", l.level])
              }, a(String(l.level).toUpperCase()), 3),
              e("span", ls, a(l.protagonist) + a(l.phase ? ` · ${l.phase}` : ""), 1),
              e("span", ns, a(l.message), 1)
            ], 64)) : l.kind === "narrative" ? (t(), s(N, { key: 1 }, [
              e("span", os, a(l.phase), 1),
              e("span", is, a(l.decision), 1),
              e("span", us, a(C.value.has(l.seq) ? "收起" : l.script ? `展开 ${l.script.length} 字` : "（剧本预览已关闭）"), 1)
            ], 64)) : l.kind === "usage" ? (t(), s(N, { key: 2 }, [
              e("span", ds, a(l.task) + " · " + a(l.model), 1),
              e("span", rs, "入 " + a(q(l.inputTokens)) + "（缓存 " + a(q(l.cachedInputTokens)) + "） 出 " + a(q(l.outputTokens)) + a(l.cost ? ` ≈${l.cost.toFixed(4)}` : ""), 1)
            ], 64)) : (t(), s(N, { key: 3 }, [
              e("span", cs, a(l.qq), 1),
              e("span", vs, a(l.status), 1)
            ], 64))
          ], 8, ts),
          l.kind === "narrative" && C.value.has(l.seq) && l.script ? (t(), s("pre", fs, a(l.script), 1)) : k("", !0)
        ], 2))), 128))
      ], 512)
    ]));
  }
}), ps = /* @__PURE__ */ Y(hs, [["__scopeId", "data-v-b749075a"]]), ms = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ps
}, Symbol.toStringTag, { value: "Module" })), ys = { class: "tabs-row" }, gs = {
  key: 0,
  class: "notice warn"
}, bs = {
  key: 1,
  class: "notice info"
}, ks = {
  key: 0,
  class: "empty"
}, _s = { class: "cards" }, $s = { class: "card" }, ws = { class: "v" }, Cs = { class: "card" }, Ss = { class: "v" }, xs = { class: "s" }, Ms = { class: "card" }, qs = { class: "v" }, Is = { class: "s" }, Ts = { class: "card" }, Ps = { class: "v" }, Ns = { class: "section-title" }, As = { class: "chart" }, Os = ["title"], Vs = { class: "table" }, Ds = { class: "col task" }, js = { class: "col model mono" }, Ls = { class: "col num" }, Es = { class: "col num mono" }, Us = { class: "col num mono" }, Rs = { class: "col num" }, Bs = { class: "col num mono" }, Fs = { class: "col num mono" }, zs = { class: "section-title" }, Js = { class: "table" }, Hs = { class: "col time mono" }, Qs = { class: "col task" }, Ks = { class: "col model mono" }, Ws = { class: "col num mono" }, Gs = { class: "col num mono" }, Ys = { class: "col num mono" }, Xs = { class: "col num mono" }, Zs = /* @__PURE__ */ X({
  name: "UsagePage",
  __name: "UsagePage",
  setup(u) {
    const f = y("today"), o = y(null), _ = y(""), m = y(!0), b = y(!0);
    let w, v = !1;
    async function r() {
      if (!v) {
        v = !0;
        try {
          const n = await W.opsUsage(f.value);
          n != null && n.ok ? (o.value = n, _.value = "") : _.value = (n == null ? void 0 : n.error) || "读取失败";
        } catch (n) {
          _.value = (n == null ? void 0 : n.message) ?? String(n);
        } finally {
          v = !1, m.value = !1;
        }
      }
    }
    function C(n) {
      f.value !== n && (f.value = n, m.value = !0, r());
    }
    const h = z(() => {
      var n;
      return ((n = o.value) == null ? void 0 : n.totals) ?? { calls: 0, inputTokens: 0, outputTokens: 0, cachedInputTokens: 0, cost: 0 };
    }), S = z(() => h.value.inputTokens ? Math.round(h.value.cachedInputTokens / h.value.inputTokens * 100) : 0), x = z(() => {
      var n;
      return Math.max(1, ...(((n = o.value) == null ? void 0 : n.buckets) ?? []).map((c) => c.inputTokens + c.outputTokens));
    });
    function g(n) {
      return n.inputTokens ? Math.round(n.cachedInputTokens / n.inputTokens * 100) : 0;
    }
    function A(n) {
      const c = n.inputTokens + n.outputTokens;
      return c ? `${Math.max(3, Math.round(c / x.value * 100))}%` : "0%";
    }
    function q(n) {
      const c = n.inputTokens + n.outputTokens;
      return c ? `${Math.round(n.cachedInputTokens / c * 100)}%` : "0%";
    }
    function B(n) {
      var c;
      return ((c = o.value) == null ? void 0 : c.bucketMode) === "day" || n % 3 === 0;
    }
    function O(n) {
      return n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(Math.round(n));
    }
    function T(n) {
      return n >= 1 ? n.toFixed(2) : n.toFixed(4);
    }
    function j(n) {
      const c = new Date(n), l = (I) => String(I).padStart(2, "0"), R = `${l(c.getHours())}:${l(c.getMinutes())}:${l(c.getSeconds())}`;
      return f.value === "7d" ? `${l(c.getMonth() + 1)}-${l(c.getDate())} ${R.slice(0, 5)}` : R;
    }
    return ne(() => {
      r(), !(typeof window > "u") && (w = window.setInterval(() => {
        b.value && r();
      }, 3e4));
    }), oe(() => {
      w && window.clearInterval(w);
    }), (n, c) => (t(), s("div", null, [
      c[15] || (c[15] = e("div", { class: "pg-head" }, [
        e("div", null, [
          e("h2", null, "调用分析"),
          e("div", { class: "sub" }, "模型调用的 token 用量、缓存命中与费用 · 数据源 interlude_usage_log（保留 60 天）· 30 秒自动刷新")
        ])
      ], -1)),
      e("div", ys, [
        e("button", {
          class: E({ on: f.value === "today" }),
          onClick: c[0] || (c[0] = (l) => C("today"))
        }, "今日", 2),
        e("button", {
          class: E({ on: f.value === "yesterday" }),
          onClick: c[1] || (c[1] = (l) => C("yesterday"))
        }, "昨日", 2),
        e("button", {
          class: E({ on: f.value === "7d" }),
          onClick: c[2] || (c[2] = (l) => C("7d"))
        }, "近 7 天", 2),
        c[5] || (c[5] = e("span", { class: "flex-fill" }, null, -1)),
        e("button", {
          class: E({ primary: b.value }),
          onClick: c[3] || (c[3] = (l) => b.value = !b.value)
        }, a(b.value ? "暂停刷新" : "继续刷新"), 3),
        e("button", {
          onClick: c[4] || (c[4] = (l) => {
            m.value = !0, r();
          })
        }, "立即刷新")
      ]),
      _.value ? (t(), s("div", gs, "读取失败：" + a(_.value), 1)) : k("", !0),
      m.value && !o.value ? (t(), s("div", bs, "读取中……")) : k("", !0),
      o.value ? (t(), s(N, { key: 2 }, [
        h.value.calls ? (t(), s(N, { key: 1 }, [
          e("div", _s, [
            e("div", $s, [
              c[6] || (c[6] = e("div", { class: "k" }, "调用次数", -1)),
              e("div", ws, a(h.value.calls), 1)
            ]),
            e("div", Cs, [
              c[7] || (c[7] = e("div", { class: "k" }, "总 tokens", -1)),
              e("div", Ss, a(O(h.value.inputTokens + h.value.outputTokens)), 1),
              e("div", xs, "输入 " + a(O(h.value.inputTokens)) + " · 输出 " + a(O(h.value.outputTokens)), 1)
            ]),
            e("div", Ms, [
              c[8] || (c[8] = e("div", { class: "k" }, "缓存命中率", -1)),
              e("div", qs, a(S.value) + "%", 1),
              e("div", Is, "命中 " + a(O(h.value.cachedInputTokens)), 1)
            ]),
            e("div", Ts, [
              c[9] || (c[9] = e("div", { class: "k" }, "估算费用", -1)),
              e("div", Ps, "¥" + a(T(h.value.cost)), 1),
              c[10] || (c[10] = e("div", { class: "s" }, "按连接价格字段", -1))
            ])
          ]),
          e("div", Ns, "趋势（" + a(o.value.bucketMode === "hour" ? "按小时" : "按天") + "，深色为缓存命中部分）", 1),
          e("div", As, [
            (t(!0), s(N, null, H(o.value.buckets, (l, R) => (t(), s("div", {
              key: l.label,
              class: "bar-col",
              title: `${l.label} · ${l.calls} 次 · ${O(l.inputTokens + l.outputTokens)} tok · 命中 ${g(l)}%`
            }, [
              e("div", {
                class: "bar",
                style: me({ height: A(l) })
              }, [
                e("div", {
                  class: "seg cached",
                  style: me({ height: q(l) })
                }, null, 4)
              ], 4),
              e("div", {
                class: E(["bar-label", { dim: !B(R) }])
              }, a(l.label), 3)
            ], 8, Os))), 128))
          ]),
          c[13] || (c[13] = e("div", { class: "section-title" }, "按任务汇总", -1)),
          e("div", Vs, [
            c[11] || (c[11] = ue('<div class="thead" data-v-d9e6eff9><div class="col task" data-v-d9e6eff9>任务</div><div class="col model" data-v-d9e6eff9>模型</div><div class="col num" data-v-d9e6eff9>次数</div><div class="col num" data-v-d9e6eff9>输入</div><div class="col num" data-v-d9e6eff9>命中</div><div class="col num" data-v-d9e6eff9>命中率</div><div class="col num" data-v-d9e6eff9>输出</div><div class="col num" data-v-d9e6eff9>费用</div></div>', 1)),
            (t(!0), s(N, null, H(o.value.byTask, (l) => (t(), s("div", {
              key: l.task + "|" + l.model,
              class: "trow"
            }, [
              e("div", Ds, a(l.task), 1),
              e("div", js, a(l.model), 1),
              e("div", Ls, a(l.calls), 1),
              e("div", Es, a(O(l.inputTokens)), 1),
              e("div", Us, a(O(l.cachedInputTokens)), 1),
              e("div", Rs, a(g(l)) + "%", 1),
              e("div", Bs, a(O(l.outputTokens)), 1),
              e("div", Fs, "¥" + a(T(l.cost)), 1)
            ]))), 128))
          ]),
          e("div", zs, "最近调用（最新 " + a(o.value.recent.length) + " 条）", 1),
          e("div", Js, [
            c[12] || (c[12] = ue('<div class="thead" data-v-d9e6eff9><div class="col time" data-v-d9e6eff9>时间</div><div class="col task" data-v-d9e6eff9>任务</div><div class="col model" data-v-d9e6eff9>模型</div><div class="col num" data-v-d9e6eff9>输入</div><div class="col num" data-v-d9e6eff9>命中</div><div class="col num" data-v-d9e6eff9>输出</div><div class="col num" data-v-d9e6eff9>费用</div></div>', 1)),
            (t(!0), s(N, null, H(o.value.recent, (l) => (t(), s("div", {
              key: l.id,
              class: "trow"
            }, [
              e("div", Hs, a(j(l.ts)), 1),
              e("div", Qs, a(l.task), 1),
              e("div", Ks, a(l.model), 1),
              e("div", Ws, a(O(l.inputTokens)), 1),
              e("div", Gs, a(O(l.cachedInputTokens)), 1),
              e("div", Ys, a(O(l.outputTokens)), 1),
              e("div", Xs, "¥" + a(T(l.cost)), 1)
            ]))), 128))
          ]),
          c[14] || (c[14] = e("div", { class: "hint-line" }, "缓存命中率 = cachedInputTokens / inputTokens。命中率受前缀稳定性影响：人设与事实段是稳定前缀，重启或配置变更会使缓存失效一次。费用为按连接价格字段的估算值。", -1))
        ], 64)) : (t(), s("div", ks, "该时段没有模型调用记录。"))
      ], 64)) : k("", !0)
    ]));
  }
}), el = /* @__PURE__ */ Y(Zs, [["__scopeId", "data-v-d9e6eff9"]]), tl = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: el
}, Symbol.toStringTag, { value: "Module" })), al = { class: "pg-head" }, sl = { class: "head-info" }, ll = {
  class: "chip",
  title: "sharedStory.managerAccounts"
}, nl = {
  class: "chip",
  title: "主动消息名单策略"
}, ol = { class: "tabs-row" }, il = {
  key: 0,
  class: "badge"
}, ul = ["disabled"], dl = {
  key: 0,
  class: "notice info"
}, rl = {
  key: 1,
  class: "notice warn"
}, cl = {
  key: 2,
  class: "notice info"
}, vl = {
  key: 0,
  class: "empty"
}, fl = {
  key: 1,
  class: "table"
}, hl = { class: "col qq mono" }, pl = { class: "col name" }, ml = { class: "col src" }, yl = { class: "col num" }, gl = { class: "col time" }, bl = ["title"], kl = { class: "col ops" }, _l = ["disabled", "onClick"], $l = ["disabled", "onClick"], wl = { class: "history" }, Cl = { class: "table slim" }, Sl = { class: "col qq mono" }, xl = { class: "col name" }, Ml = { class: "col src" }, ql = { class: "col num" }, Il = { class: "col time" }, Tl = ["title"], Pl = { class: "col ops" }, Nl = ["disabled", "onClick"], Al = { class: "table" }, Ol = { class: "col qq mono" }, Vl = {
  key: 0,
  class: "badge",
  title: "有待审批申请"
}, Dl = { class: "col name" }, jl = ["onUpdate:modelValue"], Ll = {
  key: 0,
  class: "subname"
}, El = { class: "col st" }, Ul = ["onUpdate:modelValue"], Rl = { class: "col st" }, Bl = ["onUpdate:modelValue"], Fl = { class: "col time" }, zl = { class: "col time" }, Jl = { class: "col ops" }, Hl = ["onClick"], Ql = {
  key: 0,
  class: "empty"
}, Kl = {
  key: 1,
  class: "table"
}, Wl = { class: "col qq mono" }, Gl = { class: "col name" }, Yl = ["onUpdate:modelValue"], Xl = { class: "col st" }, Zl = ["onUpdate:modelValue"], en = { class: "col mode" }, tn = ["title"], an = { class: "col ops" }, sn = ["onClick"], ln = /* @__PURE__ */ X({
  name: "ListsPage",
  __name: "ListsPage",
  setup(u) {
    const f = y("requests"), o = y(!0), _ = y(""), m = y([]), b = y([]), w = y([]), v = y(!0), r = y([]), C = y("all"), h = y([]), S = y(!1), x = y(!1), g = y(""), A = y(""), q = z(() => w.value.filter((p) => p.status === "pending")), B = z(() => {
      const p = A.value.trim().toLowerCase();
      return p ? m.value.filter((d) => [d.qq, d.label, d.displayName, d.personId].filter(Boolean).join(" ").toLowerCase().includes(p)) : m.value;
    });
    async function O() {
      var p, d;
      o.value = !0, _.value = "";
      try {
        const i = await W.listsRead();
        if (!(i != null && i.ok)) throw new Error((i == null ? void 0 : i.error) ?? "读取失败");
        m.value = i.users ?? [], b.value = i.groups ?? [], w.value = i.requests ?? [], v.value = i.onebotEnabled, r.value = i.managers ?? [], C.value = ((p = i.proactive) == null ? void 0 : p.mode) ?? "all", h.value = ((d = i.proactive) == null ? void 0 : d.list) ?? [], S.value = !1;
      } catch (i) {
        _.value = (i == null ? void 0 : i.message) ?? String(i);
      } finally {
        o.value = !1;
      }
    }
    function T() {
      S.value = !0, g.value = "";
    }
    function j() {
      const p = window.prompt("要添加的 QQ 号（5-12 位数字）");
      !p || !/^\d{5,12}$/.test(p.trim()) || m.value.some((d) => d.qq === p.trim()) || (m.value.push({ qq: p.trim(), label: "", personId: "", profile: "", relationship: "", enabled: !0, proactive: !0 }), T());
    }
    function n(p) {
      const d = m.value[p];
      window.confirm(`从私聊白名单移除 ${d.qq}${d.label ? `（${d.label}）` : ""}？
（参与者与历史剧本保留，仅停止接收其私聊）`) && (m.value.splice(p, 1), T());
    }
    function c() {
      const p = window.prompt("要添加的 QQ 群号（5-12 位数字）");
      !p || !/^\d{5,12}$/.test(p.trim()) || b.value.some((d) => d.groupId === p.trim()) || (b.value.push({ groupId: p.trim(), label: "", enabled: !0, responseMode: "mention-only", collectionScope: "directed", purpose: "", characterRole: "" }), T());
    }
    function l(p) {
      const d = b.value[p];
      window.confirm(`从群聊白名单移除 ${d.groupId}${d.label ? `（${d.label}）` : ""}？`) && (b.value.splice(p, 1), T());
    }
    async function R() {
      x.value = !0, g.value = "";
      try {
        const p = await W.listsSave({ users: m.value, groups: b.value });
        if (!(p != null && p.ok)) throw new Error((p == null ? void 0 : p.error) ?? "保存失败");
        g.value = "已保存（写入 koishi.yml 并热更新）。", await O();
      } catch (p) {
        g.value = `保存失败：${(p == null ? void 0 : p.message) ?? String(p)}`;
      } finally {
        x.value = !1;
      }
    }
    async function I(p, d) {
      x.value = !0, g.value = "";
      try {
        const i = await W.listsDecide(p, d);
        if (!(i != null && i.ok)) throw new Error((i == null ? void 0 : i.error) ?? "操作失败");
        g.value = d ? `已授权 ${p}（写入白名单）。` : `已拒绝 ${p}。`, await O();
      } catch (i) {
        g.value = `操作失败：${(i == null ? void 0 : i.message) ?? String(i)}`;
      } finally {
        x.value = !1;
      }
    }
    function Q(p) {
      if (!p) return "—";
      const d = new Date(p);
      return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: !1 });
    }
    function P(p) {
      const d = [p.collectionScope ?? p.responseMode ?? "—"];
      return p.backgroundParticipation && p.backgroundParticipation !== "off" && d.push(`后台:${p.backgroundParticipation}`), d.join(" · ");
    }
    return ne(O), (p, d) => (t(), s("div", null, [
      e("div", al, [
        d[4] || (d[4] = e("div", null, [
          e("h2", null, "名单"),
          e("div", { class: "sub" }, "私聊用户与群聊白名单的统一管理；陌生人的申请在此审批。写操作经配置中心管线持久化到 koishi.yml。")
        ], -1)),
        e("div", sl, [
          e("span", {
            class: E(["chip", { off: !v.value }])
          }, a(v.value ? "OneBot 白名单：启用" : "OneBot 白名单：未启用（全部放行）"), 3),
          e("span", ll, "管理员 " + a(r.value.length || "（全部授权用户）"), 1),
          e("span", nl, [
            V("主动消息：" + a(C.value), 1),
            h.value.length ? (t(), s(N, { key: 0 }, [
              V("（" + a(h.value.length) + "）", 1)
            ], 64)) : k("", !0)
          ])
        ])
      ]),
      e("div", ol, [
        e("button", {
          class: E({ on: f.value === "requests" }),
          onClick: d[0] || (d[0] = (i) => f.value = "requests")
        }, [
          d[5] || (d[5] = V("申请", -1)),
          q.value.length ? (t(), s("span", il, a(q.value.length), 1)) : k("", !0)
        ], 2),
        e("button", {
          class: E({ on: f.value === "users" }),
          onClick: d[1] || (d[1] = (i) => f.value = "users")
        }, "私聊用户（" + a(m.value.length) + "）", 3),
        e("button", {
          class: E({ on: f.value === "groups" }),
          onClick: d[2] || (d[2] = (i) => f.value = "groups")
        }, "群聊（" + a(b.value.length) + "）", 3),
        d[6] || (d[6] = e("span", { class: "flex-fill" }, null, -1)),
        f.value === "users" ? ee((t(), s("input", {
          key: 0,
          class: "search",
          "onUpdate:modelValue": d[3] || (d[3] = (i) => A.value = i),
          placeholder: "搜索 QQ / 昵称 / 备注…"
        }, null, 512)), [
          [he, A.value]
        ]) : k("", !0),
        f.value === "users" ? (t(), s("button", {
          key: 1,
          onClick: j
        }, "+ 添加用户")) : k("", !0),
        f.value === "groups" ? (t(), s("button", {
          key: 2,
          onClick: c
        }, "+ 添加群")) : k("", !0),
        e("button", {
          class: "primary",
          disabled: !S.value || x.value,
          onClick: R
        }, a(x.value ? "保存中…" : S.value ? "保存名单" : "无变更"), 9, ul),
        e("button", { onClick: O }, "刷新")
      ]),
      g.value ? (t(), s("div", dl, a(g.value), 1)) : k("", !0),
      _.value ? (t(), s("div", rl, "读取失败：" + a(_.value), 1)) : k("", !0),
      o.value ? (t(), s("div", cl, "读取名单中……")) : f.value === "requests" ? (t(), s(N, { key: 3 }, [
        q.value.length ? (t(), s("div", fl, [
          d[7] || (d[7] = ue('<div class="thead" data-v-ee68f73a><div class="col qq" data-v-ee68f73a>QQ</div><div class="col name" data-v-ee68f73a>昵称</div><div class="col src" data-v-ee68f73a>来源</div><div class="col num" data-v-ee68f73a>尝试</div><div class="col time" data-v-ee68f73a>最近申请</div><div class="col note" data-v-ee68f73a>备注</div><div class="col ops" data-v-ee68f73a>操作</div></div>', 1)),
          (t(!0), s(N, null, H(q.value, (i) => (t(), s("div", {
            key: i.id,
            class: "trow"
          }, [
            e("div", hl, a(i.qq), 1),
            e("div", pl, a(i.displayName || "—"), 1),
            e("div", ml, a(i.source === "friend-request" ? "好友申请" : i.source === "private" ? "私聊" : i.source), 1),
            e("div", yl, a(i.attempts), 1),
            e("div", gl, a(Q(i.lastRequestAt)), 1),
            e("div", {
              class: "col note",
              title: i.note
            }, a(i.note || "—"), 9, bl),
            e("div", kl, [
              e("button", {
                class: "primary",
                disabled: x.value,
                onClick: (ae) => I(i.qq, !0)
              }, "授权", 8, _l),
              e("button", {
                disabled: x.value,
                onClick: (ae) => I(i.qq, !1)
              }, "拒绝", 8, $l)
            ])
          ]))), 128))
        ])) : (t(), s("div", vl, "没有待审批申请。陌生人的私聊与好友申请会自动出现在这里。")),
        e("details", wl, [
          e("summary", null, "历史记录（" + a(w.value.length - q.value.length) + " 条已处理）", 1),
          e("div", Cl, [
            (t(!0), s(N, null, H(w.value.filter((i) => i.status !== "pending"), (i) => (t(), s("div", {
              key: i.id,
              class: "trow"
            }, [
              e("div", Sl, a(i.qq), 1),
              e("div", xl, a(i.displayName || "—"), 1),
              e("div", Ml, [
                e("span", {
                  class: E(["tag", i.status])
                }, a(i.status === "approved" ? "已通过" : "已拒绝"), 3)
              ]),
              e("div", ql, a(i.attempts), 1),
              e("div", Il, a(Q(i.decidedAt || i.lastRequestAt)), 1),
              e("div", {
                class: "col note",
                title: i.note
              }, a(i.note || "—"), 9, Tl),
              e("div", Pl, [
                i.status !== "approved" ? (t(), s("button", {
                  key: 0,
                  class: "primary",
                  disabled: x.value,
                  onClick: (ae) => I(i.qq, !0)
                }, "改为授权", 8, Nl)) : k("", !0)
              ])
            ]))), 128))
          ])
        ])
      ], 64)) : f.value === "users" ? (t(), s(N, { key: 4 }, [
        e("div", Al, [
          d[8] || (d[8] = ue('<div class="thead" data-v-ee68f73a><div class="col qq" data-v-ee68f73a>QQ</div><div class="col name" data-v-ee68f73a>称呼 / 昵称</div><div class="col st" data-v-ee68f73a>私聊</div><div class="col st" data-v-ee68f73a>主动</div><div class="col time" data-v-ee68f73a>最近活跃</div><div class="col time" data-v-ee68f73a>加入</div><div class="col ops" data-v-ee68f73a>操作</div></div>', 1)),
          (t(!0), s(N, null, H(B.value, (i, ae) => (t(), s("div", {
            key: i.qq,
            class: E(["trow", { off: !i.enabled }])
          }, [
            e("div", Ol, [
              V(a(i.qq), 1),
              i.pendingRequest ? (t(), s("span", Vl, "申请")) : k("", !0)
            ]),
            e("div", Dl, [
              ee(e("input", {
                "onUpdate:modelValue": ($) => i.label = $,
                placeholder: "称呼（留空用平台昵称）",
                onInput: T
              }, null, 40, jl), [
                [he, i.label]
              ]),
              i.displayName && i.displayName !== i.label ? (t(), s("div", Ll, a(i.displayName), 1)) : k("", !0)
            ]),
            e("div", El, [
              ee(e("input", {
                type: "checkbox",
                "onUpdate:modelValue": ($) => i.enabled = $,
                onChange: T
              }, null, 40, Ul), [
                [pe, i.enabled]
              ])
            ]),
            e("div", Rl, [
              ee(e("input", {
                type: "checkbox",
                "onUpdate:modelValue": ($) => i.proactive = $,
                onChange: T
              }, null, 40, Bl), [
                [pe, i.proactive]
              ])
            ]),
            e("div", Fl, a(i.lastActiveAt ? Q(i.lastActiveAt) : "未入组"), 1),
            e("div", zl, a(Q(i.joinedAt)), 1),
            e("div", Jl, [
              e("button", {
                onClick: ($) => n(ae)
              }, "移除", 8, Hl)
            ])
          ], 2))), 128))
        ]),
        d[9] || (d[9] = e("div", { class: "hint-line" }, "称呼与档案的完整编辑（profile / relationship / personId）请到 配置中心 → QQ 接入；本页覆盖开关、称呼与增删。", -1))
      ], 64)) : (t(), s(N, { key: 5 }, [
        b.value.length ? (t(), s("div", Kl, [
          d[10] || (d[10] = ue('<div class="thead" data-v-ee68f73a><div class="col qq" data-v-ee68f73a>群号</div><div class="col name" data-v-ee68f73a>备注</div><div class="col st" data-v-ee68f73a>启用</div><div class="col mode" data-v-ee68f73a>模式</div><div class="col time" data-v-ee68f73a>用途</div><div class="col ops" data-v-ee68f73a>操作</div></div>', 1)),
          (t(!0), s(N, null, H(b.value, (i, ae) => (t(), s("div", {
            key: i.groupId,
            class: E(["trow", { off: !i.enabled }])
          }, [
            e("div", Wl, a(i.groupId), 1),
            e("div", Gl, [
              ee(e("input", {
                "onUpdate:modelValue": ($) => i.label = $,
                placeholder: "群备注",
                onInput: T
              }, null, 40, Yl), [
                [he, i.label]
              ])
            ]),
            e("div", Xl, [
              ee(e("input", {
                type: "checkbox",
                "onUpdate:modelValue": ($) => i.enabled = $,
                onChange: T
              }, null, 40, Zl), [
                [pe, i.enabled]
              ])
            ]),
            e("div", en, a(P(i)), 1),
            e("div", {
              class: "col time ellip",
              title: i.purpose
            }, a(i.purpose || "—"), 9, tn),
            e("div", an, [
              e("button", {
                onClick: ($) => l(ae)
              }, "移除", 8, sn)
            ])
          ], 2))), 128))
        ])) : (t(), s("div", Ql, '还没有启用任何群聊。添加群号后，默认"仅@触发 + 定向采集"。')),
        d[11] || (d[11] = e("div", { class: "hint-line" }, "群规则的高级维度（意愿档位、冷却、表情包采集等）请到 配置中心 → QQ 接入 → 群聊白名单。", -1))
      ], 64))
    ]));
  }
}), nn = /* @__PURE__ */ Y(ln, [["__scopeId", "data-v-ee68f73a"]]), on = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: nn
}, Symbol.toStringTag, { value: "Module" }));
export {
  cn as default
};
