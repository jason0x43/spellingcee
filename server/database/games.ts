import { log } from "../deps.ts";
import { Game } from "./types.ts";
import { createRowHelpers } from "./util.ts";

export const { columns: gameColumns, query: gameQuery } = createRowHelpers<
  Game
>()("id", "userId", "key", "addedAt", "maxWords", "maxScore");

export function addGame(
  data: { userId: number; key: string; maxWords: number; maxScore: number },
): Game {
  log.debug(`Adding game with key ${data.key} for user ${data.userId}`);
  return gameQuery(
    `INSERT INTO games (user_id, key, max_words, max_score)
    VALUES (:userId, :key, :maxWords, :maxScore)
    RETURNING ${gameColumns}`,
    data,
  )[0];
}

export function getGame(gameId: number): Game {
  log.debug(`Getting game ${gameId}`);
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
  log.debug(`Getting game with key ${data.key} for user ${data.userId}`);
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

export function getGames(userId: number): Game[] {
  log.debug(`Getting games for ${userId}`);
  return gameQuery(
    `SELECT ${gameColumns} FROM games WHERE user_id = (:userId)`,
    { userId },
  );
}

