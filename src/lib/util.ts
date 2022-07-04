/**
 * Permute the values in an array
 */
export function permute<T>(values: T[]): T[] {
  const newValues: T[] = [];
  const oldValues = values.slice();
  while (oldValues.length > 0) {
    const index = random(oldValues.length);
    newValues.push(oldValues.splice(index, 1)[0]);
  }
  return newValues;
}

/**
 * Return an integer in [0, max)
 */
export function random(max: number) {
  return Math.floor(Math.random() * max);
}
