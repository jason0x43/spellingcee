import type { RequestHandler } from '@sveltejs/kit';
import { errorResponse } from '$lib/request';
import { prisma } from '$lib/db';
import type { GameWord } from '@prisma/client';
import { getWords } from '$lib/db/word';

export type AddWordRequest = {
  word: string;
};

export type AddWordResponse =
  | GameWord
  | {
      errors?: Record<string, string>;
    };

/**
 * Add a word
 */
export const post: RequestHandler<
  Record<string, string>,
  AddWordResponse
> = async ({ request, locals, params }) => {
  const user = locals.session?.user;
  if (!user) {
    return errorResponse({ user: 'No active user' });
  }

  const data: AddWordRequest = await request.json();

  if (typeof data.word !== 'string') {
    return errorResponse({ word: 'A word must be provided' });
  }

  const gameId = params.id;

  const game = await prisma.game.findUnique({
    where: {
      id: gameId
    }
  });

  if (!game) {
    return errorResponse({ gameId: 'Invalid game ID' });
  }

  const gameWords = await getWords({ key: game.key });
  const { compare } = new Intl.Collator('en', { sensitivity: 'base' });
  const foundWord = gameWords.find((word) => compare(word, data.word) === 0);

  if (!foundWord) {
    return errorResponse({ word: 'Invalid word' });
  }

  const gameWord = await prisma.gameWord.create({
    data: {
      userId: user.id,
      gameId,
      word: foundWord
    }
  });

  return {
    body: gameWord
  };
};
