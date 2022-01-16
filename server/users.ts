import { OtherUser, User } from "../types.ts";
import { getUser as getDbUser, getUsers } from "./database/users.ts";
import { getCurrentGameId } from "./database/user_games.ts";

export function getUser(userId: number): User {
  const user = getDbUser(userId);
  const currentGame = getCurrentGameId(userId);
  return {
    ...user,
    currentGame,
  };
}

export function getOtherUsers(userId: number): OtherUser[] {
  const users = getUsers();
  return users.filter(({ id }) => id !== userId).map(({ id, name }) => ({
    id,
    name,
  }));
}
