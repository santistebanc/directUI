import { removeUndefinedPadding } from "../utils";
import Memo from "./Memo";

export default function Collection(initialKeys = [], { name }) {
  const memo = Memo({ name });
  const keys = [...initialKeys];
  const idKey = (id) => {
    const keyArr = [];
    Object.entries(id).forEach(([k, v]) => {
      const idx = keys.indexOf(k);
      if (idx === -1) {
        keyArr[keys.length] = v;
        keys.push(k);
      } else {
        keyArr[idx] = v;
      }
    });
    return removeUndefinedPadding(keyArr);
  };

  return {
    get: (id, fallback) => {
      const val = memo.get(idKey(id));
      if (typeof val !== "undefined") return val;
      return fallback;
    },
    delete: (id) => {
      return memo.del(idKey(id));
    },
    getOrAdd: (id, func) => {
      const key = idKey(id);
      const val = memo.get(key);
      if (typeof val !== "undefined") return val;
      return memo.set(key, func(key));
    },
    addOrReplace: (id, func) => {
      const key = idKey(id);
      return memo.set(key, func(key));
    },
  };
}
