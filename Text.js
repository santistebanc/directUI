import { Component } from "./Component";
import { DEFAULT_FONT_SIZE, DEFAULT_LINE_HEIGHT } from "./constants";
import { Computed, parse } from "./direct";

export const defaultProps = {
  classes: ["text"],
  text: "",
  fontSize: DEFAULT_FONT_SIZE,
  lineHeight: DEFAULT_LINE_HEIGHT,
  maxHeight: Infinity,
  maxWidth: Infinity,
  x: 0,
  y: 0,
  font: null,
};

export const getCharWidth = Computed(
  (char, fontSize, font) =>
    font?.getAdvanceWidth(char, fontSize) || (fontSize * 1229) / 2048
);

export const getStringWidth = Computed((text, fontSize, font) =>
  font
    ? text
        .split("")
        .reduce((sum, char) => sum + getCharWidth(char, fontSize, font), 0)
    : (text.length * fontSize * 1229) / 2048
);

export const getWords = Computed((text, fontSize, font) => {
  const spaceWidth = getStringWidth(" ", fontSize, font);
  let widthSoFar = 0;
  return text.split(" ").map((wordText, i) => {
    const wordWidth = getStringWidth(wordText, fontSize, font);
    widthSoFar += wordWidth + (i > 0 ? spaceWidth : 0);
    return [wordText, wordWidth, widthSoFar];
  });
});

export const getMaxWidth = Computed((maxWidth, text, fontSize, font) => {
  const words = getWords(text, fontSize, font);
  return Math.min(maxWidth, words[words.length - 1][2]);
});

export const getLines = Computed((maxWidth, text, fontSize, font) => {
  const spaceWidth = getStringWidth(" ", fontSize, font);
  const availableWidth = getMaxWidth(maxWidth, text, fontSize, font);
  const words = getWords(text, fontSize, font);
  const totalWidth = words[words.length - 1][2];
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
      usedWidth = words[pointerIdx][2];
    }
  } while (pointerIdx < words.length - 1);

  function findCutIndex(limitWidth, idx, discarded) {
    if (limitWidth > words[words.length - 1][2]) return words.length - 1; //the whole text can fit
    if (idx <= 0) return 0; //only one word fits
    if (idx > words.length - 1 || words[idx][2] > limitWidth) {
      if (discarded === "down") return idx - 1; //found it
      return findCutIndex(limitWidth, idx - 1, "up");
    } else {
      if (discarded === "up") return idx; //found it
      return findCutIndex(limitWidth, idx + 1, "down");
    }
  }

  return lines;
});

export const getWidth = (props) => {
  const { maxWidth, text, fontSize, font } = parse(props);
  if (getLines(maxWidth, text, fontSize, font) > 1) return maxWidth;
  return getMaxWidth(maxWidth, text, fontSize, font);
};

export const getHeight = (props) => {
  const { maxWidth, text, fontSize, lineHeight, font } = parse(props);
  const linesCount = getLines(maxWidth, text, fontSize, font);
  return linesCount * lineHeight;
};

export const TextComponent = Component(defaultProps, {
  text: ({ text }) => text(),
  x: ({ x }) => x(),
  y: ({ y }) => y(),
  width: getWidth,
  height: getHeight,
  fontFamily: ({ font }) => font()?.names.fontFamily.en ?? "Courier New",
  fontSize: ({ fontSize }) => fontSize(),
  lineHeight: ({ lineHeight }) => lineHeight(),
  classes: ({ classes }) => classes(),
});

export function Text(...args) {
  const parsedArgs = args[0].text ? args[0] : { text: args[0], ...args[1] };
  return TextComponent(parsedArgs);
}
