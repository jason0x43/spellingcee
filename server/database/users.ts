import { bcrypt } from "../deps.ts";
import { query } from "./db.ts";
import { User } from "../../types.ts";
import { createRowHelpers, select } from "./util.ts";

const {
  columns: userColumns,
  query: userQuery,
} = createRowHelpers<
  User
>()(
  "id",
  "email",
  "name",
);

export function addUser({ name, email, password }: {
  name: string;
  email: string;
  password: string;
}): User {
  const hashedPassword = bcrypt.hashSync(password);
  return userQuery(
    `INSERT INTO users (name, email, password)
    VALUES (:name, :email, :password)
    RETURNING ${userColumns}`,
    { name, email, password: hashedPassword },
  )[0];
}

export function getUser(userId: number): User {
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
  return userQuery(
    `SELECT ${userColumns} FROM users WHERE deleted = FALSE`,
  );
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
  return user;
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
