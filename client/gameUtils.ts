import { newRng, randomString } from "./random.ts";
import { getDateString } from "./util.ts";
import wordlist, { blocks } from "./wordlist.ts";
import {
  findPangram,
  findValidWords,
  getLetters,
  isPangram,
  permute,
} from "./wordUtil.ts";
import { Game, Games } from "./types.ts";

/**
 * Compute the score of one or more words
 */
export function computeScore(words: string | string[]): number {
  const wordList = typeof words === "string" ? [words] : words;
  return wordList.reduce(
    (sum, word) =>
      word.length === 4
        ? sum + 1
        : isPangram(word)
        ? sum + 2 * word.length
        : sum + word.length,
    0,
  );
}

/**
 * Return a new empty game
 */
export function createGame({
  userId,
  key,
}: {
  userId: string | undefined;
  key?: string;
}): Game {
  const gameKey = key ?? getNewGameKey();
  const validWords = findValidWords({
    allWords: wordlist,
    pangram: gameKey,
    center: gameKey[0],
  });
  const maxScore = computeScore(validWords);

  return {
    gameId: createGameId(),
    key: gameKey,
    totalWords: validWords.length,
    wordsFound: 0,
    maxScore,
    score: 0,
    isShared: false,
    difficulty: 0,
    addedAt: Date.now(),
    addedBy: userId ?? "local",
  };
}

/**
 * Return a random game ID
 */
export function createGameId(): string {
  return randomString(16);
}

/**
 * Return the first game key for a day
 */
export function getDailyGameKey(): string {
  return getNewGameKey(getDateString());
}

/**
 * Return the newest game from a set of games
 */
export function getNewestGameId(games: Games): string {
  const ids = Object.keys(games);
  if (ids.length === 0) {
    throw new Error("Must be at least one game");
  }

  let newestGameId = ids[0];
  let addedAt = 0;
  for (const id of ids) {
    if (games[id].addedAt > addedAt) {
      addedAt = games[id].addedAt;
      newestGameId = id;
    }
  }

  return newestGameId;
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
  const randomizedLetters = permute(uniqueLetters, rng).join("");
  return [
    randomizedLetters[0],
    ...randomizedLetters.slice(1).split("").sort(),
  ].join("");
}
