import { path, React, ReactDOMServer, Router } from "./deps.ts";
import {
  getGame,
  getUser,
  getUserByEmail,
  isUserPassword,
} from "./database/mod.ts";
import { AppState, LoginRequest } from "../types.ts";
import { getDefinition } from "./dictionary.ts";
import App, { AppProps } from "../client/App.tsx";
import { Game } from "../types.ts";
import { createGame } from "./games.ts";

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

function toString(value: unknown): string {
  return JSON.stringify(value ?? null).replace(/</g, "\\u003c");
}

const mode = Deno.env.get("SC_MODE") ?? "prod";

export function createRouter(config: { client: string; styles: string }) {
  // Render the base HTML
  const render = (initialState: AppProps) => {
    const preloadedState = `globalThis.__PRELOADED_STATE__ = ${
      toString(initialState)
    };`;
    const renderedApp = ReactDOMServer.renderToString(
      <App {...initialState} />,
    );

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
      </body>
    </html>`;
  };

  const router = new Router<AppState>();

  router.get("/user", ({ response, state }) => {
    const user = getUser(state.userId);
    response.type = "application/json";
    response.body = user;
  });

  router.get("/definition", async ({ request, response }) => {
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

  router.get("/login", ({ response, state }) => {
    if (state.userId) {
      response.redirect("/");
    } else {
      response.type = "text/html";
      response.body = render({});
    }
  });

  router.post("/login", async ({ cookies, request, response, state }) => {
    response.type = "application/json";

    if (!request.hasBody) {
      response.status = 400;
      response.body = { error: "Missing or invalid credentials" };
      return;
    }

    const body = request.body();
    const data = await body.value as LoginRequest;
    const user = getUserByEmail(data.email);

    if (!isUserPassword(user.id, data.password)) {
      response.status = 400;
      response.body = { error: "Missing or invalid credentials" };
      return;
    }

    state.userId = user.id;
    await cookies.set("userId", `${user.id}`, {
      secure: mode !== "dev",
      httpOnly: mode !== "dev",
      // assume we're being proxied through an SSL server
      ignoreInsecure: true,
    });

    response.body = user;
  });

  router.get("/", async ({ response, state }) => {
    if (!state.userId) {
      response.redirect("/login");
      return;
    }

    const user = getUser(state.userId);
    let game: Game;
    if (user.meta?.currentGame) {
      game = getGame(user.meta.currentGame);
    } else {
      game = await createGame();
    }

    response.type = "text/html";
    response.body = render({ user, game });
  });

  return router;
}
