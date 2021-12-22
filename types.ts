export type { Game, GameWord } from "./server/database/types.ts";

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
  meta?: UserMeta;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GameData {
  gameId: number;
  maxScore: number;
  score: number;
  totalWords: number;
  wordsFound: number;
}

export interface AddWordRequest {
  word: string;
}
