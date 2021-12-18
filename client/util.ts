export function getDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}${month}${day}`;
}

export type ClassName =
  | string
  | { [name: string]: boolean | undefined }
  | undefined;

export function classNames(...args: ClassName[]) {
  const names = new Set<string>();
  for (const arg of args) {
    if (arg) {
      if (typeof arg === "string") {
        names.add(arg);
      } else {
        for (const argName in arg) {
          if (arg[argName]) {
            names.add(argName);
          }
        }
      }
    }
  }
  return Array.from(names.values()).join(" ");
}
