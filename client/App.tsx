/// <reference no-default-lib="true" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import { classNames } from "./util.ts";
import { React, useCallback, useEffect, useState } from "./deps.ts";
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
import { Game, GameData, GameWord, User } from "../types.ts";
import { Words as WordsType } from "./types.ts";
import { permute } from "../shared/util.ts";

interface LoggedInProps {
  user: User;
  game: Game;
  words: GameWord[];
  games: Game[];
  gameData: GameData[];
}

const LoggedIn: React.FC<LoggedInProps> = (props) => {
  const { user } = props;
  const [inputDisabled, setInputDisabled] = useState(false);
  const [error, setError] = useState<Error | undefined>();
  const [warning, setWarning] = useState<string | undefined>();
  const [letters, setLetters] = useState<string[]>([...props.game.key]);
  const [letterMessage, setLetterMessage] = useState<
    { type: "normal" | "good" | "bad"; message: string } | undefined
  >();
  const [wordListExpanded, setWordListExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState<
    { type: "normal" | "good" | "bad"; message: string } | undefined
  >();
  const [inputValue, setInputValue] = useState<string[]>([]);
  const [validLetters, setValidLetters] = useState<string[]>([]);
  const [words, setWords] = useState<WordsType>(() =>
    props.words.reduce((allWords, word) => {
      allWords[word.word] = word;
      return allWords;
    }, {} as WordsType) ?? {}
  );
  const [validWords, setValidWords] = useState<string[]>([]);
  const [game, setGame] = useState(props.game);
  const [games, setGames] = useState(props.games);
  const [gameData, setGameData] = useState(() =>
    props.gameData.reduce((allData, data) => {
      allData[data.gameId] = data;
      return allData;
    }, {} as { [id: number]: GameData })
  );
  const isVertical = useVerticalMediaQuery();

  const scrambleLetters = () => {
    if (letters) {
      setLetters([letters[0], ...permute(letters.slice(1))]);
    }
  };

  const addInput = (char: string) => {
    setInputValue([...inputValue, char]);
  };

  const deleteInput = () => {
    setInputValue(inputValue.slice(0, inputValue.length - 1));
  };

  const submitWord = async () => {
    try {
      if (game) {
        const newWord = await addWord({
          userId: user.id,
          gameId: game.id,
          word: inputValue.join(""),
        });
        setWords({
          ...words,
          [newWord.word]: newWord,
        });
      }
    } catch (error) {
      console.error(error);
    }
    setInputValue([]);
  };

  const handleLetterMessageHidden = useCallback(() => {
    setInputValue([]);
    setInputDisabled(false);
    setLetterMessage(undefined);
  }, []);

  // TODO: update inputDisable when setting letterMessage
  useEffect(() => {
    if (letterMessage) {
      setInputDisabled(true);
    }
  }, [letterMessage]);

  // Add event listeners
  useEffect(() => {
    // Handle a general keypress event
    const handleKeyPress = (event: KeyboardEvent) => {
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
          deleteInput();
        } else if (key === "Enter") {
          if (game) {
            submitWord();
          }
        }
      } else if (key === " ") {
        scrambleLetters();
      } else if ((key >= "a" && key <= "z") || (key >= "A" && key <= "Z")) {
        addInput(event.key);
      }
    };

    globalThis.addEventListener("keydown", handleKeyPress);

    return () => {
      globalThis.removeEventListener("keydown", handleKeyPress);
    };
  }, [inputDisabled, inputValue, game]);

  const handleHideWarning = useCallback(() => {
    setWarning(undefined);
  }, []);

  const renderWords = () => (
    <div className="App-words">
      {game && gameData?.[game.id] && <Progress gameData={gameData[game.id]} />}
      <Words
        words={words}
        gameData={gameData[game.id]}
        user={user}
        setWordListExpanded={setWordListExpanded}
      />
    </div>
  );

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
          {isVertical && renderWords()}

          <div className="App-letters">
            <Input value={inputValue} validLetters={validLetters} />
            <Letters
              disabled={inputDisabled}
              addInput={addInput}
              letters={letters}
            />
            <div className="App-letters-controls">
              <Button
                onClick={() => {
                  if (!inputDisabled) {
                    deleteInput();
                  }
                }}
              >
                Delete
              </Button>
              <Button
                onClick={() => {
                  if (!inputDisabled) {
                    scrambleLetters();
                  }
                }}
              >
                Mix
              </Button>
              <Button onClick={() => submitWord()}>Enter</Button>
            </div>
            <Message
              message={letterMessage?.message}
              type={letterMessage?.type}
              visibleTime="normal"
              onHide={handleLetterMessageHidden}
            />
          </div>

          {!isVertical && renderWords()}

          <Message
            message={toastMessage?.message}
            type={toastMessage?.type}
          />
        </div>
      </>

      {warning && (
        <Modal type="warning" onHide={handleHideWarning}>
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

export type AppProps = Partial<LoggedInProps>;

const App: React.FC<AppProps> = (props) => {
  const { user, game, games, words, gameData } = props;

  return (
    <div className="App">
      {user && game && gameData && words && games
        ? (
          <LoggedIn
            {...props}
            user={user}
            game={game}
            gameData={gameData}
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
