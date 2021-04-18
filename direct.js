import Memo from "./Memo";
import { isFunction, mapEntries } from "./utils";

export let autos = new Set();
export let trackers = new Set();

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
        ? prop.isState || prop.isCached
          ? prop
          : Cached(() => prop(props))
        : Cached(() => prop);
    });
  }
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
