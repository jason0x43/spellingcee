const DEBUG = (import.meta as any).env.SNOWPACK_PUBLIC_DEBUG;
let rootLevel = Number(DEBUG) || 1;

export function createLogger(
  options: { prefix?: string; level?: number } = {}
) {
  let level = options.level ?? rootLevel;
  const prefix = options.prefix ? `[${options.prefix}]` : '';

  return {
    setLevel(lvl: number | undefined) {
      level = lvl ?? rootLevel;
    },

    error(...args: any) {
      if (level >= 1) {
        let processedArgs = args.map((arg: unknown) => {
          if (isError(arg)) {
            return formatError(arg);
          }
          return arg;
        });
        console.error(prefix, ...processedArgs);
      }
    },

    warn(...args: any) {
      if (level >= 2) {
        console.warn(prefix, ...args);
      }
    },

    log(...args: any) {
      if (level >= 3) {
        console.log(prefix, ...args);
      }
    },

    debug(...args: any) {
      if (level >= 4) {
        console.debug(prefix, ...args);
      }
    },

    trace(...args: any) {
      if (level >= 5) {
        console.trace(prefix, ...args);
      }
    },
  };
}

export function setLevel(lvl: number) {
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

function isError(value: any): value is Error {
  return (
    value &&
    typeof value === 'object' &&
    value.name != null &&
    value.message != null
  );
}
