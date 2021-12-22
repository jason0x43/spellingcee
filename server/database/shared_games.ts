import { SharedGame } from "./types.ts";
import { createRowHelpers } from "./util.ts";

const {
  columns: sharedGameColumns,
  query: sharedGameQuery,
} = createRowHelpers<
  SharedGame
>()(
  "userId",
  "gameId",
);

export function addSharedGame(data: { userId: number; gameId: number }) {
  return sharedGameQuery(
    `INSERT INTO shared_games (user_id, game_id)
    VALUES (:userId, :gameId)
    RETURNING ${sharedGameColumns}`,
    data,
  );
}
