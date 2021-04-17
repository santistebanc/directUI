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

export const components = new Set();

export function mountToDOM(base, comp, props = {}) {
  components.add(comp);

  let prevChildren = [];

  const inst = comp.render(props);

  const { classes } = inst;
  const isText = classes.includes("text");

  comp.el = document.createElement(isText ? "span" : "div");
  let styles = {};

  Auto(() => {
    if (!comp.el) return;
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
      ["opacity"]: `${comp.el.style.opacity}`,
      ["transform"]: `translate(${x}px,${y}px)`,
      ["width"]: `${width}px`,
      ["height"]: `${height}px`,
    };

    if (isText) {
      styles = {
        ...styles,
        ["font-family"]: fontFamily,
        ["font-size"]: `${fontSize}px`,
        ["line-height"]: `${lineHeight}px`,
      };
    }

    comp.el.style.cssText = getStylesString(styles);

    if (text) comp.el.textContent = text;
  });

  comp.el.style.opacity = "0";
  setTimeout(() => (comp.el.style.opacity = "1"), 0);

  if (inst.childrenProp) {
    Auto(() => {
      if (!comp.el) return;
      const { childrenProp, propsToPassDown } = inst;

      const { added, removed } = getDiff(prevChildren, childrenProp);

      added.forEach((child) => {
        mountToDOM(
          comp.el,
          child,
          propsToPassDown[childrenProp.indexOf(child)]
        );
      });
      removed.forEach((child) => {
        child.el.style.opacity = "0";
        setTimeout(() => {
          child.el.remove();
          child.el = null;
          components.delete(child);
        }, 500);
      });

      prevChildren = childrenProp;
    });
  }

  base.appendChild(comp.el);

  return inst;
}
