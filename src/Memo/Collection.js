import { removeUndefinedPadding } from "../utils";
import Memo from "./Memo";

export default function Collection(initialKeys = [], { name } = {}) {
  const memo = Memo({ name });
  const keys = [...initialKeys];
  const indices = {
    all: {
      size: 0,
      place: function (node, current) {
        if (current) node;
        node.indices.all = { prev: this.last };
        if (this.last) this.last.next = node;
        else this.root = node;
        this.last = node;
        this.size++;
      },
      remove: function (node) {
        const { prev, next } = node.indices.all;
        if (prev) prev.indices.all.next = next;
        else this.root = undefined;
        if (next) next.indices.all.prev = prev;
        elsethis.last = prev;
        this.size--;
      },
      list: function* () {
        let node = this.root;
        while (node) {
          yield node.val;
          node = node.next;
        }
      },
    },
  };
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

  function get(key) {
    return memo.get(key)?.val;
  }
  function set(key, val, current) {
    const node = { val, indices: {} };
    Object.values(indices).forEach((ind) => {
      if (current) current.val = val;
      else ind.place(node);
    });
    return memo.set(key, node)?.val;
  }
  function del(key) {
    const node = memo.get(key);
    Object.values(indices).forEach((ind) => {
      ind.remove(node);
    });
    return memo.del(key)?.val;
  }

  return {
    list: (...args) => {
      if (!args.length) {
        return indices.all.list();
      }
    },
    size: () => indices.all.size,
    get: (id, fallback) => {
      const val = get(idKey(id));
      if (typeof val !== "undefined") return val;
      return fallback;
    },
    delete: (id) => {
      return del(idKey(id));
    },
    getOrAdd: (id, func) => {
      const key = idKey(id);
      const val = get(key);
      if (typeof val !== "undefined") return val;
      return set(key, func(key));
    },
    addOrReplace: (id, func) => {
      const key = idKey(id);
      return set(key, func(key), memo.get(key));
    },
  };
}
