const storage = window.localStorage;

export function createRef<T>(key: string) {
  return {
    get(): T | undefined {
      const val = storage.getItem(key);
      if (val == null) {
        return;
      }
      return JSON.parse(val);
    },

    set(value: T) {
      storage.setItem(key, JSON.stringify(value));
    }
  };
}
