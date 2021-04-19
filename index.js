import { Box } from "./Box";
import { context, State, Store } from "./direct";
import { mountToDOM } from "./dom";
import { Text } from "./Text";
import opentype from "opentype.js";
import { Input } from "./Input";

const font = State(null);

opentype.load("fonts/OpenSans-Regular.ttf").then((res) => font.set(res));

const title = Text(({ page }) => "hello world " + page(), { font });

const content = Text("this is the content of the page", { font });

const input = Input("test here", { font });

const container = Box(({ page }) =>
  page() % 2 === 1 ? [Text("test"), content] : [Text("second"), Text("test")]
);

const store = Store({
  page: 1,
  screenWidth: window.innerWidth,
  screenHeight: window.innerHeight,
});

console.log(store);

const main = Box(
  ({ page }) =>
    page() % 5 !== 4
      ? [container({ page }), content, title({ page })]
      : [Text("non")],
  {
    ...store,
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
  app.page.set((val) => val + 1);
  console.log(app);
}, 5000);

window.onresize = () => {
  app.setState({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
  });
};
