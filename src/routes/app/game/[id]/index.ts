import { getUserGameByGameId } from '$lib/db/game';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, locals }) => {
  const userId = locals.session?.userId;

  if (!userId) {
    return {
      status: 405,
      body: {
        error: 'Missing user'
      }
    };
  }

  const gameId = params.id as string;
  const game = await getUserGameByGameId({ userId, gameId });
  if (!game) {
    return {
      status: 302,
      redirect: '/app'
    };
  }

  return {
    body: {
      game
    }
  };
};
