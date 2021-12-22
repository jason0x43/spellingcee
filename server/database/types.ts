export interface Game {
  id: number;
  userId: number;
  key: string;
  addedAt: number;
}

export interface SharedGame {
  userId: number;
  gameId: number;
  isOwner: boolean;
}

export interface GameWord {
  gameId: number;
  userId: number;
  word: string;
  addedAt: number;
}
