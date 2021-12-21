import { query } from "./db.ts";
import { UserGame } from "./types.ts";
import { createRowHelpers } from "./util.ts";

const {
  columns: userGameColumns,
  query: userGameQuery,
} = createRowHelpers<
  UserGame
>()(
  "userId",
  "gameId",
  "isOwner",
);

export function getUserGames(data: { userId: number }): UserGame[] {
  return userGameQuery(
    `SELECT ${userGameColumns} FROM user_games WHERE user_id = (:userId)`,
    data,
  );
}

export function setGameOwner(data: { gameId: number; userId: number }) {
  query(
    `INSERT INTO user_games (user_id, game_id, is_owner)
    VALUES (:userId, :gameId, :isOwner)
    ON CONFLICT(user_id, game_id)
    DO UPDATE SET is_owner = (:isOwner)`,
    { ...data, isOwner: true },
  );
}
