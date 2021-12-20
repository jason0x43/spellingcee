export interface Game {
  id: number;
  key: string;
  addedAt: number;
}

export interface UserGame {
  id: number;
  userId: number;
  gameId: number;
  isOwner: boolean;
}
