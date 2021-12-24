import { bcrypt, log } from "../deps.ts";
import { query } from "./db.ts";
import { User, UserMeta } from "../../types.ts";
import { createRowHelpers, select } from "./util.ts";

interface DbUser extends Omit<User, "meta"> {
  meta?: string;
}

const {
  columns: userColumns,
  query: userQuery,
} = createRowHelpers<
  DbUser
>()(
  "id",
  "email",
  "name",
  "meta",
);

function toUser(dbUser: DbUser): User {
  return {
    ...dbUser,
    meta: dbUser.meta ? JSON.parse(dbUser.meta) : undefined,
  };
}

export function addUser({ name, email, password }: {
  name: string;
  email: string;
  password: string;
}): User {
  const hashedPassword = bcrypt.hashSync(password);
  return toUser(
    userQuery(
      `INSERT INTO users (name, email, password)
    VALUES (:name, :email, :password)
    RETURNING ${userColumns}`,
      { name, email, password: hashedPassword },
    )[0],
  );
}

export function getUser(userId: number): User {
  const user = userQuery(
    `SELECT ${userColumns} FROM users WHERE id = (:userId) AND deleted = FALSE`,
    { userId },
  )[0];
  if (!user) {
    throw new Error(`No user with id ${userId}`);
  }
  return toUser(user);
}

export function getUsers(): User[] {
  return userQuery(
    `SELECT ${userColumns} FROM users WHERE deleted = FALSE`,
  ).map(toUser);
}

export function getUserByEmail(email: string): User {
  const user = userQuery(
    `SELECT ${userColumns}
    FROM users
    WHERE email = (:email) AND deleted = FALSE`,
    { email },
  )[0];
  if (!user) {
    throw new Error(`No user with email ${email}`);
  }
  return toUser(user);
}

export function updateUserMeta(userId: number, meta: UserMeta) {
  const dbMeta = JSON.stringify(meta);
  query(
    "UPDATE users SET meta = (json(:meta)) WHERE id = (:userId)",
    { meta: dbMeta, userId },
  );
  log.debug(`Set meta for user ${userId} to ${dbMeta}`);
}

export function updateUserPassword(userId: number, password: string): void {
  const hashedPassword = bcrypt.hashSync(password);
  query(
    "UPDATE users SET password = (:password) WHERE id = (:userId)",
    { password: hashedPassword, userId },
  );
}

export function isUserPassword(userId: number, password: string): boolean {
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
