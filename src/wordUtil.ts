export function isPangram(word: string) {
  const chars = new Set(word);
  return chars.size === 7;
}

export function findPangram(words: string[], end: number): string {
  const index = Math.floor(Math.random() * end);
  let pangram = words[0];
  for (let i = index; i < end; i++) {
    const word = words[i];
    if (isPangram(word)) {
      pangram = word;
      break;
    }
  }
  if (!pangram) {
    for (let i = 0; i < index; i++) {
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
