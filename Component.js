import { Cached } from "./direct";

export function Component(resolvers) {
  const Template = Cached((attributes = {}) => {
    const inst = (props = {}) => Template({ ...attributes, ...props });
    inst.props = { ...attributes };
    Object.assign(inst, resolvers(inst.props));
    return inst;
  }, {name: 'comp'});
  return Template;
}