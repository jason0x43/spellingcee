import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.session?.user;
  return {
    status: 302,
    headers: {
      location: user ? '/app/classify' : '/login'
    }
  };
};
