import { Obj } from "./direct";
import Memo from "./Memo";
import { defineGetters, isFunction } from "./utils";

export let count = 0;

export const components = Memo({ limit: 1000 });

export function Component(type, defaultProps, resolvers) {
  return (atts = {}) => {
    const allAtts = { ...atts };
    const createTemplate = (idd) => {
      console.log("creating new template", idd);
      const output = (extraProps = {}) => {
        Object.assign(allAtts, extraProps);
        return Obj("templates", { type, ...allAtts }, createTemplate);
      };
      output.isTemplate = true;
      output.attributes = { ...allAtts };
      output.render = (renderProps = {}) => {
        const createComponent = () => {
          const inst = {};
          const attributes = { ...allAtts };

          const mergedProps = {
            ...defaultProps,
            ...renderProps,
            ...attributes,
            template: output,
            type,
            defaultProps,
          };

          const props = defineGetters({}, mergedProps, (prop, key) =>
            typeof defaultProps[key] === "undefined"
              ? prop
              : isFunction(prop)
              ? prop(props)
              : prop
          );

          defineGetters(inst, Object.getOwnPropertyDescriptors(props), (desc) =>
            desc.get()
          );
          defineGetters(inst, resolvers, (func) => func(props));
          return inst;
        };

        const keys = {
          template: output,
          id: renderProps.id,
          parentTemplate: renderProps.parentTemplate,
          parentId: renderProps.parentId
        };

        return renderProps.parentTemplate
          ? Obj("components", keys, (idd) => {
              console.log("created new component", idd);
              return createComponent(idd);
            })
          : createComponent();
      };

      return output;
    };

    return Obj("templates", { type, ...allAtts }, createTemplate);
  };
}
