import React from 'react';
import ReactDOM from 'react-dom';
import cookies from 'js-cookie';
import { getDateString } from './util';
import { saveRng, initRng, RngState } from './random';
import App, { GameState } from './App';
import * as serviceWorker from './serviceWorker';
import './index.css';

interface SavedGameState extends GameState {
  rng: RngState;
}

interface AppState {
  [id: string]: SavedGameState;
}

// Load the game ID and initialize the random number generator
const queryArgs = new URLSearchParams(window?.location?.search);
const id = queryArgs.get('id') || getDateString();

// Load the game state for the current ID
const appStateCookie = cookies.get('spelling-cee-game-state');
let appState: AppState = appStateCookie
  ? (JSON.parse(appStateCookie) as AppState)
  : {};

// Initialize the random number generator
if (appState[id]?.rng) {
  initRng(appState[id].rng);
} else {
  initRng(id);
}

function saveState(newState: GameState) {
  appState = {
    ...appState,
    [id]: {
      ...appState[id],
      ...newState,
      rng: saveRng(),
    },
  };
  cookies.set('spelling-cee-game-state', JSON.stringify(appState));
}

ReactDOM.render(
  <React.StrictMode>
    <App
      gameId={id}
      savedState={appState[id]}
      saveState={saveState}
    />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
