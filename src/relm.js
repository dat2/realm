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

/* Relm */
class Relm {
  constructor({ model, update }) {
    this.model = model;
    this.update = update;
    this.subscribers = [];
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
    this.subscribers.forEach(subscriber => {
      subscriber();
    });
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
    }
  }

  subscribe(subscriber) {
    this.subscribers.push(subscriber);
    return () => {
      const index = this.subscribers.indexOf(subscriber);
      this.subscribers.splice(index, 1);
    };
  }
}

const createRelm = ({ model, init, update }, subscriber) => {
  if (init) {
    const relm = new Relm({ model: init.left, update });
    const unsubscribe = relm.subscribe(subscriber);
    relm.handleCmd(init.right);
    return { relm, unsubscribe };
  } else {
    const relm = new Relm({ model, update });
    const unsubscribe = relm.subscribe(subscriber);
    return { relm, unsubscribe };
  }
};

/* React Class */
export default class RelmApp extends React.Component {
  static propTypes = {
    children: PropTypes.func.isRequired
  };

  componentWillMount() {
    const { relm, unsubscribe } = createRelm(this.props, () => {
      this.setState({});
    });
    this._relm = relm;
    this._unsubscribe = unsubscribe;
  }

  componentWillUnmount() {
    this._unsubscribe();
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
