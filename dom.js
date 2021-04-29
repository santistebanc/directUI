import Collection from "./Collection";
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

export function mountToDOM(base, comp, renderer = AbsoluteRenderer()) {
  let prevChildren = [];
  const inst = comp.isTemplate ? comp.render() : comp;
  inst.base = base;

  const { onMount, autos } = renderer(inst);

  onMount();
  inst.isActive = true;

  if (inst.children) {
    Auto(() => {
      if (!inst.isActive) return;
      const { children } = inst;
      const { dif } = getDiff(prevChildren, children);

      dif.forEach(([child, action]) => {
        if (action === -1) {
          deactivate(child);
          renderer(child).onUnmount();
        } else if (action === 1) {
          mountToDOM(inst.el, child);
        }
      });

      prevChildren = children;
    });
  }

  autos.forEach((attr) => {
    Auto(() => {
      if (!inst.isActive) return;
      attr();
    });
  });

  return inst;
}

export function AbsoluteRenderer() {
  return (inst) => {
    const { base, type } = inst;

    const isText = type === "text";
    const isInput = type === "input";
    const tag = isText ? "span" : isInput ? "textarea" : "div";
    const onMount = () => {
      if (!inst.el) inst.el = document.createElement(tag);
      if (inst.exitTimeout) clearTimeout(inst.exitTimeout);
      inst.el.style.opacity = "0";
      setTimeout(() => (inst.el.style.opacity = "1"), 0);
      base.appendChild(inst.el);
    };
    const onUnmount = () => {
      inst.el.style.opacity = "0";
      inst.exitTimeout = setTimeout(() => {
        inst.el.remove();
      }, inst.transitionTime || 200);
    };
    const autos = [
      () => {
        const {
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
        } = inst;

        let styles = { ...style };

        styles = {
          ...styles,
          opacity: `${inst.el.style.opacity}`,
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

        inst.el.style.cssText = getStylesString(styles);

        if (text) inst.el.textContent = text;

        return styles;
      },
    ];
    return { onUnmount, onMount, autos };
  };
}

const styles = Collection();

export function style(obj) {
  return styles.getOrAdd(obj, (idd) => {
    console.log("created new style", idd);
    return obj;
  });
}