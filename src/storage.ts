import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import { Game, Games, Profile } from './types';
import { normalizeGame, normalizeGames } from './gameUtils';
import { createLogger } from './logging';

const logger = createLogger({ prefix: 'storage' });
const storage = window.localStorage;

/**
 * A handle to an database subscription
 */
export interface Subscription {
  key: string;
  off(): void;
}

/**
 * Load games from local storage
 */
export function loadLocalGames(
  user?: Profile | string | null
): Games | undefined {
  const games = storage.getItem(getLocalGamesKey(user));
  logger.log('Loaded local games for', user);
  if (games == null) {
    return;
  }
  return normalizeGames(JSON.parse(games));
}

/**
 * Load user profiles from the database
 */
export function loadUsers() {
  logger.debug('loading remote users');
  const ref = getRef('users');
  ref.orderByKey().on('child_added', (snapshot) => {
    logger.debug('got user:', snapshot.val());
  });
}

/**
 * Load games from the database
 */
export async function loadRemoteGames(
  user: Profile
): Promise<Games | undefined> {
  const ref = getRef(getGamesKey(user));
  const snapshot = await ref.once('value');
  const games = snapshot.val();
  if (games == null) {
    return;
  }
  return normalizeGames(games);
}

/**
 * Save games to local storage
 */
export function saveLocalGames(games: Games, user?: Profile | null) {
  storage.setItem(getLocalGamesKey(user), JSON.stringify(games));
}

/**
 * Save the current user profile to the database
 */
export async function saveProfile(user: Profile): Promise<void> {
  const profileData = {
    userId: user.userId,
    name: user.name,
  };
  await getRef(getProfileKey(user)).set(profileData);
}

/**
 * Save a game to the database
 */
export async function saveRemoteGame(user: Profile, game: Game): Promise<void> {
  await getRef(getGamesKey(user, game.id)).set(game);
}

/**
 * Save games to the database
 */
export async function saveRemoteGames(
  user: Profile,
  games: Games
): Promise<void> {
  await getRef(getGamesKey(user)).set(games);
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

function getLocalGamesKey(user: Profile | string | undefined | null) {
  let userId = 'local';
  if (user != null) {
    userId = typeof user === 'string' ? user : user.userId;
  }
  return `spellingcee/${userId}/games`;
}

function getGamesKey(user: Profile | string, gameId?: string) {
  const userId = typeof user === 'string' ? user : user.userId;
  const gameIdPath = gameId ? `/${gameId}` : '';
  return `user_games/${userId}${gameIdPath}`;
}

function getProfileKey(user: Profile | string) {
  const userId = typeof user === 'string' ? user : user.userId;
  return `users/${userId}`;
}

/**
 * Return a handle to the database
 */
function getRef(key: string) {
  return firebase.database().ref(key);
}
