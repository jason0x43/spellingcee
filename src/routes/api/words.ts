import type { RequestHandler } from '@sveltejs/kit';
import { errorResponse } from '$lib/request';
import type { Word } from '@prisma/client';
import { rateWord } from '$lib/db/word';
import { ratings, type Rating } from '$lib/words';

export type UpdateWordRequest = {
  word: string;
  rating: Rating;
};

export type UpdateWordResponse =
  | Word
  | {
      errors?: Record<string, string>;
    };

/**
 * Update a word's info
 */
export const put: RequestHandler<
  Record<string, string>,
  UpdateWordResponse
> = async ({ request, locals }) => {
  const user = locals.session?.user;
  if (!user) {
    return errorResponse({ user: 'No active user' });
  }

  const data: UpdateWordRequest = await request.json();

  if (typeof data.word !== 'string') {
    return errorResponse({ word: 'A word must be provided' });
  }

  if (typeof data.rating !== 'number' || !(data.rating in ratings)) {
    return errorResponse({
      word: 'Non-numeric or invalid rating'
    });
  }

  const word = await rateWord({
    word: data.word,
    rating: data.rating
  });

  if (!word) {
    return errorResponse({ word: 'Problem updating word' });
  }

  return {
    body: word
  };
};
