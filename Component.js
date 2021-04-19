import { Props, context } from "./direct";
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
  return (atts = {}) => {
    const parent = context.props?.self;
    const output = (extraProps = {}) => {
      Object.assign(output.attributes, extraProps);
      return output;
    };
    output.attributes = { ...atts };
    output.isTemplate = true;
    output.templateId = output.attributes;
    output.render = (renderProps = {}) => {
      const inst = {};
      const attributes = output.attributes;

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
            parent: renderProps.parent,
          }
        : parent
        ? {
            type,
            ...attributes,
            parent,
          }
        : {
            type,
            ...renderProps,
            ...attributes,
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

      const mergedProps = {
        ...defaultProps,
        ...renderProps,
        ...attributes,
        self: inst,
        type,
      };

      const props = Props(mergedProps, defaultProps);

      defineGetters(inst, Object.getOwnPropertyDescriptors(props), (desc) => desc.get());
      defineGetters(inst, resolvers, (func) => func(props));

      return inst;
    };

    return output;
  };
}
