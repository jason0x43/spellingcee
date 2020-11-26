import React, {
  FunctionComponent,
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames';
import { GrFormClose as CloseIcon } from 'react-icons/gr';
import { GoPrimitiveDot as NotifyIcon } from 'react-icons/go';
import { BsPeopleCircle as ShareIcon } from 'react-icons/bs';
import { AiFillStar as NewGameIcon } from 'react-icons/ai';
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
  selectNewGameIds,
  selectUser,
  selectUserId,
  selectUsers,
  setNewGameIds,
  shareActiveGame,
  signIn,
  signOut,
} from '../store';
import Modal from './Modal';
import Spinner from './Spinner';
import './MenuBar.css';

const logger = createLogger({ prefix: 'MenuBar' });
type SelectionState = 'loading' | 'selecting';

const MenuBar: FunctionComponent = () => {
  const [selectingGame, setSelectingGame] = useState<SelectionState>();
  const [selectingUser, setSelectingUser] = useState<SelectionState>();
  const dispatch = useDispatch<AppDispatch>();
  const games = useSelector(selectGames);

  const loggedIn = useSelector(isLoggedIn);
  const user = useSelector(selectUser);
  const users = useSelector(selectUsers);
  const userId = useSelector(selectUserId);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const { gameId: activeGameId } = useSelector(selectGame);
  const menuRef = useRef<HTMLDivElement>(null);
  const newGameIds = useSelector(selectNewGameIds);

  const handleAccount = useCallback(async () => {
    setShowAccountMenu(!showAccountMenu);
  }, [showAccountMenu]);

  const handleSelectGame: MouseEventHandler = useCallback(
    async (event) => {
      const gameId = event.currentTarget.getAttribute('data-item-id');
      logger.debug(`selecting ${gameId} from games`, games);
      if (gameId && games) {
        dispatch(activateGame(games[gameId]));
      } else {
        dispatch(newGame());
      }
      setSelectingGame(undefined);
    },
    [dispatch, games]
  );

  const handleHideModal = useCallback(() => {
    setSelectingGame(undefined);
    setSelectingUser(undefined);
  }, []);

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
        if (window.confirm('Are you sure you want to delete this game?')) {
          dispatch(removeGame(gameId));
        }
      }
    },
    [dispatch]
  );

  const handleShareGame = useCallback(async () => {
    setSelectingUser('loading');
    await dispatch(loadUsers());
    setSelectingUser('selecting');
  }, [dispatch]);

  const handleShowGames = useCallback(async () => {
    setSelectingGame('loading');
    await dispatch(loadUsers());
    await dispatch(loadGames());
    setSelectingGame('selecting');
  }, [dispatch]);

  const handleSignin = useCallback(async () => {
    dispatch(signIn());
  }, [dispatch]);

  const handleSignout = useCallback(async () => {
    dispatch(signOut());
    setShowAccountMenu(false);
  }, [dispatch]);

  const handleUserSelect: MouseEventHandler = useCallback(
    async (event) => {
      const otherUserId = event.currentTarget.getAttribute('data-item-id');
      logger.debug('Sharing with', otherUserId);
      if (userId && otherUserId) {
        dispatch(shareActiveGame(otherUserId));
      }
      setSelectingUser(undefined);
    },
    [dispatch, userId]
  );

  useEffect(() => {
    if (!selectingGame) {
      dispatch(setNewGameIds(undefined));
    }
  }, [dispatch, selectingGame]);

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      const target = event.target as Node;
      if (showAccountMenu && !menuRef.current?.contains(target)) {
        setShowAccountMenu(false);
      }
    };
    window.addEventListener('click', listener);

    return () => {
      window.removeEventListener('click', listener);
    };
  }, [showAccountMenu]);

  const renderGame = useCallback(
    (gameId: string) => {
      const game = (games ?? {})[gameId];
      if (!game) {
        console.warn(`Unknown game ID ${gameId}`);
        return;
      }

      return (
        <li
          className={classNames({
            'MenuBar-select-item': true,
            'MenuBar-select-item-noselect': gameId === activeGameId,
          })}
          key={gameId}
          data-item-id={gameId}
          onClick={gameId !== activeGameId ? handleSelectGame : undefined}
        >
          <dl className="MenuBar-select-info" title={gameId}>
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
              <dt>Words</dt>
              <dd>
                {game.wordsFound} / {game.totalWords}
              </dd>
            </div>
            {game.isShared && users?.[game.addedBy] && (
              <div>
                <dt>Creator</dt>
                <dd>{users[game.addedBy].name}</dd>
              </div>
            )}
          </dl>
          <div className="MenuBar-select-controls">
            {gameId !== activeGameId && (
              <div
                className="MenuBar-select-control MenuBar-pressable"
                onClickCapture={handleRemoveGame}
              >
                <CloseIcon className="MenuBar-select-control-icon" />
              </div>
            )}
            {game.isShared && (
              <div className="MenuBar-select-control">
                <ShareIcon className="MenuBar-select-control-icon" />
              </div>
            )}
            {newGameIds?.[game.gameId] && (
              <div className="MenuBar-select-control">
                <NewGameIcon className="MenuBar-select-control-icon MenuBar-notify" />
              </div>
            )}
          </div>
        </li>
      );
    },
    [activeGameId, games, handleSelectGame, handleRemoveGame, newGameIds, users]
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
      <div className="MenuBar-bar">
        <div className="MenuBar-left">
          <div className="MenuBar-item" onClick={handleShowGames}>
            Games
            {newGameIds != null && <NotifyIcon className="MenuBar-notify" />}
          </div>
          <div className="MenuBar-item" onClick={handleNewGame}>
            New
          </div>
          {loggedIn && (
            <div className="MenuBar-item" onClick={handleShareGame}>
              Share
            </div>
          )}
        </div>

        <div className="MenuBar-right">
          {loggedIn ? (
            <div
              className={classNames({
                'MenuBar-item': true,
                'MenuBar-item-active': showAccountMenu,
              })}
              onClick={handleAccount}
            >
              Account
            </div>
          ) : (
            <div className="MenuBar-item" onClick={handleSignin}>
              Sign in
            </div>
          )}
        </div>

        {selectingGame && (
          <Modal onHide={handleHideModal}>
            {selectingGame === 'selecting' && games ? (
              <ul className="MenuBar-select-list">
                {renderGame(activeGameId)}
                {Object.keys(games)
                  .filter(
                    (gameId) => gameId !== activeGameId && newGameIds?.[gameId]
                  )
                  .sort((a, b) => {
                    const gameA = games[a];
                    const gameB = games[b];
                    return gameB.addedAt - gameA.addedAt;
                  })
                  .map(renderGame)}
                {Object.keys(games)
                  .filter(
                    (gameId) => gameId !== activeGameId && !newGameIds?.[gameId]
                  )
                  .sort((a, b) => {
                    const gameA = games[a];
                    const gameB = games[b];
                    return gameB.addedAt - gameA.addedAt;
                  })
                  .map(renderGame)}
              </ul>
            ) : (
              <Spinner />
            )}
          </Modal>
        )}

        {selectingUser && (
          <Modal onHide={handleHideModal}>
            {selectingUser === 'selecting' && users ? (
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

      {showAccountMenu && (
        <div ref={menuRef} className="MenuBar-menu">
          <div className="MenuBar-menu-section">
            <div className="MenuBar-menu-item">
              <strong>Name:</strong> {user.name}
            </div>
            <div className="MenuBar-menu-item">
              <strong>ID:</strong> {user.userId}
            </div>
          </div>
          <div className="MenuBar-menu-section">
            <div
              className="MenuBar-menu-item MenuBar-menu-item-pressable"
              onClick={handleSignout}
            >
              Sign out
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuBar;
