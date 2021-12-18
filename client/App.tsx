/// <reference no-default-lib="true" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import { classNames } from './util.ts';
import {
  React,
  useCallback,
  useDispatch,
  useEffect,
  useSelector,
} from './deps.ts';
import AppError from './AppError.ts';
import Button from './components/Button.tsx';
import Input from './components/Input.tsx';
import Letters from './components/Letters.tsx';
import MenuBar from './components/MenuBar.tsx';
import Message from './components/Message.tsx';
import Modal from './components/Modal.tsx';
import Progress from './components/Progress.tsx';
import Words from './components/Words.tsx';
import { useVerticalMediaQuery } from './hooks/mod.ts';
import { createLogger } from './logging.ts';
import {
  addInput,
  AppDispatch,
  clearInput,
  deleteInput,
  isInputDisabled,
  isUserLoading,
  isWordListExpanded,
  scrambleLetters,
  selectError,
  selectLetterMessage,
  selectToastMessage,
  selectWarning,
  setInputDisabled,
  setLetterMessage,
  setWarning,
  submitWord,
} from './store.ts';

const logger = createLogger({ prefix: 'App' });

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const inputDisabled = useSelector(isInputDisabled);
  const userLoading = useSelector(isUserLoading);
  const error = useSelector(selectError);
  const warning = useSelector(selectWarning);
  const letterMessage = useSelector(selectLetterMessage);
  const wordListExpanded = useSelector(isWordListExpanded);
  const isVertical = useVerticalMediaQuery();
  const toastMessage = useSelector(selectToastMessage);

  const handleLetterMessageHidden = useCallback(() => {
    dispatch(clearInput());
    dispatch(setInputDisabled(false));
    dispatch(setLetterMessage(undefined));
  }, [dispatch]);

  // If we have a message, display it
  useEffect(() => {
    if (letterMessage) {
      dispatch(setInputDisabled(true));
    }
  }, [dispatch, letterMessage]);

  // Handle a general keypress event
  const handleKeyPress = useCallback(
    (event) => {
      if (inputDisabled) {
        return;
      }

      // Ignore meta/control keys
      if (event.metaKey) {
        return;
      }

      const { key } = event;

      if (key.length > 1) {
        if (key === 'Backspace' || key === 'Delete') {
          dispatch(deleteInput());
        } else if (key === 'Enter') {
          dispatch(submitWord());
        }
      } else if (key === ' ') {
        dispatch(scrambleLetters());
      } else if ((key >= 'a' && key <= 'z') || (key >= 'A' && key <= 'Z')) {
        dispatch(addInput(event.key));
      }
    },
    [dispatch, inputDisabled]
  );

  // Add event listeners
  useEffect(() => {
    globalThis.addEventListener('keydown', handleKeyPress);
    return () => {
      globalThis.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  const handleHideWarning = useCallback(() => {
    () => dispatch(setWarning(undefined));
  }, [dispatch]);

  const handleDelete = useCallback(() => {
    if (!inputDisabled) {
      dispatch(deleteInput());
    }
  }, [dispatch, inputDisabled]);

  const handleScramble = useCallback(() => {
    if (!inputDisabled) {
      dispatch(scrambleLetters());
    }
  }, [dispatch, inputDisabled]);

  const handleSubmit = useCallback(() => {
    console.log('submitting word');
    dispatch(submitWord());
  }, [dispatch]);

  const renderWords = useCallback(() => {
    return (
      <div className="App-words">
        <Progress />
        <Words />
      </div>
    );
  }, []);

  // If there was an error, display an error message rather than the normal UI
  if (error) {
    logger.error(error);
    const message =
      typeof error === 'string'
        ? error
        : AppError.isAppError(error)
        ? error.appMessage
        : 'There was an error loading the application';
    return (
      <div className="App">
        <div className="App-error">{message}</div>
      </div>
    );
  }

  return (
    <div className="App">
      {userLoading ? (
        <Modal />
      ) : (
        <>
          <MenuBar />
          <div
            className={classNames({
              'App-content': true,
              'App-words-expanded': wordListExpanded,
            })}
          >
            {isVertical && renderWords()}

            <div className="App-letters">
              <Input />
              <Letters />
              <div className="App-letters-controls">
                <Button onClick={handleDelete}>Delete</Button>
                <Button onClick={handleScramble}>Mix</Button>
                <Button onClick={handleSubmit}>Enter</Button>
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
      )}

      {warning && (
        <Modal type="warning" onHide={handleHideWarning}>
          {warning}
        </Modal>
      )}
    </div>
  );
};

export default App;
