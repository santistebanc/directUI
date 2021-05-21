import Cached from "../Memo/Cached";
import { Component } from "./Component";
import {
  DEFAULT_FONT,
  DEFAULT_FONT_SIZE,
  DEFAULT_LINE_HEIGHT,
} from "../constants";
import { width as textWidth, height as textHeight } from "./Text";
import { getStylesString, mapEntries, parsePrefixes } from "../utils";
import { State } from "../direct";
import { parseOutput } from "../dom";

export const defaultProps = {
  text: "",
  index: 0,
  fontSize: DEFAULT_FONT_SIZE,
  lineHeight: DEFAULT_LINE_HEIGHT,
  maxHeight: Infinity,
  maxWidth: Infinity,
  x: 0,
  y: 0,
  font: DEFAULT_FONT,
  paddingLeft: 0,
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  width: null,
  height: null,
  expandX: true,
  expandY: false,
};

export const width = Cached(
  (props) => {
    const { width, maxWidth, expandX } = props;
    const txtWidth = textWidth(props);
    const resWidth = width != null ? width : expandX ? maxWidth : txtWidth;
    return Math.min(maxWidth, Math.max(txtWidth, resWidth));
  },
  defaultProps,
  { name: "input_width" }
);

export const height = Cached(
  (props) => {
    const { height, maxHeight, lineHeight, expandY } = props;
    const txtHeight = textHeight(props);
    const resHeight =
      height != null ? height : expandY ? maxHeight : lineHeight;
    return Math.min(maxHeight, Math.max(txtHeight, resHeight));
  },
  defaultProps,
  { name: "input_height" }
);

export const InputComponent = Component(
  (atts) =>
    parseOutput({
      atts,
      defaultProps,
      props: {
        create,
        mount,
        unmount,
        render,
      },
      resolvers: {
        width,
        height,
      },
    }),
  { name: "input" }
);

export function Input(...args) {
  const parsedArgs =
    typeof args[0] === "object" ? args[0] : { text: args[0], ...args[1] };
  return InputComponent(parsedArgs);
}

//dom

export function create() {
  const { text, on } = this.comp;
  const el = document.createElement("input");
  this.eventListeners = mapEntries(on, ([k, v]) => [
    k,
    el.addEventListener(k, v),
  ]);
  this.userText = text;
  this.text = text;
  el.oninput = (e) => (this.text = e.target.value);
  return el;
}

const exitTimeout = Symbol();
export function mount(parentEl) {
  const el = this.el;
  if (this[exitTimeout]) clearTimeout(this[exitTimeout]);
  el.style.opacity = "0";
  setTimeout(() => (el.style.opacity = "1"), 0);
  parentEl.appendChild(el);
}

export function unmount() {
  const el = this.el;
  el.style.opacity = "0";
  this[exitTimeout] = setTimeout(() => {
    el.remove();
  }, this.transitionTime || 200);
}

export function render() {
  const el = this.el;
  const {
    x,
    y,
    text,
    width,
    height,
    font,
    fontSize,
    lineHeight,
    style,
    transitionTime,
  } = this.comp;

  const styles = {
    opacity: `${el.style.opacity}`,
    transform: `translate(${x}px,${y}px)`,
    width: `${width}px`,
    height: `${height}px`,
    transition: `all ease-in-out ${transitionTime || 200}ms`,
    "font-family": font.fontFamily,
    "font-size": `${fontSize}px`,
    "line-height": `${lineHeight}px`,
    ...style,
  };

  el.style.cssText = getStylesString(styles);
  if (text !== this.userText) {
    this.userText = text;
    this.text = text;
  }
  el.value = this.text;
}
