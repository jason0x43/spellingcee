/// <reference no-default-lib="true" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import { classNames } from "./util.ts";
import { React, useEffect, useReducer, useState } from "./deps.ts";
import AppError from "./AppError.ts";
import Button from "./components/Button.tsx";
import Input from "./components/Input.tsx";
import Letters from "./components/Letters.tsx";
import MenuBar from "./components/MenuBar.tsx";
import Message from "./components/Message.tsx";
import Modal from "./components/Modal.tsx";
import Progress from "./components/Progress.tsx";
import Words from "./components/Words.tsx";
import { useVerticalMediaQuery } from "./hooks/mod.ts";
import { addWord, login } from "./api.ts";
import { Game, GameWord, OtherUser, User } from "../types.ts";
import { Words as WordsType } from "./types.ts";
import { permute } from "../shared/util.ts";

interface LoggedInProps {
  user: User;
  otherUsers: OtherUser[];
  words: GameWord[];
  games: Game[];
  game: Game;
}

interface AppState {
  user: User;
  otherUsers: OtherUser[];
  words: WordsType;
  games: Game[];
  game: Game;
  inputDisabled: boolean;
  wordListExpanded: boolean;
  inputValue: string[];
  validWords: string[];
  error: Error | undefined;
  warning: string | undefined;
  letters: string[];
  letterMessage:
    | { type: "normal" | "good" | "bad"; message: string }
    | undefined;
  toastMessage:
    | { type: "normal" | "good" | "bad"; message: string }
    | undefined;
}

function initState(props: LoggedInProps): AppState {
  return {
    user: props.user,
    otherUsers: props.otherUsers,
    inputDisabled: false,
    error: undefined,
    warning: undefined,
    letters: [...props.game.key],
    letterMessage: undefined,
    wordListExpanded: false,
    toastMessage: undefined,
    inputValue: [],
    words: props.words.reduce((allWords, word) => {
      allWords[word.word] = word;
      return allWords;
    }, {} as WordsType) ?? {},
    validWords: [],
    games: props.games,
    game: props.game,
  };
}

type AppStateAction =
  | { type: "scrambleLetters" }
  | {
    type: "setLetterMessage";
    payload: NonNullable<AppState["letterMessage"]>;
  }
  | { type: "clearLetterMessage" }
  | { type: "clearWarning" }
  | { type: "clearInput" }
  | { type: "setWordListExpanded"; payload: boolean }
  | { type: "enableInput" }
  | { type: "disableInput" }
  | { type: "addInput"; payload: string }
  | { type: "addWord"; payload: GameWord }
  | { type: "deleteInput" };

function updateState(state: AppState, action: AppStateAction): AppState {
  switch (action.type) {
    case "scrambleLetters":
      return {
        ...state,
        letters: [state.letters[0], ...permute(state.letters.slice(1))],
      };
    case "setLetterMessage":
      return {
        ...state,
        letterMessage: action.payload,
        inputDisabled: true,
      };
    case "clearLetterMessage":
      return { ...state, letterMessage: undefined };
    case "clearWarning":
      return { ...state, warning: undefined };
    case "setWordListExpanded":
      return { ...state, wordListExpanded: action.payload };
    case "addInput":
      return {
        ...state,
        inputValue: [...state.inputValue, action.payload],
      };
    case "enableInput":
      return { ...state, inputDisabled: false };
    case "disableInput":
      return { ...state, inputDisabled: true };
    case "deleteInput":
      return {
        ...state,
        inputValue: state.inputValue.slice(0, state.inputValue.length - 1),
      };
    case "clearInput":
      return { ...state, inputValue: [] };
    case "addWord":
      return {
        ...state,
        words: {
          ...state.words,
          [action.payload.word]: action.payload,
        },
      };
    default:
      return state;
  }
}

interface AppWordsProps {
  words: WordsType;
  user: User;
  score: number;
  maxScore: number;
  totalWords: number;
  dispatch: React.Dispatch<AppStateAction>;
}

const AppWords: React.FC<AppWordsProps> = (props) => {
  const { score, maxScore, totalWords, words, user, dispatch } = props;
  return (
    <div className="App-words">
      <Progress score={score} maxScore={maxScore} />
      <Words
        words={words}
        totalWords={totalWords}
        user={user}
        setWordListExpanded={(expanded) =>
          dispatch({ type: "setWordListExpanded", payload: expanded })}
      />
    </div>
  );
};

async function submitWord(
  state: AppState,
  dispatch: React.Dispatch<AppStateAction>,
) {
  const { game, inputValue, user } = state;
  try {
    const newWord = await addWord({
      userId: user.id,
      gameId: game.id,
      word: inputValue.join(""),
    });
    dispatch({ type: "addWord", payload: newWord });
  } catch (error) {
    console.error(error);
  }
  dispatch({ type: "clearInput" });
}

