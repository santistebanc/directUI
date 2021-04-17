import { Component } from "./Component";
import { Cached, parse } from "./direct";
import { isFunction } from "./utils";

export const defaultProps = {
  type: "box",
  children: [],
  paddingLeft: 0,
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  gapHorizontal: 0,
  gapVertical: 0,
  width: null,
  height: null,
  maxHeight: Infinity,
  maxWidth: Infinity,
  x: 0,
  y: 0,
};

export const getDimensions = Cached((index, props) => {
  const {
    children,
    width,
    height,
    maxWidth,
    maxHeight,
    paddingLeft,
    paddingTop,
    paddingRight,
    paddingBottom,
    gapHorizontal,
    gapVertical,
  } = parse(props);

  let startX = paddingLeft;
  let startY = paddingTop;
  let currentHeight = 0;
  let totalWidth = 0;
  let totalHeight = 0;

  if (index > 0) {
    const {
      itemX,
      itemY,
      itemWidth,
      singleLineHeight,
      containerWidth,
      containerHeight,
    } = getDimensions(index - 1, props);

    startX = itemX + itemWidth + gapHorizontal;
    startY = itemY;
    currentHeight = singleLineHeight;
    totalWidth = containerWidth;
    totalHeight = containerHeight - paddingBottom - paddingTop;
  }

  const availableWidth = (width ?? maxWidth) - paddingLeft - paddingRight;
  const availableHeight = (height ?? maxHeight) - paddingTop - paddingBottom;

  const propsToPass = {
    maxHeight: availableHeight,
    maxWidth: availableWidth,
  };
  const child = children[index].render(propsToPass);
  const calculatedWidth = child.width;
  const calculatedHeight = child.height;

  if (index === 0 || startX + calculatedWidth <= availableWidth + paddingLeft) {
    return {
      itemX: startX,
      itemY: startY,
      itemWidth: calculatedWidth,
      itemHeight: calculatedHeight,
      singleLineHeight: Math.max(currentHeight, calculatedHeight),
      containerWidth: Math.max(
        totalWidth,
        startX + calculatedWidth + paddingRight
      ),
      containerHeight: Math.max(
        totalHeight,
        totalHeight -
          currentHeight +
          Math.max(currentHeight, calculatedHeight) +
          paddingTop +
          paddingBottom
      ),
    };
  } else {
    return {
      itemX: paddingLeft,
      itemY: startY + currentHeight + gapVertical,
      itemWidth: calculatedWidth,
      itemHeight: calculatedHeight,
      singleLineHeight: calculatedHeight,
      containerWidth: Math.max(
        totalWidth,
        paddingLeft + availableWidth + paddingRight
      ),
      containerHeight: Math.max(
        totalHeight,
        totalHeight +
          calculatedHeight +
          gapVertical +
          paddingTop +
          paddingBottom
      ),
    };
  }
});

export const getPropsToPassDown = (props) => {
  const { children } = parse(props);

  return children.map((child, idx) => ({
    maxWidth: () => getDimensions(idx, props).itemWidth,
    maxHeight: () => getDimensions(idx, props).itemHeight,
    x: () => getDimensions(idx, props).itemX,
    y: () => getDimensions(idx, props).itemY,
  }));
};

export const getChildren = (props) => {
  const { children } = parse(props);

  const propsToPass = getPropsToPassDown(props);

  return children.map((child, idx) => {
    return child.render(propsToPass[idx]);
  });
};

export const getWidth = (props) => {
  const { children, width } = parse(props);
  return (
    width ??
    (children.length
      ? getDimensions(children.length - 1, props).containerWidth
      : 0)
  );
};

export const getHeight = (props) => {
  const { children, height } = parse(props);
  return (
    height ??
    (children.length
      ? getDimensions(children.length - 1, props).containerHeight
      : 0)
  );
};

export const BoxComponent = Component(defaultProps, {
  childrenProp: ({ children }) => children(),
  children: getChildren,
  propsToPassDown: getPropsToPassDown,
  width: getWidth,
  height: getHeight,
  x: ({ x }) => x(),
  y: ({ y }) => y(),
});

export function Box(...args) {
  const parsedArgs = args[0].children
    ? args[0]
    : {
        children: isFunction(args[0])
          ? args[0]
          : Array.isArray(args[0])
          ? args[0]
          : [args[0]],
        ...args[1],
      };
  return BoxComponent(parsedArgs);
}
