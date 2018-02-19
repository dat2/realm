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

// export const listenSubscriptionHandler = {
//   create: runtime => {
//     return {
//       setup: subscription => {
//       },
//       cleanup: subscription => {
//         _close(subscription.url);
//       }
//     };
//   }
// };
