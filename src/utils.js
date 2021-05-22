export function clone(obj) {
  return Object.create(
    Object.getPrototypeOf(obj),
    Object.getOwnPropertyDescriptors(obj)
  );
}

export function merge(...sources) {
  return sources.reduce((result, source) =>
    Object.defineProperties(result, Object.getOwnPropertyDescriptors(source))
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
        enumerable: true,
        get() {
          return func(val, key, obj);
        },
      },
    ])
  );
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

export function gettersToObj(obj) {
  return mapEntries(Object.getOwnPropertyDescriptors(obj), ([k, v]) => [
    k,
    v.get(),
  ]);
}

export function serializeProps(props) {
  return mapEntries(props, ([k, v]) => [k, isFunction(v) ? v.toString() : v]);
}

export function ensureArray(target) {
  if (typeof target === "undefined") return [];
  if (Array.isArray(target)) return target;
  return [target];
}

export function getStylesString(styles) {
  if (!styles || !Object.keys(styles)) return "";
  return Object.entries(styles).reduce(
    (str, [key, val]) => `${str}${key}: ${val};`,
    ""
  );
}

export function parsePrefix(props, prefix) {
  return Object.fromEntries(
    Object.entries(props)
      .filter(([k]) => k.startsWith(prefix + "."))
      .map(([k, v]) => [k.substring(prefix.length + 1), v])
  );
}

export function removeUndefinedPadding(arr) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (typeof arr[i] !== "undefined") {
      return arr.slice(0, i + 1);
    }
  }
  return arr;
}

export function assert(func) {
  console.assert(func(), { func });
}

export function resolveThunk(args) {
  return (obj) => (isFunction(obj) ? obj(args) : obj);
}

export function setHiddenProperty(obj, prop, value, desc = {}) {
  return Object.defineProperty(obj, prop, {
    enumerable: false,
    configurable: true,
    writable: false,
    value,
    ...desc,
  });
}

export function filter(obj, func) {
  return Object.fromEntries(Object.entries(obj).filter(([k, v]) => func(v)));
}
