import curry from 'lodash.curry';

import { Ok, Err, PAIR } from './fp';

/* COMMANDS (None, Random, Http) */
const NONE = Symbol('none');

export const Cmd = {
  none: { type: NONE }
};

const RANDOM_GENERATE = Symbol('Random.generate');

export const Random = {
  generate: curry((msg, generator) => ({
    type: RANDOM_GENERATE,
    msg,
    generator
  })),
  int: curry((min, max) => ({
    generate: () => Math.floor(Math.random() * Math.floor(max + 1 - min)) + min
  }))
};

const HTTP_SEND = Symbol('Http.send');

export const Http = {
  get: curry((url, jsonFn) => ({
    method: 'GET',
    url,
    jsonFn
  })),
  send: curry((msg, request) => ({
    type: HTTP_SEND,
    msg,
    request
  }))
};

/* Subscriptions (Sub, Time, Websocket) */
const SUB_NONE = Symbol('Sub.none');
const SUB_BATCH = Symbol('Sub.batch');

export const Sub = {
  none: { type: SUB_NONE },
  batch: subs => ({
    type: SUB_BATCH,
    subs
  }),
  noneSubscriptionHandler: {
    symbol: SUB_NONE,
    create: () => {
      return {
        setup: () => {},
        cleanup: () => {}
      };
    }
  },
  batchSubscriptionHandler: {
    symbol: SUB_BATCH,
    create: runtime => {
      return {
        setup: subscriptions => {
          subscriptions.subs.forEach(subscription => {
            runtime.setupSubscription(subscription);
          });
        },
        cleanup: subscriptions => {
          subscriptions.subs.forEach(subscription => {
            runtime.cleanupSubscription(subscription);
          });
        }
      };
    }
  }
};

const TICK = Symbol('Tick');
const EVERY = Symbol('every');

const Tick = timestamp => ({ type: TICK, timestamp });

export const Time = {
  every: curry((tick, msg) => ({
    type: EVERY,
    tick,
    msg
  })),
  second: Tick(1000),
  inMinutes: timestamp => timestamp / 1000 / 60,
  everySubscriptionHandler: {
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
  }
};

const WEBSOCKET_LISTEN = Symbol('Websocket.listen');
const WEBSOCKET_SEND = Symbol('Websocket.send');

export const Websocket = {
  send: curry((url, data) => ({
    type: WEBSOCKET_SEND,
    url,
    data
  })),
  listen: curry((url, msg) => ({
    type: WEBSOCKET_LISTEN,
    url,
    msg
  })),
  listenSubscriptionHandler: {
    symbol: WEBSOCKET_LISTEN,
    create: runtime => {
      let _ws;
      return {
        setup: subscription => {
          const { url, msg } = subscription;
          _ws = new WebSocket(url);
          _ws.addEventListener('message', event => {
            runtime.dispatch({ type: msg, value: event.data });
          });
        },
        cleanup: subscription => {
          _ws.close();
        }
      };
    }
  }
};

/* Realm */
export class RealmRuntime {
  constructor({ model, init, update, subscriptions }) {
    this.model = model;
    this.init = init;
    this.update = update;
    this.subscriber = () => {};
    this.subscriptions = subscriptions;
    this.subscriptionHandlers = {};
    this.registerSubscriptionHandler(Sub.noneSubscriptionHandler);
    this.registerSubscriptionHandler(Sub.batchSubscriptionHandler);
  }

  registerSubscriptionHandler({ symbol, create }) {
    this.subscriptionHandlers[symbol] = create(this);
  }

  start() {
    if (this.init) {
      this.model = this.init.left;
      this.handleCmd(this.init.right);
      delete this.init;
    }

    this.setupSubscription(this.subscriptions);
  }

  setupSubscription = subscription => {
    const handler = this.subscriptionHandlers[subscription.type];
    // TODO invariant
    handler.setup(subscription);
  };

  stop() {
    this.cleanupSubscription(this.subscriptions);
  }

  cleanupSubscription = subscription => {
    const handler = this.subscriptionHandlers[subscription.type];
    // TODO invariant
    handler.cleanup(subscription);
  };

  subscribe(subscriber) {
    this.subscriber = subscriber;
  }

  dispatch = msg => {
    const result = this.update(msg)(this.model);
    if (result.type === PAIR) {
      this.model = result.left;
      this.handleCmd(result.right);
    } else {
      this.model = result;
    }
    this.subscriber();
  };

  handleCmd(cmd) {
    if (cmd.type === RANDOM_GENERATE) {
      this.dispatch({ type: cmd.msg, value: cmd.generator.generate() });
    } else if (cmd.type === HTTP_SEND) {
      fetch(cmd.request.url)
        .then(response => response.json())
        .then(json => {
          this.dispatch({
            type: cmd.msg,
            value: Ok(cmd.request.jsonFn(json))
          });
        })
        .catch(err => {
          this.dispatch({
            type: cmd.msg,
            value: Err(err)
          });
        });
    } else if (cmd.type === WEBSOCKET_SEND) {
      // this._websockets[cmd.url].send(cmd.data);
    }
  }
}

export const createRealmRuntime = (
  realmArgs,
  subscriptionHandlers = [
    Time.everySubscriptionHandler,
    Websocket.listenSubscriptionHandler
  ]
) => {
  const runtime = new RealmRuntime(realmArgs);
  subscriptionHandlers.forEach(subscriptionHandler => {
    runtime.registerSubscriptionHandler(subscriptionHandler);
  });
  return runtime;
};
