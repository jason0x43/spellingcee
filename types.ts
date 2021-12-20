import { Game as GameEntity } from "./server/database/types.ts";

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
  wordsFound: number;
  score: number;
  maxScore: number;
  difficulty: number;
  isShared: boolean;
  addedBy: number;
}

export interface Word {
  addedAt: number;
  addedBy: number;
}
