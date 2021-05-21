import { Box } from "./src/Components/Box";
import { State, Store } from "./src/direct";
import { mountToDOM, padding, style, onEvent, Font } from "./src/dom";
import { Text } from "./src/Components/Text";
import { Input } from "./src/Components/Input";
import { Component } from "./src/Components/Component";

const font = Font("./src/fonts/OpenSans-Regular.ttf", "Open Sans");

const texto = State("iiii");

const Comp = Component({ ...Text("works!") });

// const title = (page) => Text("hello world " + page, { font: font() });

const content = () => Text("this is the content of the page", { font: font() });

const Kiste = Box({
  width: 100,
  height: 100,
  "style.background-color": "lightblue",
  "on.click": () => console.log("clicked"),
});

const input = () =>
  Input({
    text: texto(),
    font: font(),
    "on.input": (e) => texto.set(e.target.value),
  });

const container = (page) =>
  Box(
    page % 2 === 1
      ? [
          Comp(),
          Text("test", {
            id: "waka",
            font: font(),
            ...style({ color: "purple", "font-weight": "bold" }),
          }),
          Text("you should not be here", { font: font() }),
          Kiste,
          content(),
          input(),
        ]
      : [
          input(),
          Text("you should not be here", { font: font() }),
          Text("testoooooooooo", {
            id: "waka",
            font: font(),
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
      : [
          Text("non", { font: font() }),
          Text("non", { font: font() }),
          Text("yes", { font: font() }),
        ],
    {
      width: screenWidth,
      height: screenHeight / 2,
      transitionTime: 0,
      ...padding(20),
    }
  );

const app = mountToDOM(
  () =>
    main({
      page: store.page(),
      screenHeight: store.screenHeight(),
      screenWidth: store.screenWidth(),
    }),
  { font }
);

// const app = mountToDOM(
//   () =>
//     font().loading
//       ? []
//       : Box(
//           store.page() % 3 !== 0
//             ? [
//                 Box(
//                   store.page() % 2 === 1
//                     ? [Text("hello", { font: font() })]
//                     : [Text("world")]
//                 ),
//               ]
//             : [Text("nope")]
//         ),
//   { font: font() }
// );

// const app = mountToDOM(() => Text("hello", { font: font() }), { font: font() });

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
