import Memo from "./Memo";
import { isFunction } from "./utils";

export let trackers = new Set();
export let computeds = new Set();

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
          : Computed(() => prop(props))
        : Computed(() => prop);
    });
  }
}

export function Auto(func) {
    console.log('SSS')
  const track = () => {
    trackers.add(track);
    func();
    trackers.delete(track);
  };
  track();
  console.log('EEE')
}

export function State(initialValue) {
  const output = {
    value: initialValue,
    observers: new Set(),
    get: () => {
      [...computeds].forEach((func) => func(output, output.value));
      [...trackers].forEach((func) => output.observers.add(func));
      return output.value;
    },
    set: (newVal) => {
      output.value = newVal;
      [...output.observers].forEach((obs) => {
          output.observers.delete(obs);
        obs();
      });
      return output.value;
    },
  };
  return output;
}

export function Computed(func, { limit, name } = {}) {
  const memo = Memo({ limit });
  const states = new Map();
  let last;

  return (...args) => {
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

    computeds.add(onReadState);
    last = func(...args);
    computeds.delete(onReadState);

    const keys = [...args, ...[...states.values()]];
    memo.set(keys, last);

    return last;
  };
}
