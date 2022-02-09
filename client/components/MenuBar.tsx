import { AiIcons, GoIcons, GrIcons, IoIcons, React } from "../deps.ts";
import { classNames } from "../util.ts";
import Modal from "./Modal.tsx";
import Spinner from "./Spinner.tsx";
import { Game, OtherUser } from "../../types.ts";
import { useAppDispatch, useAppSelector } from "../store/mod.ts";
import { activateGame, selectGame, selectWords, shareActiveGame } from "../store/game.ts";
import {
  selectGames,
  selectOtherUsers,
  selectUser,
  signout,
} from "../store/user.ts";
import { clearNewGameIds, selectNewGameIds } from "../store/ui.ts";

const { useRef, useState } = React;
const { GrFormClose: CloseIcon } = GrIcons;
const { GoPrimitiveDot: NotifyIcon } = GoIcons;
const { IoPeopleCircle: ShareIcon } = IoIcons;
const { AiFillStar: NewGameIcon } = AiIcons;

type MenuGameProps = {
  game: Game;
  numWords: number;
  onSelect: () => void;
  onRemove: () => void;
};

const MenuGame: React.FC<MenuGameProps> = (props) => {
  const { game, numWords, onSelect, onRemove } = props;
  const user = useAppSelector(selectUser);
  const otherUsers = useAppSelector(selectOtherUsers);
  const newGameIds = useAppSelector(selectNewGameIds);
  const dispatch = useAppDispatch();
  const isCurrentGame = game.id === user?.currentGame;

  return (
    <li
      className={classNames({
        "MenuBar-select-item": true,
        "MenuBar-select-item-noselect": isCurrentGame,
      })}
      key={game.id}
      data-item-id={game.id}
      onClick={() => {
        if (!isCurrentGame) {
          dispatch(activateGame(game.id));
          dispatch(clearNewGameIds);
          onSelect();
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
          <dt>Progress</dt>
          <dd>{numWords } / {game.maxWords}</dd>
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
                onRemove();
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

type MenuUserProps = {
  user: OtherUser;
  onSelect: () => void;
};

const MenuUser: React.FC<MenuUserProps> = (props) => {
  const { onSelect, user } = props;
  const dispatch = useAppDispatch();

  return (
    <li
      className="MenuBar-select-item"
      key={user.id}
      data-item-id={user.id}
      onClick={() => {
        dispatch(shareActiveGame(user.id));
        onSelect();
      }}
    >
      <div className="MenuBar-select-user">{user.name}</div>
    </li>
  );
};

const MenuBar: React.FC = () => {
  const [selectingGame, setSelectingGame] = useState(false);
  const [selectingUser, setSelectingUser] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const game = useAppSelector(selectGame);
  const games = useAppSelector(selectGames);
  const user = useAppSelector(selectUser);
  const otherUsers = useAppSelector(selectOtherUsers);
  const newGameIds = useAppSelector(selectNewGameIds);
  const words = useAppSelector(selectWords);

  const handleGameSelected = () => setSelectingGame(false);

  return (
    <div className="MenuBar">
      <div className="MenuBar-bar">
        <div className="MenuBar-left">
          <div
            className="MenuBar-item"
            onClick={() => setSelectingGame(true)}
          >
            Games
            {newGameIds.length > 0 && <NotifyIcon className="MenuBar-notify" />}
          </div>
          <div
            className="MenuBar-item"
            onClick={() => dispatch(activateGame())}
          >
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
          <Modal onHide={handleGameSelected}>
            {selectingGame
              ? (
                <ul className="MenuBar-select-list">
                  {game && user && (
                    <MenuGame
                      key={game.id}
                      game={game}
                      numWords={Object.keys(words).length}
                      onSelect={handleGameSelected}
                      onRemove={handleGameSelected}
                    />
                  )}
                  {games
                    .filter(
                      ({ id }) => id !== game?.id && newGameIds?.includes(id),
                    )
                    .sort((a, b) => b.addedAt - a.addedAt)
                    .map((g) => (
                      <MenuGame
                        key={g.id}
                        game={g}
                        numWords={g.numWords}
                        onSelect={handleGameSelected}
                        onRemove={handleGameSelected}
                      />
                    ))}
                  {games
                    .filter(
                      ({ id }) => id !== game?.id && !newGameIds?.includes(id),
                    )
                    .sort((a, b) => {
                      return b.addedAt - a.addedAt;
                    })
                    .map((g) => (
                      <MenuGame
                        key={g.id}
                        game={g}
                        numWords={g.numWords}
                        onSelect={handleGameSelected}
                        onRemove={handleGameSelected}
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
                      <MenuUser
                        user={u}
                        onSelect={() => setSelectingUser(false)}
                      />
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
              onClick={() => dispatch(signout())}
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
