import React from 'react';
import PropTypes from 'prop-types';

import { RealmRuntime } from './index.js';
import { identity } from './fp';

const RealmContext = React.createContext({
  model: {},
  onClick: () => {},
  onChange: () => {}
});

export class RealmProvider extends React.Component {
  static propTypes = {
    children: PropTypes.node
  };

  static defaultProps = {
    children: null
  };

  componentWillMount() {
    this._relm = new RealmRuntime(this.props);
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
    return (
      <RealmContext.Provider
        value={{
          model: this._relm.model,
          onClick: this.onClick,
          onChange: this.onChange
        }}
      >
        {this.props.children}
      </RealmContext.Provider>
    );
  }
}

export const connect = (mapProps = identity) => Component => {
  const Connect = props => {
    return (
      <RealmContext.Consumer>
        {realmProps => <Component {...props} {...mapProps(realmProps)} />}
      </RealmContext.Consumer>
    );
  };
  Connect.displayName = `connect(${Component.displayName || Component.name})`;
  return Connect;
};
