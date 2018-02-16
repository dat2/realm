import React from 'react';
import PropTypes from 'prop-types';

const NONE = Symbol('none');

export const Cmd = {
  none: { type: NONE }
};

const PAIR = Symbol('Pair');

export const Pair = (left, right) => ({
  type: PAIR,
  left,
  right
});

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

class Relm {
  constructor({ model, update }) {
    this.model = model;
    this.update = update;
    this.subscribers = [];
  }

  dispatch(msg) {
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
