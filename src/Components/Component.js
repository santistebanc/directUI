import Collection from "../Memo/Collection";
import { isFunction, merge, resolveThunk, setHiddenProperty } from "../utils";

const types = new WeakMap();

function getCollection(type, name) {
  return types.has(type)
    ? types.get(type)
    : types.set(type, Collection([], { name: "component-" + name })).get(type);
}

export function Component(...output) {
  const init = (...args) => {
    const input = merge({}, ...args.map(resolveThunk({})))
    const resolvedOutput = merge({}, ...output.map(resolveThunk(input)));
    const collection = getCollection(resolvedOutput, input.name);

    return collection.getOrAdd(collection, () => {
      function component(...args) {
        const attributes = merge({}, input, ...args.map(resolveThunk(input)));
        return init(attributes);
      }
      merge(component, init, resolvedOutput);
      return component;
    });
  };
  const resolvedOutput = merge({}, ...output.filter((out) => !isFunction(out)));
  setHiddenProperty(init, "output", output);
  setHiddenProperty(init, "extend", (...args) =>
    Component(...output, ...args)
  );
  merge(init, resolvedOutput);
  return init;
}
