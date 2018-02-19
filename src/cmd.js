// @flow
import { Ok, Err } from './fp';
import type { ResultCata } from './fp';
import * as Websocket from './websocket';

export type Cmd<M> =
  | NoneCmd
  | BatchCmd<M>
  | HttpSendCmd<M>
  | RandomGenerateCmd<M, *>
  | WebsocketSendCmd<M>;

export type NoneCmd = {
  type: 'none'
};

export type BatchCmd<M> = {
  type: 'batch',
  cmds: Array<Cmd<M>>
};

export type HttpSendCmd<M> = {
  type: 'http.send',
  cata: ResultCata<any, any, M>,
  request: Request
};

export type Request = {
  method: 'GET' | 'POST',
  url: string
};

export type RandomGenerateCmd<M, T> = {
  type: 'random.generate',
  constructMsg: T => M,
  generator: RandomGenerator<T>
};

export type RandomGenerator<T> = {
  generate: void => T
};

export type WebsocketSendCmd<M> = {
  type: 'websocket.send',
  url: string,
  data: any,
  msg: ?M
};

// create
export const none: NoneCmd = {
  type: 'none'
};

export function batch<M>(cmds: Array<Cmd<M>>): BatchCmd<M> {
  return {
    type: 'batch',
    cmds
  };
}

export function httpSend<M>(
  request: Request,
  cata: ResultCata<any, any, M>
): HttpSendCmd<M> {
  return {
    type: 'http.send',
    cata,
    request
  };
}

export function httpGet(url: string): Request {
  return {
    method: 'GET',
    url
  };
}

export function randomGenerate<M, T>(
  generator: RandomGenerator<T>,
  constructMsg: T => M
): RandomGenerateCmd<M, T> {
  return {
    type: 'random.generate',
    constructMsg,
    generator
  };
}

export function websocketSend<M>(
  url: string,
  data: any,
  msg: ?M
): WebsocketSendCmd<M> {
  return {
    type: 'websocket.send',
    url,
    data,
    msg
  };
}

export function int(min: number, max: number): RandomGenerator<number> {
  return {
    generate: () => Math.floor(Math.random() * Math.floor(max + 1 - min)) + min
  };
}

// handle
export async function handleCmd<M>(cmd: Cmd<M>, dispatch: M => void) {
  if (cmd.type === 'batch') {
    return handleBatchCmd(cmd, dispatch);
  } else if (cmd.type === 'http.send') {
    return handleHttpSendCmd(cmd, dispatch);
  } else if (cmd.type === 'random.generate') {
    return handleRandomGenerateCmd(cmd, dispatch);
  } else if (cmd.type === 'websocket.send') {
    return handleWebsocketSendCmd(cmd, dispatch);
  }
}

export async function handleBatchCmd<M>(cmd: BatchCmd<M>, dispatch: M => void) {
  await Promise.all(cmd.cmds.map(cmd => handleCmd(cmd, dispatch)));
}

export async function handleHttpSendCmd<M>(
  cmd: HttpSendCmd<M>,
  dispatch: M => void
) {
  try {
    const response = await fetch(cmd.request.url);
    const json = await response.json();
    dispatch(cmd.cata.Ok(Ok(json)));
  } catch (e) {
    dispatch(cmd.cata.Err(Err(e)));
  }
}

export async function handleRandomGenerateCmd<M, T>(
  cmd: RandomGenerateCmd<M, T>,
  dispatch: M => void
) {
  dispatch(cmd.constructMsg(cmd.generator.generate()));
}

export async function handleWebsocketSendCmd<M>(
  cmd: WebsocketSendCmd<M>,
  dispatch: M => void
) {
  Websocket.getOrOpen(cmd.url).send(cmd.data);
  if (cmd.msg !== null && cmd.msg !== undefined) {
    dispatch(cmd.msg);
  }
}
