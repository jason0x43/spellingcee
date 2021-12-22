import { getGame } from "./games.ts";
import { count } from "./util.ts";
import { Game } from "./types.ts";
import { gameColumns, gameQuery } from "./games.ts";

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

export function getUserGames(userId: number): Game[] {
  const columnNames = gameColumns.split(",").map((name) => `g.${name}`).join(
    ",",
  );
  return gameQuery(
    `SELECT ${columnNames}
    FROM games as g
    LEFT JOIN shared_games as sg
      ON g.id = sg.game_id
    WHERE sg.user_id = (:userId) OR g.user_id = (:userId)`,
    { userId },
  );
}
