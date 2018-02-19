// @flow
import { Ok, Err } from './fp';

const HTTP_SEND = 'HTTP_SEND';

export type Cmd<T> = NoneCmd | HttpSendCmd<T>;

export type NoneCmd = {
  type: 'none'
};

export type HttpMethod = 'GET' | 'POST';

export type Request<T> = {
  method: HttpMethod,
  url: string,
  jsonFn: any => T
};

export type HttpSendCmd<T> = {
  type: 'HTTP_SEND',
  msg: string,
  request: Request<T>
};

// create
export function get<T>(url: string, jsonFn: any => T): Request<T> {
  return {
    method: 'GET',
    url,
    jsonFn
  };
}

export function send<T>(msg: string, request: Request<T>): HttpSendCmd<T> {
  return {
    type: HTTP_SEND,
    msg,
    request
  };
}

// handle
export function handleCmd<T>(cmd: Cmd<T>, dispatch: any => void) {
  switch (cmd.type) {
    case HTTP_SEND:
      handleHttpSendCmd(cmd, dispatch);
      return;
    default:
      return;
  }
}

export function handleHttpSendCmd<T>(
  cmd: HttpSendCmd<T>,
  dispatch: any => void
) {
  fetch(cmd.request.url)
    .then(response => response.json())
    .then(json => {
      dispatch({
        type: cmd.msg,
        value: Ok(cmd.request.jsonFn(json))
      });
    })
    .catch(err => {
      dispatch({
        type: cmd.msg,
        value: Err(err)
      });
    });
}
