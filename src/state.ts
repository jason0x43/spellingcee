import { Dispatch } from 'react';
import { createGame, createGameId, getDailyGameKey } from './gameUtils';
import { createLogger } from './logging';
import { permute } from './wordUtil';
import { Game, Games, User, Users, Words } from './types';

export type AppDispatch = Dispatch<AppAction>;
export const localUser = 'local';
export const loadingId = 'loading';

const logger = createLogger({ prefix: 'state' });

export interface AppState {
  gameId: string;
  game: Game;
  user: User;
  input: string[];
  letters: string[];
  words: Words;
  users?: Users;
  games?: Games;
  error?: Error | string;
  message?: string;
}

export interface AddGameAction {
  type: 'addGame';
  payload: { gameId: string; game: Game };
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

export interface DeleteGameAction {
  type: 'deleteGame';
  payload: string;
}

export interface DeleteInputAction {
  type: 'deleteInput';
}

export interface MixLettersAction {
  type: 'mixLetters';
}

export interface SetGameAction {
  type: 'setGame';
  payload: { gameId: string; game?: Game };
}

export interface SetGamesAction {
  type: 'setGames';
  payload: Games | undefined;
}

export interface SetMessageAction {
  type: 'setMessage';
  payload: string | undefined;
}

export interface SetStateAction {
  type: 'setState';
  payload: AppState;
}

export interface SetUsersAction {
  type: 'setUsers';
  payload: Users | undefined;
}

export interface SetWordsAction {
  type: 'setWords';
  payload: Words;
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
  | DeleteGameAction
  | DeleteInputAction
  | MixLettersAction
  | SetGameAction
  | SetGamesAction
  | SetMessageAction
  | SetStateAction
  | SetUsersAction
  | SetWordsAction
  | UpdateGameAction;

export function init(): AppState {
  logger.debug('Initialized empty state');
  const gameId = createGameId();
  const gameKey = getDailyGameKey();
  const game = createGame({ userId: localUser, key: gameKey });

  return {
    user: { userId: localUser },
    gameId,
    game,
    input: [],
    letters: gameKey.split(''),
    words: {},
  };
}

export function isLoggedIn(state: AppState): boolean {
  return state.user.userId !== localUser;
}

export function isLoading(state: AppState): boolean {
  return state.gameId === '';
}

export function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'addGame': {
      logger.debug('Action: addGame');
      const { game, gameId } = action.payload;
      return {
        ...state,
        gameId,
        game,
        games: {
          ...state.games,
          [gameId]: game,
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
      return {
        ...state,
        words: {
          ...state.words,
          [action.payload]: {
            addedBy: state.user.userId,
            addedAt: Date.now(),
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

    case 'deleteGame': {
      logger.debug('Action: deleteGame');
      const id = action.payload;
      if (state.games) {
        const { [id]: _, ...rest } = state.games;
        return {
          ...state,
          games: rest,
        };
      }
      return state;
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
      return {
        ...state,
        letters: permute(state.letters),
      };
    }

    case 'setGame': {
      logger.debug('Action: setGame');
      const { gameId } = action.payload;
      const game = action.payload.game ?? state.games?.[gameId];
      if (!game) {
        throw new Error('No game provided and gameId not in games list');
      }
      const letters = game.key.split('');
      return {
        ...state,
        game,
        gameId,
        letters,
        input: [],
      };
    }

    case 'setGames': {
      logger.debug('Action: setGames');
      const games = action.payload;
      return {
        ...state,
        games,
      };
    }

    case 'setMessage': {
      logger.debug('Action: setMessage');
      return {
        ...state,
        message: action.payload,
      };
    }

    case 'setState': {
      logger.debug('Action: setState');
      return action.payload;
    }

    case 'setUsers': {
      logger.debug('Action: setUsers');
      return {
        ...state,
        users: action.payload,
      };
    }

    case 'setWords': {
      logger.debug('Action: setWords');
      return {
        ...state,
        words: action.payload,
      };
    }

    case 'updateGame': {
      logger.debug('Action: updateGame');
      const game = action.payload;
      return {
        ...state,
        game: {
          ...state.game,
          ...game
        },
        input: [],
      };
    }
  }
}
