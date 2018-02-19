// @flow

import React from 'react';
import createReactContext from 'create-react-context';

import type { RuntimeArgs } from './runtime';
import { RealmRuntime } from './runtime';
import { identity } from './fp';

const RealmContext = createReactContext({
  model: {},
  dispatch: () => {}
});

export class RealmProvider<Model, Msg> extends React.Component<RuntimeArgs<Model, Msg>> {
  _realm: RealmRuntime<Model, Msg>;
  _unsubscribe: void => void;

  constructor(props: RuntimeArgs<Model, Msg>) {
    super(props);
    this._realm = new RealmRuntime(this.props);
    this._unsubscribe = this._realm.subscribe(() => this.setState({}));
  }

  componentWillMount() {
    this._realm.start();
  }

  componentWillUnmount() {
    this._realm.stop();
  }

  dispatch(msg: Msg) {
    this._realm.dispatch(msg);
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

export const connect = (mapProps) => Component => {
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
