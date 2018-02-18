import curry from 'lodash.curry';

const WEBSOCKET_LISTEN = Symbol('Websocket.listen');
const WEBSOCKET_SEND = Symbol('Websocket.send');

export const send = curry((url, data) => ({
  type: WEBSOCKET_SEND,
  url,
  data
}));

export const listen = curry((url, msg) => ({
  type: WEBSOCKET_LISTEN,
  url,
  msg
}));

const _websockets = {};

const _getOrOpen = url => {
  if (url in _websockets) {
    return _websockets[url];
  } else {
    _websockets[url] = new WebSocket(url);
    return _websockets[url];
  }
};

const _close = url => {
  // TODO reference counting
  _websockets[url].close();
};

export const sendCommandHandler = {
  symbol: WEBSOCKET_SEND,
  handler: (cmd, dispatch) => {
    _getOrOpen(cmd.url).send(cmd.data);
  }
};

export const listenSubscriptionHandler = {
  symbol: WEBSOCKET_LISTEN,
  create: runtime => {
    return {
      setup: subscription => {
        const { url, msg } = subscription;
        const ws = _getOrOpen(url);
        ws.addEventListener('message', event => {
          runtime.dispatch({ type: msg, value: event.data });
        });
      },
      cleanup: subscription => {
        _close(subscription.url);
      }
    };
  }
};
