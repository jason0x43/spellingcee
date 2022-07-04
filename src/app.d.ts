/// <reference types="@sveltejs/kit" />

declare namespace App {
  interface Session {
    id?: import('$lib/db/session').Session['id'];
    user?: import('$lib/db/user').UserWithGames;
    data?: Record<string, unknown>;
  }

  interface Locals {
    session?: import('$lib/db/session').SessionWithUser;
  }

  interface Stuff {
    user?: import('@prisma/client').User;
  }

  // interface Platform {}
}
