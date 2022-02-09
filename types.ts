import {
  Game as DbGame,
  GameWord,
  User as DbUser,
} from "./server/database/types.ts";

export type AppState = {
  userId: number;
};

export type User = DbUser & {
  currentGame: number | undefined;
};

export type Game = DbGame & {
  numWords: number;
};

export { type GameWord };

export type Words = {
  [word: string]: GameWord;
};

export type OtherUser = {
  id: number;
  username: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type AddWordRequest = {
  word: string;
};

export type AddUserRequest = {
  username: string;
  email: string;
  password: string;
};
