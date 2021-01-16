const DEBUG = import.meta.env.SNOWPACK_PUBLIC_DEBUG;
let rootLevel = Number(DEBUG) || 1;

export interface Logger {
  setLevel(lvl: number | undefined): void;
  error(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  log(...args: unknown[]): void;
  debug(...args: unknown[]): void;
  trace(...args: unknown[]): void;
}

export function createLogger(
  options: { prefix?: string; level?: number } = {}
): Logger {
  let level = options.level ?? rootLevel;
  const prefix = options.prefix ? `[${options.prefix}]` : '';

  return {
    setLevel(lvl: number | undefined) {
      level = lvl ?? rootLevel;
    },

    error(...args: unknown[]) {
      if (level >= 1) {
        const processedArgs = args.map((arg: unknown) => {
          if (isError(arg)) {
            return formatError(arg);
          }
          return arg;
        });
        console.error(prefix, ...processedArgs);
      }
    },

    warn(...args: unknown[]) {
      if (level >= 2) {
        console.warn(prefix, ...args);
      }
    },

    log(...args: unknown[]) {
      if (level >= 3) {
        console.log(prefix, ...args);
      }
    },

    debug(...args: unknown[]) {
      if (level >= 4) {
        console.debug(prefix, ...args);
      }
    },

    trace(...args: unknown[]) {
      if (level >= 5) {
        console.trace(prefix, ...args);
      }
    },
  };
}

export function setLevel(lvl: number): void {
  rootLevel = lvl;
}

const defaultLogger = createLogger();

export default defaultLogger;

function formatError(error: Error): string {
  const { message } = error;
  if (/PERMISSION_DENIED/.test(message)) {
    return "You don't have permission to access the database";
  }
  return message;
}

function isError(value: unknown): value is Error {
  return (
    value != null &&
    typeof value === 'object' &&
    (value as Record<string, unknown>).name != null &&
    (value as Record<string, unknown>).message != null
  );
}
