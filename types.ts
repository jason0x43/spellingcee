import { Game as DbGame } from "./server/database/types.ts";
export type { GameWord } from "./server/database/types.ts";

export interface AppState {
  userId: number;
}

export interface UserMeta {
  currentGame: number;
}

export interface User {
  /** A unique ID */
  id: number;
  /** The user's name */
  name: string;
  /** The user's email address */
  email: string;
  /** User settings */
  meta: UserMeta;
}

export interface OtherUser {
  id: number;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Game extends DbGame {
  maxScore: number;
  score: number;
  totalWords: number;
  wordsFound: number;
}

export interface AddWordRequest {
  word: string;
}
