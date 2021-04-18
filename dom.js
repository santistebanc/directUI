import { Auto } from "./direct";

function getStylesString(styles) {
  return Object.entries(styles).reduce(
    (str, [key, val]) => `${str}${key}: ${val};`,
    ""
  );
}

function getDiff(prev, next) {
  const removed = [];
  const kept = [];
  prev.forEach((it) => (next.includes(it) ? kept.push(it) : removed.push(it)));
  const added = next.filter((it) => !kept.includes(it));
  return { removed, added, kept };
}

export function mountToDOM(base, comp, props = {}) {
  let prevChildren = [];

  const inst = comp.isTemplate ? comp.render(props) : comp;

  const { type } = inst;
  const isText = type === "text";
  const isInput = type === "input";

  inst.el =
    inst.el ??
    document.createElement(isText ? "span" : isInput ? "textarea" : "div");

  inst.isActive = true;

  let styles = {};
  Auto(() => {
    if (!inst.isActive) return;
    const {
      x,
      y,
      width,
      height,
      text,
      fontFamily,
      fontSize,
      lineHeight,
    } = inst;

    styles = {
      ...styles,
      ["opacity"]: `${inst.el.style.opacity}`,
      ["transform"]: `translate(${x}px,${y}px)`,
      ["width"]: `${width}px`,
      ["height"]: `${height}px`,
    };

    if (isText || isInput) {
      styles = {
        ...styles,
        ["font-family"]: fontFamily,
        ["font-size"]: `${fontSize}px`,
        ["line-height"]: `${lineHeight}px`,
      };
    }

    inst.el.style.cssText = getStylesString(styles);

    if (text) inst.el.textContent = text;
  });

  inst.el.style.opacity = "0";
  setTimeout(() => (inst.el.style.opacity = "1"), 0);

  if (inst.children) {
    Auto(() => {
      if (!inst.isActive) return;
      const { children } = inst;

      const { added, removed } = getDiff(prevChildren, children);

      added.forEach((child) => {
        mountToDOM(inst.el, child);
      });
      removed.forEach((child) => {
        child.el.style.opacity = "0";
        setTimeout(() => {
          child.isActive = false;
          child.el.remove();
        }, 500);
      });

      prevChildren = children;
    });
  }

  base.appendChild(inst.el);

  return inst;
}
