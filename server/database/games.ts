import { Game } from "./types.ts";
import { createRowHelpers } from "./util.ts";

const {
  columns: gameColumns,
  query: gameQuery,
} = createRowHelpers<
  Game
>()(
  "id",
  "key",
  "addedAt",
);

export function addGame(data: { key: string }): Game {
  return gameQuery(
    `INSERT INTO games (key) VALUES (:key) RETURNING ${gameColumns}`,
    data,
  )[0];
}

export function getGame(gameId: number): Game {
  const game = gameQuery(
    `SELECT ${gameColumns} FROM games WHERE game_id = (:gameId)`,
    { gameId },
  )[0];
  if (!game) {
    throw new Error("Invalid game ID");
  }
  return game;
}
