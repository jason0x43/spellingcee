import { query } from "./db.ts";
import { GameWord } from "./types.ts";
import { createRowHelpers } from "./util.ts";

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
  return gameWordsQuery(
    `INSERT INTO game_words (user_id, game_id, word)
    VALUES (:userId, :gameId, :word)
    RETURNING ${gameWordsColumns}`,
    data,
  )[0];
}

export function getGameWords(gameId: number): GameWord[] {
  return gameWordsQuery(
    `SELECT ${gameWordsColumns} FROM game_words WHERE game_id = (:gameId)`,
    { gameId },
  );
}
