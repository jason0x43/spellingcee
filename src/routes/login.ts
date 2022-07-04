import type { RequestHandler } from '@sveltejs/kit';

export const get: RequestHandler = async ({ locals }) => {
  const user = locals.session?.user;
  if (user) {
    return {
      status: 302,
      redirect: '/app'
    };
  }
  return {};
};
