import { prisma } from '$lib/db';
import type { Rating } from '$lib/words';

export type RatedWord = {
  word: string;
  rating: Rating;
};

export async function rateWord({
  word,
  rating
}: {
  word: string;
  rating: Rating;
}) {
  return await prisma.word.upsert({
    where: {
      word
    },
    create: {
      word,
      rating
    },
    update: {
      rating
    }
  });
}

export async function getRatedWords(options?: {
  key?: string;
  maxRating?: Rating;
}): Promise<RatedWord[]> {
  const key = options?.key;
  const maxRating = options?.maxRating;

  const query: Parameters<typeof prisma.word.findMany>[0] = {
    select: {
      word: true,
      rating: true
    }
  };

  const where: NonNullable<typeof query.where> = {};
  query.where = where;

  if (maxRating) {
    where.rating = {
      lte: maxRating
    };
  }

  if (key) {
    const center = key[0];
    const keySet = new Set(key);

    where.word = {
      contains: center
    };

    const words = (await prisma.word.findMany(query)) as RatedWord[];

    return words.filter(({ word }) => {
      // All the characters in the word must be in the game key
      for (const char of new Set(word)) {
        if (!keySet.has(char)) {
          return false;
        }
      }
      return true;
    });
  }

  return (await prisma.word.findMany(query)) as RatedWord[];
}

export async function getWords(options?: {
  key?: string;
  maxRating?: Rating;
}): Promise<string[]> {
  const words = await getRatedWords(options);
  return words.map(({ word }) => word);
}
