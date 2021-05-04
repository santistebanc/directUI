import { clone, defineGetters, isFunction } from "./utils";

export function Component(type, resolvers, defaultProps) {
  return (atts = {}) => {
    function Template(attributes = {}) {
      const passedProps = { ...atts };
      if (!attributes.parentProps) Object.assign(passedProps, attributes);
      const inst = (atts = {}) => Template({ ...attributes, ...atts });
      inst.attributes = { ...attributes };
      inst.passedProps = { ...passedProps };
      inst.type = type;
      inst.id = attributes.id;
      inst.defaultProps = defaultProps;
      inst.resolvers = resolvers;

      const mergedProps = {
        ...defaultProps,
        ...attributes,
      };

      const props = defineGetters({}, mergedProps, (prop, key) =>
        typeof defaultProps[key] === "undefined"
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
    }
    return Template(atts);
  };
}
