import { Component } from "./Component";
import { DEFAULT_FONT_SIZE, DEFAULT_LINE_HEIGHT } from "./constants";
import { Computed, parse } from "./direct";
import { getWidth as getTextWidth, getHeight as getTextHeight } from "./Text";

export const defaultProps = {
  text: "",
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

export const getWidth = (props) => {
  const { width, maxWidth, expandX } = parse(props);
  const textWidth = getTextWidth(props);
  const resWidth = width != null ? width : expandX ? maxWidth : textWidth;
  return Math.min(maxWidth, Math.max(textWidth, resWidth));
};

export const getHeight = (props) => {
  const { height, maxHeight, lineHeight, expandY } = parse(props);
  const textHeight = getTextHeight(props);
  const resHeight = height != null ? height : expandY ? maxHeight : lineHeight;
  return Math.min(maxHeight, Math.max(textHeight, resHeight));
};

export const InputComponent = Component("input", defaultProps, {
  width: getWidth,
  height: getHeight,
  fontFamily: ({ font }) => font()?.names.fontFamily.en ?? "Courier New",
});

export function Input(...args) {
  const parsedArgs = args[0].text ? args[0] : { text: args[0], ...args[1] };
  return InputComponent(parsedArgs);
}
