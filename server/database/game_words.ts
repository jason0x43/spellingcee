import { log } from "../deps.ts";
import { GameWord } from "./types.ts";
import { createRowHelpers, select } from "./util.ts";

const {
  columns: gameWordsColumns,
  query: gameWordsQuery,
} = createRowHelpers<
  GameWord
>()(
  "userId",
  "gameId",
  "word",
  "addedAt",
);

export function addGameWord(
  data: { gameId: number; userId: number; word: string },
): GameWord {
  log.debug(`Adding word ${data.word} to game ${data.gameId}`);
  return gameWordsQuery(
    `INSERT INTO game_words (user_id, game_id, word)
    VALUES (:userId, :gameId, :word)
    RETURNING ${gameWordsColumns}`,
    data,
  )[0];
}

export function getGameWords(gameId: number): GameWord[] {
  log.debug(`Getting words for game ${gameId}`);
  return gameWordsQuery(
    `SELECT ${gameWordsColumns} FROM game_words WHERE game_id = (:gameId)`,
    { gameId },
  );
}

export function getGameWordCount(gameId: number): number {
  log.debug(`Getting word count for game ${gameId}`);
  return select(
    `SELECT COUNT (id) FROM game_words WHERE game_id = (:gameId)`,
    (row) => row[0] as number,
    { gameId },
  )[0];
}
