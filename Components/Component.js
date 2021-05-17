import Collection from "../Cache/Collection";
import { isFunction } from "../utils";

const components = Collection();

export function Component(output) {
  const Template = (attributes = {}) => {
    const atts = { output, ...attributes };
    return components.getOrAdd(atts, (idd) => {
      console.log("created new component", idd);
      function component(input) {
        return isFunction(input)
          ? Template(input(atts))
          : Template({ ...atts, ...input });
      }
      component.attributes = atts;
      Object.assign(
        component,
        isFunction(output) ? atts.output(atts) : atts.output
      );
      return component;
    });
  };
  return Template;
}
