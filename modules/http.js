import curry from 'lodash.curry';

import { Ok, Err } from './fp';

const HTTP_SEND = Symbol('Http.send');

export const get = curry((url, jsonFn) => ({
  method: 'GET',
  url,
  jsonFn
}));

export const send = curry((msg, request) => ({
  type: HTTP_SEND,
  msg,
  request
}));

export const sendCommandHandler = {
  symbol: HTTP_SEND,
  handler: (cmd, dispatch) => {
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
};
