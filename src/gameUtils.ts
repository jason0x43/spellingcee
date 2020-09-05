import { newRng } from './random';
import { getDateString } from './util';
import wordlist, { blocks } from './wordlist';
import { computeScore, getLetters, findPangram, permute } from './wordUtil';
import { Game, Games } from './types';

/**
 * Return a new empty game
 */
export function createGame(gameId?: string): Game {
  if (!gameId) {
    gameId = getNewGameId();
  }

  return {
    id: gameId,
    letters: permute(gameId.split('')),
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
export function getDailyGameId(): string {
  return getNewGameId(getDateString());
}

/**
 * Create a new random game ID
 */
export function getNewGameId(rngSeed?: string): string {
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

  for (const gameId in games) {
    games = {
      ...games,
      [gameId]: normalizeGame(games[gameId]),
    };

    if (!games[gameId].id) {
      games = {
        ...games,
        [gameId]: {
          ...games[gameId],
          id: gameId,
        },
      };
    }
  }

  return games;
}

function arraysAreEqual(arr1: string[], arr2: string[]) {
  return arr1.length === arr2.length && arr1.every((value, index) => value === arr2[index]);
}
