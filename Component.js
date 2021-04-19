import { Props, State, Cached, parse, context } from "./direct";
import Memo from "./Memo";
import {
  defineGetters,
  mapEntries,
  getDeterministicKeys,
  isFunction,
} from "./utils";

export let count = 0;

export const components = Memo({ limit: 1000 });

export function Component(type, defaultProps, resolvers) {
  return (attributes = {}) => {
    const parent = context.props?.self;
    function render(renderProps = {}, passedProps = {}) {
      const inst = {};

      const keys = renderProps.static
        ? {
            type,
            ...renderProps,
            ...attributes,
            parent,
          }
        : renderProps.parent
        ? {
            type,
            ...attributes,
            ...passedProps,
            parent: renderProps.parent,
          }
        : parent
        ? {
            type,
            ...attributes,
            ...passedProps,
            parent,
          }
        : {
            type,
            ...renderProps,
            ...attributes,
            ...passedProps,
          };

    //   console.log(
    //     ".........",
    //     !!renderProps.static,
    //     !!parent,
    //     !!renderProps.parent,
    //     keys
    //   );

      const id = getDeterministicKeys(keys);
      const compInMemo = components.get(id);
      if (compInMemo) return compInMemo;

      components.set(id, inst);

      const state = mapEntries(attributes.state ?? {}, ([key, initialVal]) => [
        key,
        State(initialVal, key),
      ]);

      const props = new Props({
        ...defaultProps,
        ...renderProps,
        ...attributes,
        ...passedProps,
        ...state,
        self: inst,
        type,
      });

      defineGetters(inst, { ...props, ...resolvers }, (func) => func(props));

      const definedState = defineGetters({}, state, (func) => func());
      defineGetters(inst, { props, state: definedState }, (func) => func);

      inst.setState = (newState) => {
        Object.entries(newState).forEach(([key, val]) => {
          state[key].set(val);
        });
      };

      return inst;
    }

    const output = (passedProps = {}) => ({
      isTemplate: true,
      templateId: { ...attributes, ...passedProps },
      render: (renderProps = {}) => render(renderProps, passedProps),
    });
    output.templateId = { ...attributes };
    output.render = render;
    output.isTemplate = true;

    return output;
  };
}
