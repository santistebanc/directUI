const RESULT = { result: true };
const UNDEFINED = { undefined: true };

function isObject(target) {
  return target === Object(target);
}

function isMap(target) {
  return target instanceof Map || target instanceof WeakMap;
}

let highestCount = 0;

export default function Memo({ limit = 100, name } = {}) {
  let count = 0;
  let memo;
  let nullValue;
  const get = (keys) => {
    if (!keys.length) return nullValue;
    if (!memo) return;
    let iter = memo;
    for (let i = 0; i < keys.length; i++) {
      const key = typeof keys[i] === "undefined" ? UNDEFINED : keys[i];
      const currentVal = iter.get(key);
      if (!currentVal) return;
      if (i === keys.length - 1)
        return isMap(currentVal) ? currentVal.get(RESULT) : currentVal;
      iter = currentVal;
      if (!isMap(iter)) return;
    }
  };
  const set = (keys, val) => {
    if (!keys.length) {
      nullValue = val;
      return nullValue;
    }
    if (!memo) memo = isObject(keys[0]) ? new WeakMap() : new Map();

    let iter = memo;
    for (let i = 0; i < keys.length; i++) {
      const key = typeof keys[i] === "undefined" ? UNDEFINED : keys[i];

      if (iter.size >= limit) {
        iter.delete([...iter.keys()][0]);
        count--;
      }

      const currentVal = iter.get(key);
      if (i === keys.length - 1) {
        if (isMap(currentVal)) {
          currentVal.set(RESULT, val);
        } else {
          iter.set(key, val);
        }
        if (iter instanceof Map) count++;
        highestCount = Math.max(highestCount, count);

        // console.log("new cache [", name, "] ", highestCount, keys);

        return val;
      }

      if (!isMap(currentVal)) {
        iter.set(key, isObject(keys[i + 1]) ? new WeakMap() : new Map());
        if (currentVal) iter.get(key).set(RESULT, currentVal);
      }
      iter = iter.get(key);
    }
  };
  const del = (keys) => {
    if (!keys.length) nullValue = undefined;
    if (!memo) return;
    let iter = memo;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const currentVal = iter.get(key);
      if (i === keys.length - 1) {
        count--;
        if (!isMap(currentVal)) {
          return iter.delete(key);
        } else {
          return currentVal.delete(RESULT);
        }
      }
      iter = iter.get(key);
    }
  };
  const clear = () => {
    memo = undefined;
    count = 0;
  };

  const size = () => count;

  return { get, set, del, clear, size };
}
