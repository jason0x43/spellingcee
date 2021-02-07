import classNames from 'classnames';
import React, {
  FunctionComponent,
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { canGetDefinitions, getDefinition } from '../dictionary';
import {
  AppDispatch,
  isWordListExpanded,
  selectUserId,
  selectValidWords,
  selectWords,
  setWordListExpanded,
} from '../store';
import { Words } from '../types';
import { useVerticalMediaQuery } from '../hooks';
import { isPangram } from '../wordUtil';
import Button from './Button';
import Modal from './Modal';
import Spinner from './Spinner';
import './Words.css';

type DefinedWord = {
  word: string;
  definition: string[] | undefined;
};

const Words: FunctionComponent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const words = useSelector(selectWords);
  const validWords = useSelector(selectValidWords);
  const [alphabetical, setAlphabetical] = useState(false);
  const [definition, setDefinition] = useState<DefinedWord>();
  const [showWords, setShowWords] = useState(false);
  const isVertical = useVerticalMediaQuery();
  const listRef = useRef<HTMLDivElement>(null);
  const expanded = useSelector(isWordListExpanded);
  const userId = useSelector(selectUserId);

  const handleSortClick = useCallback(() => {
    setAlphabetical(!alphabetical);
  }, [setAlphabetical, alphabetical]);

  const modalTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (modalTimer.current) {
        clearTimeout(modalTimer.current);
      }
    };
  }, []);

  const handleWordClick: MouseEventHandler = useCallback(
    async (event) => {
      if (canGetDefinitions()) {
        if (modalTimer.current) {
          clearTimeout(modalTimer.current);
        }
        const word = event.currentTarget.textContent as string;
        setDefinition({ word, definition: undefined });
        const start = Date.now();
        const definition = await getDefinition(word);
        modalTimer.current = setTimeout(
          () => {
            setDefinition({ word, definition });
          },
          Math.max(1000 - (Date.now() - start)),
          0
        );
      }
    },
    [setDefinition]
  );

  const handleHideModal = useCallback(() => {
    setDefinition(undefined);
  }, [setDefinition]);

  const handleShowWords = useCallback(() => {
    setShowWords(!showWords);
  }, [setShowWords, showWords]);

  const renderWordsContent = useCallback(() => {
    const displayWords =
      alphabetical && (!isVertical || showWords)
        ? Object.keys(words).sort()
        : Object.keys(words).sort(
            (a, b) => words[b].addedAt - words[a].addedAt
          );

    return (
      <>
        <div className="Words-list-wrapper">
          <ul
            className={classNames({
              'Words-list': true,
              'Words-list-clickable': canGetDefinitions(),
            })}
          >
            {displayWords.map((word, i) => {
              const className = classNames({
                'Words-word': true,
                'Words-word-pangram': isPangram(word),
                'Words-word-own': words[word].addedBy === userId,
              });
              return (
                <li key={i} className={className} onClick={handleWordClick}>
                  {word}
                </li>
              );
            })}
          </ul>
        </div>
        <Button
          className="Words-show-list"
          size="small"
          onClick={handleShowWords}
        >
          ▼
        </Button>
        <div className="Words-controls">
          <span className="Words-metrics">
            {Object.keys(words).length} / {validWords.length} words
          </span>
          <Button size="small" onClick={handleSortClick}>
            {alphabetical ? 'Time' : 'Alpha'}
          </Button>
        </div>
      </>
    );
  }, [
    alphabetical,
    handleShowWords,
    handleSortClick,
    handleWordClick,
    isVertical,
    showWords,
    userId,
    validWords,
    words,
  ]);

  useEffect(() => {
    dispatch(setWordListExpanded(showWords));
  }, [dispatch, showWords]);

  return (
    <>
      <div
        className={classNames({
          Words: true,
          'Words-collapsed': !showWords,
          'Words-expanded': expanded,
        })}
        ref={listRef}
      >
        {renderWordsContent()}

        {definition && (
          <Modal onHide={handleHideModal}>
            {definition.definition ? (
              <div className="Definition">
                <div className="Definition-word">{definition.word}</div>
                <ol className="Definition-definitions">
                  {definition.definition.map((def, i) => (
                    <li className="Definition-definition" key={i}>
                      {def}
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <Spinner />
            )}
          </Modal>
        )}
      </div>
    </>
  );
};

export default Words;
