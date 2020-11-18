import {
  configureStore,
  createAsyncThunk,
  createSlice,
  getDefaultMiddleware,
  Middleware,
  PayloadAction,
  SerializedError,
} from '@reduxjs/toolkit';
import { createLogger } from './logging';
import { createGame, getDailyGameKey } from './gameUtils';
import { Game } from './types';
import {
  createStorage,
  loadLocalState,
  saveLocalState,
  Subscription,
} from './storage';
import {
  getCurrentUser,
  signIn as authSignIn,
  signOut as authSignOut,
} from './auth';
import {
  computeScore,
  findValidWords,
  permute,
  validateWord,
} from './wordUtil';
import wordlist from './wordlist';

const logger = createLogger({ prefix: 'storage' });

// State definitions ///////////////////////////////////////////////////

export interface PersistedAppState {
  game: Game;
  user: User;
  words: Words;
}

export interface AppState extends PersistedAppState {
  liveState: {
    validWords: string[];
    input: string[];
    letters: string[];
    userLoading?: boolean;
    inputDisabled?: boolean;
    messageGood?: boolean;
    messageVisible?: boolean;
    message?: string;
    error?: Error | SerializedError | string;
    warning?: string;
    users?: { [userId: string]: User };
    games?: { [key: string]: Game };
  };
}

export interface User {
  userId: string;
  name?: string;
}

export interface Word {
  addedAt: number;
  addedBy: string;
}

export interface Words {
  [word: string]: Word;
}

// Async thunks ////////////////////////////////////////////////////////

export const activateGame = createAsyncThunk<
  void,
  Game,
  { dispatch: AppDispatch; state: AppState }
>('app/activateGame', async (game, { dispatch, getState }) => {
  const { userId } = getState().user;
  await createStorage(userId).saveUserMeta({ gameId: game.gameId });
  dispatch(setGame(game));
});

export const loadGame = createAsyncThunk<void, string, { state: AppState }>(
  'app/loadGame',
  async (gameId, { dispatch, getState }) => {
    wordsSubscription?.off();

    const { userId } = getState().user;
    const storage = createStorage(userId);
    const game = await storage.loadGame(gameId);

    const words = await storage.loadWords(gameId);
    wordsSubscription = storage.subscribeToWords(gameId, (words) => {
      dispatch(setWords(words ?? {}));

      if (words) {
        const game = selectGame(getState());
        const rawWords = Object.keys(words);
        const stats = {
          wordsFound: rawWords.length,
          score: computeScore(rawWords),
        };
        // Only need to update the local game stats since these words came from
        // the store
        dispatch(updateGame({ ...game, ...stats }));
      }
    });

    dispatch(setGame(game));
    dispatch(setWords(words ?? {}));
  }
);

export const loadGames = createAsyncThunk<void, void, { state: AppState }>(
  'app/loadGames',
  async (_, { dispatch, getState }) => {
    const { userId } = selectUser(getState());
    const games = await createStorage(userId).loadGames();
    dispatch(setGames(games));
  }
);

export const loadUser = createAsyncThunk<
  void,
  User | void,
  { dispatch: AppDispatch }
>('app/loadUser', async (user, { dispatch }) => {
  dispatch(setUserLoading(true));

  wordsSubscription?.off();

  let loadedUser: User | undefined;
  if (user) {
    loadedUser = user;
  } else {
    loadedUser = await getCurrentUser();
  }

  if (loadedUser) {
    dispatch(updateUser(loadedUser ?? { userId: localUser }));

    const storage = createStorage(loadedUser.userId);
    const userMeta = await storage.loadUserMeta();
    console.log('loaded userMeta:', userMeta);
    if (userMeta?.gameId) {
      // Load user's current game and word list
      await dispatch(loadGame(userMeta.gameId));
    } else {
      // User has no current game -- create one
      await dispatch(newGame());
    }
  }

  dispatch(setUserLoading(false));
});

export const loadUsers = createAsyncThunk<void, void, { state: AppState }>(
  'app/loadUsers',
  async (_, { dispatch, getState }) => {
    const { userId } = selectUser(getState());
    const users = await createStorage(userId).loadUsers();
    dispatch(setUsers(users));
  }
);

export const newGame = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch; state: AppState }
>('app/newGame', async (_, { dispatch, getState }) => {
  const { userId } = getState().user;
  const newGame = createGame({ userId });
  const savedGame = await createStorage(userId).addGame(newGame);
  dispatch(addGame(savedGame));
  dispatch(setGame(savedGame));
  dispatch(setWords({}));
});

export const removeGame = createAsyncThunk<void, string, { state: AppState }>(
  'app/shareGame',
  async (gameId, { dispatch, getState }) => {
    const { userId } = getState().user;
    await createStorage(userId).removeGame(gameId);
    dispatch(deleteGame(gameId));
  }
);

