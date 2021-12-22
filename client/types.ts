import { Game, GameWord, User } from "../types.ts";

export interface Games {
  [gameId: number]: Game;
}

export interface Words {
  [word: string]: GameWord;
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
