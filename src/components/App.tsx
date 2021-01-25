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
  setLetterMessage,
  selectError,
  selectLetterMessage,
  selectWarning,
  setWarning,
  isUserLoading,
  isInputDisabled,
  isWordListExpanded,
  selectToastMessage,
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

const logger = createLogger({ prefix: 'App' });

const App: FunctionComponent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const inputDisabled = useSelector(isInputDisabled);
  const userLoading = useSelector(isUserLoading);
  const error = useSelector(selectError);
  const warning = useSelector(selectWarning);
  const letterMessage = useSelector(selectLetterMessage);
  const wordListExpanded = useSelector(isWordListExpanded);
  const isVertical = useMediaQuery(verticalQuery);
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
