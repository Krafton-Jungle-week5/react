import { createRootVNode as d, mountVNode as p, patchDom as m } from "./vdom.js";
import { applyPatchOperations as q, cloneVNode as z, countVNodeStats as H, diffTrees as D, domNodeToVNode as F, domNodeToVNodeTree as I, getVNodeKey as j, parseHtmlToVNode as P, removeDomAttribute as $, renderVNode as K, serializeVNodeToHtml as Q, setDomAttribute as U } from "./vdom.js";
let i = null;
class R {
  constructor(t, n = {}) {
    if (typeof t != "function")
      throw new TypeError("FunctionComponent must receive a function component.");
    this.renderFn = t, this.props = n, this.hooks = [], this.hookIndex = 0, this.container = null, this.currentTree = d([]), this.pendingEffects = [], this.updateScheduled = !1, this.isMounted = !1, this.isRendering = !1, this.childRenderDepth = 0, this.renderCount = 0;
  }
  mount(t) {
    if (!t)
      throw new Error("mount() needs a real DOM container.");
    return this.container = t, this.renderAndCommit(), this;
  }
  update(t = this.props) {
    if (!this.container)
      throw new Error("update() can only be called after mount().");
    return this.props = t, this.renderAndCommit(), this;
  }
  scheduleUpdate() {
    this.updateScheduled || !this.container || (this.updateScheduled = !0, N(() => {
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
    this.hookIndex = 0, this.pendingEffects = [], this.isRendering = !0;
    const t = i;
    let n;
    try {
      i = this;
      const o = this.renderFn(this.props);
      n = k(o);
    } finally {
      i = t, this.isRendering = !1;
    }
    this.isMounted ? m(this.container, this.currentTree, n) : (p(this.container, n), this.isMounted = !0), this.currentTree = n, this.renderCount += 1, this.flushEffects();
  }
  flushEffects() {
    const t = this.pendingEffects;
    this.pendingEffects = [];
    for (const n of t) {
      const o = this.hooks[n.index];
      typeof o.cleanup == "function" && o.cleanup();
      const r = n.callback();
      o.cleanup = typeof r == "function" ? r : null;
    }
  }
}
function V(e, t = {}, ...n) {
  const o = C(n), r = {
    ...t || {},
    children: o
  };
  if (typeof e == "function") {
    const h = i ? i.renderChildComponent(e, r) : e(r);
    return w(h);
  }
  const s = g(t);
  return {
    type: "element",
    tag: e,
    attrs: Object.keys(s).length ? s : void 0,
    children: o
  };
}
function S(e) {
  const t = f("useState"), n = c(
    t,
    "useState",
    "state",
    () => ({
      kind: "state",
      queue: [],
      value: b(e)
    })
  );
  v(n);
  const o = (r) => {
    if (t.isRendering)
      throw new Error("setState must be called from an event or effect, not during render.");
    n.queue.push(r), t.scheduleUpdate();
  };
  return [n.value, o];
}
function T(e, t) {
  const n = f("useEffect"), o = n.hookIndex, r = c(
    n,
    "useEffect",
    "effect",
    () => ({
      kind: "effect",
      cleanup: null,
      deps: void 0
    })
  );
  a(r.deps, t) && (n.pendingEffects.push({
    index: o,
    callback: e
  }), r.deps = l(t));
}
function x(e, t) {
  const n = f("useMemo"), o = c(
    n,
    "useMemo",
    "memo",
    () => ({
      kind: "memo",
      deps: void 0,
      value: void 0
    })
  );
  return a(o.deps, t) && (o.value = e(), o.deps = l(t)), o.value;
}
function f(e) {
  if (!i || !i.isRendering)
    throw new Error(`${e} can only be used while FunctionComponent is rendering.`);
  if (i.childRenderDepth > 0)
    throw new Error(`${e} can only be used in the root component of this runtime.`);
  return i;
}
function y(e, t, n) {
  if (e.kind !== t)
    throw new Error(`${n} was called in a different order. Hooks must keep a stable call order.`);
}
function c(e, t, n, o) {
  const r = e.hookIndex++;
  let s = e.hooks[r];
  return s || (s = o(), e.hooks[r] = s), y(s, n, t), s;
}
function g(e = {}) {
  const t = {};
  for (const [n, o] of Object.entries(e || {}))
    if (!(n === "children" || o === !1 || o == null)) {
      if (n === "className") {
        t.class = o;
        continue;
      }
      if (n === "htmlFor") {
        t.for = o;
        continue;
      }
      t[n] = o === !0 ? "" : o;
    }
  return t;
}
function k(e) {
  return d(u(e));
}
function w(e) {
  const t = u(e);
  return t.length === 1 ? t[0] : t;
}
function C(e) {
  return e.flatMap((t) => u(t));
}
function u(e) {
  if (Array.isArray(e))
    return e.flatMap((t) => u(t));
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
function a(e, t) {
  return t === void 0 || e === void 0 || e.length !== t.length ? !0 : t.some((n, o) => !Object.is(n, e[o]));
}
function l(e) {
  return Array.isArray(e) ? [...e] : void 0;
}
function b(e) {
  return typeof e == "function" ? e() : e;
}
function v(e) {
  if (!e.queue.length)
    return;
  let t = e.value;
  for (const n of e.queue)
    t = typeof n == "function" ? n(t) : n;
  e.queue = [], e.value = t;
}
function N(e) {
  if (typeof queueMicrotask == "function") {
    queueMicrotask(e);
    return;
  }
  Promise.resolve().then(e);
}
export {
  R as FunctionComponent,
  q as applyPatchOperations,
  z as cloneVNode,
  H as countVNodeStats,
  d as createRootVNode,
  D as diffTrees,
  F as domNodeToVNode,
  I as domNodeToVNodeTree,
  j as getVNodeKey,
  V as h,
  p as mountVNode,
  P as parseHtmlToVNode,
  m as patchDom,
  $ as removeDomAttribute,
  K as renderVNode,
  Q as serializeVNodeToHtml,
  U as setDomAttribute,
  T as useEffect,
  x as useMemo,
  S as useState
};
