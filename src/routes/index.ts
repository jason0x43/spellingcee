import type { RequestHandler } from '@sveltejs/kit';

export const get: RequestHandler = async ({ locals }) => {
  const user = locals.session?.user;
  console.log('user:', user);
  return {
    status: 302,
    headers: {
      location: user ? '/app/classify' : '/login'
    }
  };
};
