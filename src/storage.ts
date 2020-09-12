import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import { getRef as getLocalRef, storage } from './localstore';
import { Game, Games, Subscription, User, Users, Word, Words } from './types';
import { createLogger } from './logging';
import { AppState } from './state';

const logger = createLogger({ prefix: 'storage' });
const localUser = 'local';

interface DatabaseSchema {
  users: {
    [userId: string]: {
      name: string;
      email: string;
    };
  };

  user_data: {
    [userId: string]: {
      meta: {
        // Current game ID
        gameId: string;
      };
      games: {
        // gameId -> creator ID
        [gameId: string]: string;
      };
    };
  };

  game_data: {
    [gameId: string]: {
      meta: {
        key: string;
        addedAt: number;
        addedBy: string;
        difficulty: number;
        maxScore: number;
        totalWords: number;
      };

      stats: {
        score: number;
        wordsFound: number;
      };

      users: {
        [userId: string]: 'creator' | 'other';
      };
    };
  };

  game_words: {
    [gameId: string]: {
      [word: string]: {
        addedAt: number;
        addedBy: string;
      };
    };
  };
}

export type UserGames = DatabaseSchema['user_data'][string]['games'];
export type UserMeta = DatabaseSchema['user_data'][string]['meta'];
export type UserId = string;
export type GameId = string;

export interface WordsCallback {
  (value: Words): void;
}

export function createStorage(userId: string = localUser) {
  const getRef = userId === 'local' ? getLocalRef : getFirebaseRef;

  const storage = {
    /**
     * Add a new game to the database
     */
    async addGame(game: Game): Promise<string> {
      const userGamesKey = getUserGamesKey({ userId });
      const ref = await getRef(userGamesKey).push();
      const gameId = ref.key;
      logger.debug('Created new game key for', userId, '-', gameId);
      if (!gameId) {
        throw new Error('Unable to create new game ID');
      }

      await getRef().update({
        // Make this user the creator of the game
        ...getUpdater(getGameUserKey({ gameId, userId }))('creator'),
        // Add the game to the user's game list
        ...getUpdater(getUserGameKey({ userId, gameId }))(userId),
        // Set the game ID as the user's active game
        ...getUpdater(getUserMetaKey({ userId }))({ gameId }),
        // Add the game to the games list
        ...getUpdater(getGameMetaKey({ gameId }))(game),
      });

      logger.debug('Added game', gameId);
      return gameId;
    },

    /**
     * Add a new word to a game
     */
    async addWord(gameId: string, word: string): Promise<void> {
      const wordKey = getGameWordKey({ gameId, word });
      const wordMeta: Word = {
        addedBy: userId,
        addedAt: Date.now(),
      };
      logger.debug('Adding word', word, 'at', wordKey);
      await getRef(wordKey).set(wordMeta);
    },

    /**
     * Load a game from the database
     */
    async loadGame(gameId: string): Promise<Game> {
      logger.debug('Loading game', gameId);
      const ref = getRef(getGameMetaKey({ gameId }));
      const snapshot = await ref.once('value');
      const game = snapshot.val() as Game;
      if (!game) {
        throw new Error(`Game ${gameId} does not exist`);
      }
      return game;
    },

    /**
     * Load games from the database
     */
    async loadGames(): Promise<Games | undefined> {
      logger.debug('Loading games');
      const ref = getRef(getUserGamesKey({ userId }));
      const snapshot = await ref.once('value');
      const userGames = snapshot.val() as UserGames | undefined;
      if (userGames) {
        const gameIds = Object.keys(userGames);
        const games = await Promise.all(gameIds.map(storage.loadGame));
        const gamesObj: Games = {};
        for (let i = 0; i < games.length; i++) {
          gamesObj[gameIds[i]] = games[i] as Game;
        }
        return gamesObj;
      }
      return;
    },

    /**
     * Load private user data from the database
     */
    async loadUserMeta(): Promise<UserMeta | undefined> {
      logger.debug('Loading user metadata');
      const ref = getRef(getUserMetaKey({ userId }));
      const snapshot = await ref.once('value');
      return snapshot.val() as UserMeta | undefined;
    },

    /**
     * Load user profiles from the database
     */
    async loadUsers(): Promise<Users | undefined> {
      logger.debug('Loading users');
      const ref = getRef(getUsersKey());
      const snapshot = await ref.once('value');
      return snapshot.val() as Users | undefined;
    },

    /**
     * Load game words from the database
     */
    async loadWords(gameId: string): Promise<Words | undefined> {
      logger.debug('Loading words');
      const ref = getRef(getGameWordsKey({ gameId }));
      const snapshot = await ref.once('value');
      return snapshot.val() as Words | undefined;
    },

    /**
     * Save a shared game to the database
     */
    async removeGame(gameId: string): Promise<void> {
      const ref = getRef();
      await ref.update({
        ...getUpdater(getUserGameKey({ userId, gameId }))(null),
        ...getUpdater(getGameUserKey({ gameId, userId }))(null),
      });
    },

    /**
     * Save user data to the database
     */
    async saveUserMeta(data: UserMeta): Promise<void> {
      const key = getUserMetaKey({ userId });
      logger.debug('Saving user data to', key);
      await getRef(key).set(data);
    },

    /**
     * Save the current user profile to the database
     */
    async saveUserProfile(user: User): Promise<void> {
      const profileData = {
        userId,
        name: user.name,
      };
      await getRef(getUserKey({ userId })).set(profileData);
    },

    /**
     * Share a game with another user
     */
    async shareGame({
      gameId,
      otherUserId,
    }: {
      gameId: string;
      otherUserId: string;
    }): Promise<void> {
      const updates = {
        // Add the other user to the game's user list
        ...getUpdater(getGameUserKey({ gameId, userId: otherUserId }))('other'),
        // Add the game to the other user's game list
        ...getUpdater(getUserGameKey({ userId: otherUserId, gameId }))(userId),
      };
      logger.debug('Sharing', gameId, 'with', otherUserId, '-', updates);
      await getRef().update(updates);
    },

    /**
     * Subscribe to updates to a game's words list
     */
    subscribeToWords(gameId: string, callback: WordsCallback): Subscription {
      logger.debug('Subscribing to words for', gameId);
      const key = getGameWordsKey({ gameId });
      return storage.subscribeToKey<Words>(key, (words) => {
        callback(words);
      });
    },

    /**
     * Subscribe to updates for a particular key
     *
     * The subscription
     */
    subscribeToKey<T>(
      key: string | readonly string[],
      callback: (value: T) => void
    ): Subscription {
      const keyStr: string = Array.isArray(key)
        ? key.join('/')
        : (key as string);
      const ref = getRef(keyStr);
      logger.debug('Subscribing to key', keyStr);

      const valuePromise = new Promise<T>((resolve) => {
        let resolver = (val: T) => {
          resolve(val);
          resolver = () => {};
        };

        ref.on('value', (snapshot) => {
          logger.debug('Got value for', key);
          const value = snapshot.val() as T;
          callback(value);
          resolver(value);
        });
      });

      return {
        get key() {
          return keyStr;
        },

        off() {
          ref.off();
        },

        initialValue: valuePromise,
      };
    },

    /**
     * Save a shared game to the database
     */
    async unshareGame(gameId: string, otherUserId: string): Promise<void> {
      await getRef(getGameUserKey({ gameId, userId: otherUserId })).remove();
    },
  };

  return storage;
}

