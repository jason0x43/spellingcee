import { DB, log } from "../deps.ts";
import { closeDb, createDb, getDb, inTransaction, query } from "./db.ts";

export { inTransaction };
export {
  addUser,
  getUser,
  getUserByEmail,
  isUserPassword,
  updateUserPassword,
} from "./users.ts";

export function openDatabase(name = "data.db") {
  try {
    getDb();
  } catch {
    createDb(name);
    log.debug(`Foreign key support: ${getPragma("foreign_keys")}`);
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

interface Migration {
  up: (db: DB) => void;
  down: (db: DB) => void;
}

// DB version is index + 1
const migrations: Migration[] = [
  {
    // initial database structure
    up: (db) => {
      inTransaction(() => {
        db.query(
          `CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            name TEXT,
            meta JSON
          )`,
        );

        db.query(
          `CREATE TABLE games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT NOT NULL,
            added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIME,
            UNIQUE (key)
          )`,
        );

        db.query(
          `CREATE TABLE user_games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            game_id INTEGER NOT NULL,
            is_owner BOOLEAN,
            UNIQUE (user_id, game_id),
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(game_id) REFERENCES games(id)
          )`,
        );

        db.query(
          `CREATE TABLE game_words (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            word TEXT NOT NULL,
            added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIME,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(game_id) REFERENCES games(id)
          )`,
        );
      });

      setPragma("foreign_keys", "ON");
    },

    down: (db) => {
      inTransaction(() => {
        db.query(`DROP TABLE users`);
        db.query(`DROP TABLE games`);
        db.query(`DROP TABLE user_games`);
        db.query(`DROP TABLE game_words`);
      });
    },
  },
];
