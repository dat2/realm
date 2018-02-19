// @flow
type Tuple<L, R> = {
  type: 'PAIR',
  left: L,
  right: R
};

type Result<O, E> = { type: 'Ok', value: O } | { type: 'Err', error: E };

type ResultCata<O, E, T> = {
  Ok: O => T,
  Err: E => T
};

export function identity<T>(x: T): T {
  return x;
}

export function Pair<L, R>(left: L, right: R): Tuple<L, R> {
  return {
    type: 'PAIR',
    left,
    right
  };
}

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
}

export function MatchResult<O, E, T>(
  f: ResultCata<O, E, T>,
  result: Result<O, E>
): T {
  if (result.type === 'Ok') {
    return f.Ok(result.value);
  } else {
    return f.Err(result.error);
  }
}
