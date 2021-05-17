import { Auto, State } from "./direct";
import { ensureArray, getStylesString, mapEntries } from "./utils";

const globalStyles = `
@font-face {
  font-family: "Open Sans";
  src: url("fonts/OpenSans-Regular.ttf");
}

body {
  overflow: hidden;
  margin: 0;
}

#app,
#app * {
  will-change: transform, opacity;

  font-family: "Courier New";
  font-size: 14px;
  font-kerning: none;
  line-height: 16px;
  /* user-select: none; */
  outline: 1px dotted lightgray;

  position: absolute;
}

#app * {
  overflow: hidden;
  padding: 0;
  margin: 0;
  border: none;
  background-image: none;
  background-color: transparent;
  -webkit-box-shadow: none;
  -moz-box-shadow: none;
  box-shadow: none;
  resize: none;
}

`;

export function mountToDOM(base, renderFunc, { styles } = {}) {
  const nodes = new Map();

  const globalStyle = State(globalStyles.concat(styles));
  const root = { el: base, globalStyle };
  nodes.set(base, root);

  //create <style> element in <head> for global styles
  const styleEl = document.createElement("style");
  styleEl.appendChild(document.createTextNode(globalStyle));
  document.getElementsByTagName("head")[0].appendChild(styleEl);

  Auto(() => {
    styleEl.innerHTML = globalStyle();
  });

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
      const node = {
        comp,
        root,
        parent: nodes.get(parentEl),
      };
      const el = mountedNode?.el ?? comp.create?.call(node);
      node.el = el;
      node.active = true;
      nodes.set(el, node);
      if (comp.children) node.children = mountChildren(el, comp.children);
      comp.render?.call(node);
      if (!mountedNode) comp.mount?.call(node, parentEl);
      return node;
    });
  }

  function getKeys(comp) {
    return comp.id ? { id: comp.id, type: comp.type } : { type: comp.type };
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
