const RESULT = Symbol();

export default function Memo({ limit = 100 } = {}) {
  let count = 0;
  const memo = new Map();
  const get = (keys) => {
    let iter = memo;
    if (!keys.length) return;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (!iter.has(key)) return undefined;
      iter = iter.get(key);
      if (i === keys.length - 1) return iter.get(RESULT);
    }
    return iter;
  };
  const set = (keys, val) => {
    let iter = memo;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (iter.size >= limit) {
        iter.delete([...iter.keys()][0]);
        count--;
      }
      if (!iter.has(key)) iter.set(key, new Map());
      if (i === keys.length - 1) {
        iter.get(key).set(RESULT, val);
        count++;
        return val;
      }
      iter = iter.get(key);
    }
  };
  const del = (keys) => {
    let iter = memo;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      iter = iter.get(key);
      if (i === keys.length - 1) {
        iter.delete(RESULT);
        count--;
      }
    }
  };
  const clear = () => {
    memo.clear();
    count = 0;
  };

  const size = () => count;

  const print = () => {
    const entries = [];
    const printIter = (iter, keys) =>
      [...iter.keys()].forEach((k) => {
        const newKeys = [...keys, k];
        const val = iter.get(k);
        if (k === RESULT) {
          entries.push(`(${keys.join(", ")})-> ${String(val)}`);
        } else {
          printIter(val, newKeys);
        }
      });
    printIter(memo, []);
    return entries.join("\n");
  };
  return { get, set, del, clear, size, print };
}
