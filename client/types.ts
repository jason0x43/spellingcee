import { Game, GameWord, User } from "../types.ts";

export type Games = {
  [gameId: number]: Game;
};

export type Words = {
  [word: string]: GameWord;
};

export type Users = {
  [userId: number]: User;
};
