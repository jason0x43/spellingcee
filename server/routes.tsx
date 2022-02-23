import { log, Middleware, path, ReactDOMServer, Router } from "./deps.ts";
import React from "react";
import {
  addGameWord,
  addUser,
  getUserIdFromUsername,
  isUserPassword,
  userCanPlay,
} from "./database/mod.ts";
import {
  AddUserRequest,
  AddWordRequest,
  AppState,
  Game,
  LoginRequest,
  User,
  Words,
} from "../types.ts";
import { getDefinition } from "./dictionary.ts";
import { Provider } from "react-redux";
import App from "../client/App.tsx";
import {
  AppState as ClientAppState,
  createStore,
} from "../client/store/mod.ts";
import { createGame, getGame, getGames, getGameWords } from "./games.ts";
import { getOtherUsers, getUser } from "./users.ts";
import { validateWord } from "./words.ts";
import { setCurrentGameId } from "./database/user_games.ts";
import { addLiveReloadRoute } from "./reload.ts";
import {
  addSession,
  getSession,
  getSessions,
  removeSession,
} from "./database/sessions.ts";

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

function toString(value: unknown): string {
  return JSON.stringify(value ?? null).replace(/</g, "\\u003c");
}

const requireUser: Middleware<AppState> = async ({ response, state }, next) => {
  log.debug("Checking for user");
  if (state.userId === undefined) {
    response.type = "application/json";
    response.status = 403;
    response.body = { error: "Must be logged in" };
  } else {
    await next();
  }
};

const requireLocal: Middleware<AppState> = async (
  { request, response },
  next,
) => {
  log.debug("Checking for local connection");
  if (request.ip !== "127.0.0.1") {
    response.type = "application/json";
    response.status = 403;
    response.body = { error: "Must be running locally" };
  } else {
    await next();
  }
};

export type RouterConfig = { client: string; styles: string; dev: boolean };

