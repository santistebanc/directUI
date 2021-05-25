import { removeUndefinedPadding } from "../utils";
import Memo from "./Memo";

function Memoized(func, defaultInput, { limit, name } = {}) {
  const memo = Memo({ limit, name });
  let cache;

  return (...input) => {
    const unpaddedInput = removeUndefinedPadding(
      input.map((val, i) => (val === defaultInput[i] ? undefined : val))
    );

    const directValue = memo.get(unpaddedInput);

    if (typeof directValue !== "undefined") {
      cache = directValue;
      return cache;
    }

    const parsedInput = defaultInput.map((val, i) => input[i] ?? val);

    cache = func(...parsedInput);
    memo.set(unpaddedInput, cache);

    return cache;
  };
}

export default Memoized;
