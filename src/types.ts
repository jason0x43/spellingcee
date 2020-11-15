export interface Word {
  addedAt: number;
  addedBy: string;
}

export interface Words {
  [word: string]: Word;
}

export interface Game {
  gameId: string;
  key: string;
  totalWords: number;
  wordsFound: number;
  score: number;
  maxScore: number;
  difficulty: number;
  isShared: boolean;
  addedAt: number;
  addedBy: string;
}

export interface Games {
  [key: string]: Game;
}

export interface User {
  userId: string;
  name?: string;
}

export interface Users {
  [userId: string]: User;
}

/**
 * A handle to a store subscription
 */
export interface Subscription {
  key: string | undefined;
  off(): void;
  initialValue: Promise<unknown>;
}