export function createRouter(init: RouterConfig) {
  let config = init;

  const cookieOptions = {
    secure: !init.dev,
    httpOnly: true,
    // assume we're being proxied through an SSL server
    ignoreInsecure: true,
  };

  const updateConfig = (newConfig: Partial<RouterConfig>) => {
    config = {
      ...config,
      ...newConfig,
    };
  };

  // Render the base HTML
  const render = (initialState?: Partial<ClientAppState>) => {
    const store = createStore(initialState);

    const devMode = `globalThis.__DEV__ = ${init.dev ? "true" : "false"};`;
    const renderedApp = ReactDOMServer.renderToString(
      <Provider store={store}>
        <App />
      </Provider>,
    );
    const preloadedState = `globalThis.__PRELOADED_STATE__ = ${
      toString(store.getState())
    };`;

    const logo = Deno.readTextFileSync(
      path.join(__dirname, "..", "public", "favicon.svg"),
    ).replace(/\bsvg\b/g, "symbol");

    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <title>Spelling Cee</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-touch-fullscreen" content="yes">

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        <link rel="manifest" href="/site.webmanifest">

        <link rel="stylesheet" href="/styles.css">
        <script type="module" async src="/client.js"></script>
      </head>
      <body>
        <svg style="display:none" version="2.0">
          <defs>
            ${logo}
          </defs>
        </svg>
        <div id="root">${renderedApp}</div>
        <script>${preloadedState}</script>
        <script>${devMode}</script>
      </body>
    </html>`;
  };

  const router = new Router<AppState>();

  addLiveReloadRoute(router);

  router.get("/user", requireUser, ({ response, state }) => {
    response.type = "application/json";
    response.body = getUser(state.userId);
  });

  router.patch(
    "/user",
    requireUser,
    async ({ request, response, state }) => {
      if (!request.hasBody) {
        response.status = 400;
        response.body = { error: "Missing request body" };
        return;
      }

      const body = request.body();
      const data = await body.value as { currentGame: number };
      const dataKeys = Object.keys(data);

      // currently only currentGame can be patched
      if (dataKeys.length !== 1 || dataKeys[0] !== "currentGame") {
        response.status = 400;
        response.body = { error: "Only 'currentGame' may be modified" };
        return;
      }

      setCurrentGameId({ userId: state.userId, gameId: data.currentGame });

      response.type = "application/json";
      response.body = getUser(state.userId);
    },
  );

  router.get("/users", requireUser, ({ response, state }) => {
    response.type = "application/json";
    response.body = getOtherUsers(state.userId);
  });

  router.post("/users", async ({ request, response }) => {
    if (!request.hasBody) {
      response.status = 400;
      response.body = { error: "Missing request body" };
      return;
    }

    const body = request.body();
    const data = await body.value as AddUserRequest;

    response.type = "application/json";
    response.body = addUser(data);
    log.debug("Added user");
  });

  router.get("/definition", requireUser, async ({ request, response }) => {
    const params = request.url.searchParams;
    const word = params.get("word");

    response.type = "application/json";

    if (!word) {
      response.status = 400;
      response.body = { error: "Missing word" };
      return;
    }

    try {
      const def = await getDefinition(word);
      response.body = def;
    } catch (error) {
      response.status = 400;
      response.body = { error: `${error.message}` };
    }
  });

  router.get("/client.js", ({ response }) => {
    response.type = "application/javascript";
    response.body = config.client;
  });

  router.get("/styles.css", ({ response }) => {
    response.type = "text/css";
    response.body = config.styles;
  });

  router.get("/games", requireUser, ({ response, state }) => {
    response.type = "application/json";
    const games: Game[] = getGames(state.userId);
    response.body = games;
  });

  router.get("/games/:id/words", requireUser, ({ params, response, state }) => {
    const { userId } = state;
    const { id } = params;
    const gameId = Number(id);

    response.type = "application/json";

    if (!userCanPlay({ userId, gameId })) {
      response.status = 400;
      response.body = { error: `User ${userId} isn't part of game ${gameId}` };
    } else {
      response.body = getGameWords(gameId);
    }
  });

  router.post(
    "/games/:id/words",
    requireUser,
    async ({ params, request, response, state }) => {
      log.debug("Trying to add word");
      const { userId } = state;
      const { id } = params;
      const gameId = Number(id);
      response.type = "application/json";

      if (!userCanPlay({ userId, gameId })) {
        response.status = 400;
        response.body = {
          error: `User ${userId} isn't part of game ${gameId}`,
        };
        return;
      }

      if (!request.hasBody) {
        response.status = 400;
        response.body = { error: "Missing request body" };
        return;
      }

      const body = request.body();
      const data = await body.value as AddWordRequest;

      const game = getGame(gameId);
      if (!game) {
        response.status = 404;
        response.body = { error: "Invalid game ID" };
        return;
      }

      const message = validateWord({ word: data.word, key: game.key });
      if (message) {
        response.status = 422;
        response.body = { error: message };
        return;
      }

      const word = addGameWord({ userId, gameId, word: data.word });

      response.status = 200;
      response.body = word;
    },
  );

  router.post("/login", async ({ cookies, request, response, state }) => {
    response.type = "application/json";

    if (!request.hasBody) {
      response.status = 400;
      response.body = { error: "Missing or invalid credentials" };
      return;
    }

    const body = request.body();
    const data = await body.value as LoginRequest;
    const userId = getUserIdFromUsername(data.username);

    if (!isUserPassword(userId, data.password)) {
      response.status = 400;
      response.body = { error: "Missing or invalid credentials" };
      return;
    }

    state.userId = userId;
    const session = addSession({ userId });
    await cookies.set("userId", `${userId}`, {
      ...cookieOptions,
      expires: new Date(session.expires),
    });

    const user: User = getUser(userId);
    response.body = user;
  });

  router.get("/logout", requireUser, async ({ cookies, response }) => {
    await cookies.set("userId", "", cookieOptions);
    response.type = "application/json";
    response.body = { success: true };
  });

  router.get("/create-game", requireUser, ({ response, state }) => {
    const game = createGame({ userId: state.userId });
    response.type = "application/json";
    response.body = game;
  });

  router.get("/", ({ response, state }) => {
    const start = Date.now();
    response.type = "text/html";

    if (!state.userId) {
      response.body = render();
      return;
    }

    const user = getUser(state.userId);
    let game: Game;
    let words: Words;

    const gotGame = Date.now();
    log.debug(`Got user and game in ${gotGame - start} ms`);

    if (user.currentGame !== undefined) {
      game = getGame(user.currentGame);
      words = getGameWords(game.id);
    } else {
      game = createGame({ userId: state.userId });
      words = {};
    }

    const gotWords = Date.now();
    log.debug(`Got words in ${gotWords - gotGame} ms`);

    const games = getGames(state.userId);
    const gotGames = Date.now();
    log.debug(`Got games in ${gotGames - gotWords} ms`);
    const otherUsers = getOtherUsers(state.userId);

    log.debug(`Got other users in ${Date.now() - gotGames} ms`);

    response.type = "text/html";
    response.body = render({
      user: {
        user,
        games,
        otherUsers,
      },
      game: {
        game,
        words,
      },
    });

    log.debug(`Rendered app in ${Date.now() - start} ms`);
  });

  // local service endpoints

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
          response.body = getSession(userId);
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
      const username = params.get("username");

      response.type = "application/json";

      try {
        if (!username) {
          throw new Error("A username is required");
        }

        const userId = getUserIdFromUsername(username);
        const session = getSession(userId);
        removeSession(session.id);
        response.body = { success: true };
      } catch (error) {
        response.status = 400;
        response.body = { error: `${error}` };
      }
    },
  );

  return {
    router,
    updateConfig,
  };
}
