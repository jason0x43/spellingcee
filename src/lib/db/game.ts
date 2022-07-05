import { prisma } from '$lib/db';
import { permute } from '$lib/util';
import { getRandomPangram, getValidWords } from '$lib/wordlist';
import { computeScore, ratingNames, type Rating } from '$lib/words';
import type { Game, GameWord, User } from '@prisma/client';
import type { GameWithStats } from './user';

export type GameWithWords = Game & {
  words: GameWord[];
  maxScore: number;
  maxWords: number;
};

export async function getUserGameByGameId({
  userId,
  gameId,
  maxRating = 2
}: {
  userId: User['id'];
  gameId: Game['id'];
  maxRating?: Rating;
}): Promise<GameWithWords | null> {
  const game = await prisma.game.findUnique({
    where: {
      id: gameId
    },
    include: {
      words: true,
      otherUsers: true
    }
  });

  if (
    game?.userId !== userId &&
    !game?.otherUsers.find((u) => u.userId === userId)
  ) {
    return null;
  }

  const validWords = getValidWords(game.key);

  const ratedWords = await prisma.word.findMany({
    where: {
      word: {
        in: validWords
      }
    }
  });

  const reallyValidWords = validWords.filter((word) => {
    const info = ratedWords.find((info) => info.word === word);
    return info && info.rating <= maxRating;
  });

  return {
    ...game,
    maxWords: reallyValidWords.length,
    maxScore: computeScore(reallyValidWords)
  };
}

export async function createUserGame({
  userId,
  key
}: {
  userId: User['id'];
  key: Game['key'];
}): Promise<GameWithStats> {
  const game = await prisma.game.create({
    data: {
      userId,
      key
    }
  });
  return {
    ...game,
    numWords: 0
  };
}

export async function getDailyGameKey(maxRating = ratingNames.medium) {
  const today = new Date();
  const year = `${today.getFullYear()}`;
  const month = `${today.getMonth() + 1}`.padStart(2, '0');
  const day = `${today.getDate()}`.padStart(2, '0');
  const date = `${year}-${month}-${day}`;
  let dailyGame = await prisma.dailyGame.findUnique({
    where: {
      date
    }
  });

  // Not the most elegant solution ever, but it will be fine for small numbers
  // of players
  while (!dailyGame) {
    const validWords = (
      await prisma.word.findMany({
        where: {
          rating: {
            lte: maxRating
          }
        },
        select: {
          word: true
        }
      })
    ).map(({ word }) => word);

    if (validWords.length === 0) {
      throw new Error('No valid words');
    }

    const pangram = getRandomPangram(validWords);
    if (!pangram) {
      throw new Error('Unable to find pangram');
    }

    const uniqueLetters = Array.from(new Set(pangram));
    const randomizedLetters = permute(uniqueLetters).join('');
    const key = [
      randomizedLetters[0],
      ...randomizedLetters.slice(1).split('').sort()
    ].join('');

    const dg = await prisma.dailyGame.findUnique({
      where: {
        key
      }
    });

    if (!dg) {
      dailyGame = await prisma.dailyGame.create({
        data: {
          key,
          date
        }
      });
    }
  }

  return dailyGame.key;
}
