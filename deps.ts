import yargs from "https://deno.land/x/yargs@v17.2.1-deno/deno.ts";
export { yargs };

import { Arguments } from "https://deno.land/x/yargs@v17.2.1-deno/deno-types.ts";
export type { Arguments };

type Yargs = ReturnType<typeof yargs>;
export type { Yargs };

export { log } from "./server/deps.ts";

export * as color from "https://deno.land/std@0.121.0/fmt/colors.ts";
