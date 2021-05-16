import { Auto } from "./direct";
import { ensureArray, mapEntries } from "./utils";

function getStylesString(styles) {
  return Object.entries(styles).reduce(
    (str, [key, val]) => `${str}${key}: ${val};`,
    ""
  );
}

export function mountToDOM(base, renderFunc) {
  const nodes = new WeakMap();
  Auto(() => {
    const comps = ensureArray(renderFunc());
    mountChildren(base, comps);
  });

  function mountChildren(base, comps) {
    const mountedNodes = Array.from(base.children).map((el) => nodes.get(el));
    let compsToMatch = [...comps];
    const nodesToUnmount = mountedNodes.filter(
      (n) =>
        n.active &&
        !compsToMatch.some((ch, i) => {
          const same = sameComps(ch, n.comp);
          if (same) compsToMatch.splice(i, 1);
          return same;
        })
    );

    nodesToUnmount.forEach((n) => {
      const node = nodes.get(n.el);
      node.active = false;
      unmount(n.el);
    });

    const compsToRender = [...mountedNodes];
    comps.forEach((comp) => {
      const mountedNode = compsToRender.find((n, i) => {
        const found = sameComps(comp, n.comp);
        if (found) compsToRender.splice(i, 1);
        return found;
      });
      const el = mountedNode?.el ?? create(comp);
      nodes.set(el, {
        el,
        comp,
        active: true,
      });
      if (comp.children) mountChildren(el, comp.children);
      render(el);
      if (!mountedNode) mount(base, el);
    });
  }

  function render(el) {
    const node = nodes.get(el);
    const {
      index,
      type,
      x,
      y,
      width,
      height,
      text,
      fontFamily,
      fontSize,
      lineHeight,
      style,
      transitionTime,
    } = node.comp;
    const isText = type === "text";
    const isInput = type === "input";

    let styles = { ...style };

    styles = {
      ...styles,
      opacity: `${el.style.opacity}`,
      transform: `translate(${x}px,${y}px)`,
      width: `${width}px`,
      height: `${height}px`,
      transition: `all ease-in-out ${transitionTime || 200}ms`,
    };

    if (isText || isInput) {
      styles = {
        ...styles,
        "font-family": fontFamily,
        "font-size": `${fontSize}px`,
        "line-height": `${lineHeight}px`,
      };
    }

    el.style.cssText = getStylesString(styles);

    if (text) el.textContent = text;
    
  }
  function create(comp) {
    const { type } = comp;
    const isText = type === "text";
    const isInput = type === "input";
    const tag = isText ? "span" : isInput ? "textarea" : "div";
    const el = document.createElement(tag);
    return el;
  }
  function mount(base, el) {
    const node = nodes.get(el);
    if (node?.exitTimeout) clearTimeout(node.exitTimeout);
    el.style.opacity = "0";
    setTimeout(() => (el.style.opacity = "1"), 0);
    base.appendChild(el);
  }
  function unmount(el) {
    el.style.opacity = "0";
    const node = nodes.get(el);
    node.exitTimeout = setTimeout(() => {
      el.remove();
    }, node.transitionTime || 200);
  }

  function getKeys(comp) {
    return comp.id
      ? { id: comp.id, type: comp.type }
      : comp.children
      ? { type: comp.type }
      : {
          ...comp.keys,
          type: comp.type,
        };
  }

  function sameComps(c1, c2) {
    if (c1 === c2) return true;
    const k1 = getKeys(c1);
    const k2 = getKeys(c2);
    return (
      Object.keys(k1).length === Object.keys(k2).length &&
      !Object.entries(k1).some(([k, v]) => k2[k] !== v)
    );
  }

  return nodes;
}

export function style(obj) {
  return mapEntries(obj, ([k, v]) => ["style." + k, v]);
}

export function padding(...args) {
  const keys = ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"];
  let parts = [];
  if (args.lenth === 1) {
    if (typeof args[0] === "string") {
      parts = args[0].split(" ").map((s) => Number(s));
    } else if (Array.isArray(args[0])) {
      parts = args[0].map((s) => Number(s));
    }
  } else {
    parts = args.map((s) => Number(s));
  }
  let values = [];
  if (parts.length === 1) values = [0, 0, 0, 0];
  if (parts.length === 2) values = [0, 1, 0, 1];
  if (parts.length === 3) values = [0, 1, 2];
  if (parts.length === 4) values = [0, 1, 2, 3];

  return Object.fromEntries(values.map((x, i) => [keys[i], parts[x]]));
}
