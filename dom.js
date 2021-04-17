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
  const el = document.createElement("div");

  let prevChildren = [];

  const inst = comp.render({ el, ...props });

  Auto(() => {
    const { x, y, width, height, text } = inst;

    const styles = {
      ["transform"]: `translate(${x}px,${y}px)`,
      ["width"]: `${width}px`,
      ["height"]: `${height}px`,
    };

    el.style.cssText = getStylesString(styles);

    if (text) el.textContent = text;
  });

  if (inst.childrenProp) {
    Auto(() => {
      const { childrenProp, propsToPassDown } = inst;

      const { added, removed, kept } = getDiff(prevChildren, childrenProp);
      added.forEach((child) => {
        mountToDOM(el, child, propsToPassDown[childrenProp.indexOf(child)]);
      });
      // removed.forEach((child) => mountToDOM(el, child));

      prevChildren = childrenProp;
    });
  }

  base.appendChild(el);

  return inst;
}
