import Cached from "../Cache/Cached";
import Collection from "../Cache/Collection";
import { Component } from "./Component";
import { ensureArray } from "../utils";

export const defaultProps = {
  index: 0,
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

export const getDimensions = Cached(
  (props) => {
    const {
      childIndex,
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

    if (childIndex > 0) {
      const {
        itemX,
        itemY,
        itemWidth,
        singleLineHeight,
        containerWidth,
        containerHeight,
      } = getDimensions({ ...props, childIndex: childIndex - 1 });

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

    const renderedChild = children[childIndex](propsToPass);
    const calculatedWidth = renderedChild.width;
    const calculatedHeight = renderedChild.height;

    if (
      childIndex === 0 ||
      startX + calculatedWidth <= availableWidth + paddingLeft
    ) {
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
  },
  { name: "dims" }
);

export const children = Cached((props) => {
  const { children } = props;
  return children.map((child, index) => {
    const dimensions = getDimensions({ ...props, childIndex: index });

    const propsToPassDown = {
      maxWidth: dimensions.itemWidth,
      maxHeight: dimensions.itemHeight,
      x: dimensions.itemX,
      y: dimensions.itemY,
      index,
    };

    return child(propsToPassDown);
  });
});

export const width = Cached((props) => {
  const { children, width } = props;
  return (
    width ??
    (children.length
      ? getDimensions({ ...props, childIndex: children.length - 1 })
          .containerWidth
      : 0)
  );
});

export const height = Cached((props) => {
  const { children, height } = props;
  return (
    height ??
    (children.length
      ? getDimensions({ ...props, childIndex: children.length - 1 })
          .containerHeight
      : 0)
  );
});

export const BoxComponent = Component((atts) => {
  const props = { ...defaultProps, ...atts };
  return {
    ...props,
    width: width(props),
    height: height(props),
    children: children(props),
    type: "box",
  };
});

const childrenCollection = Collection();

export function ch(obj) {
  return childrenCollection.getOrAdd(obj, (idd) => {
    console.log("created new children collection", idd);
    return obj;
  });
}

export function Box(...args) {
  const parsedArgs = args[0].children
    ? ch(ensureArray(args[0]))
    : args[0]?.length
    ? {
        children: ch(ensureArray(args[0])),
        ...args[1],
      }
    : args[0];
  return BoxComponent(parsedArgs);
}
