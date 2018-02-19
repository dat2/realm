// @flow
type Rc<T> = {
  count: number,
  obj: T
};

const _websockets: { [string]: Rc<WebSocket> } = {};

export function getOrOpen(url: string) {
  if (url in _websockets) {
    const obj = _websockets[url];
    obj.count++;
    return obj.obj;
  } else {
    _websockets[url] = {
      count: 1,
      obj: new WebSocket(url)
    };
    return _websockets[url].obj;
  }
}

export function close(url: string) {
  if (url in _websockets) {
    _websockets[url].count--;
    if (_websockets[url].count === 0) {
      _websockets[url].obj.close();
    }
  }
}

// listen

// const WEBSOCKET_LISTEN = Symbol('Websocket.listen');

// export const listen = curry((url, msg) => ({
//   type: WEBSOCKET_LISTEN,
//   url,
//   msg
// }));

// export const listenSubscriptionHandler = {
//   symbol: WEBSOCKET_LISTEN,
//   create: runtime => {
//     return {
//       setup: subscription => {
//         const { url, msg } = subscription;
//         const ws = _getOrOpen(url);
//         ws.addEventListener('message', event => {
//           runtime.dispatch({ type: msg, value: event.data });
//         });
//       },
//       cleanup: subscription => {
//         _close(subscription.url);
//       }
//     };
//   }
// };
