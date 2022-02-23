export type Game = {
  id: number;
  userId: number;
  key: string;
  maxWords: number;
  maxScore: number;
  addedAt: number;
};

export type User = {
  /** A unique ID */
  id: number;
  /** A unique username */
  username: string;
  /** The user's email address */
  email: string;
};

export type UserGame = {
  userId: number;
  gameId: number;
  isCurrent: boolean;
};

export type GameWord = {
  gameId: number;
  userId: number;
  word: string;
  addedAt: number;
};

export type Session = {
  id: number;
  userId: number;
  expires: number;
}
