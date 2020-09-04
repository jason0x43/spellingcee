import { Dispatch, useCallback, useEffect } from 'react';
import { subscribe, save, Subscription } from '../firebase';
import { createRef } from '../storage';
import { Game, createGame, getDailyGameId, normalizeGame } from '../gameUtils';
import { createSharedState } from './sharedState';
import useUser, { UserState } from './useUser';

export interface Games {
  [id: string]: Game;
}

const storeRef = createRef<Games>('spellingcee/games');
const gamesStateManager = createSharedState<Games>(init());
const { useSharedState } = gamesStateManager;

let watchCount = 0;
let subscription: Subscription | undefined;

/**
 * Shared game state
 *
 * @returns array the game state, the default setter, and a setter that only
 * updates the local state
 */
export default function useGames(): [Games, Dispatch<Games>, Dispatch<Games>] {
  const [user] = useUser();
  const [games, setGames] = useSharedState();

  const setAllGames = useCallback(
    (games: Games) => {
      setGames(games);
      storeRef.set(games);
      if (user) {
        save(getDbKey(user), games);
      }
    },
    [games, setGames]
  );

  const setLocalGames = useCallback(
    (games: Games) => {
      setGames(games);
      storeRef.set(games);
    },
    [games, setGames]
  );

  useEffect(() => {
    watchCount++;
    watchGames(user, setLocalGames, setAllGames);

    return () => {
      watchCount--;
      unwatch();
    }
  }, [user, setLocalGames, setAllGames]);


  return [games, setAllGames, setLocalGames];
}

/**
 * Return the firebase path to games
 */
function getDbKey(user: UserState, gameId?: string): string {
  return `users/${user.userId}/games${gameId ? '/' + gameId : ''}`;
}
/**
 * Initialize the games state
 *
 * Load locally stored games. If there are no games, create the daily game for
 * the current date.
 */
function init(): Games {
  const games = storeRef.get();
  if (games) {
    return normalizeGames(games);
  }

  const dailyGame = getDailyGameId();
  return {
    [dailyGame]: createGame(dailyGame),
  };
}

/**
 * Perform any cleanup on newly loaded game data
 */
function normalizeGames(state: Games): Games {
  let games: Games = state || {};

  for (const gameId in games) {
    games = {
      ...games,
      [gameId]: normalizeGame(games[gameId])
    };

    if (!games[gameId].id) {
      games = {
        ...games,
        [gameId]: {
          ...games[gameId],
          id: gameId,
        },
      };
    }
  }

  return games;
}

/**
 * Watch the database for game updates
 *
 * TODO: Is this necessary? We probably only need to subscribe to updates for
 * shared games. Otherwise, we just need to update once from the database when
 * initializing, and store new updates.
 */
function watchGames(
  user: UserState | null | undefined,
  setLocalGamesState: Dispatch<Games>,
  setAllGamesState: Dispatch<Games>
): void {
  if (!user) {
    unwatch();
    return;
  }

  const storeKey = user ? `users/${user.userId}/games` : '';

  if (!user || (subscription?.key === storeKey)) {
    // Not logged in or already subscribed
    return;
  }

  if (subscription) {
    unwatch();
  }

  subscription = subscribe<Games>(storeKey, (rawState) => {
    if (rawState) {
      const remoteState = normalizeGames(rawState);
      const localState = gamesStateManager.current;
      const allIds = Array.from(
        new Set([...Object.keys(remoteState), ...Object.keys(localState)])
      );
      let mergedState = remoteState;
      for (const gameId of allIds) {
        if (!mergedState[gameId]) {
          mergedState = {
            ...mergedState,
            [gameId]: localState[gameId],
          };
        } else {
          // Keep the game with the most words, regardless of the lastUpdated
          // timestamp. This will prevent a newly created daily game from
          // overwriting a partially-completed daily game from the database.
          const localGame = localState[gameId];
          const remoteGame = remoteState[gameId];
          if (localGame && localGame.lastUpdated !== remoteGame.lastUpdated) {
            const keepGame =
              localGame.words.length > remoteGame.words.length
                ? localGame
                : remoteGame;
            mergedState = {
              ...mergedState,
              [gameId]: keepGame,
            };
          }
        }
      }

      if (mergedState !== remoteState) {
        setAllGamesState(mergedState);
      } else {
        setLocalGamesState(mergedState);
      }
    }
  });
}

/**
 * Stop watching the database
 */
function unwatch() {
  if (watchCount <= 0) {
    if (subscription) {
      subscription.off();
      subscription = undefined;
    }
    watchCount = 0;
  }
}