function createKeyPressHandler(
  state: AppState,
  dispatch: React.Dispatch<AppStateAction>,
) {
  return (event: KeyboardEvent) => {
    const { game, inputDisabled } = state;

    if (inputDisabled) {
      return;
    }

    // Ignore meta/control keys
    if (event.metaKey) {
      return;
    }

    const { key } = event;

    if (key.length > 1) {
      if (key === "Backspace" || key === "Delete") {
        dispatch({ type: "deleteInput" });
      } else if (key === "Enter") {
        if (game) {
          submitWord(state, dispatch);
        }
      }
    } else if (key === " ") {
      dispatch({ type: "scrambleLetters" });
    } else if ((key >= "a" && key <= "z") || (key >= "A" && key <= "Z")) {
      dispatch({ type: "addInput", payload: event.key });
    }
  };
}

const LoggedIn: React.FC<LoggedInProps> = (props) => {
  const [state, dispatch] = useReducer(updateState, props, initState);
  const isVertical = useVerticalMediaQuery();
  const {
    error,
    game,
    games,
    inputDisabled,
    inputValue,
    letterMessage,
    letters,
    toastMessage,
    user,
    otherUsers,
    warning,
    wordListExpanded,
    words,
  } = state;

  useEffect(() => {
    const handleKeyPress = createKeyPressHandler(state, dispatch);
    globalThis.addEventListener("keydown", handleKeyPress);

    return () => {
      globalThis.removeEventListener("keydown", handleKeyPress);
    };
  }, [inputDisabled, inputValue, game]);

  // If there was an error, display an error message rather than the normal UI
  if (error) {
    console.error(error);
    const message = typeof error === "string"
      ? error
      : AppError.isAppError(error)
      ? error.appMessage
      : "There was an error loading the application";
    return (
      <div className="App">
        <div className="App-error">{message}</div>
      </div>
    );
  }

  return (
    <div className="App">
      <>
        <MenuBar
          user={user}
          game={game}
          otherUsers={otherUsers}
          clearNewGameIds={() => undefined}
          activateGame={() => undefined}
          addGame={() => undefined}
          games={games}
          removeGame={() => undefined}
          loadUsers={() => Promise.resolve()}
          loadGames={() => Promise.resolve()}
          signIn={() => Promise.resolve()}
          signOut={() => Promise.resolve()}
          shareActiveGame={() => Promise.resolve()}
        />
        <div
          className={classNames({
            "App-content": true,
            "App-words-expanded": wordListExpanded,
          })}
        >
          {isVertical && (
            <AppWords
              score={game.score}
              maxScore={game.maxScore}
              totalWords={game.totalWords}
              words={words}
              user={user}
              dispatch={dispatch}
            />
          )}

          <div className="App-letters">
            <Input value={inputValue} validLetters={letters} />
            <Letters
              disabled={inputDisabled}
              addInput={(letter) =>
                dispatch({ type: "addInput", payload: letter })}
              letters={letters}
            />
            <div className="App-letters-controls">
              <Button
                onClick={() => {
                  if (!inputDisabled) {
                    dispatch({ type: "deleteInput" });
                  }
                }}
              >
                Delete
              </Button>
              <Button
                onClick={() => {
                  if (!inputDisabled) {
                    dispatch({ type: "scrambleLetters" });
                  }
                }}
              >
                Mix
              </Button>
              <Button onClick={() => submitWord(state, dispatch)}>
                Enter
              </Button>
            </div>
            <Message
              message={letterMessage?.message}
              type={letterMessage?.type}
              visibleTime="normal"
              onHide={() => {
                dispatch({ type: "clearInput" });
                dispatch({ type: "enableInput" });
                dispatch({ type: "clearLetterMessage" });
              }}
            />
          </div>

          {!isVertical && (
            <AppWords
              score={game.score}
              maxScore={game.maxScore}
              totalWords={game.totalWords}
              words={words}
              user={user}
              dispatch={dispatch}
            />
          )}

          <Message
            message={toastMessage?.message}
            type={toastMessage?.type}
          />
        </div>
      </>

      {warning && (
        <Modal
          type="warning"
          onHide={() => dispatch({ type: "clearWarning" })}
        >
          {warning}
        </Modal>
      )}
    </div>
  );
};

interface LoginProps {
  setUser: (user: User) => void;
}

const Login: React.FC<LoginProps> = (props) => {
  const { setUser } = props;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<Error>();

  const handleLogin = async () => {
    try {
      const user = await login(email, password);
      console.log("got user:", user);
      if (user) {
        setUser(user);
      }
    } catch (error) {
      setError(error);
    }
  };

  return (
    <form className="Login">
      <input
        placeholder="Email"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
        }}
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <button type="button" onClick={handleLogin}>Login</button>

      {error && <div className="LoginError">{error.message}</div>}
    </form>
  );
};

export type AppProps = Partial<Omit<LoggedInProps, "game">>;

const App: React.FC<AppProps> = (props) => {
  const { user, games, words, otherUsers } = props;
  const game = games?.find(({ id }) => id === user?.meta.currentGame);

  return (
    <div className="App">
      {user && otherUsers && words && games && game
        ? (
          <LoggedIn
            {...props}
            user={user}
            otherUsers={otherUsers}
            game={game}
            games={games}
            words={words}
          />
        )
        : (
          <Login
            setUser={() => {
              location.href = "/";
            }}
          />
        )}
    </div>
  );
};

export default App;
