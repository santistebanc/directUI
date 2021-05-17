import { Auto } from "./direct";
import { ensureArray, mapEntries } from "./utils";

export function mountToDOM(base, renderFunc) {
  const nodes = new Map();
  const root = nodes
    .set(base, {
      el: base,
    })
    .get(base);
  Auto(() => {
    const comps = ensureArray(renderFunc());
    root.children = mountChildren(base, comps);
  });

  function mountChildren(parentEl, comps) {
    const mountedNodes = Array.from(parentEl.children).map((el) =>
      nodes.get(el)
    );
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
      n.comp.unmount?.call(n);
    });

    const compsToRender = [...mountedNodes];
    return comps.map((comp) => {
      const mountedNode = compsToRender.find((n, i) => {
        const found = sameComps(comp, n.comp);
        if (found) compsToRender.splice(i, 1);
        return found;
      });
      const el = mountedNode?.el ?? comp.create?.call(null);
      const node = nodes
        .set(el, {
          el,
          comp,
          active: true,
          root,
          parent: nodes.get(parentEl),
        })
        .get(el);
      if (comp.children) node.children = mountChildren(el, comp.children);
      comp.render?.call(node);
      if (!mountedNode) comp.mount?.call(node, parentEl);
      return node;
    });
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
