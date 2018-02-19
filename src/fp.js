// @flow
import curry from 'lodash.curry';

type Tuple<L, R> = {
  type: 'PAIR',
  left: L,
  right: R,
};

type Result<O, E> =
    { type: 'Ok', value: O }
  | { type: 'Err', error: E };

export const ERR = Symbol('Err');

export function identity<T>(x: T): T {
  return x;
}

export const Pair = curry((left, right) => ({
  left,
  right
}));

export function Ok<O, R>(value: O): Result<O, R> {
  return {
    type: 'Ok',
    value
  };
}

export function Err<O, E>(error: E): Result<O, E> {
  return {
    type: 'Err',
    error
  };
};

export const MatchResult = curry((f, result) => {
  if (result.type === 'Ok') {
    return f.Ok(result.value);
  } else {
    return f.Err(result.error);
  }
});
