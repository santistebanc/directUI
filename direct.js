import Memo from "./Memo";
import { isFunction } from "./utils";

export let currentTracker = null;
export let computeds = new Set();
export let outputs = new Set();

export function parse(props) {
  return Object.fromEntries(
    Object.entries(props).map(([key, val]) => [
      key,
      isFunction(val) ? val() : val,
    ])
  );
}

export class Props {
  constructor(props) {
    Object.entries(props).forEach(([key, prop]) => {
      this[key] = isFunction(prop)
        ? prop.isState
          ? prop
          : Cached(() => prop(props))
        : Cached(() => prop);
    });
  }
}

export function Auto(func) {
  const parentTracker = currentTracker;
  currentTracker = func;
  func();
  currentTracker = parentTracker;
}

export function State(initialValue, key) {
  let value = initialValue;
  const observers = new Set();
  const computedObservers = new Set();
  const output = {
    get: () => {
      [...outputs].forEach((func) => func(output, value));
      [...computeds].forEach((comp) => computedObservers.add(comp));
      if (currentTracker) observers.add(currentTracker);
      return value;
    },
    set: (newVal) => {
      value = newVal;
      [...computedObservers].forEach((obs) => obs(output, value));
      [...observers].forEach((obs) => obs());
      return value;
    },
  };
  return output;
}

export function Cached(func, { limit, name } = {}) {
  const memo = Memo({ limit });
  const states = new Map();
  let last;

  const output = (...args) => {
    const stateValues = [...states.keys()].map((state) => state.get());
    const input = [...args, ...stateValues];

    const valueInMemo = memo.get(input);
    if (typeof valueInMemo !== "undefined") {
      last = valueInMemo;
      return last;
    }

    const onReadState = (obj, value) => {
      states.set(obj, value);
    };

    outputs.add(onReadState);
    last = func(...args);
    outputs.delete(onReadState);

    const keys = [...args, ...[...states.values()]];
    memo.set(keys, last);

    return last;
  };
  output.isCached = true;
  return output;
}
