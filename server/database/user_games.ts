import { log } from "../deps.ts";
import { inTransaction, query } from "./db.ts";
import { UserGame } from "./types.ts";
import { createRowHelpers, select } from "./util.ts";

const {
  columns: userGameColumns,
  query: userGameQuery,
} = createRowHelpers<
  UserGame
>()(
  "userId",
  "gameId",
  "isCurrent",
);

export function addUserGame(
  data: { userId: number; gameId: number },
) {
  log.debug(`Adding game ${data.gameId} to user ${data.userId}`);
  return userGameQuery(
    `INSERT INTO user_games (user_id, game_id)
    VALUES (:userId, :gameId)
    RETURNING ${userGameColumns}`,
    data,
  );
}

export function getGameIds(userId: number): number[] {
  log.debug(`Getting game IDs for user ${userId}`);
  return select(
    `SELECT game_id
    FROM user_games
    WHERE user_id = (:userId)`,
    (row) => row[0] as number,
    { userId },
  );
}

export function getCurrentGameId(userId: number): number | undefined {
  log.debug(`Getting current game ID for user ${userId}`);
  return select(
    `SELECT game_id
    FROM user_games
    WHERE user_id = (:userId) AND is_current IS TRUE`,
    (row) => row[0] as number,
    { userId },
  )[0];
}

export function setCurrentGameId(
  params: { userId: number; gameId: number },
) {
  log.debug(
    `Setting current game for ${params.userId} to user ${params.gameId}`,
  );
  inTransaction(() => {
    query(
      `UPDATE user_games
        SET is_current = NULL 
        WHERE user_id = (:userId)`,
      { userId: params.userId },
    );

    query(
      `INSERT INTO user_games (user_id, game_id, is_current)
      VALUES (:userId, :gameId, TRUE)
      ON CONFLICT DO UPDATE SET is_current = TRUE`,
      { userId: params.userId, gameId: params.gameId },
    );
  });
}
