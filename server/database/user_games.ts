import { query } from "./db.ts";
import { UserGame } from "./types.ts";

type UserGameRow = [number, number, number, boolean];

function rowToUserGame(row: UserGameRow): UserGame {
  return {
    id: row[0],
    userId: row[1],
    gameId: row[2],
    isOwner: row[3],
  };
}

export function getUserGames(data: { userId: number }): UserGame[] {
  const rows = query<UserGameRow>(
    `SELECT * FROM user_games WHERE user_id = (:userId)`,
    data,
  );
  return rows.map(rowToUserGame);
}

export function setGameOwner(data: { gameId: number; userId: number }) {
  query<UserGameRow>(
    `INSERT INTO user_games (user_id, game_id, is_owner)
    VALUES (:userId, :gameId, :isOwner)
    ON CONFLICT(user_id, game_id)
    DO UPDATE SET is_owner = (:isOwner)`,
    { ...data, isOwner: true },
  );
}
