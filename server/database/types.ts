export interface Game {
  id: number;
  key: string;
  addedAt: number;
}

export interface UserGame {
  userId: number;
  gameId: number;
  isOwner: boolean;
}
