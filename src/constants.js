export const DEFAULT_FONT_SIZE = 16;
export const DEFAULT_LINE_HEIGHT = 20;
export const DEFAULT_FONT = {
  fontFamily: "Courier New",
  getWidth: (text, fontSize) => (text.length * (fontSize * 1229)) / 2048,
};
