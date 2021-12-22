import { bcrypt, log } from "../deps.ts";
import { query } from "./db.ts";
import { User, UserConfig } from "../../types.ts";

type UserRow = [number, string, string, string?];

function rowToUser(row: UserRow): User {
  const [id, email, name, rawConfig] = row;
  const config = rawConfig !== undefined ? JSON.parse(rawConfig) : undefined;
  return { id, name, email, config };
}

export function addUser(
  user: Pick<User, "name" | "email">,
  password: string,
): User {
  const hashedPassword = bcrypt.hashSync(password);
  const rows = query<UserRow>(
    `INSERT INTO users (name, email, password)
    VALUES (:name, :email, :password)
    RETURNING *`,
    { name: user.name, email: user.email, password: hashedPassword },
  );
  return rowToUser(rows[0]);
}

export function getUser(userId: number): User {
  const rows = query<UserRow>(
    "SELECT * FROM users WHERE id = (:userId)",
    { userId },
  );
  if (!rows[0]) {
    throw new Error(`No user with id ${userId}`);
  }
  return rowToUser(rows[0]);
}

export function getUserByEmail(email: string): User {
  const rows = query<UserRow>(
    "SELECT * FROM users WHERE email = (:email)",
    { email },
  );
  if (!rows[0]) {
    throw new Error(`No user with email ${email}`);
  }
  return rowToUser(rows[0]);
}

export function updateUserConfig(userId: number, config: UserConfig) {
  const dbConfig = JSON.stringify(config);
  query(
    "UPDATE users SET config = (json(:config)) WHERE id = (:userId)",
    { config: dbConfig, userId },
  );
  log.debug(`Set config for user ${userId} to ${dbConfig}`);
}

export function updateUserPassword(userId: number, password: string): void {
  const hashedPassword = bcrypt.hashSync(password);
  query(
    "UPDATE users SET password = (:password) WHERE id = (:userId)",
    { password: hashedPassword, userId },
  );
}

export function isUserPassword(userId: number, password: string): boolean {
  const rows = query<[string]>(
    "SELECT password FROM users WHERE id = (:userId)",
    { userId },
  );
  if (!rows[0]) {
    throw new Error(`No user with id ${userId}`);
  }
  const userPassword = rows[0][0];
  return bcrypt.compareSync(password, userPassword);
}
