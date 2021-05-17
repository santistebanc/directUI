import { Box } from "./Components/Box";
import { State, Store } from "./direct";
import { mountToDOM, padding, style, onEvent } from "./dom";
import { Text } from "./Components/Text";
import { Input } from "./Components/Input";
import opentype from "opentype.js";

const font = State(null);

opentype
  .load("fonts/OpenSans-Regular.ttf")
  .then((res) => new Promise((resolve) => setTimeout(() => resolve(res), 5000)))
  .then((res) => font.set(res));

// const title = Text(({ page }) => "hello world " + page(), { font });

const content = () => Text("this is the content of the page", { font: font() });

const Kiste = Box({
  width: 100,
  height: 100,
  ...style({ "background-color": "blue" }),
  ...onEvent({ click: () => console.log("clicked") }),
});

const input = () =>
  Input({
    text: "initial",
    font: font(),
  });

const container = (page) =>
  Box(
    page % 2 === 1
      ? [
          Text("test", {
            id: "waka",
            ...style({ color: "purple", "font-weight": "bold" }),
          }),
          Text("you should not be here"),
          Kiste,
          content(),
          input(),
        ]
      : [
          input(),
          Text("you should not be here"),
          Text("testoooooooooo", {
            id: "waka",
            ...style({ color: "green", "font-weight": "bold" }),
          }),
          content(),
          Kiste,
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

// const app = mountToDOM(
//   base,
//   () => Text("hello world", { font: font(), ...style({ "font-weight": "bold" }) })
// );

console.log(app);

setInterval(() => {
  store.page.set(store.page() + 1);
}, 5000);

window.onresize = () => {
  store.setState({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
  });
};
