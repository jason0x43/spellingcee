import { Application, Cookies, CookiesSetDeleteOptions, Router } from "oak";
import * as log from "std/log/mod.ts";
import { AppState } from "../types.ts";
import {
  addSession,
  getSession,
  getSessions,
  getUserSessions,
  isActiveSession,
  removeSession,
} from "./database/sessions.ts";
import { getUserIdFromUsername } from "./database/users.ts";
import { requireLocal } from "./middleware.ts";

const sessionCookie = "sessionId";

export async function createSession(
  { userId, cookies, cookieOptions }: {
    userId: number;
    cookies: Cookies;
    cookieOptions: CookiesSetDeleteOptions;
  },
) {
  const session = addSession({ userId });
  await cookies.set(sessionCookie, `${session.sessionId}`, {
    ...cookieOptions,
    expires: new Date(session.expires),
  });
  log.debug(`Created session ${session.sessionId} for user ${userId}`);
}

export async function deleteSession({ cookies, cookieOptions }: {
  cookies: Cookies;
  cookieOptions: CookiesSetDeleteOptions;
}) {
  const sessionId = await cookies.get(sessionCookie);
  if (sessionId) {
    await cookies.set(sessionCookie, "", cookieOptions);
    removeSession(sessionId);
    log.debug(`Removed session ${sessionId}`);
  }
}

export function addSessionMiddleware(app: Application<AppState>) {
  app.use(async ({ cookies, state }, next) => {
    const sessionId = await cookies.get(sessionCookie);
    if (sessionId) {
      log.debug(`sessionId: ${sessionId}`);
      try {
        const session = getSession(sessionId);
        if (isActiveSession(session)) {
          log.debug(`session is active`);
          state.userId = session.userId;
        }
      } catch {
        log.warning(`Invalid session ${sessionId}`);
      }
    }
    await next();
  });
}

export function addSessionManagementRoutes(router: Router<AppState>) {
  router.get(
    "/sessions",
    requireLocal,
    ({ request, response }) => {
      const params = request.url.searchParams;
      const username = params.get("username");

      response.type = "application/json";

      try {
        if (username) {
          const userId = getUserIdFromUsername(username);
          response.body = getUserSessions(userId);
        } else {
          response.body = getSessions();
        }
      } catch (error) {
        response.status = 400;
        response.body = { error: `${error}` };
      }
    },
  );

  router.delete(
    "/sessions",
    requireLocal,
    ({ request, response }) => {
      const params = request.url.searchParams;
      const sessionId = params.get("session");

      response.type = "application/json";

      try {
        if (!sessionId) {
          throw new Error("A sessionId is required");
        }
        removeSession(sessionId);
        response.body = { success: true };
      } catch (error) {
        response.status = 400;
        response.body = { error: `${error}` };
      }
    },
  );
}
