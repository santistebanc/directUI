import Cached from "../Memo/Cached";
import { Component } from "./Component";
import {
  DEFAULT_FONT,
  DEFAULT_FONT_SIZE,
  DEFAULT_LINE_HEIGHT,
} from "../constants";
import { getStylesString, mapEntries } from "../utils";
import { useDOMEventListeners, useStyle } from "../dom";

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
};

export const getCharWidth = Cached(
  ({ char, fontSize, font }) =>
    !font.loading
      ? font.getWidth(char, fontSize)
      : DEFAULT_FONT.getWidth(char, fontSize),
  { char: " ", ...defaultProps },
  { name: "getCharWidth" }
);

export const getStringWidth = Cached(
  ({ text, fontSize, font }) =>
    text
      .split("")
      .reduce((sum, char) => sum + getCharWidth({ char, fontSize, font }), 0),
  defaultProps,
  { name: "getStringWidth" }
);

export const getWords = Cached(
  ({ text, fontSize, font }) => {
    const spaceWidth = getStringWidth({ text: " ", fontSize, font });
    let widthSoFar = 0;
    return text.split(" ").map((wordText, i) => {
      const wordWidth = getStringWidth({ text: wordText, fontSize, font });
      widthSoFar += wordWidth + (i > 0 ? spaceWidth : 0);
      return { wordText, wordWidth, widthSoFar };
    });
  },
  defaultProps,
  { name: "getWords" }
);

export const getLines = Cached(
  (props) => {
    const { text, fontSize, font } = props;

    if (!text.length) return 0;

    const spaceWidth = getStringWidth({ text: " ", fontSize, font });
    const availableWidth = getMaxWidth(props);

    const words = getWords({ text, fontSize, font });
    const totalWidth = words[words.length - 1].widthSoFar;
    const aproxCutPoint = Math.ceil(
      (words.length * availableWidth) / totalWidth
    );
    let lines = 0;
    let pointerIdx = 0;
    let usedWidth = 0;
    do {
      lines++;
      pointerIdx = findCutIndex(
        availableWidth + usedWidth + (lines > 1 ? spaceWidth : 0),
        pointerIdx + aproxCutPoint
      );
      if (pointerIdx < words.length) {
        usedWidth = words[pointerIdx].widthSoFar;
      }
    } while (pointerIdx < words.length - 1);

    function findCutIndex(limitWidth, idx, discarded) {
      if (limitWidth > words[words.length - 1].widthSoFar)
        return words.length - 1; //the whole text can fit
      if (idx <= 0) return 0; //only one word fits
      if (idx > words.length - 1 || words[idx].widthSoFar > limitWidth) {
        if (discarded === "down") return idx - 1; //found it
        return findCutIndex(limitWidth, idx - 1, "up");
      } else {
        if (discarded === "up") return idx; //found it
        return findCutIndex(limitWidth, idx + 1, "down");
      }
    }

    return lines;
  },
  defaultProps,
  { name: "getLines" }
);

export const getMaxWidth = Cached(
  ({ maxWidth, text, fontSize, font }) => {
    const words = getWords({ text, fontSize, font });
    return Math.min(maxWidth, words[words.length - 1].widthSoFar);
  },
  defaultProps,
  { name: "text_getMaxWidth" }
);

export const width = Cached(
  (props) => {
    const { maxWidth } = props;
    if (getLines(props) > 1) return maxWidth;
    return getMaxWidth(props);
  },
  defaultProps,
  { name: "text_width" }
);

export const height = Cached(
  (props) => {
    const { lineHeight } = props;
    const linesCount = getLines(props);
    return linesCount * lineHeight;
  },
  defaultProps,
  { name: "text_height" }
);

export const TextComponent = Component(
  useDOMEventListeners,
  useStyle,
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
    style,
    transitionTime,
  } = this.comp;

  const styles = {
    opacity: `${el.style.opacity}`,
    transform: `translate(${x}px,${y}px)`,
    width: `${width}px`,
    height: `${height}px`,
    overflow: "hidden",
    transition: `all ease-in-out ${transitionTime || 200}ms, height 0s`,
    "font-family": font.fontFamily,
    "font-size": `${fontSize}px`,
    "line-height": `${lineHeight}px`,
    ...style,
  };

  el.style.cssText = getStylesString(styles);
  el.textContent = text;
}
