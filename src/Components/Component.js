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

export function Component(output, { name } = {}) {
  const collection = getCollection(output, name);
  const comp = UncachedComp(output);
  return (attributes = {}) =>
    collection.getOrAdd(attributes, () => comp(attributes));
}

export function UncachedComp(output) {
  function init(attributes = {}) {
    const atts = Object.freeze({ ...attributes });
    function component(input) {
      return init(merge({}, atts, isFunction(input) ? input(atts) : input));
    }
    Object.defineProperty(component, "output", {
      configurable: true,
      enumerable: false,
      value: output,
    });
    merge(component, isFunction(output) ? output(atts) : output);
    return Object.freeze(component);
  }
  return init();
}
