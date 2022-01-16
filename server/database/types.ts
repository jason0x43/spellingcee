export interface Game {
  id: number;
  userId: number;
  key: string;
  addedAt: number;
}

export interface User {
  /** A unique ID */
  id: number;
  /** The user's name */
  name: string;
  /** The user's email address */
  email: string;
}

export interface UserGame {
  userId: number;
  gameId: number;
  isCurrent: boolean;
}

export interface GameWord {
  gameId: number;
  userId: number;
  word: string;
  addedAt: number;
}
