import { Component } from "./Component";
import { Cached, parse } from "./direct";
import { isFunction, objectIsEqual } from "./utils";

export const defaultProps = {
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

export function getIndexOfChild(children, child) {
  return children.indexOf(child) !== -1
    ? children.indexOf(child)
    : children.findIndex(
        (ch) =>
          ch.attributes &&
          child.attributes &&
          objectIsEqual(ch.attributes, child.attributes)
      );
}

export const getDimensions = Cached((child, props) => {
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

  const index = getIndexOfChild(children, child);

  if (index > 0) {
    const {
      itemX,
      itemY,
      itemWidth,
      singleLineHeight,
      containerWidth,
      containerHeight,
    } = getDimensions(children[index - 1], props);

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
  const renderedChild = child.render(propsToPass);
  const calculatedWidth = renderedChild.width;
  const calculatedHeight = renderedChild.height;

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
  const { children, self } = parse(props);

  return children.map((child) => ({
    maxWidth: () => getDimensions(child, props).itemWidth,
    maxHeight: () => getDimensions(child, props).itemHeight,
    x: () => getDimensions(child, props).itemX,
    y: () => getDimensions(child, props).itemY,
    parent: self,
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
      ? getDimensions(children[children.length - 1], props).containerWidth
      : 0)
  );
};

export const getHeight = (props) => {
  const { children, height } = parse(props);
  return (
    height ??
    (children.length
      ? getDimensions(children[children.length - 1], props).containerHeight
      : 0)
  );
};

export const BoxComponent = Component("box", defaultProps, {
  childrenProp: ({ children }) => children(),
  children: getChildren,
  propsToPassDown: getPropsToPassDown,
  width: getWidth,
  height: getHeight,
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
