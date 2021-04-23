import { Component } from "./Component";
import { Cached } from "./direct";
import {
  clone,
  defineGetters,
  gettersToObj,
  indicesOf,
  isFunction,
  mapEntries,
  objectIsEqual,
} from "./utils";

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
  } = props;

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

  const renderedChild = children[index].render(propsToPass);
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

export const children = Cached((props) => {
  const { children, template, id } = props;

  const childrenWithId = children.map((child, i) => {
    const count = children.filter((x) => x == child).length;
    const countAfter = children.slice(i).filter((x) => x == child).length;
    return [child, count - countAfter];
  });

  const childrenCopy = [...children];

  return childrenWithId.map(([child, childId], idx) => {
    const dimensions = (prop) => ({ family }) => {
      const index = indicesOf(props.children, child)[childId];
      if (typeof index !== "undefined") {
        return getDimensions(index, props)[prop];
      } else {
        const propsWithFixedChildren = defineGetters(
          clone(props),
          { children: family },
          (prop) => prop
        );
        return getDimensions(idx, propsWithFixedChildren)[prop];
      }
    };

    const propsToPassDown = {
      maxWidth: dimensions("itemWidth"),
      maxHeight: dimensions("itemHeight"),
      x: dimensions("itemX"),
      y: dimensions("itemY"),
      family: childrenCopy,
      parentTemplate: template,
      parentId: id,
      id: childId,
    };

    return child.render(propsToPassDown);
  });
});

export const width = Cached((props) => {
  const { children, width } = props;
  return (
    width ??
    (children.length
      ? getDimensions(children.length - 1, props).containerWidth
      : 0)
  );
});

export const height = Cached((props) => {
  const { children, height } = props;
  return (
    height ??
    (children.length
      ? getDimensions(children.length - 1, props).containerHeight
      : 0)
  );
});

export const BoxComponent = Component("box", defaultProps, {
  childrenProp: ({ children }) => children,
  children,
  width,
  height,
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
