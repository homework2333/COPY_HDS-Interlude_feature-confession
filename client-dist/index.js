import { defineComponent as ee, h as de, defineAsyncComponent as se, computed as H, ref as y, onUnmounted as ue, onMounted as ne, resolveComponent as ie, openBlock as t, createBlock as G, withCtx as ve, createElementVNode as e, createElementBlock as a, Fragment as D, renderList as W, createVNode as j, normalizeClass as T, createTextVNode as N, toDisplayString as o, createCommentVNode as k, resolveDynamicComponent as $e, useId as ge, withKeys as re, withModifiers as ce, unref as oe, normalizeStyle as we, nextTick as Ce, withDirectives as Z, vModelText as fe, reactive as Se, vModelCheckbox as he, createStaticVNode as pe, vModelSelect as ye } from "vue";
import { send as Q, icons as xe, SchemaBase as qe, Schema as Me } from "@koishijs/client";
import { useRoute as Ie, onBeforeRouteLeave as be, onBeforeRouteUpdate as ke } from "vue-router";
const K = {
  /** 拉取 hdsi-overview DataService 快照。 */
  async overview() {
    return Q("hdsi-overview/get");
  },
  /** 读取一节配置（authority=1）。无活跃故事时 story 节返回空 values。 */
  async readConfig(n) {
    return Q("hdsi/config/read", n);
  },
  /** 提交一节配置（authority=3）。白名单外的键由服务端静默忽略。 */
  async saveConfig(n, c) {
    return Q("hdsi/config/save", { section: n, values: c });
  },
  /** 配置中心：读取菜单树（无参）或某开放节（authority=1）。 */
  async readConfigCenter(n) {
    return n ? Q("hdsi/config-center/read", n) : Q("hdsi/config-center/read");
  },
  /** 配置中心：按节提交 patch（authority=3）——服务端合并、预校验后
   * scope.update 持久化写回 koishi.yml 并热更新。 */
  async saveConfigCenter(n, c, i = {}) {
    return Q("hdsi/config-center/save", { section: n, patch: c, ...i });
  },
  /** 通信动作只读视图：账本/计划派生的动作列表（authority=1，游标分页）。 */
  async actionsList(n, c = 20) {
    return Q("hdsi/actions/list", { cursor: n, limit: c });
  },
  /** 通信动作详情（按动作 ID 惰性读取，含分段与原文摘录）。 */
  async actionDetail(n) {
    return Q("hdsi/actions/get", { id: n });
  },
  /** 取消未来计划/未执行分段（authority=3；服务端幂等）。 */
  async cancelAction(n) {
    return Q("hdsi/actions/cancel", { id: n });
  },
  /** unknown 分段人工核实（authority=3）。 */
  async verifyAction(n, c) {
    return Q("hdsi/actions/verify", { id: n, outcome: c });
  },
  /** 运维套件：调试事件流（最近事件 + 统计；authority=1，2s 轮询）。 */
  async opsRecent(n = 200) {
    return Q("hdsi/ops/recent", { limit: n });
  },
  /** 名单页合并视图（authority=1）。 */
  async listsRead() {
    return Q("hdsi/lists/read");
  },
  /** 保存私聊用户/群聊白名单（authority=3，经配置中心管线持久化）。 */
  async listsSave(n) {
    return Q("hdsi/lists/save", n);
  },
  /** 审批白名单申请（authority=3）。 */
  async listsDecide(n, c, i) {
    return Q("hdsi/lists/decide", { qq: n, approve: c, note: i });
  },
  /** 日报预览（authority=3）。 */
  async opsReport(n) {
    return Q("hdsi/ops/report", { date: n });
  }
}, me = {
  overview: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zm0 6a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z",
  desk: "M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zm9.1 15.6L15.5 15.5M7.5 10.5h6M10.5 7.5v6",
  density: "M4 20v-6M9.3 20V9M14.6 20V4M20 20v-9",
  config: "M4 7.5h7M15 7.5h5M15 4.5v6M4 16.5h3M11 16.5h9M9 13.5v6",
  actions: "M4 5h16v11H9l-5 4V5zm4 4h8M8 12h5",
  center: "M4 7h4.5M11.5 7H20M4 17h9.5M16.5 17H20M7.2 4.4v5.2M13.2 14.4v5.2",
  debug: "M5 5h14v14H5zM8.5 9h7M8.5 12.5h4.5M8.5 16h6",
  lists: "M9 5.5h11M9 12h11M9 18.5h11M4.2 5.5h.01M4.2 12h.01M4.2 18.5h.01"
}, Pe = ee({
  name: "IconSet",
  props: { name: { type: String, required: !0 } },
  render() {
    return de("path", { d: me[this.name] ?? me.overview });
  }
}), Ne = { class: "hdsi-host-title" }, Ae = { class: "hdsi-shell" }, Oe = { class: "topbar" }, Ve = { class: "tabs" }, De = {
  class: "glyph",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "1.7",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
  "aria-hidden": "true"
}, je = { class: "main" }, Le = {
  key: 0,
  class: "notice info"
}, Ee = {
  key: 1,
  class: "notice warn"
}, Te = {
  key: 0,
  class: "snapshot-actions"
}, Re = {
  key: 0,
  class: "notice warn"
}, Ue = ["disabled"], Be = /* @__PURE__ */ ee({
  name: "HdsiApp",
  __name: "HdsiApp",
  setup(n) {
    const c = [
      { id: "overview", path: "/hdsi/overview", label: "概览", group: "运行", icon: "overview", component: se(() => Promise.resolve().then(() => rt)) },
      { id: "config-center", path: "/hdsi/config-center", label: "配置中心", group: "配置", icon: "center", component: se(() => Promise.resolve().then(() => Ot)) },
      { id: "config", path: "/hdsi/config", label: "当前故事", group: "配置", icon: "config", component: se(() => Promise.resolve().then(() => ta)) },
      { id: "desk", path: "/hdsi/desk", label: "考据案头", group: "观测", icon: "desk", component: se(() => Promise.resolve().then(() => ra)) },
      { id: "actions", path: "/hdsi/actions", label: "通信动作", group: "观测", icon: "actions", component: se(() => Promise.resolve().then(() => ja)) },
      { id: "density", path: "/hdsi/density", label: "上下文预算", group: "观测", icon: "density", component: se(() => Promise.resolve().then(() => Ja)) },
      { id: "debug", path: "/hdsi/debug", label: "调试", group: "观测", icon: "debug", component: se(() => Promise.resolve().then(() => yl)) },
      { id: "lists", path: "/hdsi/lists", label: "名单", group: "配置", icon: "lists", component: se(() => Promise.resolve().then(() => _s)) }
    ], i = Ie(), _ = H(() => {
      const w = i.params.page, x = Array.isArray(w) ? w[0] : w;
      return c.some((m) => m.id === x) ? x : "overview";
    }), h = H(() => !["config", "config-center", "actions", "debug", "lists"].includes(_.value)), g = y(null), $ = y(!0), r = y("");
    let u = 0, C = !1;
    ue(() => {
      C = !0, u++;
    });
    async function f() {
      if (C) return;
      const w = ++u, x = () => !C && w === u;
      $.value = !0, r.value = "";
      try {
        const m = await K.overview();
        if (!x()) return;
        if (!m) throw new Error("Console 连接尚未就绪，请重试。");
        g.value = m;
      } catch (m) {
        x() && (r.value = (m == null ? void 0 : m.message) ?? String(m));
      } finally {
        x() && ($.value = !1);
      }
    }
    return ne(f), (w, x) => {
      const m = ie("router-link"), A = ie("k-layout");
      return t(), G(A, { main: "hdsi-layout" }, {
        header: ve(() => {
          var M;
          return [
            e("span", Ne, [
              x[0] || (x[0] = N("HDSI ", -1)),
              e("small", null, o(((M = g.value) == null ? void 0 : M.version) ?? "写作工作台"), 1)
            ])
          ];
        }),
        default: ve(() => [
          e("div", Ae, [
            e("header", Oe, [
              e("nav", Ve, [
                (t(), a(D, null, W(c, (M) => j(m, {
                  key: M.id,
                  to: M.path,
                  class: T(["tab", { on: _.value === M.id }])
                }, {
                  default: ve(() => [
                    (t(), a("svg", De, [
                      j(Pe, {
                        name: M.icon
                      }, null, 8, ["name"])
                    ])),
                    N(" " + o(M.label), 1)
                  ]),
                  _: 2
                }, 1032, ["to", "class"])), 64))
              ])
            ]),
            e("main", je, [
              h.value && !g.value ? (t(), a(D, { key: 0 }, [
                $.value ? (t(), a("div", Le, "正在连接 HDSI 数据服务……")) : (t(), a("div", Ee, [
                  N(" 数据服务不可用：" + o(r.value) + " ", 1),
                  e("button", {
                    class: "refresh",
                    onClick: f
                  }, "重试")
                ]))
              ], 64)) : (t(), a(D, { key: 1 }, [
                h.value ? (t(), a("div", Te, [
                  r.value ? (t(), a("span", Re, "刷新失败：" + o(r.value) + "，当前展示上次快照。", 1)) : k("", !0),
                  e("button", {
                    class: "refresh",
                    disabled: $.value,
                    onClick: f
                  }, o($.value ? "刷新中……" : "刷新概览"), 9, Ue)
                ])) : k("", !0),
                (t(), G($e(c.find((M) => M.id === _.value).component), { overview: g.value }, null, 8, ["overview"]))
              ], 64))
            ])
          ])
        ]),
        _: 1
      });
    };
  }
}), Y = (n, c) => {
  const i = n.__vccOpts || n;
  for (const [_, h] of c)
    i[_] = h;
  return i;
}, ze = /* @__PURE__ */ Y(Be, [["__scopeId", "data-v-614f4742"]]);
function Ss(n) {
  xe.register("hdsi", {
    render: () => de("svg", {
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
      de("rect", { x: "4", y: "4", width: "10", height: "10", transform: "rotate(45 9 9)" }),
      de("path", { d: "M20 11v9h-9" }),
      de("circle", { cx: "20", cy: "8", r: "2" })
    ])
  }), n.page({
    id: "hdsi",
    path: "/hdsi/:page*",
    name: "HDS Interlude",
    icon: "hdsi",
    order: 600,
    component: ze
  });
}
const Je = ["aria-expanded", "aria-describedby", "onKeydown"], Fe = ["id"], He = { key: 0 }, Qe = {
  key: 1,
  class: "tip-range"
}, Ke = /* @__PURE__ */ ee({
  name: "InfoDot",
  __name: "InfoDot",
  props: {
    info: {},
    range: {}
  },
  setup(n) {
    const c = y(!1), i = y(null), _ = ge();
    let h = 0;
    ne(() => {
      typeof window < "u" && window.addEventListener("scroll", r, !0);
    }), ue(() => {
      typeof window < "u" && window.removeEventListener("scroll", r, !0);
    });
    const g = y({ left: "0px", top: "0px", maxWidth: "320px" });
    async function $(u) {
      const f = u.currentTarget.getBoundingClientRect(), w = Math.min(320, window.innerWidth - 32), x = window.innerHeight - f.bottom > 140;
      g.value = {
        left: `${Math.max(16, Math.min(f.left, window.innerWidth - w - 16))}px`,
        top: `${x ? f.bottom + 8 : Math.max(16, f.top - 140)}px`,
        maxWidth: `${w}px`
      }, c.value = !0;
      const m = ++h;
      if (await Ce(), !c.value || m !== h || !i.value) return;
      const A = i.value.getBoundingClientRect().height;
      g.value.top = `${Math.max(8, Math.min(Number.parseFloat(g.value.top), window.innerHeight - A - 8))}px`;
    }
    function r() {
      c.value = !1, h++;
    }
    return (u, C) => (t(), a("button", {
      type: "button",
      class: "info-dot",
      "aria-label": "查看说明（悬停或按住）",
      "aria-expanded": c.value,
      "aria-describedby": c.value ? oe(_) : void 0,
      onMouseenter: $,
      onMouseleave: r,
      onPointerdown: ce($, ["stop"]),
      onPointerup: r,
      onPointercancel: r,
      onFocus: $,
      onBlur: r,
      onClick: ce(r, ["stop"]),
      onKeydown: [
        re(r, ["esc"]),
        re(ce($, ["prevent"]), ["space"]),
        re(ce($, ["prevent"]), ["enter"])
      ],
      onKeyup: [
        re(r, ["space"]),
        re(r, ["enter"])
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
      c.value ? (t(), a("span", {
        key: 0,
        id: oe(_),
        ref_key: "tooltip",
        ref: i,
        class: "hdsi-tip",
        role: "tooltip",
        style: we(g.value)
      }, [
        n.info ? (t(), a("span", He, o(n.info), 1)) : k("", !0),
        n.range ? (t(), a("span", Qe, "范围：" + o(n.range), 1)) : k("", !0)
      ], 12, Fe)) : k("", !0)
    ], 40, Je));
  }
}), _e = /* @__PURE__ */ Y(Ke, [["__scopeId", "data-v-d68b18ae"]]), We = {
  name: "DataRow",
  components: { InfoDot: _e },
  props: {
    label: { type: String, required: !0 },
    value: { type: [String, Number, Boolean], default: "—" },
    state: { type: String, default: "" },
    // 'ok' | 'warn' | 'acc'
    info: { type: String, default: "" },
    range: { type: String, default: "" }
  }
}, Ge = { class: "row" }, Ye = { class: "k" };
function Xe(n, c, i, _, h, g) {
  const $ = ie("InfoDot");
  return t(), a("div", Ge, [
    e("span", Ye, [
      N(o(i.label) + " ", 1),
      i.info || i.range ? (t(), G($, {
        key: 0,
        info: i.info,
        range: i.range
      }, null, 8, ["info", "range"])) : k("", !0)
    ]),
    e("span", {
      class: T(["v", i.state || void 0])
    }, o(i.value), 3)
  ]);
}
const V = /* @__PURE__ */ Y(We, [["render", Xe], ["__scopeId", "data-v-4e9413bc"]]), Ze = { key: 0 }, et = {
  key: 0,
  class: "notice info"
}, tt = {
  key: 1,
  class: "notice"
}, at = { class: "grid" }, lt = { class: "card" }, st = { class: "card" }, nt = { class: "card" }, ot = { class: "card" }, it = /* @__PURE__ */ ee({
  name: "OverviewPage",
  __name: "OverviewPage",
  props: {
    overview: {}
  },
  setup(n) {
    const c = n, i = { active: "活动中", paused: "已暂停", archived: "已归档" }, _ = { asleep: "睡眠", resting: "休息", occupied: "忙碌", available: "空闲", normal: "日常", active: "活跃", "phone-focused": "关注消息", focused: "专注" }, h = H(() => {
      var r, u, C, f;
      return _[(u = (r = c.overview) == null ? void 0 : r.story) == null ? void 0 : u.rhythm] ?? ((f = (C = c.overview) == null ? void 0 : C.story) == null ? void 0 : f.rhythm) ?? "未建立";
    }), g = { main: "主叙事", compaction: "记忆整理", timeline: "时间导演", alter: "情绪分析", embedding: "向量检索", stickers: "表情包描述", vision: "视觉理解", research: "考据检索" }, $ = {
      allowProactiveMessages: "主角可主动发起可见消息（非回复式）",
      urge: "依据生活节奏和对话密度安排后台补写；人物是否联系他人由主叙事形成动作",
      sceneConditions: "设备、隐私和负荷的有效场景证据；缺失或过期时显示未知",
      deliveryPolicy: "管理员设置的主动出站运行额度和间隔；人物动机由主叙事决定",
      research: "考据 Agent：人物形成查证动作后，后台核实并写入考据案头，供后续写作参考",
      jev: "生活推进前的外部考据判定；命中时先检索资料，再继续写作"
    };
    return (r, u) => {
      var C;
      return n.overview ? (t(), a("div", Ze, [
        u[6] || (u[6] = e("div", { class: "pg-head" }, [
          e("div", null, [
            e("h2", null, "概览"),
            e("div", { class: "sub" }, "当前故事 · 模型用途 · 运行边界 · 考据状态")
          ])
        ], -1)),
        (C = n.overview.story) != null && C.found ? (t(), a("div", et, [
          e("b", null, o(n.overview.story.characterName), 1),
          N(" · " + o(i[n.overview.story.status] ?? n.overview.story.status) + " · 当前节奏 " + o(h.value) + "。剧情时间 ", 1),
          e("code", null, o(n.overview.story.cursorLocal), 1),
          u[0] || (u[0] = N("，共 ", -1)),
          e("b", null, o(n.overview.story.entryCount), 1),
          u[1] || (u[1] = N(" 条剧本记录。 ", -1))
        ])) : (t(), a("div", tt, "当前还没有故事。先在配置中心填写故事档案和模型，再从聊天启动故事。")),
        e("div", at, [
          e("div", lt, [
            u[2] || (u[2] = e("h3", null, [
              e("span", { class: "sq" }),
              N("故事状态")
            ], -1)),
            j(V, {
              label: "主角",
              value: n.overview.story.characterName || "—",
              info: "主角姓名，出现在全部叙事中",
              range: "任意非空中文/英文"
            }, null, 8, ["value"]),
            j(V, {
              label: "关系人数",
              value: n.overview.story.participantCount,
              info: "已登记的参与者（跨会话共享同一故事）"
            }, null, 8, ["value"]),
            j(V, {
              label: "故事状态",
              value: i[n.overview.story.status] ?? n.overview.story.status,
              state: n.overview.story.status === "active" ? "ok" : "",
              info: "active=活动 / paused=暂停 / archived=归档"
            }, null, 8, ["value", "state"]),
            j(V, {
              label: "节奏",
              value: h.value,
              state: "acc",
              info: "主角当前的生活节奏/注意力，由时间与近况推得"
            }, null, 8, ["value"])
          ]),
          e("div", st, [
            u[3] || (u[3] = e("h3", null, [
              e("span", { class: "sq" }),
              N("模型连接")
            ], -1)),
            (t(!0), a(D, null, W(n.overview.models, (f) => (t(), G(V, {
              key: f.task,
              label: g[f.task] ?? f.task,
              value: `${f.provider} · ${f.model}`,
              state: f.available ? "ok" : f.reason === "disabled" ? "" : "warn",
              info: "按模型中心的用途配置解析出的连接与模型；该状态表示配置匹配，不表示网络探活成功"
            }, null, 8, ["label", "value", "state"]))), 128))
          ]),
          e("div", nt, [
            u[4] || (u[4] = e("h3", null, [
              e("span", { class: "sq" }),
              N("系统开关")
            ], -1)),
            (t(!0), a(D, null, W(n.overview.switches, (f) => (t(), G(V, {
              key: f.key,
              label: f.label,
              value: f.value,
              state: f.ok === !0 ? "ok" : f.ok === !1 ? "warn" : "",
              info: $[f.key]
            }, null, 8, ["label", "value", "state", "info"]))), 128))
          ]),
          e("div", ot, [
            u[5] || (u[5] = e("h3", null, [
              e("span", { class: "sq" }),
              N("考据 Agent")
            ], -1)),
            j(V, {
              label: "状态",
              value: n.overview.research.enabled ? "开启" : "关闭",
              state: n.overview.research.enabled ? "ok" : "",
              info: "考据总开关，可在配置中心的「考据 Agent」中修改"
            }, null, 8, ["value", "state"]),
            j(V, {
              label: "搜索后端",
              value: n.overview.research.backend,
              state: "acc",
              info: "考据检索的网络后端",
              range: "auto/tavily/bocha/searxng/duckduckgo-html"
            }, null, 8, ["value"]),
            j(V, {
              label: "案头条目",
              value: n.overview.research.deskEntries,
              info: "在架的核实事实数（稳定+易变，TTL 过期淘汰）",
              range: "案头容量 2-32"
            }, null, 8, ["value"]),
            j(V, {
              label: "写入 / 复用",
              value: `${n.overview.research.counters.offered} / ${n.overview.research.counters.reused}`,
              info: "累计写入案头 / 复用已有条目（重载归零）"
            }, null, 8, ["value"]),
            j(V, {
              label: "Jev 门控",
              value: n.overview.research.jev.enabled ? n.overview.research.jev.keyConfigured ? `判定 ${n.overview.research.jev.calls} / 触发 ${n.overview.research.jev.triggered}` : "已开启 · 待配置密钥" : "未启用",
              state: n.overview.research.jev.enabled ? n.overview.research.jev.keyConfigured ? "ok" : "warn" : "",
              info: "判定=门控调用次数，触发=判定 TRUE 放行先查后写"
            }, null, 8, ["value", "state"])
          ])
        ])
      ])) : k("", !0);
    };
  }
}), ut = /* @__PURE__ */ Y(it, [["__scopeId", "data-v-870eac41"]]), rt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ut
}, Symbol.toStringTag, { value: "Module" })), dt = { class: "cc" }, ct = ["disabled"], vt = {
  key: 1,
  class: "hint"
}, ft = { class: "layout" }, ht = {
  class: "menu",
  "aria-label": "配置分类"
}, pt = { class: "search" }, yt = {
  key: 0,
  class: "menu-summary"
}, mt = { class: "group" }, gt = ["aria-current", "disabled", "onClick"], bt = {
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
}, xt = ["disabled"], qt = ["disabled"], Mt = ["disabled"], It = {
  key: 2,
  class: "hint"
}, Pt = {
  key: 3,
  class: "hint"
}, Nt = /* @__PURE__ */ ee({
  name: "ConfigCenterPage",
  __name: "ConfigCenterPage",
  props: {
    overview: {}
  },
  setup(n) {
    const c = {
      blindMode: ["enabled"]
    }, i = y(""), _ = y([]), h = y(""), g = y(null), $ = y(null), r = y({}), u = y({}), C = y([]), f = y(!1), w = y(!1), x = y(!1), m = y(!1), A = y(""), M = y("ok"), z = y("");
    let R = 0, O = !1;
    ue(() => {
      O = !0, R++;
    });
    const L = H(() => _.value.flatMap((b) => b.sections.filter((q) => q.stage === 1))), p = H(() => z.value === h.value && JSON.stringify(r.value) !== JSON.stringify(u.value)), S = H(() => _.value.map((b) => ({ ...b, sections: b.sections.filter((q) => `${q.label} ${q.id} ${q.description}`.toLowerCase().includes(i.value.trim().toLowerCase())) })).filter((b) => b.sections.length)), v = () => !p.value || window.confirm("配置中心有未保存的修改。离开此页面？");
    be(v), ke((b, q) => b.path === q.path || v());
    async function J(b) {
      b === h.value || m.value || p.value && !window.confirm("本节有尚未保存的修改。切换配置节将重新读取，继续切换？") || await s(b);
    }
    async function I() {
      f.value || m.value || !h.value || p.value && !window.confirm("重新读取将以已保存配置替换本节的未保存修改。继续？") || await s(h.value);
    }
    function F(b, q, E = "") {
      return Object.keys(b).flatMap((B) => {
        const X = E ? `${E}.${B}` : B;
        if (!(B in q)) return [X];
        const U = b[B], te = q[B];
        return U && te && typeof U == "object" && typeof te == "object" && !Array.isArray(U) && !Array.isArray(te) ? F(U, te, X) : [];
      });
    }
    function P(b) {
      for (const q of _.value) {
        const E = q.sections.find((B) => B.id === b);
        if (E) return E;
      }
    }
    async function d() {
      if (!(O || w.value)) {
        w.value = !0, x.value = !1, A.value = "";
        try {
          const b = await K.readConfigCenter();
          if (O) return;
          if (!(b != null && b.ok) || !Array.isArray(b.menu)) throw new Error((b == null ? void 0 : b.error) ?? "菜单读取失败");
          _.value = b.menu;
          const q = L.value.find((E) => E.id === "runtime") ?? L.value[0];
          q && await s(q.id);
        } catch (b) {
          O || (x.value = !0, A.value = `配置菜单读取失败：${(b == null ? void 0 : b.message) ?? String(b)}`, M.value = "warn");
        } finally {
          O || (w.value = !1);
        }
      }
    }
    async function s(b, q = !1) {
      const E = P(b);
      if (O || !E || E.stage !== 1) return;
      const B = ++R, X = () => !O && B === R && h.value === b;
      h.value = b, g.value = E, z.value = "", $.value = null, r.value = {}, u.value = {}, C.value = [], f.value = !0, q || (A.value = "");
      try {
        const U = await K.readConfigCenter(b);
        if (!X()) return;
        if (!U.ok) throw new Error(U.error ?? "读取失败");
        if (!U.schema) throw new Error("配置结构读取失败");
        $.value = new Me(U.schema);
        const te = U.values ?? {};
        r.value = JSON.parse(JSON.stringify(te)), u.value = JSON.parse(JSON.stringify(te)), C.value = U.maskedFields ?? [], z.value = b;
      } catch (U) {
        X() && (A.value = `${q ? "配置已保存，重新读取失败：" : ""}${(U == null ? void 0 : U.message) ?? String(U)}`, M.value = "warn");
      } finally {
        X() && (f.value = !1);
      }
    }
    function l() {
      return (c[h.value] ?? []).filter((q) => JSON.stringify(r.value[q]) !== JSON.stringify(u.value[q]));
    }
    async function ae(b = !1) {
      if (O || m.value || f.value || !h.value || z.value !== h.value) return;
      const q = h.value, E = R, B = () => !O && E === R && h.value === q, X = JSON.stringify(r.value), U = JSON.parse(X), te = l();
      if (!(te.length && !window.confirm(`本次保存将修改影响排障能力的字段：${te.join("、")}。
盲区模式开启后将关闭管理指令并隐藏运行日志，恢复需在 Koishi 配置中关闭该开关并重载。

确认继续？`))) {
        m.value = !0, A.value = "";
        try {
          const le = await K.saveConfigCenter(q, U, { reload: b, unset: F(u.value, U) });
          if (!B()) return;
          if (!le.ok) throw new Error(le.error ?? "未知错误");
          A.value = b ? "已保存，并已请求重载 HDSI。" : "已保存到 koishi.yml；配置更新已提交，插件将按需自动重载。", M.value = "ok", JSON.stringify(r.value) === X ? await s(q, !0) : u.value = JSON.parse(X);
        } catch (le) {
          B() && (A.value = `保存失败：${(le == null ? void 0 : le.message) ?? String(le)}`, M.value = "warn");
        } finally {
          O || (m.value = !1);
        }
      }
    }
    return ne(d), (b, q) => (t(), a("div", dt, [
      q[8] || (q[8] = e("div", { class: "pg-head" }, [
        e("div", null, [
          e("h2", null, "配置中心"),
          e("div", { class: "sub" }, "按用途管理故事档案、模型、上下文与运行能力。修改仅在保存后写入配置文件。")
        ])
      ], -1)),
      A.value ? (t(), a("div", {
        key: 0,
        class: T(["notice", M.value]),
        role: "status"
      }, [
        N(o(A.value) + " ", 1),
        x.value ? (t(), a("button", {
          key: 0,
          class: "save",
          disabled: w.value,
          onClick: d
        }, "重试", 8, ct)) : k("", !0)
      ], 2)) : k("", !0),
      w.value && !_.value.length ? (t(), a("div", vt, "读取配置菜单……")) : k("", !0),
      e("div", ft, [
        e("aside", ht, [
          e("label", pt, [
            q[5] || (q[5] = e("span", null, "查找配置", -1)),
            Z(e("input", {
              "onUpdate:modelValue": q[0] || (q[0] = (E) => i.value = E),
              type: "search",
              placeholder: "名称或字段，如 runtime",
              "aria-label": "查找配置节"
            }, null, 512), [
              [fe, i.value]
            ])
          ]),
          _.value.length ? (t(), a("div", yt, o(L.value.length) + " 个配置节 · 全部可编辑", 1)) : k("", !0),
          (t(!0), a(D, null, W(S.value, (E) => (t(), a(D, {
            key: E.id
          }, [
            e("div", mt, o(E.label), 1),
            (t(!0), a(D, null, W(E.sections, (B) => (t(), a("button", {
              key: B.id,
              type: "button",
              class: T(["item", { on: h.value === B.id }]),
              "aria-current": h.value === B.id ? "page" : void 0,
              disabled: m.value,
              onClick: (X) => J(B.id)
            }, o(B.label), 11, gt))), 128))
          ], 64))), 128)),
          i.value && !S.value.length ? (t(), a("div", bt, "没有匹配的配置节。")) : k("", !0)
        ]),
        e("main", kt, [
          f.value ? (t(), a("div", _t, "读取中……")) : g.value && $.value ? (t(), a("div", $t, [
            e("h3", null, [
              q[6] || (q[6] = e("span", { class: "sq" }, null, -1)),
              N(o(g.value.label), 1)
            ]),
            e("div", wt, [
              N(o(g.value.description), 1),
              C.value.length ? (t(), a(D, { key: 0 }, [
                N(" 密钥已隐藏，保持占位值可保留原密钥；填写新值可替换。")
              ], 64)) : k("", !0)
            ]),
            (t(), G(oe(qe).Form, {
              onSubmit: q[1] || (q[1] = ce(() => {
              }, ["prevent"])),
              key: z.value,
              inert: m.value || void 0,
              "aria-busy": m.value,
              schema: $.value,
              "model-value": r.value,
              initial: u.value,
              "onUpdate:modelValue": q[2] || (q[2] = (E) => r.value = E)
            }, null, 8, ["inert", "aria-busy", "schema", "model-value", "initial"])),
            e("div", Ct, [
              e("span", St, o(m.value ? "正在写入配置…" : p.value ? "有未保存的修改" : "与已读取配置一致"), 1),
              e("button", {
                class: "secondary",
                type: "button",
                disabled: m.value || f.value,
                onClick: I
              }, "重新读取", 8, xt),
              e("button", {
                class: "save",
                type: "button",
                disabled: m.value || f.value || z.value !== h.value,
                onClick: q[3] || (q[3] = (E) => ae(!1))
              }, o(m.value ? "保存中……" : "保存本节"), 9, qt),
              e("button", {
                class: "secondary",
                type: "button",
                disabled: m.value || f.value || z.value !== h.value,
                onClick: q[4] || (q[4] = (E) => ae(!0))
              }, "保存并重载", 8, Mt)
            ])
          ])) : !f.value && h.value ? (t(), a("div", It, [
            q[7] || (q[7] = N("本节读取失败。", -1)),
            e("button", {
              class: "secondary",
              onClick: I
            }, "重新读取")
          ])) : !f.value && _.value.length ? (t(), a("div", Pt, "选择配置节以查看和编辑。")) : k("", !0)
        ])
      ])
    ]));
  }
}), At = /* @__PURE__ */ Y(Nt, [["__scopeId", "data-v-10c1f819"]]), Ot = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: At
}, Symbol.toStringTag, { value: "Module" })), Vt = {
  name: "EditField",
  components: { InfoDot: _e },
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
    return { inputId: ge() };
  },
  data() {
    return { visible: !1 };
  },
  computed: {
    currentValue: {
      get() {
        return this.modelValue;
      },
      set(n) {
        this.$emit("update:modelValue", n);
      }
    }
  },
  methods: {
    onBool() {
      this.$emit("update:modelValue", !this.modelValue);
    }
  }
}, Dt = { class: "field" }, jt = ["for"], Lt = { class: "field-input" }, Et = ["id", "value", "placeholder"], Tt = ["id", "value"], Rt = ["value"], Ut = ["id", "aria-checked", "aria-label"], Bt = ["id", "value", "min", "max"], zt = ["id", "type", "value", "placeholder"];
function Jt(n, c, i, _, h, g) {
  const $ = ie("InfoDot");
  return t(), a("div", Dt, [
    e("label", {
      class: "field-label",
      for: _.inputId
    }, [
      N(o(i.label) + " ", 1),
      i.info || i.range ? (t(), G($, {
        key: 0,
        info: i.info,
        range: i.range
      }, null, 8, ["info", "range"])) : k("", !0)
    ], 8, jt),
    e("div", Lt, [
      i.textarea ? (t(), a("textarea", {
        key: 0,
        id: _.inputId,
        value: String(i.modelValue ?? ""),
        placeholder: i.placeholder,
        class: "input area",
        onInput: c[0] || (c[0] = (r) => n.$emit("update:modelValue", r.target.value))
      }, null, 40, Et)) : i.type === "select" ? (t(), a("select", {
        key: 1,
        id: _.inputId,
        value: String(i.modelValue),
        class: "input",
        onChange: c[1] || (c[1] = (r) => n.$emit("update:modelValue", r.target.value))
      }, [
        (t(!0), a(D, null, W(i.options, (r) => (t(), a("option", {
          key: r.value,
          value: r.value
        }, o(r.label), 9, Rt))), 128))
      ], 40, Tt)) : i.type === "boolean" ? (t(), a("button", {
        key: 2,
        id: _.inputId,
        type: "button",
        role: "switch",
        "aria-checked": !!i.modelValue,
        "aria-label": i.label,
        class: T(["toggle", { on: i.modelValue }]),
        onClick: c[2] || (c[2] = (...r) => g.onBool && g.onBool(...r))
      }, [...c[6] || (c[6] = [
        e("span", { class: "toggle-dot" }, null, -1)
      ])], 10, Ut)) : i.type === "number" ? (t(), a("input", {
        key: 3,
        id: _.inputId,
        type: "number",
        value: Number(i.modelValue),
        min: i.min,
        max: i.max,
        class: "input",
        onInput: c[3] || (c[3] = (r) => n.$emit("update:modelValue", Number(r.target.value)))
      }, null, 40, Bt)) : (t(), a("input", {
        key: 4,
        id: _.inputId,
        type: i.secret && !h.visible ? "password" : "text",
        value: String(i.modelValue ?? ""),
        placeholder: i.placeholder,
        class: "input",
        onInput: c[4] || (c[4] = (r) => n.$emit("update:modelValue", r.target.value))
      }, null, 40, zt)),
      i.secret ? (t(), a("button", {
        key: 5,
        type: "button",
        class: "reveal",
        onClick: c[5] || (c[5] = (r) => h.visible = !h.visible)
      }, o(h.visible ? "隐藏" : "显示"), 1)) : k("", !0)
    ])
  ]);
}
const Ft = /* @__PURE__ */ Y(Vt, [["render", Jt], ["__scopeId", "data-v-47b39beb"]]), Ht = {
  key: 1,
  class: "notice warn"
}, Qt = { class: "card" }, Kt = { class: "hint" }, Wt = {
  key: 0,
  class: "hint"
}, Gt = { class: "actions" }, Yt = ["disabled"], Xt = ["disabled"], Zt = /* @__PURE__ */ ee({
  name: "ConfigPage",
  __name: "ConfigPage",
  props: {
    overview: {}
  },
  setup(n) {
    const c = [
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
    ], i = y("story"), _ = () => c.find((L) => L.id === i.value), h = Se({}), g = y(!1), $ = y(!1), r = y(""), u = y("ok"), C = y(""), f = H(() => !!m.value && JSON.stringify(h) !== C.value), w = () => !f.value || window.confirm("当前故事有未保存的修改。离开此页面？");
    be(w), ke((L, p) => L.path === p.path || w());
    async function x() {
      f.value && !window.confirm("重新读取将使用服务器上的故事设定替换当前修改。继续？") || await z(i.value);
    }
    const m = y("");
    let A = 0, M = !1;
    ue(() => {
      M = !0, A++;
    });
    async function z(L) {
      var J;
      const p = c.find((I) => I.id === L);
      if (M || !p) return;
      const S = ++A, v = () => !M && S === A && i.value === L;
      i.value = L, m.value = "";
      for (const I of Object.keys(h)) delete h[I];
      g.value = !0, r.value = "";
      try {
        const I = await K.readConfig(L);
        if (!I) throw new Error("Console 连接尚未就绪");
        if (!I.ok) throw new Error(I.error ?? "读取失败");
        if (!v()) return;
        for (const F of p.fields) {
          const P = (J = I.values) == null ? void 0 : J[F.key];
          h[F.key] = F.type === "boolean" ? P === !0 : P ?? (F.type === "number" ? 0 : "");
        }
        C.value = JSON.stringify(h), m.value = L;
      } catch (I) {
        v() && (r.value = (I == null ? void 0 : I.message) ?? String(I), u.value = "warn");
      } finally {
        v() && (g.value = !1);
      }
    }
    async function R() {
      if (M || $.value || g.value || m.value !== i.value) return;
      const L = i.value, p = A, S = () => !M && p === A && i.value === L, v = {};
      for (const I of _().fields) v[I.key] = h[I.key];
      const J = JSON.parse(JSON.stringify(v));
      $.value = !0, r.value = "";
      try {
        const I = await K.saveConfig(L, J);
        if (!S()) return;
        if (!I.ok) throw new Error(I.error ?? "未知错误");
        C.value = JSON.stringify(J), r.value = `已写入 ${I.applied ?? 0} 项。${L === "story" ? "已保存到当前故事，后续写作立即使用。" : "已写入 koishi.yml，插件热更新生效。"}`, u.value = "ok";
      } catch (I) {
        S() && (r.value = `保存失败：${(I == null ? void 0 : I.message) ?? String(I)}`, u.value = "warn");
      } finally {
        M || ($.value = !1);
      }
    }
    const O = () => i.value === "story" && m.value === "story" && !h["character.name"] && !g.value;
    return ne(() => z("story")), (L, p) => {
      const S = ie("router-link");
      return t(), a("div", null, [
        p[2] || (p[2] = e("div", { class: "pg-head" }, [
          e("div", null, [
            e("h2", null, "当前故事"),
            e("div", { class: "sub" }, "编辑当前故事的设定，保存到故事数据库。新故事的默认档案在配置中心设置。")
          ])
        ], -1)),
        j(S, {
          to: "/hdsi/config-center",
          class: "redirect-card"
        }, {
          default: ve(() => [...p[0] || (p[0] = [
            N("模型、上下文预算、运行时与考据设置 → 配置中心", -1)
          ])]),
          _: 1
        }),
        r.value ? (t(), a("div", {
          key: 0,
          class: T(["notice", u.value]),
          role: "status"
        }, o(r.value), 3)) : k("", !0),
        O() ? (t(), a("div", Ht, "当前没有活跃故事——先在聊天里用 interlude.story.start 启动，再回来编辑故事设定。")) : k("", !0),
        e("div", Qt, [
          e("h3", null, [
            p[1] || (p[1] = e("span", { class: "sq" }, null, -1)),
            N(o(_().label), 1)
          ]),
          e("div", Kt, o(_().hint), 1),
          g.value ? (t(), a("div", Wt, "读取中……")) : m.value === i.value && !O() ? (t(), a(D, { key: 1 }, [
            (t(!0), a(D, null, W(_().fields, (v) => (t(), G(Ft, {
              key: v.key,
              modelValue: h[v.key],
              "onUpdate:modelValue": (J) => h[v.key] = J,
              label: v.label,
              type: v.type,
              options: v.options,
              info: v.info,
              range: v.range,
              min: v.min,
              max: v.max,
              textarea: v.textarea,
              secret: v.secret,
              placeholder: v.placeholder
            }, null, 8, ["modelValue", "onUpdate:modelValue", "label", "type", "options", "info", "range", "min", "max", "textarea", "secret", "placeholder"]))), 128)),
            e("div", Gt, [
              e("button", {
                class: "refresh",
                disabled: g.value || $.value,
                onClick: x
              }, "重新读取", 8, Yt),
              e("button", {
                class: "save",
                disabled: $.value || g.value || m.value !== i.value,
                onClick: R
              }, o($.value ? "写入中……" : "保存故事设定"), 9, Xt)
            ])
          ], 64)) : (t(), a("button", {
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
}, Symbol.toStringTag, { value: "Module" })), aa = { key: 0 }, la = { class: "grid" }, sa = { class: "card" }, na = { class: "card" }, oa = {
  key: 0,
  class: "notice info",
  style: { "margin-top": "8px" }
}, ia = /* @__PURE__ */ ee({
  name: "DeskPage",
  __name: "DeskPage",
  props: {
    overview: {}
  },
  setup(n) {
    return (c, i) => n.overview ? (t(), a("div", aa, [
      i[2] || (i[2] = e("div", { class: "pg-head" }, [
        e("div", null, [
          e("h2", null, "考据案头"),
          e("div", { class: "sub" }, "经核实的写作参考；资料可供作者使用，主角知情范围由剧情证据决定。")
        ])
      ], -1)),
      e("div", la, [
        e("div", sa, [
          i[0] || (i[0] = e("h3", null, [
            e("span", { class: "sq" }),
            N("案头概况")
          ], -1)),
          j(V, {
            label: "在架条目",
            value: n.overview.research.deskEntries,
            info: "在架的核实事实数（稳定+易变，TTL 过期淘汰）",
            range: "案头容量 2-32，默认 8"
          }, null, 8, ["value"]),
          j(V, {
            label: "搜索后端",
            value: n.overview.research.backend,
            state: "acc",
            info: "考据检索的网络后端",
            range: "auto/tavily/bocha/searxng/duckduckgo-html"
          }, null, 8, ["value"]),
          j(V, {
            label: "查询缓存",
            value: `${n.overview.research.cache.size} 条（命中 ${n.overview.research.cache.hits} / 未命中 ${n.overview.research.cache.misses}）`,
            info: "搜索查询结果缓存——命中可省一次网络检索"
          }, null, 8, ["value"]),
          j(V, {
            label: "累计写入 / 复用 / 淘汰",
            value: `${n.overview.research.counters.offered} / ${n.overview.research.counters.reused} / ${n.overview.research.counters.evicted}`,
            info: "写入案头 / 复用已有条目 / 容量与 TTL 淘汰（重载归零）"
          }, null, 8, ["value"])
        ]),
        e("div", na, [
          i[1] || (i[1] = e("h3", null, [
            e("span", { class: "sq" }),
            N("Jev 决策门控")
          ], -1)),
          j(V, {
            label: "状态",
            value: n.overview.research.jev.enabled ? n.overview.research.jev.keyConfigured ? "已启用" : "已开启 · 待配置密钥" : "未启用",
            state: n.overview.research.jev.enabled ? n.overview.research.jev.keyConfigured ? "ok" : "warn" : "",
            info: "自动生活推进前的考据判定；同时受考据总开关控制"
          }, null, 8, ["value", "state"]),
          j(V, {
            label: "判定 / 触发",
            value: `${n.overview.research.jev.calls} / ${n.overview.research.jev.triggered}`,
            info: "判定=门控调用次数，触发=判定 TRUE 放行先查后写（重载归零）"
          }, null, 8, ["value"]),
          n.overview.research.jev.enabled ? k("", !0) : (t(), a("div", oa, "如需在生活推进前判定是否查证，可在配置中心的「考据 Agent」中配置 Jev 密钥并启用门控。"))
        ])
      ]),
      i[3] || (i[3] = e("div", {
        class: "notice info",
        style: { "margin-top": "12px" }
      }, "当前页展示案头数量、缓存与门控的汇总状态；资料的使用情况可结合写作记录和考据日志核对。", -1))
    ])) : k("", !0);
  }
}), ua = /* @__PURE__ */ Y(ia, [["__scopeId", "data-v-9c6e59c1"]]), ra = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ua
}, Symbol.toStringTag, { value: "Module" })), da = { class: "pg-head" }, ca = { class: "sub" }, va = ["disabled"], fa = {
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
}, ya = {
  key: 3,
  class: "empty"
}, ma = { class: "list" }, ga = ["aria-expanded", "disabled", "onClick"], ba = ["data-kind"], ka = { class: "target" }, _a = { class: "head" }, $a = ["data-status"], wa = { class: "time" }, Ca = {
  key: 0,
  class: "detail"
}, Sa = { key: 0 }, xa = {
  key: 4,
  class: "quote"
}, qa = {
  key: 5,
  class: "ops"
}, Ma = {
  key: 0,
  class: "verify-hint"
}, Ia = ["disabled"], Pa = ["disabled"], Na = ["disabled"], Aa = ["onClick"], Oa = ["disabled"], Va = /* @__PURE__ */ ee({
  name: "ActionsPage",
  __name: "ActionsPage",
  setup(n) {
    const c = y([]), i = y(0), _ = y(void 0), h = y(!1), g = y(""), $ = y(""), r = y(""), u = y(null), C = y(!1), f = y(!1);
    let w = !1, x = 0, m = 0;
    const A = { action: "当前动作", plan: "人物计划", "fixed-delay": "确定延迟" }, M = {
      pending: "待执行",
      delivered: "已送达",
      partial: "部分送达",
      failed: "失败",
      cancelled: "已取消",
      unknown: "待核实",
      "pending-plan": "计划待处理"
    }, z = H(() => u.value ? u.value.kind !== "action" ? !0 : u.value.segments.some((P) => P.status === "pending" || P.status === "unknown") : !1), R = H(() => {
      var P;
      return !!((P = u.value) != null && P.segments.some((d) => d.status === "unknown"));
    }), O = {
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
    }, L = {
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
    function p(P) {
      return L[P] ? `${L[P]}（${P}）` : P;
    }
    async function S(P) {
      if (f.value) return;
      const d = r.value;
      f.value = !0, $.value = "", g.value = "";
      try {
        const s = await P();
        if (w) return;
        if (!s.ok) throw new Error(O[s.reason] ?? s.reason ?? "操作失败");
        $.value = O[s.reason] ?? (s.changed ? "操作已完成。" : "状态已经更新，本次无需变更。"), s.changed > 0 && (await J(!0), !w && r.value === d && await v(d));
      } catch (s) {
        w || (g.value = s instanceof Error ? s.message : String(s));
      } finally {
        w || (f.value = !1);
      }
    }
    async function v(P) {
      g.value = "";
      const d = ++m;
      C.value = !0, u.value = null;
      try {
        const s = await K.actionDetail(P);
        if (w || d !== m || r.value !== P) return;
        if (!s) throw new Error("该动作已不在当前记录中，请刷新列表。");
        u.value = s;
      } catch (s) {
        !w && d === m && (g.value = s instanceof Error ? s.message : String(s));
      } finally {
        !w && d === m && (C.value = !1);
      }
    }
    async function J(P = !0) {
      const d = ++x;
      h.value = !0, g.value = "";
      try {
        const s = await K.actionsList(P ? void 0 : _.value);
        if (!s) throw new Error("Console 连接尚未就绪");
        if (w || d !== x) return;
        c.value = P ? s.rows : [...c.value, ...s.rows], i.value = s.total, _.value = s.cursor, P && r.value && !c.value.some((l) => l.id === r.value) && (r.value = "", u.value = null, m++, C.value = !1);
      } catch (s) {
        !w && d === x && (g.value = String(s));
      } finally {
        !w && d === x && (h.value = !1);
      }
    }
    async function I(P) {
      if (!f.value) {
        if (g.value = "", $.value = "", r.value === P) {
          r.value = "", u.value = null, m++, C.value = !1;
          return;
        }
        r.value = P, await v(P);
      }
    }
    function F(P) {
      if (!P) return "—";
      const d = new Date(P);
      return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
    }
    return ne(() => void J()), ue(() => {
      w = !0, x++, m++;
    }), (P, d) => (t(), a("div", null, [
      e("div", da, [
        e("div", null, [
          d[5] || (d[5] = e("h2", null, "通信动作", -1)),
          e("div", ca, "查看作者动作、投递结果与未来计划；管理员可取消后续分段或核实未知回执。当前窗口共 " + o(i.value) + " 条。", 1)
        ]),
        e("button", {
          class: "refresh",
          disabled: h.value,
          onClick: d[0] || (d[0] = (s) => J(!0))
        }, "刷新", 8, va)
      ]),
      g.value ? (t(), a("div", fa, o(g.value), 1)) : k("", !0),
      $.value ? (t(), a("div", ha, o($.value), 1)) : k("", !0),
      h.value && !c.value.length ? (t(), a("div", pa, "正在读取通信动作…")) : k("", !0),
      !h.value && !c.value.length && !g.value ? (t(), a("div", ya, "暂无动作记录。")) : k("", !0),
      e("div", ma, [
        (t(!0), a(D, null, W(c.value, (s) => (t(), a("div", {
          key: s.id,
          class: T(["row", { open: r.value === s.id }])
        }, [
          e("button", {
            type: "button",
            class: "row-main",
            "aria-expanded": r.value === s.id,
            disabled: f.value,
            onClick: (l) => I(s.id)
          }, [
            e("span", {
              class: "kind",
              "data-kind": s.kind
            }, o(A[s.kind] ?? s.kind), 9, ba),
            e("span", ka, o(s.target), 1),
            e("span", _a, o(s.head), 1),
            e("span", {
              class: "status",
              "data-status": s.status
            }, [
              N(o(M[s.status] ?? s.status), 1),
              s.segmentCount ? (t(), a(D, { key: 0 }, [
                N("（" + o(s.deliveredCount) + "/" + o(s.segmentCount) + "）", 1)
              ], 64)) : k("", !0)
            ], 8, $a),
            e("span", wa, o(F(s.updatedAt)), 1)
          ], 8, ga),
          r.value === s.id ? (t(), a("div", Ca, [
            C.value ? (t(), a("div", Sa, "读取中…")) : u.value ? (t(), a(D, { key: 1 }, [
              j(V, {
                label: "动作",
                value: u.value.id
              }, null, 8, ["value"]),
              j(V, {
                label: "渠道",
                value: u.value.channel === "group" ? "群聊" : "私聊"
              }, null, 8, ["value"]),
              u.value.dueAt ? (t(), G(V, {
                key: 0,
                label: "到期",
                value: F(u.value.dueAt)
              }, null, 8, ["value"])) : k("", !0),
              u.value.expiresAt ? (t(), G(V, {
                key: 1,
                label: "失效",
                value: F(u.value.expiresAt)
              }, null, 8, ["value"])) : k("", !0),
              u.value.reason ? (t(), G(V, {
                key: 2,
                label: "原因",
                value: p(u.value.reason)
              }, null, 8, ["value"])) : k("", !0),
              u.value.segments.length ? (t(), G(V, {
                key: 3,
                label: "分段",
                value: u.value.segments.map((l) => `第 ${l.index + 1} 段：${M[l.status] ?? l.status}${l.reason ? `（${p(l.reason)}）` : ""}`).join("；") || "—"
              }, null, 8, ["value"])) : k("", !0),
              u.value.quote ? (t(), a("div", xa, "原文：" + o(u.value.quote), 1)) : k("", !0),
              z.value || R.value ? (t(), a("div", qa, [
                R.value ? (t(), a("p", Ma, "根据平台实际记录核实；确认送达后，该结果会作为后续写作依据。")) : k("", !0),
                z.value ? (t(), a("button", {
                  key: 1,
                  disabled: f.value,
                  onClick: d[1] || (d[1] = (l) => S(() => oe(K).cancelAction(u.value.id)))
                }, o(f.value ? "处理中…" : "取消后续"), 9, Ia)) : k("", !0),
                R.value ? (t(), a("button", {
                  key: 2,
                  disabled: f.value,
                  class: "ok",
                  onClick: d[2] || (d[2] = (l) => S(() => oe(K).verifyAction(u.value.id, "delivered")))
                }, "核实已送达", 8, Pa)) : k("", !0),
                R.value ? (t(), a("button", {
                  key: 3,
                  disabled: f.value,
                  onClick: d[3] || (d[3] = (l) => S(() => oe(K).verifyAction(u.value.id, "not-sent")))
                }, "核实未发送", 8, Na)) : k("", !0)
              ])) : k("", !0)
            ], 64)) : (t(), a("button", {
              key: 2,
              class: "refresh",
              onClick: (l) => v(s.id)
            }, "重试读取详情", 8, Aa))
          ])) : k("", !0)
        ], 2))), 128))
      ]),
      _.value ? (t(), a("button", {
        key: 4,
        class: "more",
        disabled: h.value,
        onClick: d[4] || (d[4] = (s) => J(!1))
      }, o(h.value ? "读取中…" : "加载更多"), 9, Oa)) : k("", !0)
    ]));
  }
}), Da = /* @__PURE__ */ Y(Va, [["__scopeId", "data-v-7c409614"]]), ja = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Da
}, Symbol.toStringTag, { value: "Module" })), La = { key: 0 }, Ea = { class: "scope-controls" }, Ta = { class: "grid" }, Ra = { class: "card" }, Ua = { class: "card" }, Ba = /* @__PURE__ */ ee({
  name: "DensityPage",
  __name: "DensityPage",
  props: {
    overview: {}
  },
  setup(n) {
    const c = n, i = y("private"), _ = { burst: "极高密度", high: "高密度", normal: "日常", low: "低密度", advance: "自动推进" }, h = H(() => {
      var u, C, f, w, x, m, A, M;
      const r = (w = (f = (C = (u = c.overview) == null ? void 0 : u.density) == null ? void 0 : C.scopes) == null ? void 0 : f[i.value]) == null ? void 0 : w.mode;
      return r && r !== "inherit" ? r : ((m = (x = c.overview) == null ? void 0 : x.density) == null ? void 0 : m.globalMode) ?? ((M = (A = c.overview) == null ? void 0 : A.density) == null ? void 0 : M.mode) ?? "fixed";
    }), g = H(() => {
      var C, f, w;
      const r = ((C = c.overview) == null ? void 0 : C.density) ?? {}, u = ((w = (f = r.scopes) == null ? void 0 : f[i.value]) == null ? void 0 : w.tiers) ?? {};
      return [
        { label: "极高密度", tier: "burst", limit: u.burst, info: "近 5 分钟至少 4 条消息" },
        { label: "高密度", tier: "high", limit: u.high, info: "近 5 分钟至少 2 条，或近 15 分钟至少 4 条消息" },
        { label: "日常", tier: "normal", limit: r.anchor, info: "使用 contextEntryLimit 作为日常档锚点" },
        { label: "低密度", tier: "low", limit: u.low, info: "近 30 分钟没有新消息" },
        { label: "自动推进", tier: "advance", limit: u.advance, info: "自动生活推进回合使用的档位" }
      ];
    }), $ = H(() => {
      var u, C, f;
      const r = h.value === "fixed" ? (C = (u = c.overview) == null ? void 0 : u.density) == null ? void 0 : C.anchor : (f = g.value.find((w) => {
        var x, m;
        return w.tier === ((m = (x = c.overview) == null ? void 0 : x.density) == null ? void 0 : m.tier);
      })) == null ? void 0 : f.limit;
      return h.value === "auto" && r != null ? Math.max(4, Math.min(200, Math.floor(r))) : r;
    });
    return (r, u) => {
      const C = ie("router-link");
      return n.overview ? (t(), a("div", La, [
        u[5] || (u[5] = e("div", { class: "pg-head" }, [
          e("div", null, [
            e("h2", null, "上下文预算"),
            e("div", { class: "sub" }, "近期原始剧本的保留预算。密度统计按当前故事计算，私聊与群聊可分别设置模式和档位。")
          ])
        ], -1)),
        e("div", Ea, [
          e("button", {
            class: T({ on: i.value === "private" }),
            onClick: u[0] || (u[0] = (f) => i.value = "private")
          }, "私聊预算", 2),
          e("button", {
            class: T({ on: i.value === "group" }),
            onClick: u[1] || (u[1] = (f) => i.value = "group")
          }, "群聊预算", 2),
          j(C, { to: "/hdsi/config-center" }, {
            default: ve(() => [...u[2] || (u[2] = [
              N("在配置中心调整 →", -1)
            ])]),
            _: 1
          })
        ]),
        e("div", Ta, [
          e("div", Ra, [
            u[3] || (u[3] = e("h3", null, [
              e("span", { class: "sq" }),
              N("当前档位")
            ], -1)),
            j(V, {
              label: "模式",
              value: h.value === "auto" ? "随密度自适应" : "固定预算",
              state: "acc",
              info: "fixed 使用锚点与时间窗；auto 按本页档位动态选择",
              range: "fixed | auto"
            }, null, 8, ["value"]),
            j(V, {
              label: "档位",
              value: `${h.value === "auto" ? _[n.overview.density.tier] ?? n.overview.density.tier : "固定"} → ${$.value ?? "—"} 条`,
              info: "当前密度对应的用户回合预算；fixed 可额外合并时间窗，auto 使用至少 4 条的档位硬上限。自动推进回合使用推进档。"
            }, null, 8, ["value"]),
            j(V, {
              label: "近 5 分钟",
              value: `${n.overview.density.counts.count5} 条消息`,
              info: "入站消息计数——密度信号源之一（burst 判定窗）"
            }, null, 8, ["value"]),
            j(V, {
              label: "近 15 分钟",
              value: `${n.overview.density.counts.count15} 条消息`,
              info: "入站消息计数——high 判定窗"
            }, null, 8, ["value"]),
            j(V, {
              label: "近 30 分钟",
              value: `${n.overview.density.counts.count30} 条消息`,
              info: "入站消息计数——low 判定窗（轨迹重载归零）"
            }, null, 8, ["value"])
          ]),
          e("div", Ua, [
            u[4] || (u[4] = e("h3", null, [
              e("span", { class: "sq" }),
              N("档位表")
            ], -1)),
            (t(!0), a(D, null, W(g.value, (f) => (t(), G(V, {
              key: f.label,
              class: T(["row", { on: h.value === "auto" && n.overview.density.tier === f.tier }]),
              label: f.label,
              value: f.limit == null ? "未提供配置" : `${f.limit} 条`,
              info: f.info
            }, null, 8, ["class", "label", "value", "info"]))), 128))
          ])
        ])
      ])) : k("", !0);
    };
  }
}), za = /* @__PURE__ */ Y(Ba, [["__scopeId", "data-v-f55a4e87"]]), Ja = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: za
}, Symbol.toStringTag, { value: "Module" })), Fa = { class: "pg-head" }, Ha = {
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
}, el = {
  key: 0,
  class: "empty"
}, tl = ["onClick"], al = { class: "seq" }, ll = { class: "time" }, sl = { class: "who" }, nl = { class: "msg" }, ol = { class: "who" }, il = { class: "msg" }, ul = { class: "hint" }, rl = { class: "who" }, dl = { class: "msg" }, cl = { class: "who" }, vl = { class: "msg" }, fl = {
  key: 0,
  class: "script"
}, hl = /* @__PURE__ */ ee({
  name: "DebugPage",
  __name: "DebugPage",
  setup(n) {
    const c = y([]), i = y(null), _ = y(""), h = y(!0), g = y(!0), $ = y("all"), r = y("all"), u = y(""), C = y(/* @__PURE__ */ new Set()), f = y(null);
    let w, x = !1;
    H(() => c.value.reduce((p, S) => Math.max(p, S.seq), 0));
    const m = H(() => c.value.filter((p) => {
      if (r.value !== "all" && p.kind !== r.value || p.kind === "log" && ($.value === "warn" && !["warn", "error"].includes(String(p.level)) || $.value === "error" && p.level !== "error"))
        return !1;
      if (u.value.trim()) {
        const S = u.value.trim().toLowerCase();
        if (![p.message, p.script, p.model, p.phase, p.protagonist, p.qq, p.decision].filter(Boolean).join(" ").toLowerCase().includes(S)) return !1;
      }
      return !0;
    }));
    function A(p) {
      return new Date(p).toLocaleTimeString("zh-CN", { hour12: !1 });
    }
    function M(p) {
      return p ? p >= 1e6 ? `${(p / 1e6).toFixed(2)}M` : p >= 1e3 ? `${(p / 1e3).toFixed(1)}k` : String(p) : "0";
    }
    function z(p) {
      return { log: "日志", narrative: "续写", usage: "用量", access: "申请" }[p] ?? p;
    }
    function R(p) {
      const S = new Set(C.value);
      S.has(p) ? S.delete(p) : S.add(p), C.value = S;
    }
    async function O() {
      if (!x) {
        x = !0;
        try {
          const p = await K.opsRecent(240);
          p != null && p.ok && (c.value = p.events ?? [], i.value = p.stats ?? null, _.value = "");
        } catch (p) {
          _.value = (p == null ? void 0 : p.message) ?? String(p);
        } finally {
          x = !1, g.value && requestAnimationFrame(() => {
            f.value && (f.value.scrollTop = 0);
          });
        }
      }
    }
    function L() {
      c.value = [];
    }
    return ne(() => {
      O(), w = window.setInterval(() => {
        h.value && O();
      }, 2e3);
    }), ue(() => {
      w && window.clearInterval(w);
    }), (p, S) => (t(), a("div", null, [
      e("div", Fa, [
        S[6] || (S[6] = e("div", null, [
          e("h2", null, "调试"),
          e("div", { class: "sub" }, "主叙事剧本续写、模型用量与 warn/error 的实时事件流（2 秒轮询）。剧本文本受 ops.debugStream.scriptPreview 门控。")
        ], -1)),
        i.value ? (t(), a("div", Ha, [
          e("span", Qa, "启动 " + o(new Date(i.value.sinceBoot).toLocaleTimeString("zh-CN", { hour12: !1 })), 1),
          e("span", Ka, "✗ " + o(i.value.levels.error) + " / ⚠ " + o(i.value.levels.warn), 1),
          e("span", Wa, "✎ " + o(i.value.counts.narrative) + " · ◇ " + o(i.value.counts.usage) + " · ✉ " + o(i.value.counts.access), 1),
          e("span", Ga, "丢弃 " + o(i.value.dropped), 1)
        ])) : k("", !0)
      ]),
      e("div", Ya, [
        e("button", {
          class: T({ on: h.value }),
          onClick: S[0] || (S[0] = (v) => h.value = !h.value)
        }, o(h.value ? "● 实时" : "○ 已暂停"), 3),
        e("label", Xa, [
          Z(e("input", {
            type: "checkbox",
            "onUpdate:modelValue": S[1] || (S[1] = (v) => g.value = v)
          }, null, 512), [
            [he, g.value]
          ]),
          S[7] || (S[7] = N(" 自动置顶", -1))
        ]),
        Z(e("select", {
          "onUpdate:modelValue": S[2] || (S[2] = (v) => r.value = v),
          title: "事件类型"
        }, [...S[8] || (S[8] = [
          pe('<option value="all" data-v-b749075a>全部类型</option><option value="narrative" data-v-b749075a>续写</option><option value="log" data-v-b749075a>日志</option><option value="usage" data-v-b749075a>用量</option><option value="access" data-v-b749075a>申请</option>', 5)
        ])], 512), [
          [ye, r.value]
        ]),
        Z(e("select", {
          "onUpdate:modelValue": S[3] || (S[3] = (v) => $.value = v),
          title: "日志级别（仅日志类型生效）"
        }, [...S[9] || (S[9] = [
          e("option", { value: "all" }, "全部级别", -1),
          e("option", { value: "warn" }, "warn 及以上", -1),
          e("option", { value: "error" }, "仅 error", -1)
        ])], 512), [
          [ye, $.value]
        ]),
        Z(e("input", {
          class: "search",
          "onUpdate:modelValue": S[4] || (S[4] = (v) => u.value = v),
          placeholder: "过滤关键字（消息/模型/相位…）"
        }, null, 512), [
          [fe, u.value]
        ]),
        e("button", { onClick: L }, "清屏"),
        e("button", {
          onClick: S[5] || (S[5] = (v) => O())
        }, "立即刷新"),
        _.value ? (t(), a("span", Za, "刷新失败：" + o(_.value), 1)) : k("", !0)
      ]),
      e("div", {
        class: "log-pane",
        ref_key: "logPane",
        ref: f
      }, [
        m.value.length ? k("", !0) : (t(), a("div", el, ' 暂无事件。发一条私聊消息、等一次自动推进，或把级别过滤器调回"全部"。 ')),
        (t(!0), a(D, null, W(m.value, (v) => (t(), a("div", {
          key: v.seq,
          class: T(["ev", [v.kind, v.level]])
        }, [
          e("div", {
            class: "ev-head",
            onClick: (J) => v.kind === "narrative" && R(v.seq)
          }, [
            e("span", al, "#" + o(v.seq), 1),
            e("span", ll, o(A(v.ts)), 1),
            e("span", {
              class: T(["kind", v.kind])
            }, o(z(v.kind)), 3),
            v.kind === "log" ? (t(), a(D, { key: 0 }, [
              e("span", {
                class: T(["lvl", v.level])
              }, o(String(v.level).toUpperCase()), 3),
              e("span", sl, o(v.protagonist) + o(v.phase ? ` · ${v.phase}` : ""), 1),
              e("span", nl, o(v.message), 1)
            ], 64)) : v.kind === "narrative" ? (t(), a(D, { key: 1 }, [
              e("span", ol, o(v.phase), 1),
              e("span", il, o(v.decision), 1),
              e("span", ul, o(C.value.has(v.seq) ? "收起" : v.script ? `展开 ${v.script.length} 字` : "（剧本预览已关闭）"), 1)
            ], 64)) : v.kind === "usage" ? (t(), a(D, { key: 2 }, [
              e("span", rl, o(v.task) + " · " + o(v.model), 1),
              e("span", dl, "入 " + o(M(v.inputTokens)) + "（缓存 " + o(M(v.cachedInputTokens)) + "） 出 " + o(M(v.outputTokens)) + o(v.cost ? ` ≈${v.cost.toFixed(4)}` : ""), 1)
            ], 64)) : (t(), a(D, { key: 3 }, [
              e("span", cl, o(v.qq), 1),
              e("span", vl, o(v.status), 1)
            ], 64))
          ], 8, tl),
          v.kind === "narrative" && C.value.has(v.seq) && v.script ? (t(), a("pre", fl, o(v.script), 1)) : k("", !0)
        ], 2))), 128))
      ], 512)
    ]));
  }
}), pl = /* @__PURE__ */ Y(hl, [["__scopeId", "data-v-b749075a"]]), yl = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: pl
}, Symbol.toStringTag, { value: "Module" })), ml = { class: "pg-head" }, gl = { class: "head-info" }, bl = {
  class: "chip",
  title: "sharedStory.managerAccounts"
}, kl = {
  class: "chip",
  title: "主动消息名单策略"
}, _l = { class: "tabs-row" }, $l = {
  key: 0,
  class: "badge"
}, wl = ["disabled"], Cl = {
  key: 0,
  class: "notice info"
}, Sl = {
  key: 1,
  class: "notice warn"
}, xl = {
  key: 2,
  class: "notice info"
}, ql = {
  key: 0,
  class: "empty"
}, Ml = {
  key: 1,
  class: "table"
}, Il = { class: "col qq mono" }, Pl = { class: "col name" }, Nl = { class: "col src" }, Al = { class: "col num" }, Ol = { class: "col time" }, Vl = ["title"], Dl = { class: "col ops" }, jl = ["disabled", "onClick"], Ll = ["disabled", "onClick"], El = { class: "history" }, Tl = { class: "table slim" }, Rl = { class: "col qq mono" }, Ul = { class: "col name" }, Bl = { class: "col src" }, zl = { class: "col num" }, Jl = { class: "col time" }, Fl = ["title"], Hl = { class: "col ops" }, Ql = ["disabled", "onClick"], Kl = { class: "table" }, Wl = { class: "col qq mono" }, Gl = {
  key: 0,
  class: "badge",
  title: "有待审批申请"
}, Yl = { class: "col name" }, Xl = ["onUpdate:modelValue"], Zl = {
  key: 0,
  class: "subname"
}, es = { class: "col st" }, ts = ["onUpdate:modelValue"], as = { class: "col st" }, ls = ["onUpdate:modelValue"], ss = { class: "col time" }, ns = { class: "col time" }, os = { class: "col ops" }, is = ["onClick"], us = {
  key: 0,
  class: "empty"
}, rs = {
  key: 1,
  class: "table"
}, ds = { class: "col qq mono" }, cs = { class: "col name" }, vs = ["onUpdate:modelValue"], fs = { class: "col st" }, hs = ["onUpdate:modelValue"], ps = { class: "col mode" }, ys = ["title"], ms = { class: "col ops" }, gs = ["onClick"], bs = /* @__PURE__ */ ee({
  name: "ListsPage",
  __name: "ListsPage",
  setup(n) {
    const c = y("requests"), i = y(!0), _ = y(""), h = y([]), g = y([]), $ = y([]), r = y(!0), u = y([]), C = y("all"), f = y([]), w = y(!1), x = y(!1), m = y(""), A = y(""), M = H(() => $.value.filter((d) => d.status === "pending")), z = H(() => {
      const d = A.value.trim().toLowerCase();
      return d ? h.value.filter((s) => [s.qq, s.label, s.displayName, s.personId].filter(Boolean).join(" ").toLowerCase().includes(d)) : h.value;
    });
    async function R() {
      var d, s;
      i.value = !0, _.value = "";
      try {
        const l = await K.listsRead();
        if (!(l != null && l.ok)) throw new Error((l == null ? void 0 : l.error) ?? "读取失败");
        h.value = l.users ?? [], g.value = l.groups ?? [], $.value = l.requests ?? [], r.value = l.onebotEnabled, u.value = l.managers ?? [], C.value = ((d = l.proactive) == null ? void 0 : d.mode) ?? "all", f.value = ((s = l.proactive) == null ? void 0 : s.list) ?? [], w.value = !1;
      } catch (l) {
        _.value = (l == null ? void 0 : l.message) ?? String(l);
      } finally {
        i.value = !1;
      }
    }
    function O() {
      w.value = !0, m.value = "";
    }
    function L() {
      const d = window.prompt("要添加的 QQ 号（5-12 位数字）");
      !d || !/^\d{5,12}$/.test(d.trim()) || h.value.some((s) => s.qq === d.trim()) || (h.value.push({ qq: d.trim(), label: "", personId: "", profile: "", relationship: "", enabled: !0, proactive: !0 }), O());
    }
    function p(d) {
      const s = h.value[d];
      window.confirm(`从私聊白名单移除 ${s.qq}${s.label ? `（${s.label}）` : ""}？
（参与者与历史剧本保留，仅停止接收其私聊）`) && (h.value.splice(d, 1), O());
    }
    function S() {
      const d = window.prompt("要添加的 QQ 群号（5-12 位数字）");
      !d || !/^\d{5,12}$/.test(d.trim()) || g.value.some((s) => s.groupId === d.trim()) || (g.value.push({ groupId: d.trim(), label: "", enabled: !0, responseMode: "mention-only", collectionScope: "directed", purpose: "", characterRole: "" }), O());
    }
    function v(d) {
      const s = g.value[d];
      window.confirm(`从群聊白名单移除 ${s.groupId}${s.label ? `（${s.label}）` : ""}？`) && (g.value.splice(d, 1), O());
    }
    async function J() {
      x.value = !0, m.value = "";
      try {
        const d = await K.listsSave({ users: h.value, groups: g.value });
        if (!(d != null && d.ok)) throw new Error((d == null ? void 0 : d.error) ?? "保存失败");
        m.value = "已保存（写入 koishi.yml 并热更新）。", await R();
      } catch (d) {
        m.value = `保存失败：${(d == null ? void 0 : d.message) ?? String(d)}`;
      } finally {
        x.value = !1;
      }
    }
    async function I(d, s) {
      x.value = !0, m.value = "";
      try {
        const l = await K.listsDecide(d, s);
        if (!(l != null && l.ok)) throw new Error((l == null ? void 0 : l.error) ?? "操作失败");
        m.value = s ? `已授权 ${d}（写入白名单）。` : `已拒绝 ${d}。`, await R();
      } catch (l) {
        m.value = `操作失败：${(l == null ? void 0 : l.message) ?? String(l)}`;
      } finally {
        x.value = !1;
      }
    }
    function F(d) {
      if (!d) return "—";
      const s = new Date(d);
      return Number.isNaN(s.getTime()) ? "—" : s.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: !1 });
    }
    function P(d) {
      const s = [d.collectionScope ?? d.responseMode ?? "—"];
      return d.backgroundParticipation && d.backgroundParticipation !== "off" && s.push(`后台:${d.backgroundParticipation}`), s.join(" · ");
    }
    return ne(R), (d, s) => (t(), a("div", null, [
      e("div", ml, [
        s[4] || (s[4] = e("div", null, [
          e("h2", null, "名单"),
          e("div", { class: "sub" }, "私聊用户与群聊白名单的统一管理；陌生人的申请在此审批。写操作经配置中心管线持久化到 koishi.yml。")
        ], -1)),
        e("div", gl, [
          e("span", {
            class: T(["chip", { off: !r.value }])
          }, o(r.value ? "OneBot 白名单：启用" : "OneBot 白名单：未启用（全部放行）"), 3),
          e("span", bl, "管理员 " + o(u.value.length || "（全部授权用户）"), 1),
          e("span", kl, [
            N("主动消息：" + o(C.value), 1),
            f.value.length ? (t(), a(D, { key: 0 }, [
              N("（" + o(f.value.length) + "）", 1)
            ], 64)) : k("", !0)
          ])
        ])
      ]),
      e("div", _l, [
        e("button", {
          class: T({ on: c.value === "requests" }),
          onClick: s[0] || (s[0] = (l) => c.value = "requests")
        }, [
          s[5] || (s[5] = N("申请", -1)),
          M.value.length ? (t(), a("span", $l, o(M.value.length), 1)) : k("", !0)
        ], 2),
        e("button", {
          class: T({ on: c.value === "users" }),
          onClick: s[1] || (s[1] = (l) => c.value = "users")
        }, "私聊用户（" + o(h.value.length) + "）", 3),
        e("button", {
          class: T({ on: c.value === "groups" }),
          onClick: s[2] || (s[2] = (l) => c.value = "groups")
        }, "群聊（" + o(g.value.length) + "）", 3),
        s[6] || (s[6] = e("span", { class: "flex-fill" }, null, -1)),
        c.value === "users" ? Z((t(), a("input", {
          key: 0,
          class: "search",
          "onUpdate:modelValue": s[3] || (s[3] = (l) => A.value = l),
          placeholder: "搜索 QQ / 昵称 / 备注…"
        }, null, 512)), [
          [fe, A.value]
        ]) : k("", !0),
        c.value === "users" ? (t(), a("button", {
          key: 1,
          onClick: L
        }, "+ 添加用户")) : k("", !0),
        c.value === "groups" ? (t(), a("button", {
          key: 2,
          onClick: S
        }, "+ 添加群")) : k("", !0),
        e("button", {
          class: "primary",
          disabled: !w.value || x.value,
          onClick: J
        }, o(x.value ? "保存中…" : w.value ? "保存名单" : "无变更"), 9, wl),
        e("button", { onClick: R }, "刷新")
      ]),
      m.value ? (t(), a("div", Cl, o(m.value), 1)) : k("", !0),
      _.value ? (t(), a("div", Sl, "读取失败：" + o(_.value), 1)) : k("", !0),
      i.value ? (t(), a("div", xl, "读取名单中……")) : c.value === "requests" ? (t(), a(D, { key: 3 }, [
        M.value.length ? (t(), a("div", Ml, [
          s[7] || (s[7] = pe('<div class="thead" data-v-ee68f73a><div class="col qq" data-v-ee68f73a>QQ</div><div class="col name" data-v-ee68f73a>昵称</div><div class="col src" data-v-ee68f73a>来源</div><div class="col num" data-v-ee68f73a>尝试</div><div class="col time" data-v-ee68f73a>最近申请</div><div class="col note" data-v-ee68f73a>备注</div><div class="col ops" data-v-ee68f73a>操作</div></div>', 1)),
          (t(!0), a(D, null, W(M.value, (l) => (t(), a("div", {
            key: l.id,
            class: "trow"
          }, [
            e("div", Il, o(l.qq), 1),
            e("div", Pl, o(l.displayName || "—"), 1),
            e("div", Nl, o(l.source === "friend-request" ? "好友申请" : l.source === "private" ? "私聊" : l.source), 1),
            e("div", Al, o(l.attempts), 1),
            e("div", Ol, o(F(l.lastRequestAt)), 1),
            e("div", {
              class: "col note",
              title: l.note
            }, o(l.note || "—"), 9, Vl),
            e("div", Dl, [
              e("button", {
                class: "primary",
                disabled: x.value,
                onClick: (ae) => I(l.qq, !0)
              }, "授权", 8, jl),
              e("button", {
                disabled: x.value,
                onClick: (ae) => I(l.qq, !1)
              }, "拒绝", 8, Ll)
            ])
          ]))), 128))
        ])) : (t(), a("div", ql, "没有待审批申请。陌生人的私聊与好友申请会自动出现在这里。")),
        e("details", El, [
          e("summary", null, "历史记录（" + o($.value.length - M.value.length) + " 条已处理）", 1),
          e("div", Tl, [
            (t(!0), a(D, null, W($.value.filter((l) => l.status !== "pending"), (l) => (t(), a("div", {
              key: l.id,
              class: "trow"
            }, [
              e("div", Rl, o(l.qq), 1),
              e("div", Ul, o(l.displayName || "—"), 1),
              e("div", Bl, [
                e("span", {
                  class: T(["tag", l.status])
                }, o(l.status === "approved" ? "已通过" : "已拒绝"), 3)
              ]),
              e("div", zl, o(l.attempts), 1),
              e("div", Jl, o(F(l.decidedAt || l.lastRequestAt)), 1),
              e("div", {
                class: "col note",
                title: l.note
              }, o(l.note || "—"), 9, Fl),
              e("div", Hl, [
                l.status !== "approved" ? (t(), a("button", {
                  key: 0,
                  class: "primary",
                  disabled: x.value,
                  onClick: (ae) => I(l.qq, !0)
                }, "改为授权", 8, Ql)) : k("", !0)
              ])
            ]))), 128))
          ])
        ])
      ], 64)) : c.value === "users" ? (t(), a(D, { key: 4 }, [
        e("div", Kl, [
          s[8] || (s[8] = pe('<div class="thead" data-v-ee68f73a><div class="col qq" data-v-ee68f73a>QQ</div><div class="col name" data-v-ee68f73a>称呼 / 昵称</div><div class="col st" data-v-ee68f73a>私聊</div><div class="col st" data-v-ee68f73a>主动</div><div class="col time" data-v-ee68f73a>最近活跃</div><div class="col time" data-v-ee68f73a>加入</div><div class="col ops" data-v-ee68f73a>操作</div></div>', 1)),
          (t(!0), a(D, null, W(z.value, (l, ae) => (t(), a("div", {
            key: l.qq,
            class: T(["trow", { off: !l.enabled }])
          }, [
            e("div", Wl, [
              N(o(l.qq), 1),
              l.pendingRequest ? (t(), a("span", Gl, "申请")) : k("", !0)
            ]),
            e("div", Yl, [
              Z(e("input", {
                "onUpdate:modelValue": (b) => l.label = b,
                placeholder: "称呼（留空用平台昵称）",
                onInput: O
              }, null, 40, Xl), [
                [fe, l.label]
              ]),
              l.displayName && l.displayName !== l.label ? (t(), a("div", Zl, o(l.displayName), 1)) : k("", !0)
            ]),
            e("div", es, [
              Z(e("input", {
                type: "checkbox",
                "onUpdate:modelValue": (b) => l.enabled = b,
                onChange: O
              }, null, 40, ts), [
                [he, l.enabled]
              ])
            ]),
            e("div", as, [
              Z(e("input", {
                type: "checkbox",
                "onUpdate:modelValue": (b) => l.proactive = b,
                onChange: O
              }, null, 40, ls), [
                [he, l.proactive]
              ])
            ]),
            e("div", ss, o(l.lastActiveAt ? F(l.lastActiveAt) : "未入组"), 1),
            e("div", ns, o(F(l.joinedAt)), 1),
            e("div", os, [
              e("button", {
                onClick: (b) => p(ae)
              }, "移除", 8, is)
            ])
          ], 2))), 128))
        ]),
        s[9] || (s[9] = e("div", { class: "hint-line" }, "称呼与档案的完整编辑（profile / relationship / personId）请到 配置中心 → QQ 接入；本页覆盖开关、称呼与增删。", -1))
      ], 64)) : (t(), a(D, { key: 5 }, [
        g.value.length ? (t(), a("div", rs, [
          s[10] || (s[10] = pe('<div class="thead" data-v-ee68f73a><div class="col qq" data-v-ee68f73a>群号</div><div class="col name" data-v-ee68f73a>备注</div><div class="col st" data-v-ee68f73a>启用</div><div class="col mode" data-v-ee68f73a>模式</div><div class="col time" data-v-ee68f73a>用途</div><div class="col ops" data-v-ee68f73a>操作</div></div>', 1)),
          (t(!0), a(D, null, W(g.value, (l, ae) => (t(), a("div", {
            key: l.groupId,
            class: T(["trow", { off: !l.enabled }])
          }, [
            e("div", ds, o(l.groupId), 1),
            e("div", cs, [
              Z(e("input", {
                "onUpdate:modelValue": (b) => l.label = b,
                placeholder: "群备注",
                onInput: O
              }, null, 40, vs), [
                [fe, l.label]
              ])
            ]),
            e("div", fs, [
              Z(e("input", {
                type: "checkbox",
                "onUpdate:modelValue": (b) => l.enabled = b,
                onChange: O
              }, null, 40, hs), [
                [he, l.enabled]
              ])
            ]),
            e("div", ps, o(P(l)), 1),
            e("div", {
              class: "col time ellip",
              title: l.purpose
            }, o(l.purpose || "—"), 9, ys),
            e("div", ms, [
              e("button", {
                onClick: (b) => v(ae)
              }, "移除", 8, gs)
            ])
          ], 2))), 128))
        ])) : (t(), a("div", us, '还没有启用任何群聊。添加群号后，默认"仅@触发 + 定向采集"。')),
        s[11] || (s[11] = e("div", { class: "hint-line" }, "群规则的高级维度（意愿档位、冷却、表情包采集等）请到 配置中心 → QQ 接入 → 群聊白名单。", -1))
      ], 64))
    ]));
  }
}), ks = /* @__PURE__ */ Y(bs, [["__scopeId", "data-v-ee68f73a"]]), _s = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ks
}, Symbol.toStringTag, { value: "Module" }));
export {
  Ss as default
};
