import { Dispatch } from 'react';
import { createGame, getDailyGameId, normalizeGames } from './gameUtils';
import { localLoadGames } from './storage';
import { computeScore, permute } from './wordUtil';
import { Game, User } from './types';

export type AppDispatch = Dispatch<AppAction>;

export interface Games {
  [gameId: string]: Game;
}

export interface AddGameAction {
  type: 'addGame';
  payload?: string;
}

export interface AddInputAction {
  type: 'addInput';
  payload: string;
}

export interface AddWordAction {
  type: 'addWord';
  payload: string;
}

export interface ClearInputAction {
  type: 'clearInput';
}

export interface ClearUserAction {
  type: 'clearUser';
}

export interface DeleteGameAction {
  type: 'deleteGame';
  payload: string | Game;
}

export interface DeleteInputAction {
  type: 'deleteInput';
}

export interface MixLettersAction {
  type: 'mixLetters';
}

export interface SetCurrentGameAction {
  type: 'setCurrentGame';
  payload: string;
}

export interface SetGameAction {
  type: 'setGame';
  payload: Game;
}

export interface SetMessageAction {
  type: 'setMessage';
  payload: string | undefined;
}

export interface SetUserAction {
  type: 'setUser';
  payload: User | null;
}

export interface UpdateGameAction {
  type: 'updateGame';
  payload: Partial<Game>;
}

export type AppAction =
  | AddGameAction
  | AddInputAction
  | AddWordAction
  | ClearInputAction
  | ClearUserAction
  | DeleteGameAction
  | DeleteInputAction
  | MixLettersAction
  | SetCurrentGameAction
  | SetGameAction
  | SetMessageAction
  | SetUserAction
  | UpdateGameAction;

export interface AppState {
  currentGame: string;
  user: User | undefined | null;
  error?: Error | string;
  message?: string;
  input: string[];
  games: Games;
}

export function init(): AppState {
  let games = localLoadGames();
  let currentGame: string;

  if (games) {
    let lastUpdated = 0;
    for (const gameId of Object.keys(games)) {
      if (games[gameId].lastUpdated > lastUpdated) {
        lastUpdated = games[gameId].lastUpdated;
        currentGame = gameId;
      }
    }
  } else {
    currentGame = getDailyGameId();
    games = {
      [currentGame]: createGame(currentGame),
    };
  }

  return {
    games,
    currentGame: currentGame!,
    user: undefined,
    input: [],
  };
}

export function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'addGame': {
      console.log('Action: addGame');
      const game = createGame(action.payload);
      return {
        ...state,
        games: {
          ...state.games,
          [game.id]: game,
        },
      };
    }

    case 'addInput': {
      console.log('Action: addInput');
      const { input } = state;
      return {
        ...state,
        input: [...input, action.payload],
      };
    }

    case 'addWord': {
      console.log('Action: addWord');
      const game = state.games[state.currentGame];
      const newWords = [...game.words, action.payload];
      return {
        ...state,
        games: {
          ...state.games,
          [game.id]: {
            ...game,
            words: newWords,
            score: computeScore(newWords),
            lastUpdated: Date.now()
          },
        },
      };
    }

    case 'clearInput': {
      console.log('Action: clearInput');
      return {
        ...state,
        input: [],
      };
    }

    case 'clearUser': {
      console.log('Action: clearUser');
      return {
        ...state,
        user: null,
      };
    }

    case 'deleteGame': {
      console.log('Action: deleteGame');
      const gameId =
        typeof action.payload === 'string' ? action.payload : action.payload.id;
      const { [gameId]: _, ...rest } = state.games;
      return {
        ...state,
        games: rest,
      };
    }

    case 'deleteInput': {
      console.log('Action: deleteInput');
      const { input } = state;
      return {
        ...state,
        input: input.slice(0, input.length - 1),
      };
    }

    case 'mixLetters': {
      console.log('Action: mixLetters');
      const game = state.games[state.currentGame];
      return {
        ...state,
        games: {
          ...state.games,
          [game.id]: {
            ...game,
            letters: permute(game.letters),
            lastUpdated: Date.now()
          },
        },
      };
    }

    case 'setCurrentGame': {
      console.log('Action: setCurrentGame');
      return {
        ...state,
        currentGame: action.payload
      };
    }

    case 'setGame': {
      console.log('Action: setGame');
      const game = action.payload;
      return {
        ...state,
        games: {
          ...state.games,
          [game.id]: game
        }
      };
    }

    case 'setMessage': {
      console.log('Action: setMessage');
      return {
        ...state,
        message: action.payload,
      };
    }

    case 'setUser': {
      console.log('Action: setUser');
      return {
        ...state,
        user: action.payload,
      };
    }

    case 'updateGame': {
      console.log('Action: updateGame:', action.payload);
      return {
        ...state,
        games: {
          ...state.games,
          [state.currentGame]: {
            ...state.games[state.currentGame],
            ...action.payload,
            lastUpdated: Date.now()
          }
        },
      };
    }
  }
}
