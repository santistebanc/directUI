import Memo from "./Memo";
import { isFunction, mapEntries } from "./utils";

export let trackers = new Set();
export let computeds = new Set();

export function parse(props) {
  return mapEntries(props, ([key, val]) => [
    key,
    isFunction(val) ? val() : val,
  ]);
}

export class Props {
  constructor(props) {
    Object.entries(props).forEach(([key, prop]) => {
      this[key] = isFunction(prop)
        ? prop.isState
          ? prop
          : Computed(() => prop(props))
        : Computed(() => prop);
    });
  }
}

export function Auto(func) {
  const track = () => {
    trackers.add(track);
    func();
    trackers.delete(track);
  };
  track();
}

export function State(initialValue) {
  const get = () => {
    [...computeds].forEach((func) => func(get, get.value));
    [...trackers].forEach((func) => get.observers.add(func));
    return get.value;
  };

  get.value = initialValue;
  get.observers = new Set();
  get.get = get;
  get.set = (newVal) => {
    get.value = newVal;
    [...get.observers].forEach((obs) => {
      get.observers.delete(obs);
      obs();
    });
    return get.value;
  };
  get.isState = true;
  return get;
}

export function Computed(func, { limit } = {}) {
  const memo = Memo({ limit });
  const states = new Map();
  let last;

  return (...args) => {
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

    computeds.add(onReadState);
    last = func(...args);
    computeds.delete(onReadState);

    const keys = [...args, ...[...states.values()]];
    memo.set(keys, last);

    return last;
  };
}
