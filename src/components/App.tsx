import classNames from 'classnames';
import React, { FunctionComponent, useCallback, useEffect } from 'react';
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
  selectWarning,
  setWarning,
  isUserLoading,
  isInputDisabled,
  isWordListExpanded,
} from '../store';
import { createLogger } from '../logging';
import AppError from '../AppError';
import Button from './Button';
import Input from './Input';
import Letters from './Letters';
import MenuBar from './MenuBar';
import Message from './Message';
import Modal from './Modal';
import Progress from './Progress';
import Words from './Words';
import './App.css';
import useMediaQuery, { verticalQuery } from '../useMediaQuery';

const messageTimeout = 1000;
const inputShakeTimeout = 300;
const logger = createLogger({ prefix: 'App' });

const App: FunctionComponent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const inputDisabled = useSelector(isInputDisabled);
  const userLoading = useSelector(isUserLoading);
  const error = useSelector(selectError);
  const warning = useSelector(selectWarning);
  const message = useSelector(selectMessage);
  const wordListExpanded = useSelector(isWordListExpanded);
  const isVertical = useMediaQuery(verticalQuery);

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
              <Message />
              <Input />
              <Letters />
              <div className="App-letters-controls">
                <Button onClick={handleDelete}>Delete</Button>
                <Button onClick={handleScramble}>Mix</Button>
                <Button onClick={handleSubmit}>Enter</Button>
              </div>
            </div>

            {!isVertical && renderWords()}
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
