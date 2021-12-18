import {
  configureStore,
  createAsyncThunk,
  createSlice,
  Middleware,
  PayloadAction,
  SerializedError,
} from "./deps.ts";
import { createLogger } from "./logging.ts";
import { createGame, getDailyGameKey } from "./gameUtils.ts";
import { Game } from "./types.ts";
import {
  createStorage,
  loadLocalState,
  saveLocalState,
  Subscription,
} from "./storage.ts";
import {
  computeScore,
  findValidWords,
  permute,
  validateWord,
} from "./wordUtil.ts";
import wordlist from "./wordlist.ts";
import { getWords, setActiveGame } from "./api.ts";

const logger = createLogger({ prefix: "storage" });

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
    letterMessage?: { message: string; type?: "normal" | "good" | "bad" };
    toastMessage?: { message: string; type?: "normal" | "good" | "bad" };
    newGameIds?: { [gameId: number]: string };
    error?: Error | SerializedError | string;
    warning?: string;
    users?: { [userId: number]: User };
    games?: { [gameId: number]: Game };
    wordListExpanded?: boolean;
  };
}

export interface User {
  userId: number;
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

type AsyncThunkProps = {
  dispatch: AppDispatch;
  state: AppState;
};

export const activateGame = createAsyncThunk<void, Game, AsyncThunkProps>(
  "app/activateGame",
  async (game, { dispatch, getState }) => {
    const { userId } = getState().user;
    const { gameId } = game;
    await setActiveGame({ userId, gameId });
    dispatch(setGame(game));

    const words = await getWords(gameId);
    dispatch(setWords(words ?? {}));

    // wordsSubscription?.off();
    // wordsSubscription = await storage.subscribeToWords(game.gameId, (words) => {
    //   dispatch(setWords(words ?? {}));

    //   if (words) {
    //     const game = selectGame(getState());
    //     const rawWords = Object.keys(words);
    //     const stats = {
    //       wordsFound: rawWords.length,
    //       score: computeScore(rawWords),
    //     };
    //     // Only need to update the local game stats since these words came from
    //     // the store
    //     dispatch(updateGame({ ...game, ...stats }));
    //   }
    // });
  },
);

export const loadGame = createAsyncThunk<void, string, AsyncThunkProps>(
  "app/loadGame",
  async (gameId, { dispatch, getState }) => {
    const { userId } = getState().user;
    const storage = createStorage(userId);
    const game = await storage.loadGame(gameId);
    await dispatch(activateGame(game));
  },
);

export const loadGames = createAsyncThunk<void, void, AsyncThunkProps>(
  "app/loadGames",
  async (_, { dispatch, getState }) => {
    const { userId } = selectUser(getState());
    const games = await createStorage(userId).loadGames();
    dispatch(setGames(games));
  },
);

export const loadUser = createAsyncThunk<void, User | void, AsyncThunkProps>(
  "app/loadUser",
  async (user, { dispatch, getState }) => {
    dispatch(setUserLoading(true));

    // wordsSubscription?.off();
    // gamesSubscription?.off();

    const loadedUser = user ?? (await getCurrentUser());

    if (loadedUser) {
      dispatch(updateUser(loadedUser ?? { userId: localUser }));

      const storage = createStorage(loadedUser.userId);
      const userMeta = await storage.loadUserMeta();
      if (userMeta?.gameId) {
        // Load user's current game and word list
        await dispatch(loadGame(userMeta.gameId));
      } else {
        // User has no current game -- create one
        await dispatch(newGame());
      }

      gamesSubscription = await storage.subscribeToNewGames(
        loadedUser.userId,
        async (newGameInfo) => {
          const creator = Object.values(newGameInfo)[0];
          if (creator !== loadedUser.userId) {
            // Load games before setting the new game IDs so that when the IDs
            // are added, there will be something to reference
            await dispatch(loadGames());
            dispatch(
              setNewGameIds({
                ...selectNewGameIds(getState()),
                ...newGameInfo,
              }),
            );
          }
        },
      );
    }

    dispatch(setUserLoading(false));
  },
);

export const loadUsers = createAsyncThunk<void, void, AsyncThunkProps>(
  "app/loadUsers",
  async (_, { dispatch, getState }) => {
    const { userId } = selectUser(getState());
    const users = await createStorage(userId).loadUsers();
    dispatch(setUsers(users));
  },
);

export const newGame = createAsyncThunk<void, void, AsyncThunkProps>(
  "app/newGame",
  async (_, { dispatch, getState }) => {
    const { userId } = getState().user;
    const newGame = createGame({ userId });
    const createdGame = await createStorage(userId).addGame(newGame);
    dispatch(addGame(createdGame));
    await dispatch(activateGame(createdGame));
    dispatch(setToastMessage({ message: `Started new game ${newGame.key}` }));
  },
);

export const removeGame = createAsyncThunk<void, string, AsyncThunkProps>(
  "app/removeGame",
  async (gameId, { dispatch, getState }) => {
    const { userId } = getState().user;
    await createStorage(userId).removeGame(gameId);
    dispatch(deleteGame(gameId));
  },
);

export const shareActiveGame = createAsyncThunk<void, string, AsyncThunkProps>(
  "app/shareGame",
  async (otherUserId, { dispatch, getState }) => {
    const { userId } = getState().user;
    const { gameId } = getState().game;
    if (otherUserId === userId) {
      dispatch(
        setLetterMessage({
          message: "Unable to share game with self",
          type: "bad",
        }),
      );
    } else {
      try {
        await createStorage(userId).shareGame({ otherUserId, gameId });
      } catch (error) {
        console.warn(error);
        dispatch(
          setLetterMessage({
            message: "There as a problem sharing the game",
            type: "bad",
          }),
        );
      }
    }
  },
);

export const signIn = createAsyncThunk<void, void, AsyncThunkProps>(
  "app/signIn",
  async (_, { dispatch }) => {
    const user = await authSignIn();
    if (user) {
      await dispatch(loadUser(user));
      await createStorage(user.userId).saveUserProfile(user);
    }
  },
);

export const signOut = createAsyncThunk(
  "app/signOut",
  async (_, { dispatch }) => {
    await authSignOut();

    gamesSubscription?.off();
    dispatch(updateUser({ userId: localUser }));

    const storedGame = loadLocalState<Game>(localUser) ?? defaultGame;
    store.dispatch(activateGame(storedGame));
  },
);

export const submitWord = createAsyncThunk<void, void, AsyncThunkProps>(
  "app/submitWord",
  async (_, { dispatch, getState }) => {
    const word = selectInput(getState()).join("");
    if (!word) {
      return;
    }

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
      dispatch(setLetterMessage({ message, type: "bad" }));
    } else {
      const state = getState();
      const { userId } = state.user;
      const { game, words } = state;
      const { gameId, score } = game;

      const storage = createStorage(userId);
      const stats = {
        wordsFound: Object.keys(words).length + 1,
        score: score + computeScore(word),
      };
      const wordMeta = await storage.addWord(gameId, word, stats);

      dispatch(setLetterMessage({ message: "Good job!", type: "good" }));
      dispatch(setWords({ ...words, [word]: wordMeta }));
      dispatch(updateGame({ ...game, ...stats }));
      dispatch(clearInput());
    }
  },
);

