import { createRootVNode, mountVNode, patchDom } from './vdom.js';

let activeComponent = null;

export class FunctionComponent {
  constructor(renderFn, props = {}) {
    if (typeof renderFn !== 'function') {
      throw new TypeError('FunctionComponent must receive a function component.');
    }

    this.renderFn = renderFn;
    this.props = props;
    this.hooks = [];
    this.hookIndex = 0;
    this.container = null;
    this.currentTree = createRootVNode([]);
    this.pendingEffects = [];
    this.updateScheduled = false;
    this.isMounted = false;
    this.isRendering = false;
    this.childRenderDepth = 0;
    this.renderCount = 0;
  }

  mount(container) {
    if (!container) {
      throw new Error('mount() needs a real DOM container.');
    }

    this.container = container;
    this.renderAndCommit();
    return this;
  }

  update(nextProps = this.props) {
    if (!this.container) {
      throw new Error('update() can only be called after mount().');
    }

    this.props = nextProps;
    this.renderAndCommit();
    return this;
  }

  scheduleUpdate() {
    if (this.updateScheduled || !this.container) {
      return;
    }

    this.updateScheduled = true;
    scheduleMicrotask(() => {
      this.updateScheduled = false;
      this.update(this.props);
    });
  }

  renderChildComponent(component, props) {
    this.childRenderDepth += 1;

    try {
      return component(props);
    } finally {
      this.childRenderDepth -= 1;
    }
  }

  renderAndCommit() {
    if (this.isRendering) {
      throw new Error('update() cannot run while rendering is in progress.');
    }

    this.hookIndex = 0;
    this.pendingEffects = [];
    this.isRendering = true;

    const previousComponent = activeComponent;
    let nextTree;

    try {
      activeComponent = this;
      const output = this.renderFn(this.props);
      nextTree = normalizeRootOutput(output);
    } finally {
      activeComponent = previousComponent;
      this.isRendering = false;
    }

    if (!this.isMounted) {
      mountVNode(this.container, nextTree);
      this.isMounted = true;
    } else {
      patchDom(this.container, this.currentTree, nextTree);
    }

    this.currentTree = nextTree;
    this.renderCount += 1;
    this.flushEffects();
  }

  flushEffects() {
    const effectQueue = this.pendingEffects;
    this.pendingEffects = [];

    for (const entry of effectQueue) {
      const hook = this.hooks[entry.index];

      if (typeof hook.cleanup === 'function') {
        hook.cleanup();
      }

      const cleanup = entry.callback();
      hook.cleanup = typeof cleanup === 'function' ? cleanup : null;
    }
  }
}

export function h(type, props = {}, ...children) {
  const normalizedChildren = normalizeChildList(children);
  const nextProps = {
    ...(props || {}),
    children: normalizedChildren,
  };

  if (typeof type === 'function') {
    const output = activeComponent
      ? activeComponent.renderChildComponent(type, nextProps)
      : type(nextProps);

    return unwrapComponentOutput(output);
  }

  const attrs = normalizeProps(props);

  return {
    type: 'element',
    tag: type,
    attrs: Object.keys(attrs).length ? attrs : undefined,
    children: normalizedChildren,
  };
}

export function useState(initialValue) {
  const component = assertHookAccess('useState');
  const hook = getHook(
    component,
    'useState',
    'state',
    () => ({
      kind: 'state',
      queue: [],
      value: resolveInitialValue(initialValue),
    }),
  );

  flushStateQueue(hook);

  const setState = (nextValue) => {
    if (component.isRendering) {
      throw new Error('setState must be called from an event or effect, not during render.');
    }

    hook.queue.push(nextValue);
    component.scheduleUpdate();
  };

  return [hook.value, setState];
}

