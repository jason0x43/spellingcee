import { AppProps } from "./App.tsx";

declare global {
  // deno-lint-ignore no-var
  var __PRELOADED_STATE__: AppProps | undefined;
}
