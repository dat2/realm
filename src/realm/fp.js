export const PAIR = Symbol('Pair');
export const OK = Symbol('Ok');
export const ERR = Symbol('Err');

export const identity = x => x;

export const Pair = (left, right) => ({
  type: PAIR,
  left,
  right
});

export const Ok = value => ({ type: OK, value });

export const Err = error => ({ type: ERR, error });

export const Result = f => result => {
  if (result.type === OK) {
    return f.Ok(result.value);
  } else {
    return f.Err(result.error);
  }
};
