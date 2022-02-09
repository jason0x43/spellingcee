import { Game, GameWord, Words } from "../../types.ts";
import { createAsyncThunk, createSlice, PayloadAction } from "../deps.ts";
import * as api from "../api.ts";
import { AppDispatch, AppState } from "./mod.ts";
import { selectGames, signin } from "./user.ts";
import { clearInput, clearLetterMessage, selectInput, setInputDisabled, setLetterMessage } from "./ui.ts";
import { ResponseError } from "../api.ts";

export type GameState = {
  game: Game | null;
  words: Words;
};

export const activateGame = createAsyncThunk<
  { game: Game; words: Words },
  number | undefined,
  { state: AppState }
>(
  "game/activate",
  async (gameId, { getState }) => {
    if (gameId) {
      const games = selectGames(getState());
      const g = games.find(({ id }) => id === gameId);
      if (!g) {
        throw new Error(`Unknown game ID: ${gameId}`);
      }

      await api.setActiveGame(gameId);

      return {
        game: g,
        words: await api.getWords(g.id),
      };
    }

    return {
      game: await api.createGame(),
      words: {},
    };
  },
);

export const shareActiveGame = createAsyncThunk<
  void,
  number,
  { state: AppState }
>(
  "game/share",
  async (withUser: number) => {
    console.log(`sharing with ${withUser}`);
    await Promise.resolve();
  },
);

export const submitWord = createAsyncThunk<
  void,
  void,
  { state: AppState; dispatch: AppDispatch }
>(
  "game/submitWord",
  async (_, { getState, dispatch }) => {
    const game = selectGame(getState());
    const inputValue = selectInput(getState());

    if (!game) {
      throw new Error("No active game");
    }

    try {
      const word = await api.addWord({
        gameId: game.id,
        word: inputValue.join(""),
      });
      dispatch(addWord(word));
      dispatch(clearInput());
    } catch (error) {
      const message = error instanceof ResponseError
        ? error.error
        : error.message;
      dispatch(setInputDisabled(true));
      dispatch(setLetterMessage({ type: "bad", message }));

      setTimeout(() => {
        dispatch(clearInput());
        dispatch(setInputDisabled(false));
        dispatch(clearLetterMessage());
      }, 1000);
      throw error;
    }
  },
);

const initialState: GameState = {
  game: null,
  words: {},
};

export const gameSlice = createSlice({
  name: "game",

  initialState,

  reducers: {
    addWord: (state, action: PayloadAction<GameWord>) => {
      const { payload } = action;
      state.words[payload.word] = payload;
    },
  },

  extraReducers: (builder) => {
    builder.addCase(activateGame.fulfilled, (state, { payload }) => {
      state.game = payload.game;
      state.words = payload.words;
    });

    builder.addCase(signin.fulfilled, (state, { payload }) => {
      const { user, games, words } = payload;
      state.game = games.find((g) => g.id === user.currentGame) ?? null;
      state.words = words;
    });
  },
});

const { addWord } = gameSlice.actions;

export default gameSlice.reducer;

export const selectGame = (state: AppState) => state.game.game;
export const selectWords = (state: AppState) => state.game.words;
export const selectGameLetters = (state: AppState) => state.game.game?.key;
