import { createUserGame, getDailyGameKey } from '$lib/db/game';
import { getSessionWithUser } from '$lib/db/session';
import type { RequestHandler } from '@sveltejs/kit';
import * as cookie from 'cookie';

export const get: RequestHandler = async ({ request }) => {
  const cookies = cookie.parse(request.headers.get('cookie') ?? '');
  const session = await getSessionWithUser(cookies.session);

  if (!session) {
    // There's no session, so send the user back to the login page
    return {
      status: 302,
      headers: { location: '/login' }
    };
  }

  const user = session.user;

  try {
    const dailyGameKey = await getDailyGameKey();
    let userGame = user?.games.find(({ key }) => key === dailyGameKey);
    if (!userGame) {
      // The user doesn't have an instance of the daily game yet -- create one
      userGame = await createUserGame({ userId: user.id, key: dailyGameKey });
      user.games.push(userGame);
    }

    // Send the user to the daily game
    return {
      status: 302,
      headers: { location: `/app/game/${userGame.id}` }
    };
  } catch (error) {
    return {
      status: 200,
      body: {
        errors: `${error}`
      }
    };
  }
};