export function useEffect(callback, deps) {
  const component = assertHookAccess('useEffect');
  const index = component.hookIndex;
  const hook = getHook(
    component,
    'useEffect',
    'effect',
    () => ({
      kind: 'effect',
      cleanup: null,
      deps: undefined,
    }),
  );

  if (shouldRunHook(hook.deps, deps)) {
    component.pendingEffects.push({
      index,
      callback,
    });
    hook.deps = cloneDeps(deps);
  }
}

export function useMemo(factory, deps) {
  const component = assertHookAccess('useMemo');
  const hook = getHook(
    component,
    'useMemo',
    'memo',
    () => ({
      kind: 'memo',
      deps: undefined,
      value: undefined,
    }),
  );

  if (shouldRunHook(hook.deps, deps)) {
    hook.value = factory();
    hook.deps = cloneDeps(deps);
  }

  return hook.value;
}

function assertHookAccess(name) {
  if (!activeComponent || !activeComponent.isRendering) {
    throw new Error(`${name} can only be used while FunctionComponent is rendering.`);
  }

  if (activeComponent.childRenderDepth > 0) {
    throw new Error(`${name} can only be used in the root component of this runtime.`);
  }

  return activeComponent;
}

function assertHookKind(hook, expectedKind, name) {
  if (hook.kind !== expectedKind) {
    throw new Error(`${name} was called in a different order. Hooks must keep a stable call order.`);
  }
}

function getHook(component, name, expectedKind, createHook) {
  const index = component.hookIndex++;
  let hook = component.hooks[index];

  if (!hook) {
    hook = createHook();
    component.hooks[index] = hook;
  }

  assertHookKind(hook, expectedKind, name);
  return hook;
}

function normalizeProps(props = {}) {
  const attrs = {};

  for (const [name, value] of Object.entries(props || {})) {
    if (name === 'children' || value === false || value == null) {
      continue;
    }

    if (name === 'className') {
      attrs.class = value;
      continue;
    }

    if (name === 'htmlFor') {
      attrs.for = value;
      continue;
    }

    attrs[name] = value === true ? '' : value;
  }

  return attrs;
}

function normalizeRootOutput(output) {
  return createRootVNode(normalizeChildValue(output));
}

function unwrapComponentOutput(output) {
  const normalized = normalizeChildValue(output);

  if (normalized.length === 1) {
    return normalized[0];
  }

  return normalized;
}

function normalizeChildList(children) {
  return children.flatMap((child) => normalizeChildValue(child));
}

function normalizeChildValue(child) {
  if (Array.isArray(child)) {
    return child.flatMap((entry) => normalizeChildValue(entry));
  }

  if (child == null || typeof child === 'boolean') {
    return [];
  }

  if (typeof child === 'string' || typeof child === 'number') {
    return [
      {
        type: 'text',
        value: String(child),
      },
    ];
  }

  if (isVNode(child)) {
    return child.type === 'root' ? child.children || [] : [child];
  }

  throw new TypeError('Components may only return Virtual DOM nodes, strings, numbers, or arrays.');
}

function isVNode(node) {
  return Boolean(node) && typeof node === 'object' && typeof node.type === 'string';
}

function shouldRunHook(previousDeps, nextDeps) {
  if (nextDeps === undefined || previousDeps === undefined) {
    return true;
  }

  if (previousDeps.length !== nextDeps.length) {
    return true;
  }

  return nextDeps.some((value, index) => !Object.is(value, previousDeps[index]));
}

function cloneDeps(deps) {
  return Array.isArray(deps) ? [...deps] : undefined;
}

function resolveInitialValue(initialValue) {
  return typeof initialValue === 'function' ? initialValue() : initialValue;
}

function flushStateQueue(hook) {
  if (!hook.queue.length) {
    return;
  }

  let nextValue = hook.value;

  for (const update of hook.queue) {
    nextValue = typeof update === 'function' ? update(nextValue) : update;
  }

  hook.queue = [];
  hook.value = nextValue;
}

function scheduleMicrotask(callback) {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(callback);
    return;
  }

  Promise.resolve().then(callback);
}
