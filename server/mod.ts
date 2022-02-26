import { Application, expandGlob, log, path } from "./deps.ts";
import { AppState } from "../types.ts";
import { createRouter, RouterConfig } from "./routes.tsx";
import { openDatabase } from "./database/mod.ts";
import { addLiveReloadMiddleware } from "./reload.ts";
import { getSession, isActiveSession } from "./database/sessions.ts";
import { addSessionMiddleware } from "./sessions.ts";

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

// The path to the client files relative to the proect root
const clientDir = path.join(__dirname, "..", "client");

let sendReloadMessage: ((message: string) => void) | undefined;
let updateRouterConfig: (config: Partial<RouterConfig>) => void;

/**
 * Touch this file (to intiate a reload) if the client code changes.
 */
async function watchStyles() {
  const watcher = Deno.watchFs(clientDir);
  let timer: number | undefined;
  let updateStyles = false;
  let updateApp = false;

  for await (const event of watcher) {
    if (event.paths.some((p) => /\.css$/.test(p))) {
      updateStyles = true;
    }

    if (event.paths.some((p) => /client\/mod.tsx$/.test(p))) {
      updateApp = true;
    }

    if (updateStyles || updateApp) {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        if (updateApp || !sendReloadMessage) {
          // If the app code was updated or live reload is not enabled,
          // trigger a server reload
          Deno.run({ cmd: ["touch", __filename] });
        } else {
          // If only styles were updated _and_ live reload is enabled, only
          // rebuild and reload the styles
          updateRouterConfig({ styles: await buildStyles() });
          sendReloadMessage("reloadStyles");
        }
      }, 250);
    }
  }
}

async function buildClient(): Promise<string> {
  const emitOptions: Deno.EmitOptions = {
    bundle: "module",
    check: false,
    compilerOptions: {
      target: "esnext",
      lib: ["dom", "dom.iterable", "dom.asynciterable", "deno.ns"],
    },
  };

  if (Deno.env.get("SC_MODE") === "dev") {
    emitOptions.compilerOptions!.inlineSourceMap = true;
  }

  const importMap = Deno.env.get("SC_IMPORT_MAP");
  if (importMap) {
    emitOptions.importMapPath = path.join(__dirname, "..", importMap);
  }

  // Build and cache the client code
  const { files, diagnostics } = await Deno.emit(
    path.join(clientDir, "mod.tsx"),
    emitOptions,
  );

  if (diagnostics.length > 0) {
    log.warning(Deno.formatDiagnostics(diagnostics));
  }

  return files["deno:///bundle.js"];
}

async function buildStyles(): Promise<string> {
  // Build and cache the styles
  let styles = "";
  for await (
    const entry of expandGlob(
      path.join(__dirname, "..", "client", "**", "*.css"),
    )
  ) {
    const text = await Deno.readTextFile(entry.path);
    styles += `${text}\n`;
  }

  return styles;
}

export async function serve(port = 8083) {
  openDatabase();

  const dev = Deno.env.get("SC_MODE") === "dev";
  const [styles, client] = await Promise.all([buildStyles(), buildClient()]);

  const { router, updateConfig } = createRouter({ styles, client, dev });
  updateRouterConfig = updateConfig;

  const scKey = Deno.env.get("SC_KEY");
  const keys = scKey ? [scKey] : undefined;
  const app = new Application<AppState>({ keys });

  if (dev) {
    sendReloadMessage = addLiveReloadMiddleware(app);
  }

  app.use(async (ctx, next) => {
    log.info(`${ctx.request.method} ${ctx.request.url.pathname}`);
    await next();
  });

  addSessionMiddleware(app);

  app.use(router.routes());
  app.use(router.allowedMethods());

  app.use(async (ctx) => {
    await ctx.send({
      root: path.join(__dirname, "..", "public"),
    });
  });

  log.info(`Listening on port ${port}`);
  await Promise.allSettled([app.listen({ port }), watchStyles()]);
}
