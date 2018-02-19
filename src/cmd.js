// @flow
import { Ok, Err } from './fp';

export type Cmd = NoneCmd | BatchCmd | SendCmd;

export type NoneCmd = {
  type: 'none'
};

export type BatchCmd = {
  type: 'batch',
  cmds: Array<Cmd>
};

export type HttpMethod = 'GET' | 'POST';

export type Request = {
  method: HttpMethod,
  url: string,
  transform: any => any
};

export type SendCmd = {
  type: 'send',
  msg: string,
  request: Request
};

// create
export function get(url: string, transform: any => any): Request {
  return {
    method: 'GET',
    url,
    transform
  };
}

export function send(msg: string, request: Request): SendCmd {
  return {
    type: 'send',
    msg,
    request
  };
}

// handle
export function handleCmd(cmd: Cmd, dispatch: any => void) {
  if (cmd.type === 'batch') {
    handleBatchCmd(cmd, dispatch);
  } else if (cmd.type === 'send') {
    handleSendCmd(cmd, dispatch);
  }
}

export function handleBatchCmd(cmd: BatchCmd, dispatch: any => void) {
  cmd.cmds.forEach(cmd => {
    handleCmd(cmd, dispatch);
  });
}

export function handleSendCmd(cmd: SendCmd, dispatch: any => void) {
  fetch(cmd.request.url)
    .then(response => response.json())
    .then(json => {
      dispatch({
        type: cmd.msg,
        value: Ok(cmd.request.transform(json))
      });
    })
    .catch(err => {
      dispatch({
        type: cmd.msg,
        value: Err(err)
      });
    });
}
