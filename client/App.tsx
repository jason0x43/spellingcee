import { classNames } from "./util.ts";
import { React } from "./deps.ts";
import Button from "./components/Button.tsx";
import Input from "./components/Input.tsx";
import Letters from "./components/Letters.tsx";
import MenuBar from "./components/MenuBar.tsx";
import ToastMessage from "./components/ToastMessage.tsx";
import Modal from "./components/Modal.tsx";
import Progress from "./components/Progress.tsx";
import Words from "./components/Words.tsx";
import { useVerticalMediaQuery } from "./hooks/mod.ts";
import { useAppDispatch, useAppSelector } from "./store/mod.ts";
import { selectUser, selectUserError, signin } from "./store/user.ts";
import { submitWord } from "./store/game.ts";
import {
  removeInput,
  scrambleLetters,
  selectError,
  selectInputDisabled,
  selectLetterMessage,
  selectToastMessage,
  selectWarning,
  selectWordListExpanded,
} from "./store/ui.ts";

const { useState } = React;

const LoggedIn: React.FC = () => {
  const isVertical = useVerticalMediaQuery();
  const dispatch = useAppDispatch();
  const inputDisabled = useAppSelector(selectInputDisabled);
  const error = useAppSelector(selectError);
  const wordListExpanded = useAppSelector(selectWordListExpanded);
  const warning = useAppSelector(selectWarning);
  const letterMessage = useAppSelector(selectLetterMessage);
  const toastMessage = useAppSelector(selectToastMessage);

  // If there was an error, display an error message rather than the normal UI
  if (error) {
    console.error(error);
    return (
      <div className="App">
        <div className="App-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="App">
      <>
        <MenuBar />
        <div
          className={classNames({
            "App-content": true,
            "App-words-expanded": wordListExpanded,
          })}
        >
          {isVertical && (
            <div className="App-words">
              <Progress />
              <Words />
            </div>
          )}

          <div className="App-letters">
            <Input />
            <Letters />
            <div className="App-letters-controls">
              <Button
                disabled={inputDisabled}
                onClick={() => dispatch(removeInput())}
              >
                Delete
              </Button>
              <Button
                disabled={inputDisabled}
                onClick={() => dispatch(scrambleLetters())}
              >
                Mix
              </Button>
              <Button
                disabled={inputDisabled}
                onClick={() => dispatch(submitWord())}
              >
                Enter
              </Button>
            </div>
            <ToastMessage message={letterMessage} />
          </div>

          {!isVertical && (
            <div className="App-words">
              <Progress />
              <Words />
            </div>
          )}

          <ToastMessage message={toastMessage} />
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

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useAppDispatch();
  const error = useAppSelector(selectUserError);

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
      <button
        type="button"
        onClick={() => dispatch(signin({ email, password }))}
      >
        Login
      </button>

      {error && <div className="LoginError">{error}</div>}
    </form>
  );
};

const App: React.FC = () => {
  const user = useAppSelector(selectUser);

  return (
    <div className="App">
      {user ? <LoggedIn /> : <Login />}
    </div>
  );
};

export default App;
