export function clone(obj) {
  return Object.create(
    Object.getPrototypeOf(obj),
    Object.getOwnPropertyDescriptors(obj)
  );
}

export function isFunction(functionToCheck) {
  return (
    !!functionToCheck && {}.toString.call(functionToCheck) === "[object Function]"
  );
}
