import Collection from "../Cache/Collection";

const components = Collection();

export function Component(output) {
  const Template = (attributes = {}) => {
    return components.getOrAdd({ ...attributes, output }, (idd) => {
      console.log("created new component", idd);
      const inst = (props = {}) => {
        return Template(
          { ...attributes, ...props },
          typeof attributes.index !== "undefined"
            ? { ...attributes, ...props }
            : { ...attributes }
        );
      };
      inst.props = { ...attributes };
      Object.assign(inst, output(inst.props));
      return inst;
    });
  };
  return Template;
}
