import Memo from "./Memo";
import { isFunction, mapEntries } from "./utils";

export let autos = new Set();
export let trackers = new Set();
export let context = {};
export let statePending = null;

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
  const states = new Map();
  let cache;

  const output = (...args) => {
    const stateValues = [...states.keys()].map((state) => state());

    //lookup cached value by reference
    const directValue = refMemo.get([...args, ...stateValues]);
    if (typeof directValue !== "undefined") {
      cache = directValue;
      return cache;
    }

    const onReadState = (obj, value) => {
      states.set(obj, value);
    };

    trackers.add(onReadState);
    cache = func(...args);
    trackers.delete(onReadState);

    const refkeys = [...args, ...[...states.values()]];
    refMemo.set(refkeys, cache);

    return cache;
  };
  output.isCached = true;
  return output;
}
