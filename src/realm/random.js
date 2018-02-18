import curry from 'lodash.curry';

const RANDOM_GENERATE = Symbol('Random.generate');

export const generate = curry((msg, generator) => ({
  type: RANDOM_GENERATE,
  msg,
  generator
}));

export const int = curry((min, max) => ({
  generate: () => Math.floor(Math.random() * Math.floor(max + 1 - min)) + min
}));

export const generateCommandHandler = {
  symbol: RANDOM_GENERATE,
  handler: (cmd, dispatch) => {
    dispatch({ type: cmd.msg, value: cmd.generator.generate() });
  }
};
