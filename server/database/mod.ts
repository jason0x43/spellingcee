import { DB, log } from "../deps.ts";
import { closeDb, createDb, getDb, inTransaction, query } from "./db.ts";

export { inTransaction };
export {
  addUser,
  getUser,
  getUserIdFromUsername,
  isUserPassword,
  updateUserPassword,
} from "./users.ts";
export { addGameWord, getGameWords } from "./game_words.ts";
export { userCanPlay } from "./queries.ts";

export function openDatabase(name = "data.db") {
  try {
    getDb();
  } catch {
    createDb(name);
    migrateDatabase(1);
    log.debug(`Database using v${getSchemaVersion()} schema`);
  }
}

export function closeDatabase() {
  closeDb();
}

function getPragma<T = string>(name: string) {
  const rows = query<[T]>(`PRAGMA ${name}`);
  return rows[0][0];
}

function setPragma(name: string, value: string | number) {
  query(`PRAGMA ${name} = ${value}`);
}

export function getSchemaVersion(): number {
  return getPragma("user_version");
}

export function setSchemaVersion(version: number) {
  setPragma("user_version", version);
}

export function migrateDatabase(targetVersion: number) {
  let version = getSchemaVersion();
  const db = getDb();

  while (version < targetVersion) {
    const migration = migrations[version++];
    migration.up(db);
    setSchemaVersion(version);
    log.debug(`Migrated db to schema v${version}`);
  }

  while (version > targetVersion) {
    const migration = migrations[--version];
    migration.down(db);
    setSchemaVersion(version);
    log.debug(`Migrated db to schema v${version}`);
  }
}

type Migration = {
  up: (db: DB) => void;
  down: (db: DB) => void;
};

// DB version is index + 1
const migrations: Migration[] = [
  {
    // initial database structure
    up: (db) => {
      inTransaction(() => {
        db.query(
          `CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            deleted BOOLEAN NOT NULL DEFAULT FALSE
          )`,
        );

        db.query(
          `CREATE TABLE games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT NOT NULL,
            max_words NUMBER NOT NULL,
            max_score NUMBER NOT NULL,
            user_id INTEGER REFERENCES users(id),
            added_at INTEGER NOT NULL DEFAULT (strftime('%s.%f', 'now') * 1000),
            UNIQUE (user_id, key)
          )`,
        );

        db.query(
          `CREATE TABLE user_games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
            is_current BOOLEAN,
            UNIQUE (user_id, game_id),
            UNIQUE (user_id, is_current)
          )`,
        );

        db.query(
          `CREATE TABLE game_words (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
            word TEXT NOT NULL,
            added_at INTEGER NOT NULL DEFAULT (strftime('%s.%f', 'now') * 1000),
            UNIQUE (game_id, word)
          )`,
        );
      });

      setPragma("foreign_keys", "ON");
    },

    down: (db) => {
      inTransaction(() => {
        db.query("DROP TABLE users");
        db.query("DROP TABLE games");
        db.query("DROP TABLE user_games");
        db.query("DROP TABLE game_words");
      });
    },
  },
];
