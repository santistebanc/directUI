export function clone(obj) {
  return Object.create(
    Object.getPrototypeOf(obj),
    Object.getOwnPropertyDescriptors(obj)
  );
}

export function isFunction(functionToCheck) {
  return (
    !!functionToCheck &&
    {}.toString.call(functionToCheck) === "[object Function]"
  );
}

export function mapEntries(obj, func) {
  return Object.fromEntries(Object.entries(obj).map(func));
}

export function defineGetters(target, obj, func) {
  return Object.defineProperties(
    target,
    mapEntries(obj, ([key, val]) => [
      key,
      {
        configurable: true,
        get() {
          return func(val, key, obj);
        },
      },
    ])
  );
}

export function getDeterministicKeys(obj) {
  return Object.entries(obj)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => v);
}

export function objectIsEqual(a, b) {
  return !Object.values(a).some((x) => !Object.values(b).includes(x));
}

export function inject(func, before, after) {
  return (...args) => {
    before(...args);
    const output = func(...args);
    after(...args);
    return output;
  };
}
