import { DB, log } from "../deps.ts";
import { closeDb, createDb, getDb, inTransaction, query } from "./db.ts";
import { createSessionId } from "./sessions.ts";

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
    migrateDatabase(3);
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
            is_admin BOOLEAN NOT NULL DEFAULT FALSE,
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

  {
    up: (db) => {
      inTransaction(() => {
        db.query(
          `CREATE TABLE sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            expires INTEGER NOT NULL
          )`,
        );
      });
    },

    down: (db) => {
      inTransaction(() => {
        db.query("DROP TABLE sessions");
      });
    },
  },

  {
    // use a unique session ID
    up: (db) => {
      inTransaction(() => {
        db.query(
          `CREATE TABLE _sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL UNIQUE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            expires INTEGER NOT NULL
          )`,
        );

        const rows = db.query("SELECT user_id, expires FROM sessions");
        for (const row of rows) {
          const [userId, expires] = row as [number, number];
          db.query(
            `INSERT INTO _sessions (session_id, user_id, expires)
            VALUES (:sessionId, :userId, :expires)`,
            {
              sessionId: createSessionId(),
              userId: userId,
              expires: expires,
            },
          );
        }

        db.query("DROP TABLE sessions");
        db.query("ALTER TABLE _sessions RENAME TO sessions");
      });
    },

    down: (db) => {
      inTransaction(() => {
        db.query(
          `CREATE TABLE _sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id UNIQUE INTEGER REFERENCES users(id) ON DELETE CASCADE,
            expires INTEGER NOT NULL
          )`,
        );

        const rows = db.query("SELECT user_id, expires FROM sessions");
        for (const row of rows) {
          const [userId, expires] = row as [number, number];
          db.query(
            `INSERT INTO _sessions (user_id, expires)
            VALUES (:userId, :expires)`,
            {
              userId: userId,
              expires: expires,
            },
          );
        }

        db.query("DROP TABLE sessions");
        db.query("ALTER TABLE _sessions RENAME TO sessions");
      });
    },
  },
];
