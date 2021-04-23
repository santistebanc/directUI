import { Component } from "./Component";
import { DEFAULT_FONT_SIZE, DEFAULT_LINE_HEIGHT } from "./constants";
import { Cached } from "./direct";
import { width as textWidth, height as textHeight } from "./Text";

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

export const width = Cached((props) => {
  const { width, maxWidth, expandX } = props;
  const textWidth = textWidth(props);
  const resWidth = width != null ? width : expandX ? maxWidth : textWidth;
  return Math.min(maxWidth, Math.max(textWidth, resWidth));
});

export const height = Cached((props) => {
  const { height, maxHeight, lineHeight, expandY } = props;
  const textHeight = textHeight(props);
  const resHeight = height != null ? height : expandY ? maxHeight : lineHeight;
  return Math.min(maxHeight, Math.max(textHeight, resHeight));
});

export const InputComponent = Component("input", defaultProps, {
  width,
  height,
  fontFamily: ({ font }) => font?.call()?.names.fontFamily.en ?? "Courier New",
});

export function Input(...args) {
  const parsedArgs = args[0].text ? args[0] : { text: args[0], ...args[1] };
  return InputComponent(parsedArgs);
}
