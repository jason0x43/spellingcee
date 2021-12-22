import { randomBelow } from "../shared/deps.ts";
import { isPangram, permute } from "../shared/util.ts";
import { findValidWords, wordList } from "./words.ts";
import { Game } from "../types.ts";
import { addGame, getGame as getDbGame } from "./database/games.ts";
import { getUser, updateUserMeta } from "./database/users.ts";

/**
 * Compute the score of a set of words
 */
function computeScore(words: string[]): number {
  return words.reduce(
    (sum, word) =>
      word.length === 4
        ? sum + 1
        : isPangram(word)
        ? sum + 2 * word.length
        : sum +
          word.length,
    0,
  );
}

/**
 * Linearly search the word list for a pangram, starting from a given position.
 */
function findPangram(startIndex: number): string {
  for (let i = 0; i < wordList.length; i++) {
    const index = (i + startIndex) % wordList.length;
    const word = wordList[index];
    if (isPangram(word)) {
      return word;
    }
  }
  return "";
}

/**
 * Return the set of unique letters in a word.
 */
function getLetters(word: string | string[]): string[] {
  return Array.from(new Set(word));
}

/**
 * Return metadata for a game
 */
function getGameData(key: string) {
  const words = findValidWords(key);
  return {
    totalWords: words.length,
    maxScore: computeScore(words),
  };
}

/**
 * Create a new random game key
 *
 * A key is a center letter followed by 6 other letters in alphabetical order.
 * All 7 letters must be unique.
 */
export function getNewGameKey(): string {
  const maxIndex = wordList.length;
  const start = randomBelow(maxIndex);
  const pangram = findPangram(start);
  const uniqueLetters = getLetters(pangram);
  const randomizedLetters = permute(uniqueLetters).join("");
  return [
    randomizedLetters[0],
    ...randomizedLetters.slice(1).split("").sort(),
  ].join("");
}

/**
 * Create a new game for a user
 */
export function createGame({ userId, key }: {
  userId: number;
  key?: string;
}): Game {
  key ??= getNewGameKey();
  const game = addGame({ userId, key });
  const user = getUser(userId);
  updateUserMeta(userId, {
    ...user.meta,
    currentGame: game.id,
  });
  return {
    ...game,
    ...getGameData(key),
  };
}

/**
 * Retrieve the user game associated with a key
 */
export function getGame(gameId: number): Game {
  const game = getDbGame(gameId);
  return {
    ...game,
    ...getGameData(game.key),
  };
}
