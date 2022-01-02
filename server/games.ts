import { random } from "../shared/util.ts";
import { isPangram, permute } from "../shared/util.ts";
import { findValidWords, wordList } from "./words.ts";
import { Game } from "../types.ts";
import { addGame, getGame as getDbGame } from "./database/games.ts";
import { getUserGames } from "./database/queries.ts";
import { Game as DbGame } from "./database/types.ts";
import { getGameWords } from "./database/game_words.ts";
import { getCurrentGameId, setCurrentGameId } from "./database/user_games.ts";

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
 * Create a new random game key
 *
 * A key is a center letter followed by 6 other letters in alphabetical order.
 * All 7 letters must be unique.
 */
export function getNewGameKey(): string {
  const maxIndex = wordList.length;
  const start = random(maxIndex);
  const pangram = findPangram(start);
  const uniqueLetters = getLetters(pangram);
  const randomizedLetters = permute(uniqueLetters).join("");
  return [
    randomizedLetters[0],
    ...randomizedLetters.slice(1).split("").sort(),
  ].join("");
}

/**
 * Mix computed game data into a game record
 */
function addGameData(game: DbGame): Game {
  const validWords = findValidWords(game.key);
  const gameWords = getGameWords(game.id);
  return {
    ...game,
    totalWords: validWords.length,
    maxScore: computeScore(validWords),
    wordsFound: gameWords.length,
    score: computeScore(gameWords.map(({ word }) => word)),
  };
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
  setCurrentGameId({ userId, gameId: game.id });
  return addGameData(game);
}

/**
 * Return a game with computed data
 */
export function getGame(gameId: number): Game {
  const game = getDbGame(gameId);
  return addGameData(game);
}

/**
 * Return a user's games with computed data
 */
export function getGames(userId: number): Game[] {
  return getUserGames(userId).map(addGameData);
}

/**
 * Return a user's current game
 */
export function getCurrentGame(userId: number): Game | undefined {
  const gameId = getCurrentGameId(userId);
  return gameId !== undefined ? addGameData(getGame(gameId)) : undefined;
}
