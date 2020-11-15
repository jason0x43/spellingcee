import React, {
  FunctionComponent,
  MouseEventHandler,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createLogger } from '../logging';
import {
  AppDispatch,
  newGame as addNewGame,
  isLoggedIn,
  selectGame,
  selectGames,
  selectUserId,
  activateGame,
  shareActiveGame,
  removeGame,
  selectUsers,
  loadUsers,
  loadGames,
} from '../store';
import Button from './Button';
import Modal from './Modal';
import Spinner from './Spinner';
import './GameSelect.css';

const logger = createLogger({ prefix: 'GameSelect' });

type Mode = 'selecting' | 'sharing';

const GameSelect: FunctionComponent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const loggedIn = useSelector(isLoggedIn);
  const game = useSelector(selectGame);
  const games = useSelector(selectGames);
  const users = useSelector(selectUsers);
  const userId = useSelector(selectUserId);
  const [mode, setMode] = useState<Mode>();

  const handleShowGames = useCallback(() => {
    setMode('selecting');
  }, [setMode]);

  const handleHideModal = useCallback(() => {
    setMode(undefined);
  }, [setMode]);

  const handleGameSelect: MouseEventHandler = useCallback(
    async (event) => {
      logger.debug('handling select with games', games);
      const gameId = event.currentTarget.getAttribute('data-item-id');
      if (gameId && games) {
        dispatch(activateGame(games[gameId]));
      } else {
        dispatch(addNewGame());
      }
      setMode(undefined);
    },
    [dispatch, games]
  );

  const handleUserSelect: MouseEventHandler = useCallback(
    async (event) => {
      const otherUserId = event.currentTarget.getAttribute('data-item-id');
      logger.debug('Sharing with', otherUserId);
      if (userId && otherUserId) {
        dispatch(shareActiveGame(otherUserId));
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
        dispatch(removeGame(gameId));
      }
    },
    [dispatch]
  );

  const handleNewGame = useCallback(async () => {
    dispatch(addNewGame());
  }, [dispatch]);

  const handleShareGame = useCallback(async () => {
    setMode('sharing');
  }, [setMode]);

  useEffect(() => {
    if (mode === 'sharing' && !users) {
      logger.debug('Loading users');
      dispatch(loadUsers());
    } else if (mode === 'selecting' && !games) {
      logger.debug('Loading games');
      dispatch(loadGames());
    }
  }, [dispatch, games, mode, users]);

  const renderGame = useCallback(
    (gameId: string) => {
      const game = (games ?? {})[gameId];
      if (!game) {
        console.warn(`Unknown game ID ${gameId}`);
        return;
      }

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
    [games, handleGameSelect, handleRemoveGame]
  );

  const renderUser = useCallback(
    (userId: string) => {
      const user = (users ?? {})[userId];
      if (!user) {
        console.warn(`Unknown user ${userId}`);
        return;
      }

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
    },
    [handleUserSelect, users]
  );

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
        {loggedIn && (
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
};

export default GameSelect;
