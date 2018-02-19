// @flow
import { Ok, Err } from './fp';

type HttpMethod = 'GET' | 'POST';

type Request<T> = {
  method: HttpMethod,
  url: string,
  jsonFn: any => T
};

type SendCmd<T> = {
  type: 'HTTP_SEND',
  msg: string,
  request: Request<T>
};

export function get<T>(url: string, jsonFn: any => T): Request<T> {
  return {
    method: 'GET',
    url,
    jsonFn
  };
}

export function send<T>(msg: string, request: Request<T>): SendCmd<T> {
  return  {
    type: 'HTTP_SEND',
    msg,
    request
  };
}

// export const sendCommandHandler = {
//   symbol: 'HTTP_SEND',
//   handler: (cmd, dispatch) => {
//     fetch(cmd.request.url)
//       .then(response => response.json())
//       .then(json => {
//         dispatch({
//           type: cmd.msg,
//           value: Ok(cmd.request.jsonFn(json))
//         });
//       })
//       .catch(err => {
//         dispatch({
//           type: cmd.msg,
//           value: Err(err)
//         });
//       });
//   }
// };
