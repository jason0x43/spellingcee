import { Game, OtherUser, User, Words } from "../../types.ts";
import { createAsyncThunk, createSlice, PayloadAction } from "../deps.ts";
import { AppDispatch, AppState } from "./mod.ts";
import * as api from "../api.ts";
import { activateGame } from "./game.ts";

export type UserState = {
  user: User | null;
  games: Game[];
  otherUsers: OtherUser[];
  error?: string;
};

export const signin = createAsyncThunk<
  { user: User; games: Game[]; words: Words },
  { username: string; password: string },
  { dispatch: AppDispatch }
>(
  "user/signin",
  async ({ username, password }, { dispatch }) => {
    dispatch(clearError());

    try {
      const user = await api.login(username, password);
      const games = await api.getGames();
      const otherUsers = await api.getOtherUsers();
      dispatch(setUser(user));
      dispatch(setGames(games));
      dispatch(setOtherUsers(otherUsers));

      return {
        user,
        games,
        words: user.currentGame ? api.getWords(user.currentGame) : {}
      };
    } catch (error) {
      dispatch(setError(error.message || `${error}`));
      throw error;
    }
  },
);

export const signout = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch }
>(
  "user/signout",
  async (_, { dispatch }) => {
    await api.logout();
    dispatch(reset());
  },
);

export const getUserGames = createAsyncThunk<
  Game[],
  void,
  { dispatch: AppDispatch }
>(
  "user/getGames",
  async (_, { dispatch }) => {
    try {
      const games = await api.getGames();
      dispatch(setGames(games));
      return games;
    } catch (error) {
      dispatch(setError(error.message || `${error}`));
      throw error;
    }
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
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setGames: (state, action: PayloadAction<Game[]>) => {
      state.games = action.payload;
    },
    setOtherUsers: (state, action: PayloadAction<OtherUser[]>) => {
      state.otherUsers = action.payload;
    },
    setError: (state, action: PayloadAction<Error | string>) => {
      const error = action.payload;
      state.error = (error as Error).message || `${error}`;
    },
    reset: (state) => {
      state.user = null;
      state.games = [];
      state.error = undefined;
      state.otherUsers = [];
    },
    clearError: (state) => {
      state.error = undefined;
    },
  },

  extraReducers: (builder) => {
    builder.addCase(activateGame.fulfilled, (state, { payload }) => {
      if (state.user) {
        state.user.currentGame = payload;
      }
    });
  },
});

const { clearError, reset, setGames, setError, setOtherUsers, setUser } =
  userSlice.actions;
export default userSlice.reducer;

export const selectGames = (state: AppState) => state.user.games;
export const selectOtherUsers = (state: AppState) => state.user.otherUsers;
export const selectUser = (state: AppState) => state.user.user;
export const selectUserError = (state: AppState) => state.user.error;
