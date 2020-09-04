import { Dispatch, useCallback } from 'react';
import { createSharedState } from './sharedState';
import { Game } from '../gameUtils';
import useGames, { Games } from './useGames';

const currentGameStateManager = createSharedState<string>();
const { useSharedState } = currentGameStateManager;

export default function useCurrentGame(): [Game, Dispatch<Game | string>] {
  const [games, setGames] = useGames();
  const [gameId, setGameId] = useSharedState(getLatestGameId(games));

  const setCurrentGame = useCallback(
    (game: string | Game) => {
      if (typeof game === 'string') {
        setGameId(game);
      } else {
        const id = game.id;
        if (id !== gameId) {
          setGameId(game.id);
        }

        // If the incoming game data has been changed, update it's lastUpdated
        // date
        if (game !== games[id]) {
          setGames({
            ...games,
            [id]: {
              ...game,
              lastUpdated: Date.now(),
            },
          });
        }
      }
    },
    [gameId, setGameId, games, setGames]
  );

  const currentGame = games[gameId];

  return [currentGame, setCurrentGame];
}

/**
 * Return the ID of the game with the most recent lastUpdated time
 */
function getLatestGameId(games: Games) {
  let lastUpdated = 0;
  let latestGame: string = '';

  for (const gameId of Object.keys(games)) {
    if (games[gameId].lastUpdated > lastUpdated) {
      lastUpdated = games[gameId].lastUpdated;
      latestGame = gameId;
    }
  }

  return latestGame;
}
