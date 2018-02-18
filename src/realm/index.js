import curry from 'lodash.curry';

import { Ok, Err, PAIR } from './fp';
import * as Random from './random';

/* COMMANDS (None, Random, Http) */
const CMD_NONE = Symbol('Cmd.none');

export const Cmd = {
  none: { type: CMD_NONE },
  noneCommandHandler: {
    symbol: CMD_NONE,
    handler: () => {}
  }
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
  })),
  sendCommandHandler: {
    symbol: HTTP_SEND,
    handler: (cmd, dispatch) => {
      fetch(cmd.request.url)
        .then(response => response.json())
        .then(json => {
          dispatch({
            type: cmd.msg,
            value: Ok(cmd.request.jsonFn(json))
          });
        })
        .catch(err => {
          dispatch({
            type: cmd.msg,
            value: Err(err)
          });
        });
    }
  }
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
  _websockets: {},
  _getOrOpen: url => {
    if (url in Websocket._websockets) {
      return Websocket._websockets[url];
    } else {
      Websocket._websockets[url] = new WebSocket(url);
      return Websocket._websockets[url];
    }
  },
  _close: url => {
    // TODO reference counting
    Websocket._websockets[url].close();
  },
  sendCommandHandler: {
    symbol: WEBSOCKET_SEND,
    handler: (cmd, dispatch) => {
      Websocket._getOrOpen(cmd.url).send(cmd.data);
    }
  },
  listenSubscriptionHandler: {
    symbol: WEBSOCKET_LISTEN,
    create: runtime => {
      return {
        setup: subscription => {
          const { url, msg } = subscription;
          const ws = Websocket._getOrOpen(url);
          ws.addEventListener('message', event => {
            runtime.dispatch({ type: msg, value: event.data });
          });
        },
        cleanup: subscription => {
          Websocket._close(subscription.url);
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
    this.subscriptions = subscriptions;
    this.subscriptionHandlers = {};
    this.registerSubscriptionHandler(Sub.noneSubscriptionHandler);
    this.registerSubscriptionHandler(Sub.batchSubscriptionHandler);
    this.commandHandlers = {};
    this.registerCommandHandler(Cmd.noneCommandHandler);
    this.subscriber = () => {};
  }

  registerSubscriptionHandler({ symbol, create }) {
    this.subscriptionHandlers[symbol] = create(this);
  }

  registerCommandHandler({ symbol, handler }) {
    this.commandHandlers[symbol] = handler;
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
    const handler = this.commandHandlers[cmd.type];
    // TODO invariant
    handler(cmd, this.dispatch);
  }
}

export const createRealmRuntime = (
  realmArgs,
  commandHandlers = [
    Random.generateCommandHandler,
    Http.sendCommandHandler,
    Websocket.sendCommandHandler
  ],
  subscriptionHandlers = [
    Time.everySubscriptionHandler,
    Websocket.listenSubscriptionHandler
  ]
) => {
  const runtime = new RealmRuntime(realmArgs);
  commandHandlers.forEach(commandHandler => {
    runtime.registerCommandHandler(commandHandler);
  });
  subscriptionHandlers.forEach(subscriptionHandler => {
    runtime.registerSubscriptionHandler(subscriptionHandler);
  });
  return runtime;
};
