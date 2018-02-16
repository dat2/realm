import React from 'react';
import PropTypes from 'prop-types';

export const Cmd = {
  none: { type: 'none' }
};

export const Random = {
  generate: msg => generator => ({
    type: 'Random.generate',
    msg,
    generator
  }),
  int: min => max => ({
    type: 'int',
    min,
    max
  })
};

export const Pair = (left, right) => ({
  type: 'Pair',
  left,
  right
});

class RelmStore {
  constructor({ model, update }) {
    this.model = model;
    this.update = update;
    this.subscribers = [];
  }

  dispatch(msg) {
    const result = this.update(msg)(this.model);
    if (result.type === 'Pair') {
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
    if (cmd.type === 'Random.generate') {
      if (cmd.generator.type === 'int') {
        const randomNumber =
          Math.floor(
            Math.random() *
              Math.floor(cmd.generator.max + 1 - cmd.generator.min)
          ) + cmd.generator.min;
        this.dispatch({ type: cmd.msg, value: randomNumber });
      }
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

export default class Relm extends React.Component {
  static propTypes = {
    children: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this._relm = new RelmStore(props);
    this._unsubscribe = this._relm.subscribe(() => {
      this.setState({});
    });
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
