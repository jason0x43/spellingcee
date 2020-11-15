import React, {
  Fragment,
  FunctionComponent,
  useCallback,
  useEffect,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppDispatch,
  addInput,
  clearInput,
  deleteInput,
  scrambleLetters,
  submitWord,
  setInputDisabled,
  setMessage,
  setMessageGood,
  setMessageVisible,
  selectError,
  selectMessage,
  isUserLoading,
  isInputDisabled,
} from './store';
import { createLogger } from './logging';
import AppError from './AppError';
import GameSelect from './GameSelect';
import Input from './Input';
import Letters from './Letters';
import MenuBar from './MenuBar';
import Message from './Message';
import Modal from './Modal';
import Progress from './Progress';
import Words from './Words';
import './App.css';

const messageTimeout = 1000;
const inputShakeTimeout = 300;
const logger = createLogger({ prefix: 'App' });

const App: FunctionComponent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const inputDisabled = useSelector(isInputDisabled);
  const userLoading = useSelector(isUserLoading);
  const error = useSelector(selectError);
  const message = useSelector(selectMessage);

  // If we have a message, display it
  useEffect(() => {
    if (message) {
      dispatch(setMessageVisible(true));
      dispatch(setInputDisabled(true));

      // After a while, hide the message and clear the input
      const timers = [
        setTimeout(() => {
          logger.log('Hiding message');
          dispatch(setMessageVisible(false));
        }, messageTimeout),

        setTimeout(() => {
          dispatch(setMessage(undefined));
          dispatch(setMessageGood(false));
        }, messageTimeout + 100),

        setTimeout(() => {
          dispatch(clearInput());
          dispatch(setInputDisabled(false));
        }, inputShakeTimeout),
      ];

      return () => {
        timers.forEach((timer) => clearTimeout(timer));
      };
    }
  }, [dispatch, message]);

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
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

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
        <Fragment>
          <MenuBar />
          <div className="App-content">
            <div className="App-letters-wrapper">
              <div className="App-letters">
                <Message />
                <Input />
                <Letters />
              </div>
            </div>

            <div className="App-words-wrapper">
              <div className="App-words">
                <Progress />
                <Words />
                <GameSelect />
              </div>
            </div>
          </div>
        </Fragment>
      )}
    </div>
  );
};

export default App;
