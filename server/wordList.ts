import { wordListBase } from "./deps.ts";

let wordList: string[][] | undefined;
let blocks: number[] | undefined;

async function getList(id: string) {
  const response = await fetch(`${wordListBase}/english-words-${id}.json`);
  const list: string[] = await response.json();
  return list.filter((word) => word.length >= 4);
}

export async function getWordList(): Promise<{
  wordList: string[][];
  blocks: number[];
}> {
  wordList ??= await Promise.all([
    getList("10"),
    getList("20"),
    getList("35"),
    getList("40"),
    getList("50"),
  ]);
  blocks ??= wordList.map((list) => list.length);
  return { wordList, blocks };
}
