import { log } from "../deps.ts";
import { createRowHelpers } from "./util.ts";
import { Session } from "./types.ts";

const {
  columns: sessionColumns,
  query: sessionQuery,
} = createRowHelpers<
  Session
>()(
  "id",
  "userId",
  "sessionId",
  "expires",
);

export function addSession({ userId, expires }: {
  userId: number;
  expires?: number;
}): Session {
  if (!expires) {
    // expire in 1 year
    expires = Date.now() + 365 * 24 * 60 * 60 * 1000;
  }
  const session = sessionQuery(
    `INSERT INTO sessions (session_id, user_id, expires)
    VALUES (:sessionId, :userId, :expires)
    RETURNING ${sessionColumns}`,
    { sessionId: createSessionId(), userId, expires },
  )[0];

  log.debug(`Added session ${session.sessionId} for user ${userId}`);
  return session;
}

export function getSession(sessionId: string): Session {
  log.debug(`Getting session ${sessionId}`);
  const session = sessionQuery(
    `SELECT ${sessionColumns} FROM sessions WHERE session_id = (:sessionId)`,
    { sessionId },
  )[0];
  if (!session) {
    throw new Error(`No active session with ID ${sessionId}`);
  }
  return session;
}

export function getSessions(): Session[] {
  log.debug(`Getting sessions`);
  return sessionQuery(`SELECT ${sessionColumns} FROM sessions`);
}

export function getUserSessions(userId: number): Session[] {
  log.debug(`Getting sessions`);
  return sessionQuery(
    `SELECT ${sessionColumns}
    FROM sessions
    WHERE user_id = (:userId)`,
    { userId },
  );
}

export function removeSession(sessionId: string): void {
  log.debug(`Removing session ${sessionId}`);
  sessionQuery(`DELETE FROM sessions WHERE session_id = (:sessionId)`, {
    sessionId,
  });
}

export function isActiveSession(session: Session): boolean {
  return session.expires > Date.now();
}

export function createSessionId(): string {
  return crypto.randomUUID();
}

// This is necessary until TS's types know about randomUUID
declare global {
  interface Crypto {
    randomUUID: () => string;
  }
}
