import { Game, GameWord } from "../../types.ts";
import { Words } from "../types.ts";
import { createAsyncThunk, createSlice } from "../deps.ts";
import { addWord, createGame, getWords, setActiveGame } from "../api.ts";
import { AppState } from "./mod.ts";
import { selectGames, signin } from "./user.ts";
import { selectInput } from "./ui.ts";

export type GameState = {
  game: Game | null;
  words: Words;
};

function toWords(words: GameWord[]): Words {
  if (!words) {
    return {};
  }

  return words.reduce((gw, word) => {
    gw[word.word] = word;
    return gw;
  }, {} as Words);
}

export const activateGame = createAsyncThunk<
  { game: Game; words: GameWord[] },
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

      await setActiveGame(gameId);

      return {
        game: g,
        words: await getWords(g.id),
      };
    }

    return {
      game: await createGame(),
      words: [],
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
  GameWord,
  void,
  { state: AppState }
>(
  "game/submitWord",
  async (_, { getState }) => {
    const game = selectGame(getState());
    const inputValue = selectInput(getState());

    if (!game) {
      throw new Error("No active game");
    }

    return await addWord({
      gameId: game.id,
      word: inputValue.join(""),
    });
  },
);

const initialState: GameState = {
  game: null,
  words: {},
};

export const gameSlice = createSlice({
  name: "game",

  initialState,

  reducers: {},

  extraReducers: (builder) => {
    // builder.addCase(activateGame.rejected, (state, { error }) => {
    //   state.error = error.message;
    // });
    builder.addCase(activateGame.fulfilled, (state, { payload }) => {
      state.game = payload.game;
      state.words = toWords(payload.words);
    });

    // builder.addCase(submitWord.rejected, (state, { error }) => {
    //   state.error = error.message;
    // });
    builder.addCase(submitWord.fulfilled, (state, { payload }) => {
      state.words[payload.word] = payload;
    });

    builder.addCase(signin.fulfilled, (state, { payload }) => {
      const { user, games, words } = payload;
      state.game = games.find((g) => g.id === user.currentGame) ?? null;
      state.words = toWords(words);
    });
  },
});

export default gameSlice.reducer;

export const selectGame = (state: AppState) => state.game.game;
export const selectWords = (state: AppState) => state.game.words;
export const selectGameLetters = (state: AppState) => state.game.game?.key;
