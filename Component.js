import Collection from "./Collection";
import { defineGetters, isFunction, mapEntries, serializeProps } from "./utils";

export const components = Collection();

export function Component(type, resolvers, defaultProps) {
  return (atts = {}) => {
    function Template(attributes = {}) {
      Object.assign(atts, attributes);
      Template.attributes = { ...atts };
      Template.id = atts.id;
      return Template;
    }
    Template.type = type;
    Template.defaultProps = defaultProps;
    Template.resolvers = resolvers;
    Template.isTemplate = true;
    Template.render = (renderProps = {}) => {
      const attributes = { ...atts };

      const mergedProps = {
        parent: () => null,
        self: () => null,
        ...defaultProps,
        ...renderProps,
        ...attributes,
        template: Template,
        type,
        defaultProps,
      };

      const keys = mergedProps.id
        ? {
            type,
            id: mergedProps.id,
            parent: mergedProps.parent(),
          }
        : {
            type,
            parent: mergedProps.parent(),
            ...serializeProps(attributes),
          };

      const inst = mergedProps.parent
        ? components.getOrAdd(keys, (idd) => {
            console.log("created new component", idd);
            return {};
          })
        : {};

      const props = defineGetters(
        {},
        { ...mergedProps, self: () => inst },
        (prop, key) =>
          typeof defaultProps[key] === "undefined" || key === "self"
            ? prop
            : isFunction(prop)
            ? prop(props)
            : prop
      );

      //output: merge props with resolvers
      defineGetters(inst, Object.getOwnPropertyDescriptors(props), (desc) =>
        desc.get()
      );
      defineGetters(inst, resolvers, (func) => func(props));

      return inst;
    };

    return Template(atts);
  };
}
