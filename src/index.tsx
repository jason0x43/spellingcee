import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { init, getState, saveState } from './state';
import * as serviceWorker from './serviceWorker';
import './index.css';

const id = init();

ReactDOM.render(
  <React.StrictMode>
    <App
      gameId={id}
      initialState={getState()}
      saveState={saveState}
    />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
