import { Box } from "./Box";
import { State } from "./direct";
import { mountToDOM } from "./dom";
import { Text } from "./Text";
import opentype from "opentype.js";

const font = State(null);

opentype.load("fonts/OpenSans-Regular.ttf").then((res) => font.set(res));

const title = Text(({ page }) => "hello world " + page(), { font });

const content = Text("this is the content of the page", { font });

const container = Box(({ page }) =>
  page() % 2 === 1 ? [content] : [title({ page }), content]
);

const main = Box(({ page }) => [container({ page })], {
  state: {
    page: 1,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
  },
  width: ({ screenWidth }) => screenWidth(),
  height: ({ screenHeight }) => screenHeight(),
  paddingLeft: 10,
  paddingRight: 10,
  paddingTop: 10,
  paddingBottom: 10,
});

const base = document.querySelector("#app");
const app = mountToDOM(base, main);

setInterval(() => {
  app.setState({ page: app.state.page + 1 });
  console.log(app);
}, 5000);

window.onresize = () => {
  app.setState({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
  });
};
