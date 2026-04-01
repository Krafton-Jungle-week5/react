const T = /* @__PURE__ */ new Set([
  "embed",
  "head",
  "iframe",
  "link",
  "meta",
  "object",
  "script",
  "style"
]), E = /* @__PURE__ */ new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]), $ = /* @__PURE__ */ new Set(["code", "pre", "textarea"]), s = Symbol("react2:event-handlers");
function y(t = []) {
  return {
    type: "root",
    children: t
  };
}
function b(t) {
  return t ? t.type === "text" ? {
    type: "text",
    value: t.value
  } : {
    type: t.type,
    tag: t.tag,
    attrs: t.attrs ? { ...t.attrs } : void 0,
    children: t.children ? t.children.map(b) : []
  } : null;
}
function S(t, e = document) {
  const r = e.createElement("template");
  return r.innerHTML = t, h(r.content);
}
function h(t) {
  return t ? t.nodeType === 11 ? y(
    Array.from(t.childNodes).map((e) => h(e)).filter(Boolean)
  ) : t.nodeType === 1 ? v(t) : t.nodeType === 3 ? A(t) : null : null;
}
function C(t) {
  return y(
    Array.from(t.childNodes).map((e) => h(e)).filter(Boolean)
  );
}
function A(t) {
  var n, c;
  const e = t.textContent ?? "", r = (c = (n = t.parentElement) == null ? void 0 : n.tagName) == null ? void 0 : c.toLowerCase();
  return !$.has(r) && e.trim() === "" ? null : {
    type: "text",
    value: e
  };
}
function v(t) {
  const e = t.tagName.toLowerCase();
  if (T.has(e))
    return null;
  const r = k(t, e);
  return e === "textarea" ? {
    type: "element",
    tag: e,
    attrs: r,
    children: []
  } : {
    type: "element",
    tag: e,
    attrs: r,
    children: Array.from(t.childNodes).map((n) => h(n)).filter(Boolean)
  };
}
function k(t, e) {
  const r = {};
  for (const n of Array.from(t.attributes))
    r[n.name] = n.value;
  if (e === "input") {
    const n = (t.getAttribute("type") || "").toLowerCase();
    (n === "checkbox" || n === "radio") && (t.checked ? r.checked = "" : delete r.checked), t.value !== void 0 && (r.value = t.value);
  }
  return e === "textarea" && (r.value = t.value ?? ""), e === "option" && (t.selected ? r.selected = "" : delete r.selected), r;
}
function w(t) {
  var e, r;
  return !t || t.type !== "element" ? null : ((e = t.attrs) == null ? void 0 : e["data-key"]) || ((r = t.attrs) == null ? void 0 : r.id) || null;
}
function o(t, e = document) {
  var n;
  if (t.type === "root") {
    const c = e.createDocumentFragment();
    for (const i of t.children)
      c.append(o(i, e));
    return c;
  }
  if (t.type === "text")
    return e.createTextNode(t.value);
  const r = e.createElement(t.tag);
  for (const [c, i] of Object.entries(t.attrs || {}))
    g(r, c, i);
  if (t.tag === "textarea")
    return r.value = ((n = t.attrs) == null ? void 0 : n.value) ?? "", r;
  for (const c of t.children || [])
    r.append(o(c, e));
  return r;
}
function M(t, e) {
  const r = t.ownerDocument || document, n = o(e, r);
  t.replaceChildren(n);
}
function j(t, e, r) {
  d(
    t,
    (e == null ? void 0 : e.children) || [],
    (r == null ? void 0 : r.children) || []
  );
}
function g(t, e, r) {
  if (D(e, r)) {
    const n = e.slice(2).toLowerCase(), c = t[s] || {}, i = c[n];
    i && t.removeEventListener(n, i), t.addEventListener(n, r), c[n] = r, t[s] = c;
    return;
  }
  if (e === "checked") {
    t.checked = !0, t.setAttribute("checked", "");
    return;
  }
  if (e === "value") {
    t.value = r ?? "", t.tagName.toLowerCase() !== "textarea" && t.setAttribute("value", r ?? "");
    return;
  }
  t.setAttribute(e, r ?? "");
}
function L(t, e) {
  var r;
  if (D(e, (r = t[s]) == null ? void 0 : r[e.slice(2).toLowerCase()])) {
    const n = e.slice(2).toLowerCase(), c = t[s], i = c == null ? void 0 : c[n];
    i && (t.removeEventListener(n, i), delete c[n]);
    return;
  }
  e === "checked" && (t.checked = !1), e === "value" && (t.value = ""), t.removeAttribute(e);
}
function d(t, e, r) {
  const n = Math.min(e.length, r.length);
  for (let c = 0; c < n; c += 1)
    O(
      t,
      c,
      e[c],
      r[c]
    );
  for (let c = n; c < r.length; c += 1) {
    const i = t.childNodes[c] || null, l = o(r[c], t.ownerDocument || document);
    t.insertBefore(l, i);
  }
  for (let c = e.length - 1; c >= r.length; c -= 1) {
    const i = t.childNodes[c];
    i && t.removeChild(i);
  }
}
function O(t, e, r, n) {
  const c = t.childNodes[e];
  if (!c) {
    t.append(o(n, t.ownerDocument || document));
    return;
  }
  if (!x(r, n)) {
    t.replaceChild(
      o(n, t.ownerDocument || document),
      c
    );
    return;
  }
  if (n.type === "text") {
    r.value !== n.value && (c.textContent = n.value);
    return;
  }
  V(c, r.attrs || {}, n.attrs || {}), !(n.tag === "textarea" || E.has(n.tag)) && d(
    c,
    r.children || [],
    n.children || []
  );
}
function V(t, e, r) {
  if ((t == null ? void 0 : t.nodeType) !== 1)
    return;
  const n = /* @__PURE__ */ new Set([
    ...Object.keys(e),
    ...Object.keys(r)
  ]);
  for (const c of n) {
    if (!(c in r)) {
      L(t, c);
      continue;
    }
    e[c] !== r[c] && g(t, c, r[c]);
  }
}
function H(t) {
  return t.type === "root" ? t.children.map((e) => p(e, 0)).join(`
`) : p(t, 0);
}
function p(t, e) {
  var i, l;
  if (t.type === "text")
    return `${a(e)}${f(t.value)}`;
  const r = Object.entries(t.attrs || {}).filter(([, u]) => typeof u != "function").map(([u, m]) => m === "" ? u : `${u}="${_(m)}"`).join(" "), n = r ? `<${t.tag} ${r}>` : `<${t.tag}>`;
  if (t.tag === "textarea")
    return `${a(e)}${n}${f(((i = t.attrs) == null ? void 0 : i.value) ?? "")}</${t.tag}>`;
  if (E.has(t.tag))
    return `${a(e)}${n}`;
  if (!((l = t.children) != null && l.length))
    return `${a(e)}${n}</${t.tag}>`;
  if (t.children.length === 1 && t.children[0].type === "text" && t.children[0].value.length <= 48 && !t.children[0].value.includes(`
`))
    return `${a(e)}${n}${f(t.children[0].value)}</${t.tag}>`;
  const c = t.children.map((u) => p(u, e + 1)).join(`
`);
  return `${a(e)}${n}
${c}
${a(e)}</${t.tag}>`;
}
function a(t) {
  return "  ".repeat(t);
}
function f(t) {
  return String(t).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function _(t) {
  return f(t).replaceAll('"', "&quot;");
}
function D(t, e) {
  return t.startsWith("on") && typeof e == "function";
}
function x(t, e) {
  return !t || !e || t.type !== e.type ? !1 : t.type === "text" ? !0 : t.tag === e.tag;
}
function R(t) {
  const e = {
    totalNodes: 0,
    elements: 0,
    textNodes: 0,
    keyedElements: 0,
    maxDepth: 0
  };
  return N(t, 0, (r, n) => {
    if (r.type === "root") {
      e.maxDepth = Math.max(e.maxDepth, n);
      return;
    }
    if (e.totalNodes += 1, e.maxDepth = Math.max(e.maxDepth, n), r.type === "text") {
      e.textNodes += 1;
      return;
    }
    e.elements += 1, w(r) && (e.keyedElements += 1);
  }), e;
}
function N(t, e, r) {
  var n;
  if (r(t, e), !!((n = t.children) != null && n.length))
    for (const c of t.children)
      N(c, e + 1, r);
}
export {
  b as cloneVNode,
  R as countVNodeStats,
  y as createRootVNode,
  h as domNodeToVNode,
  C as domNodeToVNodeTree,
  w as getVNodeKey,
  M as mountVNode,
  S as parseHtmlToVNode,
  j as patchDom,
  L as removeDomAttribute,
  o as renderVNode,
  H as serializeVNodeToHtml,
  g as setDomAttribute
};
