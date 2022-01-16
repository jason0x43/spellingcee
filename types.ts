import { Game as DbGame, User as DbUser } from "./server/database/types.ts";
export type { GameWord } from "./server/database/types.ts";

export interface AppState {
  userId: number;
}

export interface User extends DbUser {
  currentGame: number | undefined;
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
