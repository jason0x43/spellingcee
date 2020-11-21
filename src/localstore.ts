/**
 * Mirror the API of firebase (that we care about) for local storage
 */

import { createLogger } from './logging';
import { randomString } from './random';

export const storage = window.localStorage;

const logger = createLogger({ prefix: 'localstore' });
const baseKey = 'database';

export interface LocalSnapshot {
  val(): unknown;
}

export interface LocalRef {
  off(): void;

  on(
    event: 'value',
    callback: (snapshot: LocalSnapshot) => void
  ): (snapshot: LocalSnapshot) => void;

  once(type: 'value'): Promise<LocalSnapshot>;

  push(): Promise<LocalRef>;

  ref(key: string): LocalRef;

  remove(): void;

  set(value: unknown): Promise<void>;

  update(updates: { [key: string]: unknown }): Promise<void>;

  val(): unknown;

  key: string | null;
}

export function getRef(keyObj?: string | readonly string[]): LocalRef {
  const key: string | undefined = Array.isArray(keyObj)
    ? keyObj.join('/')
    : (keyObj as string | undefined);
  const keyParts = key ? key.split('/') : [];

  const ref: LocalRef = {
    key: key ?? null,

    off() {
      // Local subscriptions can't have listeners, so 'off' does nothing
    },

    on(_event, callback) {
      logger.debug('Subscribing to', key);
      // Call the callback with the current words value. This mirrors
      // Firebase's behavior.
      setTimeout(() => {
        callback(ref);
      });
      return callback;
    },

    async once() {
      return {
        val() {
          return ref.val();
        },
      };
    },

    async push() {
      ref.key = randomString(16);
      return ref;
    },

    ref(subkey: string) {
      if (key) {
        return getRef([key, subkey]);
      }
      return getRef(subkey);
    },

    async remove() {
      const db = loadDb();
      deepSet(db, keyParts, undefined);
      storage.setItem(baseKey, JSON.stringify(db));
    },

    async set(value) {
      const db = loadDb();
      deepSet(db, keyParts, value);
      storage.setItem(baseKey, JSON.stringify(db));
    },

    async update(updates) {
      logger.debug('Applying updates:', updates);
      for (const key in updates) {
        if (updates[key] === null) {
          ref.ref(key).remove();
        } else {
          await ref.ref(key).set(updates[key]);
        }
      }
    },

    val() {
      const db = loadDb();
      return deepGet(db, keyParts);
    },
  };

  return ref;
}

function loadDb() {
  const text = storage.getItem(baseKey);
  if (text != null) {
    return JSON.parse(text);
  }
  return {};
}

function deepGet<T = unknown>(
  obj: Record<string, unknown> | undefined,
  key: string[]
): T | undefined {
  const k = key[0];

  if (obj == null || typeof obj !== 'object') {
    return undefined;
  }

  if (key.length > 1) {
    return deepGet(obj[k] as Record<string, unknown>, key.slice(1));
  }

  return obj[k] as T;
}

function deepSet(obj: Record<string, unknown>, key: string[], value: unknown) {
  const k = key[0];

  logger.debug('Setting', key, 'to', value);

  if (key.length > 1) {
    if (obj[k] == null || typeof obj[k] !== 'object') {
      obj[k] = {};
    }
    deepSet(obj[k] as Record<string, unknown>, key.slice(1), value);
  } else {
    obj[k] = value;
  }
}
