import { createRootVNode as l, mountVNode as S, patchDom as y } from "./vdom.js";
import { applyPatchOperations as P, cloneVNode as H, countVNodeStats as j, diffTrees as I, domNodeToVNode as L, domNodeToVNodeTree as U, getVNodeKey as K, parseHtmlToVNode as Q, removeDomAttribute as B, renderVNode as J, serializeVNodeToHtml as G, setDomAttribute as W } from "./vdom.js";
let s = null;
class A {
  constructor(t, n = {}) {
    if (typeof t != "function")
      throw new TypeError("FunctionComponent must receive a function component.");
    this.renderFn = t, this.props = n, this.hooks = [], this.hookIndex = 0, this.container = null, this.currentTree = l([]), this.pendingEffects = [], this.updateScheduled = !1, this.isMounted = !1, this.isRendering = !1, this.childRenderDepth = 0, this.renderCount = 0, this.inspector = null, this.debugFlow = [], this.lastPatchOperations = [], this.debugSnapshot = h(this);
  }
  attachInspector(t) {
    return this.inspector = t, this.publishDebugSnapshot(), this;
  }
  getDebugSnapshot() {
    return this.debugSnapshot;
  }
  mount(t) {
    if (!t)
      throw new Error("mount() needs a real DOM container.");
    return this.container = t, this.renderAndCommit(), this;
  }
  update(t = this.props) {
    if (!this.container)
      throw new Error("update() can only be called after mount().");
    return this.props = t, this.recordDebugStep(
      "scheduler",
      `${this.getComponentLabel()}.update() 실행`,
      "예약된 microtask가 실행되면서 루트 컴포넌트가 다시 렌더링을 시작합니다."
    ), this.renderAndCommit(), this;
  }
  scheduleUpdate() {
    this.updateScheduled || !this.container || (this.updateScheduled = !0, this.recordDebugStep(
      "scheduler",
      `${this.getComponentLabel()}.scheduleUpdate() 예약`,
      "setState가 만든 변경을 한 번의 microtask로 모아서 처리합니다."
    ), V(() => {
      this.updateScheduled = !1, this.update(this.props);
    }));
  }
  renderChildComponent(t, n) {
    this.childRenderDepth += 1;
    try {
      return t(n);
    } finally {
      this.childRenderDepth -= 1;
    }
  }
  renderAndCommit() {
    if (this.isRendering)
      throw new Error("update() cannot run while rendering is in progress.");
    this.hookIndex = 0, this.pendingEffects = [], this.isRendering = !0, this.recordDebugStep(
      "render",
      `${this.getComponentLabel()}.renderAndCommit() 시작`,
      "hookIndex를 0으로 되돌리고 루트 함수형 컴포넌트를 다시 실행합니다."
    );
    const t = s;
    let n;
    try {
      s = this;
      const r = this.renderFn(this.props);
      n = k(r);
    } finally {
      s = t, this.isRendering = !1;
    }
    if (!this.isMounted)
      S(this.container, n), this.isMounted = !0, this.lastPatchOperations = [], this.recordDebugStep(
        "patch",
        "초기 마운트",
        "첫 렌더에서는 이전 트리가 없어서 Virtual DOM을 그대로 실제 DOM에 마운트합니다."
      );
    else {
      const r = y(this.container, this.currentTree, n);
      this.lastPatchOperations = r, this.recordDebugStep(
        "diff",
        "diff 단계 완료",
        `이전 트리와 새 트리를 비교해서 ${r.length}개의 패치 작업을 찾았습니다.`
      ), this.recordDebugStep(
        "patch",
        "patch 단계 완료",
        g(r)
      );
    }
    this.currentTree = n, this.renderCount += 1, this.publishDebugSnapshot(), this.flushEffects();
  }
  flushEffects() {
    const t = this.pendingEffects;
    this.pendingEffects = [], t.length && this.recordDebugStep(
      "effect",
      "flushEffects() 실행",
      `${t.length}개의 useEffect callback을 커밋 이후 순서대로 실행합니다.`
    );
    for (const n of t) {
      const r = this.hooks[n.index];
      typeof r.cleanup == "function" && (this.recordDebugStep(
        "effect",
        `useEffect 슬롯 ${n.index} cleanup`,
        "이전 effect가 남긴 cleanup 함수를 먼저 실행합니다."
      ), r.cleanup()), this.recordDebugStep(
        "effect",
        `useEffect 슬롯 ${n.index} 실행`,
        "의존성이 변경된 effect callback을 실행합니다."
      );
      const o = n.callback();
      r.cleanup = typeof o == "function" ? o : null, this.publishDebugSnapshot();
    }
  }
  resetDebugFlow() {
    this.debugFlow = [], this.publishDebugSnapshot();
  }
  recordDebugStep(t, n, r) {
    this.debugFlow = [
      ...this.debugFlow,
      {
        id: `flow-${this.renderCount}-${this.debugFlow.length + 1}`,
        kind: t,
        title: n,
        detail: r
      }
    ], this.publishDebugSnapshot();
  }
  publishDebugSnapshot() {
    var t;
    this.debugSnapshot = h(this), (t = this.inspector) != null && t.publish && this.inspector.publish(this.debugSnapshot);
  }
  getComponentLabel() {
    return this.renderFn.name || "App";
  }
}
function F(e, t = {}, ...n) {
  const r = $(n), o = {
    ...t || {},
    children: r
  };
  if (typeof e == "function") {
    const b = s ? s.renderChildComponent(e, o) : e(o);
    return C(b);
  }
  const u = D(t);
  return {
    type: "element",
    tag: e,
    attrs: Object.keys(u).length ? u : void 0,
    children: r
  };
}
function v(e) {
  const t = a("useState"), n = f(
    t,
    "useState",
    "state",
    () => ({
      kind: "state",
      queue: [],
      value: O(e)
    })
  );
  M(n);
  const r = (o) => {
    if (t.isRendering)
      throw new Error("setState must be called from an event or effect, not during render.");
    t.updateScheduled || t.resetDebugFlow(), n.queue.push(o), t.recordDebugStep(
      "state",
      `useState 슬롯 ${t.hooks.indexOf(n)} queue 적재`,
      `루트 ${t.getComponentLabel()}의 useState가 다음 값을 큐에 넣었습니다. 현재 대기 중인 업데이트 수는 ${n.queue.length}개입니다.`
    ), t.scheduleUpdate();
  };
  return [n.value, r];
}
function R(e, t) {
  const n = a("useEffect"), r = n.hookIndex, o = f(
    n,
    "useEffect",
    "effect",
    () => ({
      kind: "effect",
      cleanup: null,
      deps: void 0
    })
  );
  p(o.deps, t) && (n.recordDebugStep(
    "effect",
    `useEffect 슬롯 ${r} 등록`,
    "의존성이 바뀌어서 이번 커밋 이후 effect callback이 실행되도록 예약했습니다."
  ), n.pendingEffects.push({
    index: r,
    callback: e
  }), o.deps = m(t));
}
function T(e, t) {
  const n = a("useMemo"), r = f(
    n,
    "useMemo",
    "memo",
    () => ({
      kind: "memo",
      deps: void 0,
      value: void 0
    })
  );
  return p(r.deps, t) && (r.value = e(), r.deps = m(t), n.recordDebugStep(
    "memo",
    `useMemo 슬롯 ${n.hooks.indexOf(r)} 재계산`,
    `의존성이 바뀌어서 memo 값을 다시 계산했습니다. 현재 값: ${i(r.value)}.`
  )), r.value;
}
function a(e) {
  if (!s || !s.isRendering)
    throw new Error(`${e} can only be used while FunctionComponent is rendering.`);
  if (s.childRenderDepth > 0)
    throw new Error(`${e} can only be used in the root component of this runtime.`);
  return s;
}
function w(e, t, n) {
  if (e.kind !== t)
    throw new Error(`${n} was called in a different order. Hooks must keep a stable call order.`);
}
function f(e, t, n, r) {
  const o = e.hookIndex++;
  let u = e.hooks[o];
  return u || (u = r(), e.hooks[o] = u), w(u, n, t), u;
}
function D(e = {}) {
  const t = {};
  for (const [n, r] of Object.entries(e || {}))
    if (!(n === "children" || r === !1 || r == null)) {
      if (n === "className") {
        t.class = r;
        continue;
      }
      if (n === "htmlFor") {
        t.for = r;
        continue;
      }
      t[n] = r === !0 ? "" : r;
    }
  return t;
}
function k(e) {
  return l(c(e));
}
function C(e) {
  const t = c(e);
  return t.length === 1 ? t[0] : t;
}
function $(e) {
  return e.flatMap((t) => c(t));
}
function c(e) {
  if (Array.isArray(e))
    return e.flatMap((t) => c(t));
  if (e == null || typeof e == "boolean")
    return [];
  if (typeof e == "string" || typeof e == "number")
    return [
      {
        type: "text",
        value: String(e)
      }
    ];
  if (E(e))
    return e.type === "root" ? e.children || [] : [e];
  throw new TypeError("Components may only return Virtual DOM nodes, strings, numbers, or arrays.");
}
function E(e) {
  return !!e && typeof e == "object" && typeof e.type == "string";
}
function p(e, t) {
  return t === void 0 || e === void 0 || e.length !== t.length ? !0 : t.some((n, r) => !Object.is(n, e[r]));
}
function m(e) {
  return Array.isArray(e) ? [...e] : void 0;
}
function O(e) {
  return typeof e == "function" ? e() : e;
}
function M(e) {
  if (!e.queue.length)
    return;
  let t = e.value;
  for (const n of e.queue)
    t = typeof n == "function" ? n(t) : n;
  e.queue = [], e.value = t;
}
function h(e) {
  return {
    renderCount: e.renderCount,
    hooks: e.hooks.map((t, n) => N(t, n)),
    flow: e.debugFlow,
    patchSummary: g(e.lastPatchOperations)
  };
}
function N(e, t) {
  return e.kind === "state" ? {
    slot: t,
    hook: "useState",
    summary: i(e.value),
    detail: `현재 값: ${i(e.value)}, 대기 중 queue: ${e.queue.length}개`
  } : e.kind === "memo" ? {
    slot: t,
    hook: "useMemo",
    summary: i(e.value),
    detail: `deps: ${d(e.deps)}, 계산 결과: ${i(e.value)}`
  } : {
    slot: t,
    hook: "useEffect",
    summary: e.cleanup ? "cleanup 보유" : "cleanup 없음",
    detail: `deps: ${d(e.deps)}, cleanup: ${e.cleanup ? "있음" : "없음"}`
  };
}
function g(e = []) {
  if (!e.length)
    return "적용할 patch 작업이 없었습니다.";
  const t = e.reduce((n, r) => (n[r.type] = (n[r.type] || 0) + 1, n), {});
  return Object.entries(t).map(([n, r]) => `${n} ${r}개`).join(", ");
}
function d(e) {
  return Array.isArray(e) ? e.map((t) => i(t)).join(", ") : "없음";
}
function i(e) {
  return typeof e == "string" ? e : typeof e == "number" || typeof e == "boolean" || e == null ? String(e) : JSON.stringify(e);
}
function V(e) {
  if (typeof queueMicrotask == "function") {
    queueMicrotask(e);
    return;
  }
  Promise.resolve().then(e);
}
export {
  A as FunctionComponent,
  P as applyPatchOperations,
  H as cloneVNode,
  j as countVNodeStats,
  l as createRootVNode,
  I as diffTrees,
  L as domNodeToVNode,
  U as domNodeToVNodeTree,
  K as getVNodeKey,
  F as h,
  S as mountVNode,
  Q as parseHtmlToVNode,
  y as patchDom,
  B as removeDomAttribute,
  J as renderVNode,
  G as serializeVNodeToHtml,
  W as setDomAttribute,
  R as useEffect,
  T as useMemo,
  v as useState
};
