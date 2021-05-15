import Memo from "./Memo";
import { defineGetters, isFunction, mapEntries } from "./utils";

export let autos = new Set();
export let trackers = new Set();
export let context = {};
export let statePending = null;

export function Auto(func, nm) {
  const track = (who) => {
    autos.add(track);
    func(who);
    autos.delete(track);
  };
  track.nm = nm;
  track.disposers = new Map();
  track.cleanup = () => {
    [...track.disposers.values()].forEach((disp) => disp());
    track.disposers.clear();
  };
  track();
  return track;
}

export function State(initialValue) {
  const get = () => {
    [...trackers].forEach((func) => func(get, get.value));
    [...autos].forEach((func) => {
      func.disposers.set(get, () => get.observers.delete(func));
      get.observers.add(func);
    });
    return get.value;
  };

  get.prevValue = null;
  get.value = initialValue;
  get.observers = new Set();
  get.get = get;
  get.react = () => {
    const obsList = [...get.observers];
    obsList.forEach((obs) => {
      if (get.observers.has(obs)) {
        get.observers.delete(obs);
        obs(get);
      }
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

export function Cached(func, { limit, name } = {}) {
  const memo = Memo({ limit });
  const propKeys = new Set();
  let cache;
  let lastProps;

  const output = (props) => {
    if (lastProps === props) return cache;
    lastProps = props;

    const propValues = [...propKeys.keys()].map((key) => props[key]);

    if (propKeys.size) {
      const directValue = memo.get(propValues);
      if (typeof directValue !== "undefined") {
        cache = directValue;
        return cache;
      }
    }

    const trackingProps = defineGetters({}, props, (prop, key) => {
      propKeys.add(key);
      return prop;
    });

    cache = func(trackingProps);

    const keys = [...propKeys.keys()].map((k) => props[k]);

    memo.set(keys, cache);

    return cache;
  };
  output.isCached = true;
  return output;
}
