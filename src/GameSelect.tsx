import React, {
  Dispatch,
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createGame } from './gameUtils';
import { createLogger } from './logging';
import { AppAction } from './state';
import { createStorage } from './storage';
import { Game, Games, Users } from './types';
import Button from './Button';
import Modal from './Modal';
import Spinner from './Spinner';
import './GameSelect.css';

const logger = createLogger({ prefix: 'GameSelect' });

export interface GameSelectProps {
  gameId: string;
  game: Game;
  games: Games | undefined;
  isLoggedIn: boolean;
  userId: string;
  users: Users | undefined;
  dispatch: Dispatch<AppAction>;
}

type Mode = 'selecting' | 'sharing';

export default function GameSelect(props: GameSelectProps) {
  const { dispatch, gameId, game, games, isLoggedIn, userId, users } = props;
  const [mode, setMode] = useState<Mode>();
  const localGames = useRef(games);

  logger.debug('Rendering with games:', games);

  const newGame = useCallback(async () => {
    const game = createGame({ userId });
    const gameId = await createStorage(userId).addGame(game);
    dispatch({ type: 'addGame', payload: { game, gameId } });
    return gameId;
  }, [dispatch, userId]);

  useEffect(() => {
    // This ref is necessary because the handleGameSelect callback isn't being
    // updated when the value of games changes
    localGames.current = games;
  }, [games]);

  const handleShowGames = useCallback(() => {
    setMode('selecting');
  }, [setMode]);

  const handleHideModal = useCallback(() => {
    setMode(undefined);
  }, [setMode]);

  const handleGameSelect: MouseEventHandler = useCallback(
    async (event) => {
      logger.debug('handling select with games', games);
      const gameId = event.currentTarget.getAttribute('data-item-id')!;
      if (gameId) {
        try {
          const game = localGames.current![gameId];
          await createStorage(userId).saveUserMeta({ gameId });
          dispatch({ type: 'setGame', payload: { gameId, game } });
        } catch (error) {
          logger.error(`Error setting game ${gameId}:`, error);
        }
      } else {
        try {
          const gameId = await newGame();
          dispatch({ type: 'setGame', payload: { gameId } });
        } catch (error) {
          logger.error('Error creating new game:', error);
        }
      }
      setMode(undefined);
    },
    [dispatch, games]
  );

  const handleUserSelect: MouseEventHandler = useCallback(
    async (event) => {
      const otherUserId = event.currentTarget.getAttribute('data-item-id')!;
      logger.debug('Sharing with', otherUserId);
      if (userId) {
        await createStorage(userId).shareGame({ otherUserId, gameId });
      }
      setMode(undefined);
    },
    [dispatch, userId]
  );

  const handleRemoveGame: MouseEventHandler = useCallback(
    async (event) => {
      // Don't let events propogate -- they'd end up being handled by the
      // containing game element, which we don't want since we just deleted the
      // game.
      event.stopPropagation();

      // Walk up the DOM from the button that fired the event, looking for a
      // node with a game ID attribute
      let node: HTMLElement | null = event.currentTarget as HTMLElement;
      while (node && !node.getAttribute('data-item-id')) {
        node = node.parentElement;
      }
      const gameId = node?.getAttribute('data-item-id');
      if (gameId) {
        await createStorage(userId).removeGame(gameId);
        dispatch({ type: 'deleteGame', payload: gameId });
      }
    },
    [dispatch, userId]
  );

  const handleNewGame = useCallback(async () => {
    const gameId = await newGame();
    dispatch({ type: 'setGame', payload: { gameId } });
  }, [dispatch]);

  const handleShareGame = useCallback(async () => {
    setMode('sharing');
  }, [setMode]);

  useEffect(() => {
    if (mode === 'sharing' && !users) {
      logger.debug('Loading users');
      let timer: ReturnType<typeof setTimeout>;
      const start = Date.now();
      (async () => {
        const users = await createStorage(userId).loadUsers();
        logger.debug('Loaded users');
        timer = setTimeout(() => {
          dispatch({ type: 'setUsers', payload: users });
        }, Math.max(0, 1000 - (Date.now() - start)));
      })();

      return () => {
        logger.debug('Unmounting sharing effect');
        clearTimeout(timer);
      };
    } else if (mode === 'selecting' && !games) {
      logger.debug('Loading users');
      let timer: ReturnType<typeof setTimeout>;
      const start = Date.now();
      (async () => {
        const games = await createStorage(userId).loadGames();
        logger.debug('Loaded games');
        timer = setTimeout(() => {
          dispatch({ type: 'setGames', payload: games });
        }, Math.max(0, 1000 - (Date.now() - start)));
      })();

      return () => {
        logger.debug('Unmounting sharing effect');
        clearTimeout(timer);
      };
    }
  }, [mode]);

  const renderGame = useCallback(
    (gameId: string) => {
      const game = games![gameId];

      return (
        <li
          className="GameSelect-item"
          key={gameId}
          data-item-id={gameId}
          onClick={handleGameSelect}
        >
          <Button
            className="GameSelect-remove"
            type="text"
            onClickCapture={handleRemoveGame}
          >
            ✕
          </Button>
          <dl className="GameSelect-info">
            <div>
              <dt>Key</dt>
              <dd>{game.key}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{new Date(game.addedAt).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt>Difficulty</dt>
              <dd>{game.difficulty}</dd>
            </div>
            <div>
              <dt>Words</dt>
              <dd>
                {game.wordsFound} / {game.totalWords}
              </dd>
            </div>
            <div>
              <dt>Score</dt>
              <dd>
                {game.score} / {game.maxScore}
              </dd>
            </div>
          </dl>
        </li>
      );
    },
    [games]
  );

  const renderUser = useCallback((userId: string) => {
    const user = users![userId];
    return (
      <li
        className="GameSelect-item"
        key={userId}
        data-item-id={userId}
        onClick={handleUserSelect}
      >
        <div className="GameSelect-id">{user.name}</div>
        <dl className="GameSelect-info">
          <div>
            <dt>ID</dt>
            <dd>{userId}</dd>
          </div>
        </dl>
      </li>
    );
  }, [users]);

  return (
    <div className="GameSelect">
      <Button className="GameSelect-id" type="link" onClick={handleShowGames}>
        {game.key}
      </Button>

      <div className="GameSelect-controls">
        <Button
          className="GameSelect-new-game"
          size="small"
          onClick={handleNewGame}
        >
          New
        </Button>
        {isLoggedIn && (
          <Button
            className="GameSelect-share"
            size="small"
            onClick={handleShareGame}
          >
            Share
          </Button>
        )}
      </div>

      {mode === 'selecting' && (
        <Modal onHide={handleHideModal}>
          {games ? (
            <ul className="GameSelect-list">
              {Object.keys(games).map(renderGame)}
            </ul>
          ) : (
            <Spinner />
          )}
        </Modal>
      )}

      {mode === 'sharing' && (
        <Modal onHide={handleHideModal}>
          {users ? (
            <ul className="GameSelect-list GameSelect-users">
              {Object.keys(users)
                .filter((uid) => uid !== userId)
                .map(renderUser)}
            </ul>
          ) : (
            <Spinner />
          )}
        </Modal>
      )}
    </div>
  );
}
