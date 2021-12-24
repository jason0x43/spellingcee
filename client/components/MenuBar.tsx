/// <reference lib="dom" />

import {
  AiIcons,
  GoIcons,
  GrIcons,
  IoIcons,
  React,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "../deps.ts";
import { classNames } from "../util.ts";
import Modal from "./Modal.tsx";
import Spinner from "./Spinner.tsx";
import { Game, User } from "../../types.ts";

const { GrFormClose: CloseIcon } = GrIcons;
const { GoPrimitiveDot: NotifyIcon } = GoIcons;
const { IoPeopleCircle: ShareIcon } = IoIcons;
const { AiFillStar: NewGameIcon } = AiIcons;

type SelectionState = "loading" | "selecting";

interface MenuGameProps {
  game: Game;
  currentGame: number;
  newGameIds: number[] | undefined;
  user: User | undefined;
  users: User[] | undefined;
  onSelect: (gameId: number) => void;
  onRemove: (gameId: number) => void;
}

const MenuGame: React.FC<MenuGameProps> = (props) => {
  const { game, currentGame, newGameIds, onSelect, onRemove, user, users } =
    props;
  return (
    <li
      className={classNames({
        "MenuBar-select-item": true,
        "MenuBar-select-item-noselect": game.id === game?.id,
      })}
      key={game.id}
      data-item-id={game.id}
      onClick={() => {
        if (game.id !== currentGame) {
          onSelect(game.id);
        }
      }}
    >
      <dl className="MenuBar-select-info" title={`${game.id}`}>
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
            {game.wordsFound / game.totalWords}
          </dd>
        </div>
        {game.userId !== user?.id &&
          users?.find(({ id }) => id === game.userId) && (
          <div>
            <dt>Creator</dt>
            <dd>{users[game.userId].name}</dd>
          </div>
        )}
      </dl>
      <div className="MenuBar-select-controls">
        {game.id !== game?.id && (
          <div
            className="MenuBar-select-control MenuBar-pressable"
            onClickCapture={(event) => {
              // Don't let events propogate -- they'd end up being handled by
              // the containing game element, which we don't want since we just
              // deleted the game.
              event.stopPropagation();
              onRemove(game.id);
            }}
          >
            <CloseIcon className="MenuBar-select-control-icon" />
          </div>
        )}
        {game.userId !== user?.id && (
          <div className="MenuBar-select-control">
            <ShareIcon className="MenuBar-select-control-icon" />
          </div>
        )}
        {newGameIds?.includes(game.id) && (
          <div className="MenuBar-select-control">
            <NewGameIcon className="MenuBar-select-control-icon MenuBar-notify" />
          </div>
        )}
      </div>
    </li>
  );
};

interface MenuUserProps {
  user: User;
  onSelect: (userId: number) => void;
}

const MenuUser: React.FC<MenuUserProps> = (props) => {
  const { onSelect, user } = props;
  return (
    <li
      className="MenuBar-select-item"
      key={user.id}
      data-item-id={user.id}
      onClick={() => onSelect(user.id)}
    >
      <div className="MenuBar-select-user">{user.name}</div>
    </li>
  );
};

export interface MenuBarProps {
  game?: Game;
  games?: Game[];
  user: User | undefined;
  users?: User[];
  newGameIds?: number[];
  clearNewGameIds: () => void;
  activateGame: (gameId: number) => void;
  addGame: () => void;
  removeGame: (gameId: number) => void;
  loadUsers: () => Promise<void>;
  loadGames: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  shareActiveGame: (otherUserId: number) => Promise<void>;
}

const MenuBar: React.FC<MenuBarProps> = (props) => {
  const {
    activateGame,
    game,
    games,
    loadGames,
    addGame,
    signIn,
    signOut,
    removeGame,
    newGameIds,
    clearNewGameIds,
    user,
    users,
    loadUsers,
    shareActiveGame,
  } = props;
  const [selectingGame, setSelectingGame] = useState<SelectionState>();
  const [selectingUser, setSelectingUser] = useState<SelectionState>();
  const loggedIn = Boolean(user);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleAccount = useCallback(() => {
    setShowAccountMenu(!showAccountMenu);
  }, [showAccountMenu]);

  useEffect(() => {
    if (!user) {
      setShowAccountMenu(false);
    }
  }, [user]);

  const handleSelectGame = (gameId: number) => {
    console.log(`selecting ${gameId} from games`, games);
    if (gameId && games) {
      activateGame(Number(gameId));
    } else {
      addGame();
    }
    setSelectingGame(undefined);
  };

  const handleHideModal = useCallback(() => {
    setSelectingGame(undefined);
    setSelectingUser(undefined);
  }, []);

  const handleRemoveGame = (gameId: number) => {
    if (confirm("Are you sure you want to delete this game?")) {
      removeGame(Number(gameId));
    }
  };

  const handleShareGame = useCallback(async () => {
    setSelectingUser("loading");
    await loadUsers();
    setSelectingUser("selecting");
  }, []);

  const handleShowGames = useCallback(async () => {
    setSelectingGame("loading");
    await Promise.all([loadUsers, loadGames]);
    setSelectingGame("selecting");
  }, []);

  const handleUserSelect = (userId: number) => {
    console.log("Sharing with", userId);
    if (user?.id && userId) {
      shareActiveGame(userId);
    }
    setSelectingUser(undefined);
  };

  useEffect(() => {
    if (!selectingGame) {
      clearNewGameIds();
    }
  }, [selectingGame]);

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      const target = event.target as Node;
      if (showAccountMenu && !menuRef.current?.contains(target)) {
        setShowAccountMenu(false);
      }
    };
    globalThis.addEventListener("click", listener);

    return () => {
      globalThis.removeEventListener("click", listener);
    };
  }, [showAccountMenu]);

  return (
    <div className="MenuBar">
      <div className="MenuBar-bar">
        <div className="MenuBar-left">
          <div className="MenuBar-item" onClick={handleShowGames}>
            Games
            {newGameIds != null && <NotifyIcon className="MenuBar-notify" />}
          </div>
          <div className="MenuBar-item" onClick={addGame}>
            New
          </div>
          {loggedIn && (
            <div className="MenuBar-item" onClick={handleShareGame}>
              Share
            </div>
          )}
        </div>

        <div className="MenuBar-right">
          {loggedIn
            ? (
              <div
                className={classNames({
                  "MenuBar-item": true,
                  "MenuBar-item-active": showAccountMenu,
                })}
                onClick={handleAccount}
              >
                Account
              </div>
            )
            : (
              <div className="MenuBar-item" onClick={signIn}>
                Sign in
              </div>
            )}
        </div>

        {selectingGame && (
          <Modal onHide={handleHideModal}>
            {(selectingGame === "selecting" && games &&
                game?.id !== undefined)
              ? (
                <ul className="MenuBar-select-list">
                  <MenuGame
                    game={game}
                    currentGame={game.id}
                    newGameIds={newGameIds}
                    user={user}
                    users={users}
                    onSelect={handleSelectGame}
                    onRemove={handleRemoveGame}
                  />
                  {games
                    .filter(
                      ({ id }) => id !== game.id && newGameIds?.includes(id),
                    )
                    .sort((a, b) => {
                      return b.addedAt - a.addedAt;
                    })
                    .map((g) => (
                      <MenuGame
                        game={g}
                        currentGame={game.id}
                        newGameIds={newGameIds}
                        user={user}
                        users={users}
                        onSelect={handleSelectGame}
                        onRemove={handleRemoveGame}
                      />
                    ))}
                  {games
                    .filter(
                      ({ id }) => id !== game.id && !newGameIds?.includes(id),
                    )
                    .sort((a, b) => {
                      return b.addedAt - a.addedAt;
                    })
                    .map((g) => (
                      <MenuGame
                        game={g}
                        currentGame={game.id}
                        newGameIds={newGameIds}
                        user={user}
                        users={users}
                        onSelect={handleSelectGame}
                        onRemove={handleRemoveGame}
                      />
                    ))}
                </ul>
              )
              : <Spinner />}
          </Modal>
        )}

        {selectingUser && user && (
          <Modal onHide={handleHideModal}>
            {selectingUser === "selecting" && users
              ? (
                <ul className="MenuBar-select-list MenuBar-select-users">
                  {users
                    .filter(({ id }) => id !== user.id)
                    .map((u) => (
                      <MenuUser user={u} onSelect={handleUserSelect} />
                    ))}
                </ul>
              )
              : <Spinner />}
          </Modal>
        )}
      </div>

      {showAccountMenu && user && (
        <div ref={menuRef} className="MenuBar-menu">
          <div className="MenuBar-menu-section">
            <div className="MenuBar-menu-item">
              <strong>Name:</strong> {user.name}
            </div>
            <div className="MenuBar-menu-item">
              <strong>ID:</strong> {user.id}
            </div>
          </div>
          <div className="MenuBar-menu-section">
            <div
              className="MenuBar-menu-item MenuBar-menu-item-pressable"
              onClick={signOut}
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
