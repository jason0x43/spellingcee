import { OtherUser } from "../types.ts";
import { getUsers } from "./database/users.ts";

export function getOtherUsers(userId: number): OtherUser[] {
  const users = getUsers();
  return users.filter(({ id }) => id !== userId).map(({ id, name }) => ({
    id,
    name,
  }));
}
