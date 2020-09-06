import { Dispatch } from 'react';
import { createGame, getDailyGameKey, getNewestGame } from './gameUtils';
import { createLogger } from './logging';
import { loadLocalGames } from './storage';
import { computeScore, permute } from './wordUtil';
import { Games, Game, Profile } from './types';

export type AppDispatch = Dispatch<AppAction>;

const logger = createLogger({ prefix: 'state' });

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

export interface ClearMessageAction {
  type: 'clearMessage';
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

export interface SetGamesAction {
  type: 'setGames';
  payload: Games;
}

export interface SetMessageAction {
  type: 'setMessage';
  payload: string | undefined;
}

export interface SetUserAction {
  type: 'setUser';
  payload: Profile | null;
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
  | ClearMessageAction
  | ClearUserAction
  | DeleteGameAction
  | DeleteInputAction
  | MixLettersAction
  | SetCurrentGameAction
  | SetGameAction
  | SetGamesAction
  | SetMessageAction
  | SetUserAction
  | UpdateGameAction;

export interface AppState {
  currentGame: string;
  user: Profile | undefined | null;
  error?: Error | string;
  message?: string;
  input: string[];
  games: Games;
}

export function init(): AppState {
  let games = loadLocalGames();
  let currentGame: string | undefined;

  if (games) {
    let newestGame = getNewestGame(games);
    if (newestGame) {
      currentGame = newestGame.key;
    }
  }

  if (!currentGame) {
    currentGame = getDailyGameKey();
    games = {
      [currentGame]: createGame(currentGame),
    };
  }

  return {
    games: games!,
    currentGame: currentGame!,
    user: undefined,
    input: [],
  };
}

export function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'addGame': {
      logger.debug('Action: addGame');
      const game = createGame(action.payload);
      return {
        ...state,
        games: {
          ...state.games,
          [game.key]: game,
        },
      };
    }

    case 'addInput': {
      logger.debug('Action: addInput');
      const { input } = state;
      return {
        ...state,
        input: [...input, action.payload],
      };
    }

    case 'addWord': {
      logger.debug('Action: addWord');
      const game = state.games[state.currentGame];
      const newWords = [...game.words, action.payload];
      return {
        ...state,
        games: {
          ...state.games,
          [game.key]: {
            ...game,
            words: newWords,
            score: computeScore(newWords),
            lastUpdated: Date.now()
          },
        },
      };
    }

    case 'clearInput': {
      logger.debug('Action: clearInput');
      return {
        ...state,
        input: [],
      };
    }

    case 'clearMessage': {
      logger.debug('Action: clearMessage');
      return {
        ...state,
        message: undefined,
      };
    }

    case 'clearUser': {
      logger.debug('Action: clearUser');
      return {
        ...state,
        user: null,
      };
    }

    case 'deleteGame': {
      logger.debug('Action: deleteGame');
      const id =
        typeof action.payload === 'string' ? action.payload : action.payload.key;
      const { [id]: _, ...rest } = state.games;
      return {
        ...state,
        games: rest,
      };
    }

    case 'deleteInput': {
      logger.debug('Action: deleteInput');
      const { input } = state;
      return {
        ...state,
        input: input.slice(0, input.length - 1),
      };
    }

    case 'mixLetters': {
      logger.debug('Action: mixLetters');
      const game = state.games[state.currentGame];
      return {
        ...state,
        games: {
          ...state.games,
          [game.key]: {
            ...game,
            letters: permute(game.letters),
            lastUpdated: Date.now()
          },
        },
      };
    }

    case 'setCurrentGame': {
      logger.debug('Action: setCurrentGame');
      return {
        ...state,
        currentGame: action.payload
      };
    }

    case 'setGame': {
      logger.debug('Action: setGame');
      const game = action.payload;
      return {
        ...state,
        games: {
          ...state.games,
          [game.key]: game
        }
      };
    }

    case 'setGames': {
      logger.debug('Action: setGames');
      const games = action.payload;
      const currentGame = getNewestGame(games);
      return {
        ...state,
        games: action.payload,
        currentGame: currentGame.key
      };
    }

    case 'setMessage': {
      logger.debug('Action: setMessage');
      return {
        ...state,
        message: action.payload,
      };
    }

    case 'setUser': {
      logger.debug('Action: setUser');
      return {
        ...state,
        user: action.payload,
      };
    }

    case 'updateGame': {
      logger.debug('Action: updateGame:', action.payload);
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
