import { prisma } from '$lib/db';
import type { Session, User } from '@prisma/client';
import type { UserWithGames } from './user';

export type SessionWithUser = Session & {
  user: UserWithGames;
};

export async function createUserSession(userId: User['id']): Promise<Session> {
  return await prisma.session.create({
    data: {
      userId,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      data: JSON.stringify({})
    }
  });
}

export async function getSessionWithUser(
  id: Session['id']
): Promise<SessionWithUser | undefined> {
  if (!id) {
    return undefined;
  }

  const session = await prisma.session.findUnique({
    where: {
      id
    },
    include: {
      user: {
        include: {
          games: {
            include: {
              _count: {
                select: {
                  words: true
                }
              }
            }
          },
          sharedGames: {
            include: {
              game: {
                include: {
                  _count: {
                    select: {
                      words: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (session) {
    const u = session.user;
    const allGames = [...u.games, ...u.sharedGames.map((g) => g.game)];
    return {
      ...session,
      user: {
        ...u,
        games: allGames.map((g) => {
          const { _count, ...game } = g;
          return {
            ...game,
            numWords: _count.words
          };
        })
      }
    };
  }

  return undefined;
}
