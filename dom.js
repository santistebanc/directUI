import { Auto } from "./direct";
import { getDiff } from "./utils";

function getStylesString(styles) {
  return Object.entries(styles).reduce(
    (str, [key, val]) => `${str}${key}: ${val};`,
    ""
  );
}

const deactivate = (comp) => {
  comp.children?.forEach((ch) => deactivate(ch));
  comp.isActive = false;
};

export function mountToDOM(base, comp) {
  let prevChildren = [];

  const inst = comp.isTemplate ? comp.render() : comp;

  inst.parent = inst.parent ?? "root";

  const { type } = inst;
  const isText = type === "text";
  const isInput = type === "input";

  inst.el =
    inst.el ??
    document.createElement(isText ? "span" : isInput ? "textarea" : "div");

  inst.isActive = true;

  if (inst.children) {
    Auto(() => {
      if (!inst.isActive) return;

      const { children } = inst;

      const { added, removed } = getDiff(prevChildren, children);

      removed.forEach((child) => {
        deactivate(child);
        child.el.style.opacity = "0";
        setTimeout(() => {
          child.el.remove();
        }, 500);
      });

      added.forEach((child) => {
        const newComp = mountToDOM(inst.el, child, inst);
        newComp.parent = inst;
      });

      prevChildren = children;
    });
  }

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

  base.appendChild(inst.el);

  return inst;
}
