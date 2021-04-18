import { Props, State, Computed } from "./direct";
import Memo from "./Memo";
import { defineGetters, mapEntries, getDeterministicKeys } from "./utils";

export let count = 0;

export const components = Memo({ limit: 1000 });

export function Component(type, defaultProps, methods) {
  return (template = {}) => {
    function render(inheritedProps, attributes) {
      const parsedInheritedProps = inheritedProps.parent
        ? { parent: inheritedProps.parent }
        : inheritedProps;
      const keys = getDeterministicKeys({
        type,
        ...attributes,
        ...parsedInheritedProps,
      });
      const compInMemo = components.get(keys);
      if (compInMemo) return compInMemo;

      const inst = {};
      components.set(keys, inst);

      const state = mapEntries(template.state ?? {}, ([key, initialVal]) => [
        key,
        State(initialVal, key),
      ]);

      const props = new Props({
        ...defaultProps,
        ...inheritedProps,
        ...template,
        ...attributes,
        ...state,
        self: inst,
        type,
      });

      const parsedMethods = mapEntries(
        { ...props, ...methods },
        ([key, method]) => [key, Computed(method)]
      );

      defineGetters(inst, parsedMethods, (func) => func(props));

      const definedState = defineGetters({}, state, (func) => func());
      defineGetters(inst, { props, state: definedState }, (func) => func);

      inst.setState = (newState) => {
        Object.entries(newState).forEach(([key, val]) => {
          state[key].set(val);
        });
      };

      return inst;
    }

    const output = (attributes = {}) => ({
      isTemplate: true,
      attributes,
      render: (inheritedProps = {}) => render(inheritedProps, attributes),
    });

    output.render = render;
    output.isTemplate = true;

    return output;
  };
}
