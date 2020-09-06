import { newRng } from './random';
import { getDateString } from './util';
import wordlist, { blocks } from './wordlist';
import { computeScore, getLetters, findPangram, permute } from './wordUtil';
import { Game, Games } from './types';

/**
 * Return a new empty game
 */
export function createGame(key?: string): Game {
  if (!key) {
    key = getNewGameKey();
  }

  return {
    key: key,
    letters: permute(key.split('')),
    words: [],
    totalWords: 0,
    maxScore: 0,
    score: 0,
    difficulty: 0,
    lastUpdated: Date.now(),
  };
}

/**
 * Return the first game ID for a day
 */
export function getDailyGameKey(): string {
  return getNewGameKey(getDateString());
}

/**
 * Return the newest game from a set of games
 */
export function getNewestGame(games: Games): Game {
  const ids = Object.keys(games);
  if (ids.length === 0) {
    throw new Error('Must be at least one game');
  }

  let newestGameId = ids[0];
  let lastUpdated = 0;
  for (const id of ids) {
    if (games[id].lastUpdated > lastUpdated) {
      lastUpdated = games[id].lastUpdated;
      newestGameId = id;
    }
  }

  return games[newestGameId];
}

/**
 * Create a new random game ID
 */
export function getNewGameKey(rngSeed?: string): string {
  const rng = newRng(rngSeed);
  const maxIndex = blocks[0] + blocks[1] + blocks[2] + blocks[3] + blocks[4];
  const start = rng(maxIndex);
  const pangram = findPangram(wordlist, start);
  const uniqueLetters = getLetters(pangram);
  const randomizedLetters = permute(uniqueLetters, rng).join('');
  return [
    randomizedLetters[0],
    ...randomizedLetters.slice(1).split('').sort(),
  ].join('');
}

/**
 * Perform any cleanup on newly loaded game data
 */
export function normalizeGame(game: Game): Game {
  if (!game.words) {
    game = {
      ...game,
      words: [],
    };
  }
  if (game.lastPlayed && !game.lastUpdated) {
    const { lastPlayed, ...rest } = game;
    game = {
      ...rest,
      lastUpdated: lastPlayed,
    };
  }

  return game;
}

/**
 * Perform any cleanup on game data
 */
export function normalizeGames(state: Games): Games {
  let games: Games = state || {};

  for (const id in games) {
    games = {
      ...games,
      [id]: normalizeGame(games[id]),
    };

    if (!games[id].key) {
      games = {
        ...games,
        [id]: {
          ...games[id],
          key: id,
        },
      };
    }
  }

  return games;
}

function arraysAreEqual(arr1: string[], arr2: string[]) {
  return arr1.length === arr2.length && arr1.every((value, index) => value === arr2[index]);
}
