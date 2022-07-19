import type { RequestHandler } from '@sveltejs/kit';
import { errorResponse } from '$lib/request';
import type { Word } from '@prisma/client';
import { getRatedWords, rateWord } from '$lib/db/word';
import { ratings, type Rating } from '$lib/words';

export type GetWordsResponse =
  | string
  | {
      errors?: Record<string, string>;
    };

export const GET: RequestHandler<
  Record<string, string>,
  GetWordsResponse
> = async ({ locals, url }) => {
  const user = locals.session?.user;
  if (!user) {
    return errorResponse({ user: 'No active user' });
  }

  const maxRatingStr = url.searchParams.get('maxRating');
  const maxRating = (maxRatingStr ? Number(maxRatingStr) : undefined) as
    | 1
    | 2
    | 3
    | undefined;
  if (maxRating !== undefined && !(maxRating >= 1 && maxRating <= 3)) {
    return errorResponse({ maxRating: 'maxRating must be between 1 and 3' });
  }

  const includeStr = url.searchParams.get('include');
  let includeRating = false;
  if (includeStr) {
    const parts = includeStr.split(',');
    includeRating = parts.includes('rating');
  }

  const ratedWords = await getRatedWords({ maxRating });

  const { compare } = new Intl.Collator('en', { sensitivity: 'base' });
  const wordsStr = ratedWords
    .sort((a, b) => compare(a.word, b.word))
    .map((rw) => {
      if (includeRating) {
        return `${rw.word} ${rw.rating}`;
      }
      return rw.word;
    })
    .join('\n');

  return {
    body: wordsStr
  };
};

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
export const PUT: RequestHandler<
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
