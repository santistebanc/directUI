import Memo from "./Memo";
import { defineGetters, removeUndefinedPadding } from "../utils";

function Cached(func, defaultProps, { limit, name } = {}) {
  const memo = Memo({ limit, name });
  const propKeys = [];
  let cache;
  let lastProps;

  return (input) => {
    const props = { ...defaultProps, ...input };
    if (lastProps === props) return cache;
    lastProps = props;

    function getKeys() {
      const keys = propKeys.map((key) =>
        props[key] === defaultProps[key] ? undefined : props[key]
      );
      return removeUndefinedPadding(keys);
    }

    if (propKeys.length) {
      Object.keys(input).forEach((key) => {
        if (!propKeys.includes(key) && input[key] !== defaultProps[key])
          propKeys.push(key);
      });
      const propValues = getKeys();
      const directValue = memo.get(propValues);

      // if (name === "text_width")
      //   console.log(".....getting", propValues, propKeys, directValue);

      if (typeof directValue !== "undefined") {
        cache = directValue;
        return cache;
      }
    }

    const trackingProps = defineGetters({ ...props }, input, (prop, key) => {
      if (!propKeys.includes(key) && prop !== defaultProps[key])
        propKeys.push(key);
      return prop;
    });

    cache = func(trackingProps);

    const keys = getKeys(propKeys);
    memo.set(keys, cache);

    // if (name === "text_width")
    //   console.log(".....setting", keys, cache);

    return cache;
  };
}

export default Cached;
