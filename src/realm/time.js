import curry from 'lodash.curry';

const TICK = Symbol('Tick');
const EVERY = Symbol('every');

export const Tick = timestamp => ({ type: TICK, timestamp });

export const every = curry((tick, msg) => ({
  type: EVERY,
  tick,
  msg
}));

export const second = Tick(1000);

export const inMinutes = timestamp => timestamp / 1000 / 60;

export const everySubscriptionHandler = {
  symbol: EVERY,
  create: runtime => {
    let _interval;
    return {
      setup: subscription => {
        const { tick: { timestamp }, msg } = subscription;
        _interval = setInterval(() => {
          runtime.dispatch({ type: msg, value: Date.now() });
        }, timestamp);
      },
      cleanup: subscription => {
        clearInterval(_interval);
      }
    };
  }
};
