import Memo from "./Memo";
import { defineGetters } from "../utils";

function Cached(func, { limit } = {}) {
  const memo = Memo({ limit });
  const propKeys = new Set();
  let cache;
  let lastProps;

  return (props) => {
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
}

export default Cached;
