import Collection from "./Collection";
import { Auto } from "./direct";
import { getDiff, mapEntries, serializeProps } from "./utils";

function getStylesString(styles) {
  return Object.entries(styles).reduce(
    (str, [key, val]) => `${str}${key}: ${val};`,
    ""
  );
}

const deactivate = (node) => {
  node.children?.forEach((ch) => deactivate(ch));
  node.isActive = false;
};

export function mountToDOM(parentEl, rootComponent) {
  const root = {
    parent: null,
    comp: rootComponent,
    parentEl,
    active: true,
    children: [],
  };
  root.el = mount(parentEl, root);
  root.render = render(root);
  if (rootComponent.children) root.watcher = watchChildren(root);

  function watchChildren(parentNode) {
    const prevNodes = new Set();
    const nodes = Collection();
    return Auto(() => {
      const { children } = parentNode.comp;
      const getKeys = (comp) =>
        comp.id
          ? { type: comp.type, id: comp.id }
          : {
              ...serializeProps(comp.passedProps, comp.defaultProps),
              type: comp.type,
            };

      const sameComps = (c1, c2) => {
        const k1 = getKeys(c1);
        const k2 = getKeys(c2);
        return (
          Object.keys(k1).length === Object.keys(k2).length &&
          !Object.entries(k1).some(([k, v]) => k2[k] !== v)
        );
      };

      const removedNodes = [...prevNodes.values()].filter(
        (n) => n.active && !children.some((ch) => sameComps(ch, n.comp))
      );

      removedNodes.forEach((toBeRemovedNode) => {
        deactivate(toBeRemovedNode);
        function deactivate(node) {
          node.children?.forEach((ch) => deactivate(ch));
          node.active = false;
          node.render?.cleanup();
          node.watcher?.cleanup();
          node.render = null;
          node.watcher = null;
        }
        unmount(toBeRemovedNode);
      });

      prevNodes.clear();

      children.forEach((child) => {
        const keys = getKeys(child);

        console.log("keeeeeys", keys);

        const node = nodes.getOrAdd(keys, () => {
          const toBeAddedNode = {
            parent: parentNode,
            parentEl: parentNode.el,
            children: [],
          };
          console.log("created component", toBeAddedNode);
          parentNode.children.push(toBeAddedNode);
          return toBeAddedNode;
        });

        node.comp = child;
        if (!node.active) node.el = mount(parentNode.el, node);

        node.active = true;

        if (!node.render) node.render = render(node);
        if (child.children && !node.watcher) node.watcher = watchChildren(node);

        prevNodes.add(node);
      });
    });
  }
  function render(node) {
    return Auto(() => {
      const isText = node.comp.type === "text";
      const isInput = node.comp.type === "input";

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
      } = node.comp;

      let styles = { ...style };

      styles = {
        ...styles,
        opacity: `${node.el.style.opacity}`,
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

      node.el.style.cssText = getStylesString(styles);

      if (text) node.el.textContent = text;
    }, node.comp.text);
  }
  function mount(parentEl, node) {
    const { type } = node.comp;
    const isText = type === "text";
    const isInput = type === "input";
    const tag = isText ? "span" : isInput ? "textarea" : "div";
    const el = document.createElement(tag);
    if (node.exitTimeout) clearTimeout(node.exitTimeout);
    el.style.opacity = "0";
    setTimeout(() => (el.style.opacity = "1"), 0);
    parentEl.appendChild(el);
    return el;
  }
  function unmount(node) {
    node.el.style.opacity = "0";
    node.exitTimeout = setTimeout(() => {
      node.el.remove();
    }, node.transitionTime || 200);
  }

  return root;
}

const styles = Collection();

export function style(obj) {
  return styles.getOrAdd(obj, (idd) => {
    console.log("created new style", idd);
    return obj;
  });
}
