import { Game, GameWord, OtherUser, User } from "../../types.ts";
import { createAsyncThunk, createSlice } from "../deps.ts";
import { AppDispatch, AppState } from "./mod.ts";
import { getGames, getWords, login } from "../api.ts";

export type UserState = {
  user: User | null;
  games: Game[];
  otherUsers: OtherUser[];
  error?: string;
};

export const signin = createAsyncThunk<
  { user: User; games: Game[]; words: GameWord[] },
  { email: string; password: string },
  { dispatch: AppDispatch }
>(
  "user/signin",
  async ({ email, password }, { dispatch }) => {
    dispatch(clearError());
    const user = await login(email, password);
    const games = await getGames();
    const words = user.currentGame ? await getWords(user.currentGame) : [];
    return {
      user,
      games,
      words,
    };
  },
);

export const getUserGames = createAsyncThunk<
  Game[],
  void,
  { dispatch: AppDispatch }
>(
  "user/getGames",
  async () => {
    return await getGames();
  },
);

const initialState: UserState = {
  user: null,
  games: [],
  otherUsers: [],
};

export const userSlice = createSlice({
  name: "user",

  initialState,

  reducers: {
    signout: (state) => {
      state.user = null;
      state.games = [];
    },
    clearError: (state) => {
      state.error = undefined;
    },
  },

  extraReducers: (builder) => {
    builder.addCase(signin.fulfilled, (state, { payload }) => {
      state.user = payload.user;
      state.games = payload.games;
    });
    builder.addCase(signin.rejected, (state, { error }) => {
      state.error = error.message || `${error}`;
    });

    builder.addCase(getUserGames.fulfilled, (state, { payload }) => {
      state.games = payload;
    });
    builder.addCase(getUserGames.rejected, (state, { error }) => {
      state.error = error.message || `${error}`;
    });
  },
});

const { clearError } = userSlice.actions;
export const { signout } = userSlice.actions;
export default userSlice.reducer;

export const selectGames = (state: AppState) => state.user.games;
export const selectOtherUsers = (state: AppState) => state.user.otherUsers;
export const selectUser = (state: AppState) => state.user.user;
export const selectUserError = (state: AppState) => state.user.error;
