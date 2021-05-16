import Cached from "../Cache/Cached";
import { Component } from "./Component";
import { DEFAULT_FONT_SIZE, DEFAULT_LINE_HEIGHT } from "../constants";

export const defaultProps = {
  index: 0,
  text: "",
  fontSize: DEFAULT_FONT_SIZE,
  lineHeight: DEFAULT_LINE_HEIGHT,
  maxHeight: Infinity,
  maxWidth: Infinity,
  x: 0,
  y: 0,
  font: null,
};

export const getCharWidth = Cached(
  ({ char, fontSize, font }) =>
    font?.getAdvanceWidth(char, fontSize) || (fontSize * 1229) / 2048
);

export const getStringWidth = Cached(({ text, fontSize, font }) =>
  font
    ? text
        .split("")
        .reduce((sum, char) => sum + getCharWidth({ char, fontSize, font }), 0)
    : (text.length * fontSize * 1229) / 2048
);

export const getWords = Cached(({ text, fontSize, font }) => {
  const spaceWidth = getStringWidth({ text: " ", fontSize, font });
  let widthSoFar = 0;
  return text.split(" ").map((wordText, i) => {
    const wordWidth = getStringWidth({ text: wordText, fontSize, font });
    widthSoFar += wordWidth + (i > 0 ? spaceWidth : 0);
    return { wordText, wordWidth, widthSoFar };
  });
});

export const getLines = Cached((props) => {
  const { text, fontSize, font } = props;
  const spaceWidth = getStringWidth({ text: " ", fontSize, font });
  const availableWidth = getMaxWidth(props);

  const words = getWords({ text, fontSize, font });
  const totalWidth = words[words.length - 1].widthSoFar;
  const aproxCutPoint = Math.ceil((words.length * availableWidth) / totalWidth);
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
});

export const getMaxWidth = Cached(({ maxWidth, text, fontSize, font }) => {
  const words = getWords({ text, fontSize, font });
  return Math.min(maxWidth, words[words.length - 1].widthSoFar);
});

export const width = Cached(
  (props) => {
    const { maxWidth } = props;
    if (getLines(props) > 1) return maxWidth;
    return getMaxWidth(props);
  },
  { name: "textWIIIIDTH" }
);

export const height = Cached((props) => {
  const { lineHeight } = props;
  const linesCount = getLines(props);
  return linesCount * lineHeight;
});

export const TextComponent = Component((atts) => {
  const props = { ...defaultProps, ...atts };
  return {
    ...props,
    width: width(props),
    height: height(props),
    fontFamily: props.font?.names.fontFamily.en ?? "Courier New",
    type: "text",
  };
});

export function Text(...args) {
  const parsedArgs = args[0].text ? args[0] : { text: args[0], ...args[1] };
  return TextComponent(parsedArgs);
}
