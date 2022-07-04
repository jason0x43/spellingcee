import { prisma } from '$lib/db';
import type { Game, Password, User } from '@prisma/client';
import bcrypt from 'bcryptjs';

export type GameWithStats = Game & {
  numWords: number;
};

export type UserWithGames = User & {
  games: GameWithStats[];
  password?: never;
};

export type UserHandle = Pick<User, 'username' | 'id'>;

export async function verifyLogin({
  username,
  password
}: {
  username: User['username'];
  password: Password['hash'];
}): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      password: true
    }
  });

  if (!user || !user.password) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password.hash);

  if (!isValid) {
    return null;
  }

  const { password: _password, ...userWithoutPassword } = user;

  return userWithoutPassword;
}

export async function getUserById(
  userId: User['id']
): Promise<UserWithGames | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
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
  });

  if (u) {
    const allGames = [...u.games, ...u.sharedGames.map((g) => g.game)];
    return {
      ...u,
      games: allGames.map((g) => {
        const { _count, ...game } = g;
        return {
          ...game,
          numWords: _count.words
        };
      })
    };
  }

  return null;
}
