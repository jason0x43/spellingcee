import { Game as GameEntity } from "./server/database/types.ts";

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
  meta?: UserMeta;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Game extends GameEntity {
  totalWords: number;
  maxScore: number;
}

export interface GameData {
  wordsFound: number;
  score: number;
  isShared: boolean;
}

export interface AddWordRequest {
  word: string;
}
