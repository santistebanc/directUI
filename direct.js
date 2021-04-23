import Memo from "./Memo";
import {
  defineGetters,
  getDeterministicKeys,
  isFunction,
  mapEntries,
  gettersToObj,
} from "./utils";

export let autos = new Set();
export let trackers = new Set();
export let context = {};
export let statePending = null;

export const cache = Memo();

export function Obj(index, id, instantiate) {
  let keys = [id];
  if (Array.isArray(id)) keys = id;
  else if (id instanceof Object) keys = getDeterministicKeys(id);

  const val = cache.get([index, ...keys]);
  if (val) return val;

  return cache.set([index, ...keys], instantiate([index, ...keys]));
}

export function Auto(func) {
  const track = () => {
    autos.add(track);
    func();
    autos.delete(track);
  };
  track();
}

export function State(initialValue) {
  const get = () => {
    [...trackers].forEach((func) => func(get, get.value));
    [...autos].forEach((func) => get.observers.add(func));
    return get.value;
  };

  get.prevValue = null;
  get.value = initialValue;
  get.observers = new Set();
  get.get = get;
  get.react = () => {
    [...get.observers].forEach((obs) => {
      get.observers.delete(obs);
      obs();
    });
  };
  get.set = (newVal) => {
    get.prevValue = get.value;
    get.value = isFunction(newVal) ? newVal(get.value) : newVal;
    if (statePending == null) {
      get.react();
    } else {
      statePending.push(get);
    }
    return get.value;
  };
  get.isState = true;
  return get;
}

export function Store(initalValues) {
  const output = mapEntries(initalValues, ([key, val]) => [key, State(val)]);

  output.setState = (key, val) => {
    if (val) {
      if (Array.isArray(key))
        return Object.fromEntries(key.map((k, i) => output[k].set(val[i])));
      return output[key].set(val);
    }
    return mapEntries(key, ([k, v]) => [k, output[k].set(v)]);
  };

  output.getState = (key) => {
    if (Array.isArray(key))
      return Object.fromEntries(key.map((k) => output[k]()));
    return output[key]();
  };

  return output;
}

State.transaction = (func) => {
  statePending = [];
  const output = func();
  statePending.forEach((st) => {
    st.react();
  });
  statePending = null;
  return output;
};

export function Cached(func, { limit } = {}) {
  const refMemo = Memo({ limit });
  const valMemo = Memo({ limit });
  const states = new Map();
  const props = {};
  let cache;

  const output = (...args) => {
    // const lookupByValue = args.length === 1 && args[0] instanceof Object;

    // //lookup cached value by literal value
    // if (lookupByValue) {
    //   const hasDefaultProps = args[0].defaultProps;

    //   const ownProps = hasDefaultProps
    //     ? Object.fromEntries(
    //         Object.entries(gettersToObj(args[0])).filter(
    //           ([k]) => typeof args[0].defaultProps[k] !== "undefined"
    //         )
    //       )
    //     : gettersToObj(args[0]);

    //   const inputKeys = getDeterministicKeys(ownProps);
    //   const parsedValue = valMemo.get(inputKeys);
    //   if (typeof parsedValue !== "undefined") {
    //     cache = parsedValue;
    //     return cache;
    //   }
    //   //inject trackers to props
    //   const input = [
    //     defineGetters({}, ownProps, (val, key) => {
    //       props[key] = val;
    //       return val;
    //     }),
    //   ];
    //   cache = func(...input);
    //   const keys = getDeterministicKeys(props);
    //   valMemo.set(keys, cache);
    // } else {
    //   const stateValues = [...states.keys()].map((state) => state());

    //   //lookup cached value by reference
    //   const directValue = refMemo.get([...args, ...stateValues]);
    //   if (typeof directValue !== "undefined") {
    //     cache = directValue;
    //     return cache;
    //   }

    //   const onReadState = (obj, value) => {
    //     states.set(obj, value);
    //   };

    //   trackers.add(onReadState);
      cache = func(...args);
    //   trackers.delete(onReadState);

    //   const refkeys = [...args, ...[...states.values()]];
    //   refMemo.set(refkeys, cache);
    // }

    return cache;
  };
  output.isCached = true;
  return output;
}