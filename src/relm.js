import React from 'react';
import PropTypes from 'prop-types';

/* UTILS (Pair, Result) */
const PAIR = Symbol('Pair');

export const Pair = (left, right) => ({
  type: PAIR,
  left,
  right
});

const OK = Symbol('Ok');
const Ok = value => ({ type: OK, value });

const ERR = Symbol('Err');
const Err = error => ({ type: ERR, error });

export const Result = f => result => {
  if (result.type === OK) {
    return f.Ok(result.value);
  } else {
    return f.Err(result.error);
  }
};

/* COMMANDS (None, Random, Http) */
const NONE = Symbol('none');

export const Cmd = {
  none: { type: NONE }
};

const RANDOM_GENERATE = Symbol('Random.generate');

export const Random = {
  generate: msg => generator => ({
    type: RANDOM_GENERATE,
    msg,
    generator
  }),
  int: min => max => ({
    generate: () => Math.floor(Math.random() * Math.floor(max + 1 - min)) + min
  })
};

const HTTP_SEND = Symbol('Http.send');

export const Http = {
  get: url => jsonFn => ({
    method: 'GET',
    url,
    jsonFn
  }),
  send: msg => request => ({
    type: HTTP_SEND,
    msg,
    request
  })
};

/* Subscriptions (Time, Websocket) */
const TICK = Symbol('Tick');

const Tick = timestamp => ({ type: TICK, timestamp });

const EVERY = Symbol('every');

export const Time = {
  every: tick => msg => ({
    type: EVERY,
    tick,
    msg
  }),
  second: Tick(1000),
  inMinutes: timestamp => timestamp / 1000 / 60
};

const WEBSOCKET_LISTEN = Symbol('Websocket.listen');

const WEBSOCKET_SEND = Symbol('Websocket.send');

export const Websocket = {
  send: url => data => ({
    type: WEBSOCKET_SEND,
    url,
    data
  }),
  listen: url => msg => ({
    type: WEBSOCKET_LISTEN,
    url,
    msg
  })
};

const SUB_NONE = Symbol('Sub.none');
const SUB_BATCH = Symbol('Sub.batch');

export const Sub = {
  none: { type: SUB_NONE },
  batch: subs => ({
    type: SUB_BATCH,
    subs
  })
};

/* Relm */
class RelmRuntime {
  constructor({ model, init, update, subscriptions }) {
    this.model = model;
    this.init = init;
    this.update = update;
    this.subscriptions = subscriptions;
    this.subscriber = () => {};
  }

  start() {
    if (this.init) {
      this.model = this.init.left;
      this.handleCmd(this.init.right);
      delete this.init;
    }

    if (this.subscriptions.type === SUB_BATCH) {
      this.subscriptions.subs.forEach(subscription => {
        this._startSubscription(subscription);
      });
    } else {
      this._startSubscription(this.subscriptions);
    }
  }

  _startSubscription(subscription) {
    if (subscription.type === EVERY) {
      const { tick: { timestamp }, msg } = subscription;
      this._interval = setInterval(() => {
        this.dispatch({ type: msg, value: Date.now() });
      }, timestamp);
    }

    if (subscription.type === WEBSOCKET_LISTEN) {
      const { url, msg } = subscription;
      const ws = new WebSocket(url);
      ws.addEventListener('message', event => {
        this.dispatch({ type: msg, value: event.data });
      });
      this._websockets = {
        [url]: ws
      };
    }
  }

  stop() {
    if (this.subscriptions.type === SUB_BATCH) {
      this.subscriptions.subs.forEach(subscription => {
        this._stopSubscription(subscription);
      });
    } else {
      this._stopSubscription(this.subscriptions);
    }
  }

  _stopSubscription(subscription) {
    if (subscription.type === EVERY) {
      clearInterval(this._interval);
    }

    if (subscription.type === WEBSOCKET_LISTEN) {
      this._websockets[subscription.url].close();
    }
  }

  subscribe(subscriber) {
    this.subscriber = subscriber;
  }

  dispatch(msg) {
    console.log(msg);
    const result = this.update(msg)(this.model);
    if (result.type === PAIR) {
      this.model = result.left;
      this.handleCmd(result.right);
    } else {
      this.model = result;
    }
    this.subscriber();
  }

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
      this._websockets[cmd.url].send(cmd.data);
    }
  }
}

/* React Class */
export default class RelmApp extends React.Component {
  static propTypes = {
    children: PropTypes.func.isRequired
  };

  componentWillMount() {
    this._relm = new RelmRuntime(this.props);
    this._unsubscribe = this._relm.subscribe(() => this.setState({}));
    this._relm.start();
  }

  componentWillUnmount() {
    this._relm.stop();
  }

  onClick = msg => e => {
    this._relm.dispatch({ type: msg, e });
  };

  onChange = msg => e => {
    this._relm.dispatch({ type: msg, value: e.target.value });
  };

  render() {
    return this.props.children({
      model: this._relm.model,
      onClick: this.onClick,
      onChange: this.onChange
    });
  }
}
