import { Auto, State } from "./direct";
import { ensureArray, mapEntries, parsePrefix } from "./utils";
import opentype from "opentype.js";
import reset from "./reset";

export function mountToDOM(
  renderFunc,
  { selector = "body", font, initialStyles = "" } = {}
) {
  const base = document.querySelector(selector);
  //create <style> element in <head> for global styles
  const styleEl = document.createElement("style");
  styleEl.appendChild(
    document.createTextNode(reset(selector).concat(initialStyles))
  );
  document.head.appendChild(styleEl);
  const sheet = styleEl.sheet;

  const root = { el: base, sheet, children: [] };

  if (font) {
    sheet.insertRule(`
      @font-face {
        font-family: "${font().fontFamily}";
        src: url("${font().src}");
      }
    `);
  }

  Auto(() => {
    if (font && font().loading) return;
    const comps = ensureArray(renderFunc());
    mountChildren(root, comps);
  });

  function mountChildren(parent, comps) {
    const parentEl = parent.el;

    //deactivate and unmount nodes that are no longer in the current children
    const activeNodes = parent.children.filter((n) => n.active);
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

    //create new nodes that were not in the parent.children
    let nodesToMatch = [...parent.children];
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
          sheet,
          children: [],
        };
        node.el = comp.create?.call(node);
        parent.children.push(node);
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
  return comp.id
    ? { id: comp.id, output: comp.output }
    : { output: comp.output };
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

export function Font(src, fontFamily, getWidth) {
  const font = State({ src, fontFamily, loading: true, getWidth });
  opentype.load(src).then((res) =>
    font.set({
      loading: false,
      src,
      fontFamily,
      getWidth: (text, fontSize) => res.getAdvanceWidth(text, fontSize),
    })
  );
  return font;
}

export function withDOMEventListeners(atts) {
  return { on: parsePrefix(atts, "on") };
}

export function withStyle(atts) {
  return { style: parsePrefix(atts, "style") };
}