export const shareActiveGame = createAsyncThunk<
  void,
  string,
  { state: AppState }
>('app/shareGame', async (otherUserId, { dispatch, getState }) => {
  const { userId } = getState().user;
  const { gameId } = getState().game;
  if (otherUserId === userId) {
    dispatch(setMessage('Unable to share game with self'));
  } else {
    try {
      await createStorage(userId).shareGame({ otherUserId, gameId });
    } catch (error) {
      console.warn(error);
      dispatch(setMessage('There as a problem sharing the game'));
    }
  }
});

export const signIn = createAsyncThunk(
  'app/signIn',
  async (_, { dispatch }) => {
    const user = await authSignIn();
    if (user) {
      dispatch(loadUser(user));
    }
  }
);

export const signOut = createAsyncThunk(
  'app/signOut',
  async (_, { dispatch }) => {
    await authSignOut();
    dispatch(updateUser({ userId: 'local' }));

    const persistedState = loadLocalState<PersistedAppState>(localUser);
    dispatch(updateAppState(persistedState ?? initialState));
  }
);

export const submitWord = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch; state: AppState }
>('app/submitWord', async (_, { dispatch, getState }) => {
  const word = selectInput(getState()).join('');
  const { key } = selectGame(getState());
  const validWords = selectValidWords(getState());
  const pangram = key;
  const center = key[0];

  const message = validateWord({
    words: Object.keys(getState().words),
    validWords,
    word,
    pangram,
    center,
  });

  if (message) {
    dispatch(setMessage(message));
  } else {
    const state = getState();
    const { userId } = state.user;
    const { game, words } = state;
    const { gameId, score } = game;
    logger.debug(`Adding word to game ${gameId}`);

    const storage = createStorage(userId);
    const stats = {
      wordsFound: Object.keys(words).length + 1,
      score: score + computeScore(word),
    };
    const wordMeta = await storage.addWord(gameId, word, stats);

    dispatch(setWords({ ...words, [word]: wordMeta }));
    dispatch(updateGame({ ...game, ...stats }));
    dispatch(clearInput());
  }
});

// Slice ///////////////////////////////////////////////////////////////

export const localUser = 'local';

const defaultGame: Game = createGame({
  userId: localUser,
  key: getDailyGameKey(),
});

function initLiveState(game: Game): AppState['liveState'] {
  const [center, ...letters] = game.key.split('');
  return {
    validWords: findValidWords({
      allWords: wordlist,
      pangram: game.key,
      center: game.key[0],
    }),
    input: [],
    letters: [
      ...letters.slice(0, letters.length / 2),
      center,
      ...letters.slice(letters.length / 2),
    ],
  };
}

const initialState: AppState = {
  words: {},
  game: defaultGame,
  user: { userId: localUser },
  liveState: initLiveState(defaultGame),
};

