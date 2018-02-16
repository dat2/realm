import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';

import RelmApp, { Cmd, Random, Http, Pair, Result } from './relm';

const model = {
  num: 0,
  text: '',
  face: 1,
  topic: 'cats',
  gifUrl: 'waiting.gif'
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

ReactDOM.render(
  <RelmApp init={init} update={update}>
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
        <img src={model.gifUrl} />
        <button onClick={onClick('MorePlease')}>More Please</button>
      </div>
    )}
  </RelmApp>,
  document.getElementById('root')
);

registerServiceWorker();
