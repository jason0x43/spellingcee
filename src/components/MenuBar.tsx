import React, {
  FunctionComponent,
  MouseEventHandler,
  useCallback,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createLogger } from '../logging';
import {
  activateGame,
  AppDispatch,
  isLoggedIn,
  loadGames,
  loadUsers,
  newGame,
  removeGame,
  selectGame,
  selectGames,
  selectUser,
  selectUserId,
  selectUsers,
  shareActiveGame,
  signIn,
  signOut,
} from '../store';
import Button from './Button';
import Modal from './Modal';
import Spinner from './Spinner';
import './MenuBar.css';

type Mode = 'selecting' | 'sharing';

const logger = createLogger({ prefix: 'MenuBar' });

const MenuBar: FunctionComponent = () => {
  const [mode, setMode] = useState<Mode>();
  const dispatch = useDispatch<AppDispatch>();
  const games = useSelector(selectGames);
  const loggedIn = useSelector(isLoggedIn);
  const user = useSelector(selectUser);
  const users = useSelector(selectUsers);
  const userId = useSelector(selectUserId);
  const { gameId: activeGameId } = useSelector(selectGame);
  console.log('activeGameId: ' + activeGameId);

  const handleSelectGame: MouseEventHandler = useCallback(
    async (event) => {
      const gameId = event.currentTarget.getAttribute('data-item-id');
      logger.debug(`selecting ${gameId} from games`, games);
      if (gameId && games) {
        dispatch(activateGame(games[gameId]));
      } else {
        dispatch(newGame());
      }
      setMode(undefined);
    },
    [dispatch, games]
  );

  const handleHideModal = useCallback(() => {
    setMode(undefined);
  }, [setMode]);

  const handleNewGame = useCallback(async () => {
    dispatch(newGame());
  }, [dispatch]);

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

  const handleShareGame = useCallback(async () => {
    dispatch(loadUsers());
    setMode('sharing');
  }, [dispatch]);

  const handleShowGames = useCallback(() => {
    dispatch(loadGames());
    setMode('selecting');
  }, [dispatch]);

  const handleSignin = useCallback(async () => {
    dispatch(signIn());
  }, [dispatch]);

  const handleSignout = useCallback(async () => {
    dispatch(signOut());
  }, [dispatch]);

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

  const renderGame = useCallback(
    (gameId: string) => {
      const game = (games ?? {})[gameId];
      if (!game) {
        console.warn(`Unknown game ID ${gameId}`);
        return;
      }

      return (
        <li
          className="MenuBar-select-item"
          key={gameId}
          data-item-id={gameId}
          onClick={handleSelectGame}
        >
          <dl className="MenuBar-select-info">
            <div>
              <dt>Letters</dt>
              <dd className="MenuBar-select-letters">
                {game.key.slice(1, Math.ceil(game.key.length / 2))}
                <span className="MenuBar-select-letters-center">
                  {game.key[0]}
                </span>
                {game.key.slice(Math.ceil(game.key.length / 2))}
              </dd>
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
          {gameId !== activeGameId && (
            <div className="MenuBar-select-remove">
              <Button size="small" onClickCapture={handleRemoveGame}>
                Delete
              </Button>
            </div>
          )}
        </li>
      );
    },
    [activeGameId, games, handleSelectGame, handleRemoveGame]
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
          className="MenuBar-select-item"
          key={userId}
          data-item-id={userId}
          onClick={handleUserSelect}
        >
          <div className="MenuBar-select-id">{user.name}</div>
          <dl className="MenuBar-select-info">
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
    <div className="MenuBar">
      <div className="MenuBar-left">
        <Button type="text" onClick={handleShowGames}>
          Game
        </Button>
        <Button type="text" onClick={handleNewGame}>
          New
        </Button>
        {loggedIn && (
          <Button type="text" onClick={handleShareGame}>
            Share
          </Button>
        )}
      </div>

      <div className="MenuBar-right">
        {loggedIn ? (
          <Button
            type="text"
            onClick={handleSignout}
            tooltip={`${user.name} (${user.userId})`}
          >
            Sign out
          </Button>
        ) : (
          <Button type="text" onClick={handleSignin}>
            Sign in
          </Button>
        )}
      </div>

      {mode === 'selecting' && (
        <Modal onHide={handleHideModal}>
          {games ? (
            <ul className="MenuBar-select-list">
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
            <ul className="MenuBar-select-list MenuBar-select-users">
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

export default MenuBar;
