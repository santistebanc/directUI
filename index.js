import { Box } from "./Box";
import { mountToDOM } from "./dom";
import { Text } from "./Text";

const title = Text(({ page }) => "hello world " + page());

const content = Text("this is the content of the page");

const container = Box(({ page }) => [title({ page }), content]);

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
