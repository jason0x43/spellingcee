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

export async function getRatedWords(): Promise<RatedWord[]> {
  return (await prisma.word.findMany({
    select: {
      word: true,
      rating: true
    }
  })) as RatedWord[];
}
