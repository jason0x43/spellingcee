import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import { Game, Games, Profile } from './types';
import { normalizeGame, normalizeGames } from './gameUtils';

const storage = window.localStorage;
const localKey = 'spellingcee/games';

function getUserKey(user: Profile | string) {
  const userId = typeof user === 'string' ? user : user.userId;
  return `users/${userId}`;
}

function getGamesKey(user: Profile | string, gameId?: string) {
  const gameIdPath = gameId ? `/${gameId}` : '';
  return `${getUserKey(user)}/games${gameIdPath}`;
}

function getProfileKey(user: Profile | string) {
  return `${getUserKey(user)}/profile`;
}

/**
 * Return a handle to the database
 */
function getRef(key: string) {
  return firebase.database().ref(key);
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
export async function remoteLoadGames(user: Profile): Promise<Games | undefined> {
  const ref = getRef(getGamesKey(user));
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
export async function remoteSaveGame(user: Profile, game: Game): Promise<void> {
  await getRef(getGamesKey(user, game.id)).set(game);
}

/**
 * Save games to the database
 */
export async function remoteSaveGames(user: Profile, games: Games): Promise<void> {
  await getRef(getGamesKey(user)).set(games);
}

/**
 * Save the current user profile to the database
 */
export async function remoteSaveProfile(user: Profile): Promise<void> {
  await getRef(getProfileKey(user)).set(user);
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
  user: Profile | string,
  gameId: string,
  callback: (value: Game | undefined) => void
): Subscription {
  const key = getGamesKey(user, gameId);
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
