import Collection from "../Cache/Collection";
import { merge } from "../utils";
import { isFunction } from "../utils";

const components = Collection();

export function Component(output) {
  const Template = (attributes = {}) => {
    const atts = { output, ...attributes };
    return components.getOrAdd(atts, () => {
      function component(input) {
        return isFunction(input)
          ? Template({ ...atts, ...input(atts) })
          : Template({ ...atts, ...input });
      }
      component.attributes = atts;
      merge(
        component,
        isFunction(output) ? atts.output(atts) : atts.output
      );
      return component;
    });
  };
  return Template;
}
