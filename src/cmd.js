// @flow
import { Ok, Err } from './fp';
import type { ResultCata } from './fp';

export type Cmd<M> = NoneCmd | BatchCmd<M> | SendCmd<M> | GenerateCmd<M, *>;

export type NoneCmd = {
  type: 'none'
};

export type BatchCmd<M> = {
  type: 'batch',
  cmds: Array<Cmd<M>>
};

export type SendCmd<M> = {
  type: 'send',
  cata: ResultCata<any, any, M>,
  request: Request
};

export type Request = {
  method: 'GET' | 'POST',
  url: string
};

export type GenerateCmd<M, T> = {
  type: 'generate',
  constructMsg: T => M,
  generator: Generator<T>
};

export type Generator<T> = {
  generate: void => T
};

// create
export function get(url: string, transform: any => any): Request {
  return {
    method: 'GET',
    url
  };
}

export function send<M>(
  cata: ResultCata<any, any, M>,
  request: Request
): SendCmd<M> {
  return {
    type: 'send',
    cata,
    request
  };
}

export function generate<M, T>(
  constructMsg: T => M,
  generator: Generator<T>
): GenerateCmd<M, T> {
  return {
    type: 'generate',
    constructMsg,
    generator
  };
}

export function int(min: number, max: number): Generator<number> {
  return {
    generate: () => Math.floor(Math.random() * Math.floor(max + 1 - min)) + min
  };
}

// handle
export async function handleCmd<M>(cmd: Cmd<M>, dispatch: M => void) {
  if (cmd.type === 'batch') {
    return handleBatchCmd(cmd, dispatch);
  } else if (cmd.type === 'send') {
    return handleSendCmd(cmd, dispatch);
  }
}

export async function handleBatchCmd<M>(cmd: BatchCmd<M>, dispatch: M => void) {
  await Promise.all(cmd.cmds.map(cmd => handleCmd(cmd, dispatch)));
}

export async function handleSendCmd<M>(cmd: SendCmd<M>, dispatch: M => void) {
  try {
    const response = await fetch(cmd.request.url);
    const json = await response.json();
    dispatch(cmd.cata.Ok(Ok(json)));
  } catch (e) {
    dispatch(cmd.cata.Err(Err(e)));
  }
}

export async function handleGenerateCmd<M, T>(
  cmd: GenerateCmd<M, T>,
  dispatch: M => void
) {
  dispatch(cmd.constructMsg(cmd.generator.generate()));
}
