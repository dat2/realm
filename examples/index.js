import React from 'react';
import ReactDOM from 'react-dom';

import { Cmd, Sub } from '../lib';
import { pair, MatchResult } from '../lib/fp';
import * as Random from '../lib/random';
import * as Http from '../lib/http';
import * as Time from '../lib/time';
import * as Websocket from '../lib/websocket';
import { RealmProvider, connect, onClick, onChange } from '../lib/react';

const model = {
  num: 0,
  text: '',
  face: 1,
  topic: 'cats',
  gifUrl: 'waiting.gif',
  tick: 0,
  input: '',
  messages: []
};

const init = pair(model, Cmd.none);

const update = msg => model => {
  switch (msg.type) {
    case 'Increment':
      return pair({ ...model, num: model.num + 1 }, Cmd.none);
    case 'Decrement':
      return pair({ ...model, num: model.num - 1 }, Cmd.none);
    case 'Change':
      return pair({ ...model, text: msg.value }, Cmd.none);
    case 'Roll':
      return pair(model, Random.generate(Random.int(1, 6), value => ({ type: 'NewFace', value })));
    case 'NewFace':
      return pair({ ...model, face: msg.value }, Cmd.none);
    case 'ChangeTopic':
      return pair({ ...model, topic: msg.value }, Cmd.none);
    case 'MorePlease':
      return pair(model, getRandomGif(model.topic));
    case 'NewGif':
      return pair(
        { ...model, gifUrl: msg.value },
        Cmd.none
      );
    case 'Tick':
      return pair({ ...model, tick: msg.value }, Cmd.none);
    case 'Input':
      return pair({ ...model, input: msg.value }, Cmd.none);
    case 'Send':
      return pair(
        { ...model, input: '' },
        Websocket.send('ws://echo.websocket.org', model.input)
      );
    case 'NewMessage':
      return pair(
        { ...model, messages: [...model.messages, msg.value] },
        Cmd.none
      );
    default:
      return pair(model, Cmd.none);
  }
};

const getRandomGif = topic =>
  Http.send(
    Http.get(`https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=${topic}`),
    {
      Ok: json => ({ type: 'NewGif', value: json.data.image_url }),
      Err: () => ({ type: 'NewGifError' }),
    },
  );

const subscriptions = Sub.batch([
  Time.every(Time.second, 'Tick'),
  Websocket.listen('ws://echo.websocket.org', 'NewMessage')
]);

const Counter = ({ Decrement, Increment, num }) => (
  <div>
    <h2>Counter Example</h2>
    <button onClick={Decrement}>-</button>
    <div>{num}</div>
    <button onClick={Increment}>+</button>
  </div>
);

const ConnectedCounter = connect(({ model, dispatch }) => ({
  Decrement: onClick(dispatch('Decrement')),
  Increment: onClick(dispatch('Increment')),
  num: model.num
}))(Counter);

const ReversedString = ({ Change, text }) => (
  <div>
    <h2>Reverse String Example</h2>
    <input value={text} onChange={Change} />
    <p>
      {text
        .split('')
        .reverse()
        .join('')}
    </p>
  </div>
);

const ConnectedReversedString = connect(({ model, dispatch }) => ({
  Change: onChange(dispatch('Change')),
  text: model.text
}))(ReversedString);

const RollDie = ({ Roll, face }) => (
  <div>
    <h2>Dice Example</h2>
    <button onClick={Roll}>Roll</button>
    <p>{face}</p>
  </div>
);

const ConnectedRollDie = connect(({ model, dispatch }) => ({
  Roll: onClick(dispatch('Roll')),
  face: model.face
}))(RollDie);

const Giphy = ({ ChangeTopic, MorePlease, topic, gifUrl }) => (
  <div>
    <h2>Giphy Example</h2>
    <h2>{topic}</h2>
    <input value={topic} onChange={ChangeTopic} />
    <button onClick={MorePlease}>More Please</button>
    <div>
      <img alt="" src={gifUrl} />
    </div>
  </div>
);

const ConnectedGiphy = connect(({ model, dispatch }) => ({
  ChangeTopic: onChange(dispatch('ChangeTopic')),
  MorePlease: onClick(dispatch('MorePlease')),
  topic: model.topic,
  gifUrl: model.gifUrl
}))(Giphy);

function turns(n) {
  return n * 2 * Math.PI;
}

const Clock = ({ tick }) => (
  <div>
    <h2>Time Example</h2>
    <svg viewBox="0 0 100 100" width="300px">
      <circle cx={50} cy={50} r={45} fill="#0B79CE" />
      <line
        x1={50}
        y1={50}
        x2={50 + 40 * Math.cos(turns(Time.inMinutes(tick)))}
        y2={50 + 40 * Math.sin(turns(Time.inMinutes(tick)))}
        stroke="#023963"
      />
    </svg>
  </div>
);

const ConnectedClock = connect(({ model }) => ({ tick: model.tick }))(Clock);

const Websockets = ({ Input, Send, input, messages }) => (
  <div>
    <h2>Websockets Example</h2>
    <input value={input} onChange={Input} />
    <button onClick={Send}>Send</button>
    <ul>{messages.map(msg => <li key={msg}>{msg}</li>)}</ul>
  </div>
);

const ConnectedWebsockets = connect(({ model, dispatch }) => ({
  Input: onChange(dispatch('Input')),
  Send: onClick(dispatch('Send')),
  input: model.input,
  messages: model.messages
}))(Websockets);

ReactDOM.render(
  <RealmProvider init={init} update={update} subscriptions={subscriptions}>
    <ConnectedCounter />
    <ConnectedReversedString />
    <ConnectedRollDie />
    <ConnectedGiphy />
    <ConnectedClock />
    <ConnectedWebsockets />
  </RealmProvider>,
  document.getElementById('root')
);
