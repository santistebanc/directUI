import { Box } from "./Box";
import { State, Store } from "./direct";
import { mountToDOM, style } from "./dom";
import { Text } from "./Text";
import opentype from "opentype.js";
import { Input } from "./Input";

const font = State(null);

opentype.load("fonts/OpenSans-Regular.ttf").then((res) => font.set(res));

const title = Text(({ page }) => "hello world " + page(), { font });

const content = Text("this is the content of the page", { font });

// const input = Input("test here", { font });

const container = Box(({ page }) =>
  page() % 2 === 1
    ? [
        Text("test", {
          id: "waka",
          font,
          style: style({ color: "purple", "font-weight": "bold" }),
        }),
        Text("you should not be here", { madeup: { a: 6 } }),
      ]
    : [
        Text("you should not be here"),
        title({ page }),
        Text("testoooooooooo", {
          id: "waka",
          font,
          style: style({ color: "green", "font-weight": "bold" }),
        }),
        content,
      ]
);

const main = Box(
  ({ page }) => (page() % 5 !== 4 ? [container({ page })] : [Text("non")]),
  {
    ...Store({
      page: 1,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
    }),
    width: ({ screenWidth }) => screenWidth(),
    height: ({ screenHeight }) => screenHeight() / 2,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
  }
);

const base = document.querySelector("#app");
const app = mountToDOM(base, main);

console.log(app);

setInterval(() => {
  main.page.set((val) => val + 1);
  console.log(app);
}, 5000);

window.onresize = () => {
  main.setState({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
  });
};
