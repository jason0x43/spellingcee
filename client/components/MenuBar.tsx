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

export interface MenuBarProps {
  game?: Game;
  games?: Game[];
  user?: User;
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

  const handleSelectGame: React.MouseEventHandler<HTMLLIElement> = useCallback(
    (event) => {
      const gameId = event.currentTarget.getAttribute("data-item-id");
      console.log(`selecting ${gameId} from games`, games);
      if (gameId && games) {
        activateGame(Number(gameId));
      } else {
        addGame();
      }
      setSelectingGame(undefined);
    },
    [games],
  );

  const handleHideModal = useCallback(() => {
    setSelectingGame(undefined);
    setSelectingUser(undefined);
  }, []);

  const handleRemoveGame: React.MouseEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      // Don't let events propogate -- they'd end up being handled by the
      // containing game element, which we don't want since we just deleted the
      // game.
      event.stopPropagation();

      // Walk up the DOM from the button that fired the event, looking for a
      // node with a game ID attribute
      let node: HTMLElement | null = event.currentTarget as HTMLElement;
      while (node && !node.getAttribute("data-item-id")) {
        node = node.parentElement;
      }

      const gameId = node?.getAttribute("data-item-id");
      if (gameId) {
        if (confirm("Are you sure you want to delete this game?")) {
          removeGame(Number(gameId));
        }
      }
    },
    [],
  );

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

  const handleUserSelect: React.MouseEventHandler<HTMLLIElement> = useCallback(
    (event) => {
      const otherUserId = event.currentTarget.getAttribute("data-item-id");
      console.log("Sharing with", otherUserId);
      if (user?.id && otherUserId) {
        shareActiveGame(Number(otherUserId));
      }
      setSelectingUser(undefined);
    },
    [user?.id],
  );

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

  const renderGame = useCallback(
    (rg: Game) => {
      return (
        <li
          className={classNames({
            "MenuBar-select-item": true,
            "MenuBar-select-item-noselect": rg.id === game?.id,
          })}
          key={rg.id}
          data-item-id={rg.id}
          onClick={rg.id !== game?.id ? handleSelectGame : undefined}
        >
          <dl className="MenuBar-select-info" title={`${rg.id}`}>
            <div>
              <dt>Letters</dt>
              <dd className="MenuBar-select-letters">
                {rg.key.slice(1, Math.ceil(rg.key.length / 2))}
                <span className="MenuBar-select-letters-center">
                  {rg.key[0]}
                </span>
                {rg.key.slice(Math.ceil(rg.key.length / 2))}
              </dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{new Date(rg.addedAt).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt>Words</dt>
              <dd>
                {rg.wordsFound} / {rg.totalWords}
              </dd>
            </div>
            {rg.isShared && users?.find(({ id }) => id === rg.addedBy) && (
              <div>
                <dt>Creator</dt>
                <dd>{users[rg.addedBy].name}</dd>
              </div>
            )}
          </dl>
          <div className="MenuBar-select-controls">
            {rg.id !== game?.id && (
              <div
                className="MenuBar-select-control MenuBar-pressable"
                onClickCapture={handleRemoveGame}
              >
                <CloseIcon className="MenuBar-select-control-icon" />
              </div>
            )}
            {rg.isShared && (
              <div className="MenuBar-select-control">
                <ShareIcon className="MenuBar-select-control-icon" />
              </div>
            )}
            {newGameIds?.includes(rg.id) && (
              <div className="MenuBar-select-control">
                <NewGameIcon className="MenuBar-select-control-icon MenuBar-notify" />
              </div>
            )}
          </div>
        </li>
      );
    },
    [
      game?.id,
      games,
      handleSelectGame,
      handleRemoveGame,
      newGameIds,
      users,
    ],
  );

  const renderUser = useCallback(
    (user: User) => {
      return (
        <li
          className="MenuBar-select-item"
          key={user.id}
          data-item-id={user.id}
          onClick={handleUserSelect}
        >
          <div className="MenuBar-select-user">{user.name}</div>
        </li>
      );
    },
    [handleUserSelect],
  );

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
                  {renderGame(game)}
                  {games
                    .filter(
                      ({ id }) => id !== game.id && newGameIds?.includes(id),
                    )
                    .sort((a, b) => {
                      return b.addedAt - a.addedAt;
                    })
                    .map(renderGame)}
                  {games
                    .filter(
                      ({ id }) => id !== game.id && !newGameIds?.includes(id),
                    )
                    .sort((a, b) => {
                      return b.addedAt - a.addedAt;
                    })
                    .map(renderGame)}
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
                    .map(renderUser)}
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
