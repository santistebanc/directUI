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
  const globalStyle = State(globalStyles.concat(styles));
  const root = { el: base, globalStyle, children: new Set() };

  //create <style> element in <head> for global styles
  const styleEl = document.createElement("style");
  styleEl.appendChild(document.createTextNode(globalStyle));
  document.getElementsByTagName("head")[0].appendChild(styleEl);

  Auto(() => {
    styleEl.innerHTML = globalStyle();
  });

  Auto(() => {
    const comps = ensureArray(renderFunc());
    mountChildren(root, comps);
  });

  function mountChildren(parent, comps) {
    const parentEl = parent.el;

    //deactivate and unmount nodes that are no longer in the current children
    const activeNodes = [...parent.children.values()].filter((n) => n.active);
    let compsToMatch = [...comps];
    const nodesToUnmount = activeNodes.filter(
      (n) =>
        !compsToMatch.some((ch, i) => {
          const same = sameComps(ch, n.comp);
          if (same) compsToMatch.splice(i, 1);
          return same;
        })
    );
    nodesToUnmount.forEach((node) => {
      node.active = false;
      node.comp.unmount?.call(node);
    });

    //create new nodes that were not in the parent.children Set()
    let nodesToMatch = [...parent.children.values()];
    const nodesToRender = comps.map((comp) => {
      let node = nodesToMatch.find((n, i) => {
        const found = sameComps(comp, n.comp);
        if (found) nodesToMatch.splice(i, 1);
        return found;
      });
      if (!node) {
        node = {
          comp,
          root,
          parent,
          globalStyle,
          children: new Set(),
        };
        node.el = comp.create?.call(node);
        parent.children.add(node);
      }
      node.comp = comp;
      return node;
    });

    return nodesToRender.map((node) => {
      const comp = node.comp;

      if (comp.children) mountChildren(node, comp.children);
      comp.render?.call(node);
      if (!node.active) comp.mount?.call(node, parentEl);

      node.active = true;
      return node;
    });
  }

  return root;
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

export function style(obj) {
  return mapEntries(obj, ([k, v]) => ["style." + k, v]);
}

export function onEvent(obj) {
  return mapEntries(obj, ([k, v]) => ["on." + k, v]);
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
