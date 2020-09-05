const DEBUG = (import.meta as any).env.SNOWPACK_PUBLIC_DEBUG;
let level = Number(DEBUG) || 1;

export function setLevel(lvl: number) {
  level = lvl;
}

export function error(...args: any) {
  if (level >= 1) {
    console.error(...args);
  }
}

export function warn(...args: any) {
  if (level >= 2) {
    console.warn(...args);
  }
}

export function log(...args: any) {
  if (level >= 3) {
    console.log(...args);
  }
}

export function debug(...args: any) {
  if (level >= 4) {
    console.debug(...args);
  }
}

export function trace(...args: any) {
  if (level >= 5) {
    console.trace(...args);
  }
}
