import { createAsyncThunk, createSlice, PayloadAction } from "../deps.ts";
import { AppState } from "./mod.ts";
import { getDefinition as getDef } from "../api.ts";
import { AppDispatch } from "./mod.ts";
import { getUserGames } from "./user.ts";
import { activateGame, submitWord } from "./game.ts";
import { permute } from "../../shared/util.ts";

type DefinedWord = {
  word: string;
  definition: string[] | undefined;
};

export type Message = {
  message: string;
  type: "normal" | "good" | "bad";
};

export type UiState = {
  input: string[];
  inputDisabled: boolean;
  letters: string[];
  wordListExpanded: boolean;
  definition?: DefinedWord;
  gameIds: number[];
  newGameIds: number[];
  error?: string;
  warning?: string;
  toastMessage?: Message;
  letterMessage?: Message;
};

export const getDefinition = createAsyncThunk<
  DefinedWord | undefined,
  string,
  { dispatch: AppDispatch }
>(
  "ui/getDefinition",
  async (word, { dispatch }) => {
    dispatch(clearDefinition());
    const definition = await getDef(word);
    return {
      word,
      definition,
    };
  },
);

const initialState: UiState = {
  inputDisabled: false,
  wordListExpanded: false,
  gameIds: [],
  input: [],
  letters: [],
  newGameIds: [],
};

export const uiSlice = createSlice({
  name: "ui",

  initialState,

  reducers: {
    addInput: (state, action: PayloadAction<string>) => {
      if (action.payload.length !== 1) {
        throw new Error("Only a single letter may be added");
      }
      state.input = [...state.input, action.payload];
    },
    removeInput: (state) => {
      state.input = state.input.slice(0, state.input.length - 1);
    },
    clearInput: (state) => {
      state.input = [];
    },

    scrambleLetters: (state) => {
      state.letters = [
        state.letters[0],
        ...permute(state.letters.slice(1)),
      ];
    },
    setWordListExpanded: (state, action: PayloadAction<boolean>) => {
      state.wordListExpanded = action.payload;
    },
    setInputDisabled: (state, action: PayloadAction<boolean>) => {
      state.inputDisabled = action.payload;
    },
    clearDefinition: (state) => {
      state.definition = undefined;
    },
    clearNewGameIds: (state) => {
      state.newGameIds = [];
    },

    setError: (state, action: PayloadAction<Error | string>) => {
      state.error = `${action.payload}`;
    },
    clearError: (state) => {
      state.error = undefined;
    },

    setWarning: (state, action: PayloadAction<string>) => {
      state.warning = `${action.payload}`;
    },
    clearWarning: (state) => {
      state.warning = undefined;
    },

    setToastMessage: (
      state,
      action: PayloadAction<NonNullable<UiState["toastMessage"]>>,
    ) => {
      state.toastMessage = action.payload;
    },
    clearToastMessage: (state) => {
      state.toastMessage = undefined;
    },
    setLetterMessage: (
      state,
      action: PayloadAction<NonNullable<UiState["letterMessage"]>>,
    ) => {
      state.letterMessage = action.payload;
    },
    clearLetterMessage: (state) => {
      state.letterMessage = undefined;
    },
  },

  extraReducers: (builder) => {
    builder.addCase(getDefinition.fulfilled, (state, { payload }) => {
      state.definition = payload;
    });

    builder.addCase(getUserGames.fulfilled, (state, { payload }) => {
      const { gameIds: existingIds } = state;
      const newIds = payload.map(({ id }) => id);
      state.gameIds = newIds;
      state.newGameIds = newIds.filter((id) => !existingIds.includes(id));
    });

    builder.addCase(activateGame.fulfilled, (state, { payload }) => {
      state.letters = [...payload.game.key];
    });
  },
});

export default uiSlice.reducer;

export const {
  addInput,
  clearDefinition,
  clearError,
  clearInput,
  clearLetterMessage,
  clearNewGameIds,
  clearToastMessage,
  clearWarning,
  removeInput,
  scrambleLetters,
  setError,
  setInputDisabled,
  setLetterMessage,
  setToastMessage,
  setWarning,
  setWordListExpanded,
} = uiSlice.actions;

export const selectWordListExpanded = (state: AppState) =>
  state.ui.wordListExpanded;
export const selectInputDisabled = (state: AppState) => state.ui.inputDisabled;
export const selectDefinition = (state: AppState) => state.ui.definition;
export const selectNewGameIds = (state: AppState) => state.ui.newGameIds;
export const selectInput = (state: AppState) => state.ui.input;
export const selectError = (state: AppState) => state.ui.error;
export const selectWarning = (state: AppState) => state.ui.warning;
export const selectLetterMessage = (state: AppState) => state.ui.letterMessage;
export const selectToastMessage = (state: AppState) => state.ui.toastMessage;
