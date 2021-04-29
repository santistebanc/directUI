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

export function compsAreSame(a, b) {
  return (
    a === b ||
    (typeof a.id !== "undefined" && a.id === b.id && a.type === b.type)
  );
}

export function getDiff(prev, next) {
  const pool = [...next];
  const dif = [];
  const added = [];
  const removed = [];
  const kept = [];

  prev.forEach((prevIt) => {
    const idx = pool.findIndex((nxt) => compsAreSame(nxt, prevIt));
    const it = pool[idx];
    if (idx > -1) {
      dif.push([it, 0]);
      kept.push(it);
      pool.splice(idx, 1);
    } else {
      dif.push([prevIt, -1]);
      removed.push(prevIt);
    }
  });
  pool.forEach((it) => {
    dif.push([it, 1]);
    added.push(it);
  });
  return { dif, added, kept, removed };
}

export function serializeProps(props) {
  return mapEntries(props, ([k, v]) => [k, isFunction(v) ? v.toString() : v]);
}
