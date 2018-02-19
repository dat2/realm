// @flow
import * as Websocket from './websocket';

// types
export type Sub<M> =
  | NoneSub
  | BatchSub<M>
  | TimeEverySub<M>
  | WebsocketListenSub<M>;

export type NoneSub = {
  type: 'none'
};

export type BatchSub<M> = {
  type: 'batch',
  subs: Array<Sub<M>>
};

export type TimeEverySub<M> = {
  type: 'time.every',
  tick: Tick,
  constructMsg: Tick => M
};

export type Tick = {
  type: 'tick',
  timestamp: number
};

export type WebsocketListenSub<M> = {
  type: 'websocket.listen',
  url: string,
  constructMsg: any => M
};

// create
export const none: NoneSub = {
  type: 'none'
};

export function batch<M>(subs: Array<Sub<M>>): BatchSub<M> {
  return {
    type: 'batch',
    subs
  };
}

export function timeEvery<M>(
  tick: Tick,
  constructMsg: Tick => M
): TimeEverySub<M> {
  return {
    type: 'time.every',
    tick,
    constructMsg
  };
}

export function tick(timestamp: number): Tick {
  return {
    type: 'tick',
    timestamp
  };
}

export const second: Tick = tick(1000);

export function inMinutes(timestamp: number): number {
  return timestamp / 1000 / 60;
}

export function websocketListen<M>(
  url: string,
  constructMsg: any => M
): WebsocketListenSub<M> {
  return {
    type: 'websocket.listen',
    url,
    constructMsg
  };
}

// handlers
export function createSubHandler<M>(
  subscription: Sub<M>,
  dispatch: M => void
): SubHandler<M> {
  if (subscription.type === 'batch') {
    return new BatchSubHandler(subscription, dispatch);
  } else if (subscription.type === 'time.every') {
    return new TimeEverySubHandler(subscription, dispatch);
  } else if (subscription.type === 'websocket.listen') {
    return new WebsocketListenSubHandler(subscription, dispatch);
  } else {
    return new NoneSubHandler(subscription, dispatch);
  }
}

export interface SubHandler<M> {
  setup(): void;
  cleanup(): void;
}

class NoneSubHandler<M> implements SubHandler<M> {
  constructor(subscription: NoneSub, dispatch: M => void) {}
  setup() {}
  cleanup() {}
}

class BatchSubHandler<M> implements SubHandler<M> {
  handlers: Array<SubHandler<M>>;

  constructor(subscription: BatchSub<M>, dispatch: M => void) {
    this.handlers = subscription.subs.map(subscription => {
      return createSubHandler(subscription, dispatch);
    });
  }

  setup() {
    this.handlers.forEach(handler => {
      handler.setup();
    });
  }

  cleanup() {
    this.handlers.forEach(handler => {
      handler.cleanup();
    });
  }
}

class TimeEverySubHandler<M> implements SubHandler<M> {
  subscription: TimeEverySub<M>;
  dispatch: M => void;
  interval: ?IntervalID;

  constructor(subscription: TimeEverySub<M>, dispatch: M => void) {
    this.subscription = subscription;
    this.dispatch = dispatch;
    this.interval = null;
  }

  setup() {
    this.interval = setInterval(() => {
      this.dispatch(this.subscription.constructMsg(tick(Date.now())));
    }, this.subscription.tick.timestamp);
  }

  cleanup() {
    if (this.interval !== undefined && this.interval !== null) {
      clearInterval(this.interval);
    }
  }
}

class WebsocketListenSubHandler<M> implements SubHandler<M> {
  subscription: WebsocketListenSub<M>;
  dispatch: M => void;
  ws: ?WebSocket;

  constructor(subscription: WebsocketListenSub<M>, dispatch: M => void) {
    this.subscription = subscription;
    this.dispatch = dispatch;
    this.ws = null;
  }

  setup() {
    const ws = Websocket.getOrOpen(this.subscription.url);
    ws.addEventListener('message', this._onEvent);
  }

  _onEvent(event: Event) {
    this.dispatch(this.subscription.constructMsg(event.data));
  }

  cleanup() {
    if (this.ws !== undefined && this.ws !== null) {
      this.ws.removeEventListener('message', this._onEvent);
      Websocket.close(this.subscription.url);
    }
  }
}
