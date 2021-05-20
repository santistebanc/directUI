import Collection from "../Memo/Collection";
import { clone, merge } from "../utils";
import { isFunction } from "../utils";

const types = new Map();

function getCollection(output, name) {
  return types.has(output)
    ? types.get(output)
    : types
        .set(output, Collection([], { name: "component-" + name }))
        .get(output);
}

export function Component(output, { name }) {
  return (attributes = {}) => {
    const currOutput = attributes.output ?? output;
    const atts = { ...attributes };
    delete atts.output;
    const collection = getCollection(currOutput, name);
    return collection.getOrAdd(atts, () =>
      comp({ ...atts, output: currOutput })
    );
  };
}

function comp(...args) {
  function init(attributes = {}) {
    const output = attributes.output;
    const atts = { ...attributes };
    delete atts.output;
    function component(input) {
      return init(
        merge({}, { ...atts, output }, isFunction(input) ? input(atts) : input)
      );
    }
    if (output) {
      Object.defineProperty(component, "output", {
        configurable: true,
        enumerable: false,
        value: output,
      });
      merge(component, isFunction(output) ? output(atts) : output);
    }
    return component;
  }
  return init(...args);
}
