import random, { newRng } from "./random.ts";
import { blocks, wordList } from "./wordList.ts";
import { Game } from "../types.ts";
import { addGame } from "./database/games.ts";

export function isPangram(word: string): boolean {
  return new Set(word).size === 7;
}

export function findPangram(words: string[], startIndex: number): string {
  let pangram = words[0];
  for (let i = startIndex; i < words.length; i++) {
    const word = words[i];
    if (isPangram(word)) {
      pangram = word;
      break;
    }
  }
  if (!pangram) {
    for (let i = 0; i < startIndex; i++) {
      const word = words[i];
      if (isPangram(word)) {
        pangram = word;
        break;
      }
    }
  }
  return pangram;
}

export function getLetters(word: string | string[]): string[] {
  return Array.from(new Set(word));
}

export function permute(letters: string[], rng = random): string[] {
  if (letters.length === 1) {
    return letters;
  }
  const index = rng(letters.length);
  const remaining = [...letters.slice(0, index), ...letters.slice(index + 1)];
  return [letters[index], ...permute(remaining, rng)];
}

/**
 * Create a new random game ID
 */
export function getNewGameKey(rngSeed?: string): string {
  const rng = newRng(rngSeed);
  const maxIndex = blocks[0] + blocks[1] + blocks[2] + blocks[3] + blocks[4];
  const start = rng(maxIndex);
  const pangram = findPangram(wordList, start);
  const uniqueLetters = getLetters(pangram);
  const randomizedLetters = permute(uniqueLetters, rng).join("");
  return [
    randomizedLetters[0],
    ...randomizedLetters.slice(1).split("").sort(),
  ].join("");
}

export async function createGame(
  key?: string,
): Promise<Game> {
  key ??= await getNewGameKey();
  const game = addGame({ key });
  return game;
}
