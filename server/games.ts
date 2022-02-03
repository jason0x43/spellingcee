import { computeScore, random } from "../shared/util.ts";
import { isPangram, permute } from "../shared/util.ts";
import { findValidWords, wordList } from "./words.ts";
import { addGame, getGame as dbGetGame } from "./database/games.ts";
import { getUserGames } from "./database/queries.ts";
import { GameWord } from "./database/types.ts";
import {
  getGameWordCount,
  getGameWords as dbGetGameWords,
} from "./database/game_words.ts";
import {
  addUserGame,
  getCurrentGameId,
  setCurrentGameId,
} from "./database/user_games.ts";
import { Game } from "../types.ts";

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
 * Create a new game for a user
 */
export function createGame({ userId, key }: {
  userId: number;
  key?: string;
}): Game {
  key ??= getNewGameKey();
  const validWords = findValidWords(key);
  const maxScore = computeScore(validWords);
  const game = addGame({ userId, key, maxWords: validWords.length, maxScore });
  addUserGame({ userId, gameId: game.id });
  setCurrentGameId({ userId, gameId: game.id });
  return {
    ...game,
    numWords: 0,
  };
}

/**
 * Return a game with computed data
 */
export function getGame(gameId: number): Game {
  return {
    ...dbGetGame(gameId),
    numWords: getGameWordCount(gameId),
  };
}

/**
 * Return a user's games with computed data
 */
export function getGames(userId: number): Game[] {
  return getUserGames(userId).map((game) => ({
    ...game,
    numWords: getGameWordCount(game.id),
  }));
}

/**
 * Return a user's current game
 */
export function getCurrentGame(userId: number): Game | undefined {
  const gameId = getCurrentGameId(userId);
  return gameId !== undefined ? getGame(gameId) : undefined;
}

/**
 * Return game words as a word->GameWord mapping
 */
export function getGameWords(gameId: number): Record<string, GameWord> {
  const words = dbGetGameWords(gameId);
  return words.reduce((gameWords, word) => {
    gameWords[word.word] = word;
    return gameWords;
  }, {} as Record<string, GameWord>);
}