/**
 * Load games from local storage
 */
export function loadLocalState(
  userId: string = localUser
): AppState | undefined {
  const stateData = storage.getItem(getLocalStateKey(userId));
  logger.log('Loaded local state for', userId, '-', stateData);
  if (stateData == null) {
    return;
  }
  return JSON.parse(stateData);
}

/**
 * Save games to local storage
 */
export function saveLocalState(userId: string, state: AppState) {
  storage.setItem(getLocalStateKey(userId), JSON.stringify(state));
}

/**
 * A localStorage key for state data
 */
function getLocalStateKey(userId: string) {
  return `spellingcee/${userId}`;
}

/**
 * A key to a user's list of games
 */
function getUserGamesKey({ userId }: { userId: string }) {
  return ['user_data', userId, 'games'] as const;
}

/**
 * A key metadata about a game
 */
function getGameMetaKey({ gameId }: { gameId: string }) {
  return ['game_data', gameId, 'meta'] as const;
}

/**
 * A key to a user that can participate in a game
 */
function getGameUserKey({
  gameId,
  userId,
}: {
  gameId: string;
  userId: string;
}) {
  return ['game_data', gameId, 'users', userId] as const;
}

/**
 * A key to a specific word in a game
 */
function getGameWordKey({ gameId, word }: { gameId: string; word: string }) {
  return ['game_words', gameId, word] as const;
}

/**
 * A key to the list of words added by users in a game
 */
function getGameWordsKey({ gameId }: { gameId: string }) {
  return ['game_words', gameId] as const;
}

/**
 * A key to a specific game a user is participating in
 */
function getUserGameKey({
  userId,
  gameId,
}: {
  userId: string;
  gameId: string;
}) {
  return ['user_data', userId, 'games', gameId] as const;
}

/**
 * A key to a specific user profile
 */
function getUserKey({ userId }: { userId: string }) {
  return ['users', userId] as const;
}

/**
 * A key to the list of user profiles
 */
function getUserMetaKey({ userId }: { userId: string }) {
  return ['user_data', userId, 'meta'] as const;
}

/**
 * A key to the list of user profiles
 */
function getUsersKey() {
  return ['users'] as const;
}

/**
 * A function that returns an updater object
 */
interface Updater<T> {
  (value: T): { [key: string]: T };
}

/**
 * A function that returns an updater object for calls to ref.update
 */
function getUpdater<
  A extends keyof DatabaseSchema,
  V extends DatabaseSchema[A] | null
>(key: readonly [A]): Updater<V>;
function getUpdater<
  A extends keyof DatabaseSchema,
  B extends keyof DatabaseSchema[A],
  V extends DatabaseSchema[A][B] | null
>(key: readonly [A, B]): Updater<V>;
function getUpdater<
  A extends keyof DatabaseSchema,
  B extends keyof DatabaseSchema[A],
  C extends keyof DatabaseSchema[A][B],
  V extends DatabaseSchema[A][B][C] | null
>(key: readonly [A, B, C]): Updater<V>;
function getUpdater<
  A extends keyof DatabaseSchema,
  B extends keyof DatabaseSchema[A],
  C extends keyof DatabaseSchema[A][B],
  D extends keyof DatabaseSchema[A][B][C],
  V extends DatabaseSchema[A][B][C][D] | null
>(key: readonly [A, B, C, D]): Updater<V>;
function getUpdater(key: readonly string[]): Updater<unknown> {
  return (value: unknown) => ({ [key.join('/')]: value });
}

/**
 * Return a handle to the database
 */
function getFirebaseRef(key?: string | readonly string[]) {
  const keyStr: string | undefined = Array.isArray(key)
    ? key.join('/')
    : (key as string | undefined);
  return firebase.database().ref(keyStr);
}
