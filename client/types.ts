import { Game, User, Word } from "../types.ts";

export interface Games {
  [gameId: number]: Game;
}

export interface Words {
  [word: string]: Word;
}

export interface Users {
  [userId: number]: User;
}

/**
 * A handle to a store subscription
 */
export interface Subscription {
  key: string | undefined;
  off(): void;
  initialValue: Promise<unknown>;
}
