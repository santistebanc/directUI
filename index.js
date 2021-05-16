import { Box } from "./Components/Box";
import { State, Store } from "./direct";
import { mountToDOM, padding, style } from "./dom";
import { Text } from "./Components/Text";
import opentype from "opentype.js";

const font = State(null);

opentype
  .load("fonts/OpenSans-Regular.ttf")
  .then((res) => new Promise((resolve) => setTimeout(() => resolve(res), 5000)))
  .then((res) => font.set(res));

// const title = Text(({ page }) => "hello world " + page(), { font });

const content = () => Text("this is the content of the page", { font: font() });

const kiste = Box({
  width: 100,
  height: 100,
  style: style({ "background-color": "blue" }),
});

// const input = Input("test here", { font });

const container = (page) =>
  Box(
    page % 2 === 1
      ? [
          Text("test", {
            id: "waka",
            style: style({ color: "purple", "font-weight": "bold" }),
          }),
          Text("you should not be here"),
          kiste,
          content(),
        ]
      : [
          Text("you should not be here"),
          Text("testoooooooooo", {
            id: "waka",
            style: style({ color: "green", "font-weight": "bold" }),
          }),
          content(),
          kiste,
        ]
  );

const store = Store({
  page: 1,
  screenWidth: window.innerWidth,
  screenHeight: window.innerHeight,
});

const main = ({ page, screenHeight, screenWidth }) =>
  Box(
    page % 5 !== 4
      ? [container(page)]
      : [Text("non"), Text("non"), Text("yes")],
    {
      width: screenWidth,
      height: screenHeight / 2,
      transitionTime: 0,
      ...padding(20),
    }
  );

const base = document.querySelector("#app");
const app = mountToDOM(base, () =>
  main({
    page: store.page(),
    screenHeight: store.screenHeight(),
    screenWidth: store.screenWidth(),
  })
);

console.log(app);

setInterval(() => {
  store.page.set((val) => val + 1);
}, 5000);

window.onresize = () => {
  store.setState({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
  });
};
