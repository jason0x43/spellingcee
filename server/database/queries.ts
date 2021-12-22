import { getGame } from "./games.ts";
import { count } from "./util.ts";

export function userCanPlay(
  { userId, gameId }: { userId: number; gameId: number },
) {
  const game = getGame(gameId);
  if (game.userId === userId) {
    return true;
  }

  return count(
    `SELECT COUNT(*)
    FROM shared_games
    WHERE game_id = (:gameId) AND user_id = (:userId)`,
    { userId, gameId },
  ) > 0;
}
