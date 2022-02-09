import { bcrypt, log } from "../deps.ts";
import { query } from "./db.ts";
import { createRowHelpers, select } from "./util.ts";
import { User } from "./types.ts";

const {
  columns: userColumns,
  query: userQuery,
} = createRowHelpers<
  User
>()(
  "id",
  "email",
  "username"
);

export function addUser({ username, email, password }: {
  username: string;
  email: string;
  password: string;
}): User {
  log.debug(`Adding user ${username} with email ${email}`);
  const hashedPassword = bcrypt.hashSync(password);
  log.debug('Hashed the password');
  const user = userQuery(
    `INSERT INTO users (username, email, password)
    VALUES (:username, :email, :password)
    RETURNING ${userColumns}`,
    { username, email, password: hashedPassword },
  )[0];
  log.debug('Finished add');
  return user;
}

export function getUser(userId: number): User {
  log.debug(`Getting user ${userId}`);
  const user = userQuery(
    `SELECT ${userColumns} FROM users WHERE id = (:userId) AND deleted = FALSE`,
    { userId },
  )[0];
  if (!user) {
    throw new Error(`No user with id ${userId}`);
  }
  return user;
}

export function getUsers(): User[] {
  log.debug(`Getting users`);
  return userQuery(
    `SELECT ${userColumns} FROM users WHERE deleted = FALSE`,
  );
}

export function getUserIdFromUsername(username: string): number {
  log.debug(`Getting user ID for username ${username}`);
  const userId = select(
    `SELECT id 
    FROM users
    WHERE username = (:username) AND deleted = FALSE`,
    (row) => row[0] as number,
    { username },
  )[0];
  if (!userId) {
    throw new Error(`No user with username ${username}`);
  }
  return userId;
}

export function updateUserPassword(userId: number, password: string): void {
  log.debug(`Updating password for ${userId}`);
  const hashedPassword = bcrypt.hashSync(password);
  query(
    "UPDATE users SET password = (:password) WHERE id = (:userId)",
    { password: hashedPassword, userId },
  );
}

export function isUserPassword(userId: number, password: string): boolean {
  log.debug(`Checking password for ${userId}`);
  const userPassword = select(
    "SELECT password FROM users WHERE id = (:userId)",
    (row) => row[0] as string,
    { userId },
  )[0];
  if (!userPassword) {
    throw new Error(`No user with id ${userId}`);
  }
  return bcrypt.compareSync(password, userPassword);
}
