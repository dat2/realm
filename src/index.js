import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';

import RelmApp, {
  Cmd,
  Sub,
  Random,
  Http,
  Time,
  Websocket,
  Pair,
  Result
} from './relm';

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

const init = Pair(model, Cmd.none);

const update = msg => model => {
  switch (msg.type) {
    case 'Increment':
      return Pair({ ...model, num: model.num + 1 }, Cmd.none);
    case 'Decrement':
      return Pair({ ...model, num: model.num - 1 }, Cmd.none);
    case 'Change':
      return Pair({ ...model, text: msg.value }, Cmd.none);
    case 'Roll':
      return Pair(model, Random.generate('NewFace')(Random.int(1)(6)));
    case 'NewFace':
      return Pair({ ...model, face: msg.value }, Cmd.none);
    case 'ChangeTopic':
      return Pair({ ...model, topic: msg.value }, Cmd.none);
    case 'MorePlease':
      return Pair(model, getRandomGif(model.topic));
    case 'NewGif':
      return Pair(
        Result({
          Ok: gifUrl => ({ ...model, gifUrl }),
          Err: () => model
        })(msg.value),
        Cmd.none
      );
    case 'Tick':
      return Pair({ ...model, tick: msg.value }, Cmd.none);
    case 'Input':
      return Pair({ ...model, input: msg.value }, Cmd.none);
    case 'Send':
      return Pair(
        { ...model, input: '' },
        Websocket.send('ws://echo.websocket.org')(model.input)
      );
    case 'NewMessage':
      return Pair(
        { ...model, messages: [...model.messages, msg.value] },
        Cmd.none
      );
    default:
      return Pair(model, Cmd.none);
  }
};

const getRandomGif = topic =>
  Http.send('NewGif')(
    Http.get(
      `https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=${topic}`
    )(json => json.data.image_url)
  );

const subscriptions = Sub.batch([
  Time.every(Time.second)('Tick'),
  Websocket.listen('ws://echo.websocket.org')('NewMessage')
]);

function turns(n) {
  return n * 2 * Math.PI;
}

ReactDOM.render(
  <RelmApp init={init} update={update} subscriptions={subscriptions}>
    {({ model, onClick, onChange }) => (
      <div>
        <button onClick={onClick('Decrement')}>-</button>
        <div>{model.num}</div>
        <button onClick={onClick('Increment')}>+</button>
        <input value={model.text} onChange={onChange('Change')} />
        <p>
          {model.text
            .split('')
            .reverse()
            .join('')}
        </p>
        <button onClick={onClick('Roll')}>Roll</button>
        <p>{model.face}</p>
        <h2>{model.topic}</h2>
        <input value={model.topic} onChange={onChange('ChangeTopic')} />
        <img alt="" src={model.gifUrl} />
        <button onClick={onClick('MorePlease')}>More Please</button>
        <svg viewBox="0 0 100 100" width="300px">
          <circle cx={50} cy={50} r={45} fill="#0B79CE" />
          <line
            x1={50}
            y1={50}
            x2={50 + 40 * Math.cos(turns(Time.inMinutes(model.tick)))}
            y2={50 + 40 * Math.sin(turns(Time.inMinutes(model.tick)))}
            stroke="#023963"
          />
        </svg>
        <input value={model.input} onChange={onChange('Input')} />
        <button onClick={onClick('Send')}>Send</button>
        <ul>{model.messages.map(msg => <li key={msg}>{msg}</li>)}</ul>
      </div>
    )}
  </RelmApp>,
  document.getElementById('root')
);

registerServiceWorker();
