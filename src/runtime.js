// @flow
import type { Pair } from './fp';
import type { Cmd } from './cmd';
import type { Sub, SubHandler } from './sub';

import { handleCmd } from './cmd';
import { createSubHandler } from './sub';

type UpdateFnReturn<Model, Msg> = Pair<Model, Cmd<Msg>> | Model;

type UpdateFn<Model, Msg> = Msg => Model => UpdateFnReturn<Model, Msg>;

export type RuntimeArgs<Model, Msg> = {
  model: Model,
  init: ?Pair<Model, Cmd<Msg>>,
  update: UpdateFn<Model, Msg>,
  subscriptions: Sub<Msg>
};

export class RealmRuntime<Model, Msg> {
  model: Model;
  init: ?Pair<Model, Cmd<Msg>>;
  update: UpdateFn<Model, Msg>;
  subscriptionHandler: SubHandler<Msg>;
  subscriber: void => void;

  constructor({ model, init, update, subscriptions }: RuntimeArgs<Model, Msg>) {
    this.model = model;
    this.init = init;
    this.update = update;
    this.subscriptionHandler = createSubHandler(
      subscriptions,
      this.dispatch.bind(this)
    );
    this.subscriber = () => {};
  }

  start() {
    if (this.init) {
      this.model = this.init.left;
      handleCmd(this.init.right, this.dispatch.bind(this));
      delete this.init;
    }
    this.subscriptionHandler.setup();
  }

  stop() {
    this.subscriptionHandler.cleanup();
  }

  subscribe(subscriber: void => void) {
    this.subscriber = subscriber;
  }

  dispatch(msg: Msg) {
    const result = this.update(msg)(this.model);
    if (result.type === 'pair') {
      this.model = result.left;
      handleCmd(result.right, this.dispatch.bind(this));
    } else {
      this.model = result;
    }
    this.subscriber();
  }
}
