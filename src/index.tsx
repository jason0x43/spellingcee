import React from 'react';
import ReactDOM from 'react-dom';
import cookies from 'js-cookie';
import { getDateString } from './util';
import { saveRng, initRng, RngState } from './random';
import App from './App';
import * as serviceWorker from './serviceWorker';
import './index.css';

interface GameState {
  [id: string]: {
    words: string[];
    rng?: RngState;
  };
}

// Load the game ID and initialize the random number generator
const queryArgs = new URLSearchParams(window?.location?.search);
const id = queryArgs.get('id') || getDateString();

// Load the game state for the current ID
const gameStateCookie = cookies.get('spelling-cee-game-state');
const gameState: GameState = gameStateCookie
  ? JSON.parse(gameStateCookie)
  : { [id]: { words: [] } };
if (!gameState[id]) {
  updateWords([]);
}

// Initialize the random number generator
if (gameState[id].rng) {
  initRng(gameState[id].rng);
} else {
  initRng(id);
}

function updateWords(words: string[]) {
  const state: GameState = {
    ...gameState,
    [id]: {
      words,
      rng: saveRng(),
    },
  };
  cookies.set('spelling-cee-game-state', JSON.stringify(state));
}

ReactDOM.render(
  <React.StrictMode>
    <App gameId={id} savedWords={gameState[id].words} saveWords={updateWords} />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
