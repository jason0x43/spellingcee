import {
  AiIcons,
  GoIcons,
  GrIcons,
  IoIcons,
  React,
  useRef,
  useState,
} from "../deps.ts";
import { classNames } from "../util.ts";
import Modal from "./Modal.tsx";
import Spinner from "./Spinner.tsx";
import { Game, OtherUser, User } from "../../types.ts";

const { GrFormClose: CloseIcon } = GrIcons;
const { GoPrimitiveDot: NotifyIcon } = GoIcons;
const { IoPeopleCircle: ShareIcon } = IoIcons;
const { AiFillStar: NewGameIcon } = AiIcons;

interface MenuGameProps {
  user: User;
  game: Game;
  currentGameId: number;
  otherUsers: OtherUser[];
  newGameIds: number[] | undefined;
  onSelect: (gameId: number) => void;
  removeGame: (gameId: number) => void;
}

const MenuGame: React.FC<MenuGameProps> = (props) => {
  const {
    game,
    newGameIds,
    onSelect,
    removeGame,
    user,
    currentGameId,
    otherUsers,
  } = props;

  return (
    <li
      className={classNames({
        "MenuBar-select-item": true,
        "MenuBar-select-item-noselect": game.id === game?.id,
      })}
      key={game.id}
      data-item-id={game.id}
      onClick={() => {
        if (game.id !== currentGameId) {
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
            {game.wordsFound} / {game.totalWords}
          </dd>
        </div>
        {game.userId !== user?.id &&
          otherUsers?.find(({ id }) => id === game.userId) && (
          <div>
            <dt>Creator</dt>
            <dd>{otherUsers[game.userId].name}</dd>
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
              if (confirm("Are you sure you want to delete this game?")) {
                removeGame(game.id);
              }
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
  user: OtherUser;
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
  game: Game;
  games: Game[];
  user: User;
  otherUsers: OtherUser[];
  newGameIds?: number[];
  clearNewGameIds: () => void;
  activateGame: (gameId: number) => void;
  addGame: () => void;
  removeGame: (gameId: number) => void;
  loadUsers: () => Promise<void>;
  loadGames: () => Promise<void>;
  signOut: () => Promise<void>;
  shareActiveGame: (otherUserId: number) => Promise<void>;
}

const MenuBar: React.FC<MenuBarProps> = (props) => {
  const {
    activateGame,
    game,
    games,
    addGame,
    signOut,
    removeGame,
    newGameIds,
    clearNewGameIds,
    user,
    otherUsers,
    shareActiveGame,
  } = props;
  const [selectingGame, setSelectingGame] = useState(false);
  const [selectingUser, setSelectingUser] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSelectGame = (gameId: number) => {
    activateGame(gameId);
    setSelectingGame(false);
    clearNewGameIds();
  };

  const handleUserSelect = (userId: number) => {
    console.log("Sharing with", userId);
    if (user?.id && userId) {
      shareActiveGame(userId);
    }
    setSelectingUser(false);
  };

  return (
    <div className="MenuBar">
      <div className="MenuBar-bar">
        <div className="MenuBar-left">
          <div
            className="MenuBar-item"
            onClick={() => setSelectingGame(true)}
          >
            Games
            {newGameIds != null && <NotifyIcon className="MenuBar-notify" />}
          </div>
          <div className="MenuBar-item" onClick={addGame}>
            New
          </div>
          {otherUsers.length > 0 && (
            <div
              className="MenuBar-item"
              onClick={() => setSelectingUser(true)}
            >
              Share
            </div>
          )}
        </div>

        <div className="MenuBar-right">
          <div
            className="MenuBar-item"
            onClick={() => setShowAccountMenu(!showAccountMenu)}
          >
            Account
          </div>
        </div>

        {selectingGame && (
          <Modal onHide={() => setSelectingGame(false)}>
            {selectingGame
              ? (
                <ul className="MenuBar-select-list">
                  <MenuGame
                    key={game.id}
                    game={game}
                    currentGameId={game.id}
                    newGameIds={newGameIds}
                    user={user}
                    otherUsers={otherUsers}
                    onSelect={handleSelectGame}
                    removeGame={removeGame}
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
                        key={g.id}
                        game={g}
                        currentGameId={game.id}
                        newGameIds={newGameIds}
                        user={user}
                        otherUsers={otherUsers}
                        onSelect={handleSelectGame}
                        removeGame={removeGame}
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
                        key={g.id}
                        game={g}
                        currentGameId={game.id}
                        newGameIds={newGameIds}
                        user={user}
                        otherUsers={otherUsers}
                        onSelect={handleSelectGame}
                        removeGame={removeGame}
                      />
                    ))}
                </ul>
              )
              : <Spinner />}
          </Modal>
        )}

        {selectingUser && user && (
          <Modal onHide={() => setSelectingUser(false)}>
            {selectingUser
              ? (
                <ul className="MenuBar-select-list MenuBar-select-users">
                  {otherUsers
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
