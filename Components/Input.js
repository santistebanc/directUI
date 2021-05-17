import Cached from "../Cache/Cached";
import { Component } from "./Component";
import { DEFAULT_FONT_SIZE, DEFAULT_LINE_HEIGHT } from "../constants";
import { width as textWidth, height as textHeight } from "./Text";
import { getStylesString, mapEntries } from "../utils";
import { State } from "../direct";

export const defaultProps = {
  index: 0,
  fontSize: DEFAULT_FONT_SIZE,
  lineHeight: DEFAULT_LINE_HEIGHT,
  maxHeight: Infinity,
  maxWidth: Infinity,
  x: 0,
  y: 0,
  font: null,
  paddingLeft: 0,
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  width: null,
  height: null,
  expandX: true,
  expandY: false,
};

export const width = Cached((props) => {
  const { width, maxWidth, expandX } = props;
  const txtWidth = textWidth(props);
  const resWidth = width != null ? width : expandX ? maxWidth : txtWidth;
  return Math.min(maxWidth, Math.max(txtWidth, resWidth));
});

export const height = Cached((props) => {
  const { height, maxHeight, lineHeight, expandY } = props;
  const txtHeight = textHeight(props);
  const resHeight = height != null ? height : expandY ? maxHeight : lineHeight;
  return Math.min(maxHeight, Math.max(txtHeight, resHeight));
});

export const InputComponent = Component((atts) => {
  const props = { ...defaultProps, ...atts };
  return {
    ...props,
    width: width(props),
    height: height(props),
    fontFamily: props.font?.names.fontFamily.en ?? "Courier New",
    style: {
      ...(props.style ?? {}),
      ...Object.fromEntries(
        Object.entries(props)
          .filter(([k]) => k.startsWith("style."))
          .map(([k, v]) => [k.substring("style.".length), v])
      ),
    },
    on: {
      ...(props.on ?? {}),
      ...Object.fromEntries(
        Object.entries(props)
          .filter(([k]) => k.startsWith("on."))
          .map(([k, v]) => [k.substring("on.".length), v])
      ),
    },
    type: "input",
    create,
    mount,
    unmount,
    render,
  };
});

export function Input(...args) {
  const parsedArgs =
    typeof args[0] === "object" ? args[0] : { text: args[0], ...args[1] };
  return InputComponent(parsedArgs);
}

//dom

export function create() {
  console.log("+++++++++++++++++++++++++++++++++++++++crete called");
  const { text, on } = this.comp;
  this.text = State(text ?? "");
  const el = document.createElement("input");
  this.eventListeners = mapEntries(on, ([k, v]) => [
    k,
    el.addEventListener(k, v),
  ]);
  el.oninput = (e) => this.text.set(e.target.value);
  return el;
}

export function mount(parentEl) {
  const el = this.el;
  if (this.exitTimeout) clearTimeout(this.exitTimeout);
  el.style.opacity = "0";
  setTimeout(() => (el.style.opacity = "1"), 0);
  parentEl.appendChild(el);
}

export function unmount() {
  const el = this.el;
  el.style.opacity = "0";
  this.exitTimeout = setTimeout(() => {
    el.remove();
  }, this.transitionTime || 200);
}

export function render() {
  const el = this.el;
  const {
    x,
    y,
    width,
    height,
    fontFamily,
    fontSize,
    lineHeight,
    style,
    transitionTime,
  } = this.comp;

  const styles = {
    ...style,
    opacity: `${el.style.opacity}`,
    transform: `translate(${x}px,${y}px)`,
    width: `${width}px`,
    height: `${height}px`,
    transition: `all ease-in-out ${transitionTime || 200}ms`,
    "font-family": fontFamily,
    "font-size": `${fontSize}px`,
    "line-height": `${lineHeight}px`,
  };

  el.style.cssText = getStylesString(styles);
  if (typeof this.text !== "undefined") el.value = this.text();
}
