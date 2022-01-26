export {
  DB,
  type QueryParameterSet,
} from "https://deno.land/x/sqlite@v3.1.3/mod.ts";
export {
  Application,
  type Middleware,
  Router,
  send,
} from "https://deno.land/x/oak@v10.0.0/mod.ts";
export * as path from "https://deno.land/std@0.121.0/path/mod.ts";

// import to make SSR React (at least v17) happy
import "http://esm.sh/raf@3.4.1/polyfill";

import React from "https://esm.sh/react@17";
export { React };

import ReactDOMServer from "https://esm.sh/react-dom@17/server";
export { ReactDOMServer };

export * as log from "https://deno.land/std@0.121.0/log/mod.ts";
export { expandGlob } from "https://deno.land/std@0.121.0/fs/mod.ts";
export * as bcrypt from "https://deno.land/x/bcrypt@v0.2.4/mod.ts";

export const words10 =
  (await import("https://esm.sh/wordlist-english@1.2/english-words-10.json", {
    assert: {
      type: "json",
    },
  })).default;
export const words20 =
  (await import("https://esm.sh/wordlist-english@1.2/english-words-20.json", {
    assert: {
      type: "json",
    },
  })).default;
export const words35 =
  (await import("https://esm.sh/wordlist-english@1.2/english-words-35.json", {
    assert: {
      type: "json",
    },
  })).default;
export const words40 =
  (await import("https://esm.sh/wordlist-english@1.2/english-words-40.json", {
    assert: {
      type: "json",
    },
  })).default;
export const words50 =
  (await import("https://esm.sh/wordlist-english@1.2/english-words-50.json", {
    assert: {
      type: "json",
    },
  })).default;