// Slice ///////////////////////////////////////////////////////////////

export const localUser = "local";

const defaultGame: Game = createGame({
  userId: localUser,
  key: getDailyGameKey(),
});

function initLiveState(game: Game): AppState["liveState"] {
  const [center, ...letters] = game.key.split("");
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
  name: "app",

  initialState,

  reducers: {
    addGame(state, action: PayloadAction<AppState["game"]>) {
      const newGame = action.payload;
      state.liveState.games = {
        ...state.liveState.games,
        [newGame.gameId]: newGame,
      };
    },

    addInput(state, action: PayloadAction<string>) {
      if (state.liveState.input.length > 18) {
        state.liveState.letterMessage = {
          message: "Word too long",
          type: "bad",
        };
      } else {
        state.liveState.input.push(action.payload);
      }
    },

    clearInput(state) {
      state.liveState.input = [];
    },

    deleteGame(state, action: PayloadAction<AppState["game"]["gameId"]>) {
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

    setError(state, action: PayloadAction<AppState["liveState"]["error"]>) {
      state.liveState.error = action.payload;
    },

    setGame(state, action: PayloadAction<AppState["game"]>) {
      const game = action.payload;
      state.game = game;
      state.liveState = initLiveState(game);
    },

    setGames(state, action: PayloadAction<AppState["liveState"]["games"]>) {
      state.liveState.games = action.payload;
    },

    setInputDisabled(state, action: PayloadAction<boolean>) {
      state.liveState.inputDisabled = action.payload;
    },

    setLetterMessage(
      state,
      action: PayloadAction<AppState["liveState"]["letterMessage"]>,
    ) {
      state.liveState.letterMessage = action.payload;
    },

    setToastMessage(
      state,
      action: PayloadAction<AppState["liveState"]["toastMessage"]>,
    ) {
      state.liveState.toastMessage = action.payload;
    },

    setNewGameIds(
      state,
      action: PayloadAction<AppState["liveState"]["newGameIds"]>,
    ) {
      state.liveState.newGameIds = action.payload;
    },

    setUserLoading(state, action: PayloadAction<boolean>) {
      state.liveState.userLoading = action.payload;
    },

    setUsers(state, action: PayloadAction<AppState["liveState"]["users"]>) {
      state.liveState.users = action.payload;
    },

    setWarning(state, action: PayloadAction<AppState["liveState"]["warning"]>) {
      state.liveState.warning = action.payload;
    },

    setWordListExpanded(
      state,
      action: PayloadAction<AppState["liveState"]["wordListExpanded"]>,
    ) {
      state.liveState.wordListExpanded = action.payload;
    },

    setWords(state, action: PayloadAction<AppState["words"]>) {
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

    updateGame(state, action: PayloadAction<AppState["game"]>) {
      const game = action.payload;
      if (state.game.gameId !== game.gameId) {
        throw new Error("Tried to update inactive game");
      }
      state.game = action.payload;
    },

    updateUser(state, action: PayloadAction<AppState["user"]>) {
      state.user = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder.addCase(loadUser.rejected, (state, { error }) => {
      state.liveState.userLoading = false;
      state.liveState.warning = error.message;
      logger.warn("Error loadng user:", error);
    });

    builder.addCase(activateGame.rejected, (state, { error }) => {
      state.liveState.warning = error.message;
      logger.warn("Error activating game:", error);
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
  setLetterMessage,
  setToastMessage,
  setNewGameIds,
  setUserLoading,
  setUsers,
  setWarning,
  setWordListExpanded,
  setWords,
  updateAppState,
  updateGame,
  updateUser,
} = appSlice.actions;

let wordsSubscription: Subscription | undefined;
let gamesSubscription: Subscription | undefined;

// Selectors ///////////////////////////////////////////////////////////

export function isInputDisabled(state: AppState): boolean {
  return state.liveState.inputDisabled ?? false;
}

export function isLoggedIn(state: AppState): boolean {
  return state.user.userId !== localUser;
}

export function isUserLoading(state: AppState): boolean {
  return state.liveState.userLoading ?? false;
}

export function isWordListExpanded(state: AppState): boolean {
  return state.liveState.wordListExpanded ?? false;
}

export function selectError(state: AppState): AppState["liveState"]["error"] {
  return state.liveState.error;
}

export function selectGame(state: AppState): AppState["game"] {
  return state.game;
}

export function selectGames(state: AppState): AppState["liveState"]["games"] {
  return state.liveState.games;
}

export function selectInput(state: AppState): AppState["liveState"]["input"] {
  return state.liveState.input;
}

export function selectLetters(
  state: AppState,
): AppState["liveState"]["letters"] {
  return state.liveState.letters;
}

export function selectLetterMessage(
  state: AppState,
): AppState["liveState"]["letterMessage"] {
  return state.liveState.letterMessage;
}

export function selectToastMessage(
  state: AppState,
): AppState["liveState"]["toastMessage"] {
  return state.liveState.toastMessage;
}

export function selectNewGameIds(
  state: AppState,
): AppState["liveState"]["newGameIds"] {
  return state.liveState.newGameIds;
}

export function selectPangram(state: AppState): string {
  return state.game.key;
}

export function selectScore(state: AppState): number {
  return state.game.score;
}

export function selectUser(state: AppState): AppState["user"] {
  return state.user;
}

export function selectUserId(state: AppState): string {
  return state.user.userId;
}

export function selectUsers(state: AppState): AppState["liveState"]["users"] {
  return state.liveState.users;
}

export function selectValidWords(state: AppState): string[] {
  return state.liveState.validWords;
}

export function selectWarning(
  state: AppState,
): AppState["liveState"]["warning"] {
  return state.liveState.warning;
}

export function selectWords(state: AppState): AppState["words"] {
  return state.words;
}

// Store creation //////////////////////////////////////////////////////

const loggerMiddleware: Middleware = () =>
  (next) =>
    (action) => {
      if (action.type) {
        logger.debug("Dispatching", action);
      }
      const result = next(action);
      return result;
    };

const localStorageMiddleware: Middleware = ({ getState }) =>
  (next) =>
    (
      action,
    ) => {
      const result = next(action);
      if (
        action.type === `${setGame}` && getState().user?.userId === localUser
      ) {
        saveLocalState(localUser, action.payload);
      }
      return result;
    };

const store = configureStore({
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(loggerMiddleware, localStorageMiddleware),
  preloadedState: initialState,
  reducer: appSlice.reducer,
});

// Check for a stored local game. If one is present, activate it. Otherwise,
// save the current default game as the local game.
const storedGame = loadLocalState<Game>(localUser);
if (isValidState(storedGame)) {
  store.dispatch(activateGame(storedGame));
} else {
  saveLocalState(localUser, defaultGame);
}

export type AppDispatch = typeof store.dispatch;

export default store;

function isValidState(value: Game | undefined): value is Game {
  if (value == null || typeof value !== "object") {
    return false;
  }
  return "gameId" in value && "key" in value;
}