const appSlice = createSlice({
  name: 'app',

  initialState,

  reducers: {
    addGame(state, action: PayloadAction<AppState['game']>) {
      const newGame = action.payload;
      state.liveState.games = {
        ...state.liveState.games,
        [newGame.gameId]: newGame,
      };
    },

    addInput(state, action: PayloadAction<string>) {
      if (state.liveState.input.length > 18) {
        state.liveState.message = 'Word too long';
      } else {
        state.liveState.input.push(action.payload);
      }
    },

    clearInput(state) {
      state.liveState.input = [];
    },

    deleteGame(state, action: PayloadAction<AppState['game']['gameId']>) {
      const { [action.payload]: _, ...games } = state.liveState.games ?? {};
      state.liveState.games = games;
    },

    deleteInput(state) {
      state.liveState.input = state.liveState.input.slice(0, -1);
    },

    scrambleLetters(state) {
      const { letters } = state.liveState;
      const centerIndex = Math.floor(letters.length / 2);
      const toPermute = [
        ...letters.slice(0, centerIndex),
        ...letters.slice(centerIndex + 1),
      ];
      const permuted = permute(toPermute);
      state.liveState.letters = [
        ...permuted.slice(0, centerIndex),
        letters[centerIndex],
        ...permuted.slice(centerIndex),
      ];
    },

    setError(state, action: PayloadAction<AppState['liveState']['error']>) {
      state.liveState.error = action.payload;
    },

    setGame(state, action: PayloadAction<AppState['game']>) {
      const game = action.payload;
      state.game = game;
      state.liveState = initLiveState(game);
    },

    setGames(state, action: PayloadAction<AppState['liveState']['games']>) {
      state.liveState.games = action.payload;
    },

    setInputDisabled(state, action: PayloadAction<boolean>) {
      state.liveState.inputDisabled = action.payload;
    },

    setMessage(state, action: PayloadAction<AppState['liveState']['message']>) {
      state.liveState.message = action.payload;
    },

    setMessageGood(
      state,
      action: PayloadAction<AppState['liveState']['messageGood']>
    ) {
      state.liveState.messageGood = action.payload;
    },

    setMessageVisible(
      state,
      action: PayloadAction<AppState['liveState']['messageVisible']>
    ) {
      state.liveState.messageVisible = action.payload;
    },

    setUserLoading(state, action: PayloadAction<boolean>) {
      state.liveState.userLoading = action.payload;
    },

    setUsers(state, action: PayloadAction<AppState['liveState']['users']>) {
      state.liveState.users = action.payload;
    },

    setWarning(state, action: PayloadAction<AppState['liveState']['warning']>) {
      state.liveState.warning = action.payload;
    },

    setWords(state, action: PayloadAction<AppState['words']>) {
      state.words = action.payload;
    },

    updateAppState(state, action: PayloadAction<PersistedAppState>) {
      const appState = action.payload;
      const { game } = appState;

      state.user = appState.user;
      state.game = game;
      state.words = appState.words;
      state.liveState = initLiveState(game);
    },

    updateGame(state, action: PayloadAction<AppState['game']>) {
      const game = action.payload;
      if (state.game.gameId !== game.gameId) {
        throw new Error('Tried to update inactive game');
      }
      state.game = action.payload;
    },

    updateUser(state, action: PayloadAction<AppState['user']>) {
      state.user = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder.addCase(loadUser.rejected, (state, { error }) => {
      state.liveState.userLoading = false;
      state.liveState.warning = error.message;
    });
  },
});

export const {
  addGame,
  addInput,
  clearInput,
  deleteGame,
  deleteInput,
  scrambleLetters,
  setGame,
  setGames,
  setInputDisabled,
  setMessage,
  setMessageGood,
  setMessageVisible,
  setUserLoading,
  setUsers,
  setWarning,
  setWords,
  updateAppState,
  updateGame,
  updateUser,
} = appSlice.actions;

let wordsSubscription: Subscription | undefined;

// Selectors ///////////////////////////////////////////////////////////

export function isInputDisabled(state: AppState): boolean {
  return state.liveState.inputDisabled ?? false;
}

export function isLoggedIn(state: AppState): boolean {
  return state.user.userId !== localUser;
}

export function isMessageVisible(state: AppState): boolean {
  return state.liveState.messageVisible ?? false;
}

export function isMessageGood(state: AppState): boolean {
  return state.liveState.messageGood ?? false;
}

export function isUserLoading(state: AppState): boolean {
  return state.liveState.userLoading ?? false;
}

export function selectError(state: AppState): AppState['liveState']['error'] {
  return state.liveState.error;
}

export function selectGame(state: AppState): AppState['game'] {
  return state.game;
}

export function selectGames(state: AppState): AppState['liveState']['games'] {
  return state.liveState.games;
}

export function selectInput(state: AppState): AppState['liveState']['input'] {
  return state.liveState.input;
}

export function selectLetters(
  state: AppState
): AppState['liveState']['letters'] {
  return state.liveState.letters;
}

export function selectMessage(
  state: AppState
): AppState['liveState']['message'] {
  return state.liveState.message;
}

export function selectPangram(state: AppState): string {
  return state.game.key;
}

export function selectScore(state: AppState): number {
  return state.game.score;
}

export function selectUser(state: AppState): AppState['user'] {
  return state.user;
}

export function selectUserId(state: AppState): string {
  return state.user.userId;
}

export function selectUsers(state: AppState): AppState['liveState']['users'] {
  return state.liveState.users;
}

export function selectValidWords(state: AppState): string[] {
  return state.liveState.validWords;
}

export function selectWarning(
  state: AppState
): AppState['liveState']['warning'] {
  return state.liveState.warning;
}

export function selectWords(state: AppState): AppState['words'] {
  return state.words;
}

// Store creation //////////////////////////////////////////////////////

const loggerMiddleware: Middleware<unknown, AppState> = () => (next) => (
  action
) => {
  if (action.type) {
    console.info('Dispatching', action);
  }
  const result = next(action);
  return result;
};

const persistedState = loadLocalState<PersistedAppState>(localUser);
const store = configureStore({
  middleware: [loggerMiddleware, ...getDefaultMiddleware()] as const,
  preloadedState: {
    ...(persistedState ?? initialState),
    liveState: initialState.liveState,
  },
  reducer: appSlice.reducer,
});

store.subscribe(() => {
  const state = store.getState();
  const { userId } = state.user;
  const { liveState, ...saveState } = state;
  saveLocalState(userId, saveState);
});

export type AppDispatch = typeof store.dispatch;

export default store;
