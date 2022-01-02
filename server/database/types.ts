export interface Game {
  id: number;
  userId: number;
  key: string;
  addedAt: number;
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
