import React from 'react';
import PropTypes from 'prop-types';

export default class Relm extends React.Component {
  static propTypes = {
    children: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      model: props.model
    };
  }

  dispatch = msg => {
    this.setState({
      model: this.props.update(msg)(this.state.model)
    })
  }

  onClick = msg => e => {
    if (typeof msg === typeof '') {
      this.dispatch({ type: msg, e });
    } else {
      this.dispatch(msg(e));
    }
  }

  onChange = msg => e => {
    if (typeof msg === typeof '') {
      this.dispatch({ type: msg, value: e.target.value });
    } else {
      this.dispatch(msg(e.target.value));
    }
  }

  render() {
    return (
      this.props.children({
        model: this.state.model,
        onClick: this.onClick,
        onChange: this.onChange
      })
    )
  }
}
