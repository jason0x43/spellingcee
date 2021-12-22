import { Game } from "./types.ts";
import { createRowHelpers } from "./util.ts";

const {
  columns: gameColumns,
  query: gameQuery,
} = createRowHelpers<
  Game
>()(
  "id",
  "userId",
  "key",
);

export function addGame(data: { userId: number; key: string }): Game {
  return gameQuery(
    `INSERT INTO games (user_id, key)
    VALUES (:userId, :key)
    RETURNING ${gameColumns}`,
    data,
  )[0];
}

export function getGame(gameId: number): Game {
  const game = gameQuery(
    `SELECT ${gameColumns} FROM games WHERE id = (:gameId)`,
    { gameId },
  )[0];
  if (!game) {
    throw new Error("Invalid game ID");
  }
  return game;
}

export function getGameByKey(data: { userId: number; key: string }): Game {
  const game = gameQuery(
    `SELECT ${gameColumns}
    FROM games
    WHERE key = (:key) AND user_id = (:userId)`,
    data,
  )[0];
  if (!game) {
    throw new Error(`User ${data.userId} has no game with key ${data.key}`);
  }
  return game;
}
