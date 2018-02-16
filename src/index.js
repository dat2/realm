import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';

import Relm from './relm';

const model = {
  num: 0,
  text: ''
};

const update = msg => model => {
  switch (msg.type) {
    case 'Increment':
      return { ...model, num: model.num + 1 };
    case 'Decrement':
      return { ...model, num: model.num - 1 };
    case 'Change':
      return { ...model, text: msg.value };
    default:
      return model;
  }
}

ReactDOM.render(
  <Relm model={model} update={update}>
    {
      ({ model, onClick, onChange }) => (
        <div>
          <button onClick={onClick('Decrement')}>-</button>
          <div>{ model.num }</div>
          <button onClick={onClick('Increment')}>+</button>
          <input value={model.text} onChange={onChange('Change')} />
          <p>{ model.text.split('').reverse().join('') }</p>
        </div>
      )
    }
  </Relm>
, document.getElementById('root'));
registerServiceWorker();
