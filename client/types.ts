import { Game, GameWord, User } from "../types.ts";

export type Games = {
  [gameId: number]: Game;
};

export type Users = {
  [userId: number]: User;
};
