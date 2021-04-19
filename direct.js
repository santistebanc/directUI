import Memo from "./Memo";
import { defineGetters, isFunction, mapEntries } from "./utils";

export let autos = new Set();
export let trackers = new Set();
export let context = {};
export let statePending = null;

export function parse(props, defautProps = {}) {
  return mapEntries({ ...defautProps, ...props }, ([key, val]) => [
    key,
    isFunction(val) ? val() : val,
  ]);
}

function injectContext(func, ownContext) {
  let prevContext;
  return (...args) => {
    prevContext = context;
    context = ownContext;
    const output = func(...args);
    context = prevContext;
    return output;
  };
}

export function Props(props, defaultProps) {
  return defineGetters({}, props, (prop, key) =>
    typeof defaultProps[key] === "undefined"
      ? prop
      : isFunction(prop)
      ? injectContext(prop, { props })(props)
      : prop
  );
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

  defineGetters(
    output,
    {
      getState: (key) => {
        if (Array.isArray(key))
          return Object.fromEntries(key.map((k) => output[k]()));
        return output[key]();
      },
      setState: (key, val) => {
        if (val) {
          if (Array.isArray(key))
            return Object.fromEntries(key.map((k, i) => output[k].set(val[i])));
          return output[key].set(val);
        }
        return mapEntries(key, ([k, v]) => output[k].set(v));
      },
    },
    (method) => method
  );

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
  const memo = Memo({ limit });
  const states = new Map();
  let last;

  const output = (...args) => {
    const stateValues = [...states.keys()].map((state) => state());
    const input = [...args, ...stateValues];

    const valueInMemo = memo.get(input);
    if (typeof valueInMemo !== "undefined") {
      last = valueInMemo;
      return last;
    }

    const onReadState = (obj, value) => {
      states.set(obj, value);
    };

    trackers.add(onReadState);
    last = func(...args);
    trackers.delete(onReadState);

    const keys = [...args, ...[...states.values()]];
    memo.set(keys, last);

    return last;
  };
  output.isCached = true;
  return output;
}
