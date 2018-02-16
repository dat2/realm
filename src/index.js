import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';

import Relm, { Cmd, Pair, Random } from './relm';

const model = {
  num: 0,
  text: '',
  face: 1
};

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
    default:
      return Pair(model, Cmd.none);
  }
};

ReactDOM.render(
  <Relm model={model} update={update}>
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
      </div>
    )}
  </Relm>,
  document.getElementById('root')
);

registerServiceWorker();
