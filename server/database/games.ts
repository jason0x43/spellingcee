import { Game } from "./types.ts";
import { query } from "./db.ts";

type GameRow = [number, number, string];

function rowToGame(row: GameRow): Game {
  return {
    id: row[0],
    key: row[2],
  };
}

export function addGame(data: { key: string }): Game {
  const rows = query<GameRow>(
    "INSERT INTO games (key) VALUES (:key) RETURNING *",
    data,
  );
  return rowToGame(rows[0]);
}
