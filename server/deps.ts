// import to make SSR React (at least v17) happy
import "./raf.ts";

export { DB, type QueryParameterSet } from "sqlite";
export { Application, type Middleware, Router, send } from "oak";
export * as path from "std/path/mod.ts";

export { default as ReactDOMServer } from "react-dom-server";
export * as log from "std/log/mod.ts";
export { expandGlob } from "std/fs/mod.ts";
export * as bcrypt from "bcrypt";

export const words10 = (await import("wordlist/english-words-10.json", {
  assert: {
    type: "json",
  },
})).default;
export const words20 = (await import("wordlist/english-words-20.json", {
  assert: {
    type: "json",
  },
})).default;
export const words35 = (await import("wordlist/english-words-35.json", {
  assert: {
    type: "json",
  },
})).default;
export const words40 = (await import("wordlist/english-words-40.json", {
  assert: {
    type: "json",
  },
})).default;
export const words50 = (await import("wordlist/english-words-50.json", {
  assert: {
    type: "json",
  },
})).default;
