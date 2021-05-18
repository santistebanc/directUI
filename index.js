import { Box } from "./Components/Box";
import { State, Store } from "./direct";
import { mountToDOM, padding, style, onEvent, Font } from "./dom";
import { Text } from "./Components/Text";
import { Input } from "./Components/Input";

const font = Font("fonts/OpenSans-Regular.ttf");

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
  { font: font() }
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
