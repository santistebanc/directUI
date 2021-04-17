import { Props, State, Computed } from "./direct";

export let count = 0;

export function Component(defaultProps, methods) {
  return (template = {}) => {
    function render(attributes) {
      const state = Object.fromEntries(
        Object.entries(template.state ?? {}).map(([key, initialVal]) => [
          key,
          State(initialVal, key),
        ])
      );

      const props = new Props({
        ...defaultProps,
        ...template,
        ...attributes,
        ...state,
      });

      const parsedMethods = Object.fromEntries(
        Object.entries(methods).map(([key, method]) => [key, Computed(method)])
      );

      const output = Object.defineProperties(
        {},
        Object.fromEntries(
          Object.entries(parsedMethods).map(([key, func]) => [
            key,
            {
              get() {
                return func(props);
              },
            },
          ])
        )
      );

      output.state = Object.defineProperties(
        {},
        Object.fromEntries(
          Object.entries(state).map(([key, func]) => [
            key,
            {
              get() {
                return func();
              },
            },
          ])
        )
      );

      output.setState = (newState) => {
        Object.entries(newState).forEach(([key, val]) => {
          state[key].set(val);
        });
      };

      return output;
    }

    const output = (attributes = {}) => ({
      render: (extraAtts = {}) => render({ ...attributes, ...extraAtts }),
    });

    output.render = render;
    return output;
  };
}
