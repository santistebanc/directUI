import Cached from "../Memo/Cached";
import { Component } from "./Component";
import {
  DEFAULT_FONT,
  DEFAULT_FONT_SIZE,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_TEXT_ALIGN,
} from "../constants";
import { getStylesString, mapEntries } from "../utils";
import { withDOMEventListeners, withStyle } from "../dom";
import Memoized from "../Memo/Memoized";

export const defaultProps = {
  name: "text",
  index: 0,
  text: "",
  fontSize: DEFAULT_FONT_SIZE,
  lineHeight: DEFAULT_LINE_HEIGHT,
  maxHeight: Infinity,
  maxWidth: Infinity,
  x: 0,
  y: 0,
  font: DEFAULT_FONT,
  textAlign: DEFAULT_TEXT_ALIGN,
};

export const getCharWidth = Memoized(
  (char, font) =>
    !font.loading
      ? font.getWidth(char, DEFAULT_FONT_SIZE)
      : DEFAULT_FONT.getWidth(char, DEFAULT_FONT_SIZE),
  [" ", defaultProps.font],
  { name: "getCharWidth" }
);

export const getTextBreakPoints = Memoized(
  (text, font) =>
    text.split("").reduce(
      (res, c, i) => {
        if (c === " ") res[1].push(res[0]);
        res[0] += getCharWidth(c, font);
        if (i === text.length - 1) res[1].push(res[0]);
        return res;
      },
      [0, []]
    )[1],
  [" ", defaultProps.font],
  { name: "getTextBreakPoints" }
);

export const findBreakPoint = (arr, point) => {
  const p = Math.max(Math.min(point, arr[arr.length - 1]), arr[0]);
  let cursor = ~~(((p - arr[0]) * arr.length) / (arr[arr.length - 1] - arr[0]));
  if (cursor === arr.length) return arr.length - 1;
  while (true) {
    if (arr[cursor] <= p) {
      if (arr[cursor + 1] > p || cursor === arr.length - 1) {
        return cursor;
      } else {
        cursor++;
      }
    } else {
      cursor--;
    }
  }
};

export const width = (props) => {
  const { text, fontSize, font, maxWidth } = { ...defaultProps, ...props };
  const scale = DEFAULT_FONT_SIZE / fontSize;
  const textMaxWidth = getTextBreakPoints(text, font).slice(-1).pop() * scale;
  return Math.min(maxWidth, textMaxWidth);
};

export const height = Cached(
  (props) => {
    const { text, font, fontSize, lineHeight, maxWidth } = props;
    const scale = DEFAULT_FONT_SIZE / fontSize;
    const spaceWidth = getCharWidth(" ", font) * scale;
    if (text.split(" ").length === 1) return lineHeight;
    let breakpoints = getTextBreakPoints(text, font);
    let adjustedMaxWidth = maxWidth * scale;
    let lines = 0;
    let bp;
    do {
      bp = findBreakPoint(breakpoints, adjustedMaxWidth);
      adjustedMaxWidth =
        Math.max(breakpoints[bp] + maxWidth * scale, breakpoints[bp + 1]) +
        spaceWidth;
      lines++;
    } while (bp < breakpoints.length - 1);

    return lines * lineHeight;
  },
  defaultProps,
  { name: "text_height" }
);

export const TextComponent = Component(
  withDOMEventListeners,
  withStyle,
  {
    create,
    mount,
    unmount,
    render,
  },
  (atts) => ({ ...atts, width: width(atts), height: height(atts) })
)(defaultProps);

export function Text(...args) {
  const parsedArgs =
    typeof args[0] === "object" ? args[0] : { text: args[0] ?? "", ...args[1] };
  return TextComponent(parsedArgs);
}

//dom

export function create() {
  const { on } = this.comp;
  const el = document.createElement("span");
  this.eventListeners = mapEntries(on, ([k, v]) => [
    k,
    el.addEventListener(k, v),
  ]);
  return el;
}

const exitTimeout = Symbol();
export function mount(base) {
  const el = this.el;
  if (this[exitTimeout]) clearTimeout(this[exitTimeout]);
  el.style.opacity = "0";
  setTimeout(() => (el.style.opacity = "1"), 0);
  base.appendChild(el);
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
    width,
    height,
    text,
    font,
    fontSize,
    lineHeight,
    textAlign,
    style,
    transitionTime,
  } = this.comp;

  const styles = {
    opacity: `${el.style.opacity}`,
    transform: `translate(${x}px,${y}px)`,
    width: `${width}px`,
    height: `${height}px`,
    transition: `all ease-in-out ${transitionTime || 200}ms, height 0s`,
    "font-family": font.fontFamily,
    "font-size": `${fontSize}px`,
    "line-height": `${lineHeight}px`,
    "text-align": textAlign,
    "will-change": "transform, opacity width, height",
    contain: "size layout style paint",
    ...style,
  };

  el.style.cssText = getStylesString(styles);
  el.textContent = text;
}
