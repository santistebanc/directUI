import Collection from "./Cache/Collection";
import { Auto } from "./direct";
import { ensureArray, serializeProps } from "./utils";

function getStylesString(styles) {
  return Object.entries(styles).reduce(
    (str, [key, val]) => `${str}${key}: ${val};`,
    ""
  );
}

export function mountToDOM(base, renderFunc) {
  const nodes = new WeakMap();
  Auto(() => {
    console.log("RRREEEEREEEEENNNDEEERRR");
    const comps = ensureArray(renderFunc());
    mountChildren(base, comps);
  });

  function mountChildren(base, comps) {
    const mountedNodes = Array.from(base.children).map((el) => nodes.get(el));
    console.log("....start mount", comps, mountedNodes);
    const nodesToUnmount = mountedNodes.filter(
      (n) => n.active && !comps.some((ch) => sameComps(ch, n.comp))
    );
    console.log("....end mount", nodesToUnmount);

    nodesToUnmount.forEach((n) => {
      const node = nodes.get(n.el);
      node.active = false;
      unmount(n.el);
    });

    comps.forEach((comp) => {
      console.log("....comp", Object.keys(comp));
      const mountedNode = mountedNodes.find((n) => sameComps(comp, n.comp));
      console.log("....end");
      const el = mountedNode?.el ?? create(comp);
      nodes.set(el, {
        el,
        comp,
        active: true,
      });
      if (comp.children) console.log("....before mount", comp.children);
      if (comp.children) mountChildren(el, comp.children);
      render(el);
      if (!mountedNode) mount(base, el);
    });
  }

  function render(el) {
    const node = nodes.get(el);
    const {
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
      : {
          ...comp.keys,
          type: comp.type,
          index: comp.index,
        };
  }

  function sameComps(c1, c2) {
    const k1 = getKeys(c1);
    const k2 = getKeys(c2);
    console.log("....c1", Object.keys(c1), k1);
    console.log("....c2", Object.keys(c2), k2);
    if (c1.children)
      console.log(
        "....children same",
        c1.children,
        c2.children,
        c1.children === c2.children
      );
    return (
      Object.keys(k1).length === Object.keys(k2).length &&
      !Object.entries(k1).some(([k, v]) => k2[k] !== v)
    );
  }

  return nodes;
}

const styles = Collection();

export function style(obj) {
  return styles.getOrAdd(obj, (idd) => {
    console.log("created new style", idd);
    return obj;
  });
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
