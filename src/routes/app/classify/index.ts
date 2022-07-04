import { getSessionWithUser } from '$lib/db/session';
import type { RequestHandler } from '@sveltejs/kit';
import * as cookie from 'cookie';
import { wordlist } from '$lib/wordlist';
import { getRatedWords } from '$lib/db/word';

export type WordAndRating = [word: string, rating: number | undefined];

export const get: RequestHandler<
  Record<string, string>,
  { words: WordAndRating[] }
> = async ({ request }) => {
  const cookies = cookie.parse(request.headers.get('cookie') ?? '');
  const session = await getSessionWithUser(cookies.session);

  if (!session) {
    // There's no session, so send the user back to the login page
    return {
      status: 302,
      headers: { location: '/login' }
    };
  }

  const ratings = await getRatedWords();

  return {
    body: {
      words: wordlist.map((word) => {
        const rating = ratings.find(({ word: w }) => w === word);
        return [word, rating?.rating ?? undefined];
      })
    }
  };
};
