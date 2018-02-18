import React from 'react';
import PropTypes from 'prop-types';
import createReactContext from 'create-react-context';

import { createRealmRuntime } from './index.js';
import { identity } from './fp';

const RealmContext = createReactContext({
  model: {},
  dispatch: () => {}
});

export class RealmProvider extends React.Component {
  constructor(...args) {
    super(...args);
    this.dispatch = this.dispatch.bind(this);
  }

  componentWillMount() {
    this._realm = createRealmRuntime(this.props);
    this._unsubscribe = this._realm.subscribe(() => this.setState({}));
    this._realm.start();
  }

  componentWillUnmount() {
    this._realm.stop();
  }

  dispatch(msg) {
    return value => {
      this._realm.dispatch({ type: msg, value });
    };
  }

  render() {
    return (
      <RealmContext.Provider
        value={{
          model: this._realm.model,
          dispatch: this.dispatch
        }}
      >
        {this.props.children}
      </RealmContext.Provider>
    );
  }
}

RealmProvider.propTypes = {
  children: PropTypes.node
};

RealmProvider.defaultProps = {
  children: null
};

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

export const onClick = cb => e => {
  cb(e);
};

export const onChange = cb => e => {
  cb(e.target.value);
};
