import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import { Game, Games, User } from './types';
import { normalizeGame, normalizeGames } from './gameUtils';

const storage = window.localStorage;
const localKey = 'spellingcee/games';

function getDbKey(user: User | string, gameId?: string) {
  const userId = typeof user === 'string' ? user : user.userId;
  const gameIdPath = gameId ? `/${gameId}` : '';
  return `users/${userId}/games${gameIdPath}`;
}

/**
 * Return a handle to the database
 */
function getRef(user: User | string, gameId?: string) {
  return firebase.database().ref(getDbKey(user, gameId));
}

/**
 * Load games from local storage
 */
export function localLoadGames(): Games | undefined {
  const games = storage.getItem(localKey);
  if (games == null) {
    return;
  }
  return normalizeGames(JSON.parse(games));
}

/**
 * Save games to local storage
 */
export function localSaveGames(games: Games) {
  storage.setItem(localKey, JSON.stringify(games));
}

/**
 * Load games from the database
 */
export async function remoteLoadGames(user: User): Promise<Games | undefined> {
  const ref = getRef(user);
  const snapshot = await ref.once('value');
  const games = snapshot.val();
  if (games == null) {
    return;
  }
  return normalizeGames(games);
}

/**
 * Save a game to the database
 */
export async function remoteSaveGame(user: User, game: Game): Promise<void> {
  await getRef(user, game.id).set(game);
}

/**
 * Save games to the database
 */
export async function remoteSaveGames(user: User, games: Games): Promise<void> {
  await getRef(user).set(games);
}

/**
 * A handle to an database subscription
 */
export interface Subscription {
  key: string;
  off(): void;
}

/**
 * Load a value from the database
 */
export function subscribeToGame(
  user: User | string,
  gameId: string,
  callback: (value: Game | undefined) => void
): Subscription {
  const key = getDbKey(user, gameId);
  const ref = firebase.database().ref(key);
  ref.on('value', (snapshot) => {
    const value = snapshot.val();
    if (value == null) {
      callback(undefined);
    } else {
      callback(normalizeGame(value));
    }
  });

  return {
    get key() {
      return key;
    },

    off() {
      ref.off();
    },
  };
}
