import { Game as DbGame, User as DbUser } from "./server/database/types.ts";
export type { GameWord } from "./server/database/types.ts";

export type AppState = {
  userId: number;
};

export type User = DbUser & {
  currentGame: number | undefined;
};

export type Game = DbGame & {
  numWords: number;
};

export type OtherUser = {
  id: number;
  name: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AddWordRequest = {
  word: string;
};

export type AddUserRequest = {
  email: string;
  password: string;
  name: string;
};
