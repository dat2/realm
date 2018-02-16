import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';

import Relm from './relm';

const model = 0;

const update = msg => model => {
  switch (msg.type) {
    case 'Increment':
      return model + 1;
    case 'Decrement':
      return model - 1;
    default:
      return model;
  }
}

ReactDOM.render(
  <Relm model={model} update={update}>
    {
      ({ model, onClick }) => (
        <div>
          <button onClick={onClick('Decrement')}>-</button>
          <div>{ model }</div>
          <button onClick={onClick('Increment')}>+</button>
        </div>
      )
    }
  </Relm>
, document.getElementById('root'));
registerServiceWorker();
