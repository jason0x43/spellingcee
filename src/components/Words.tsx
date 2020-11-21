import React, {
  FunctionComponent,
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import classNames from 'classnames';
import { canGetDefinitions, getDefinition } from '../dictionary';
import { Words } from '../types';
import { isPangram } from '../wordUtil';
import Button from './Button';
import Modal from './Modal';
import Spinner from './Spinner';
import './Words.css';
import { useSelector } from 'react-redux';
import { selectValidWords, selectWords } from '../store';

type DefinedWord = {
  word: string;
  definition: string[] | undefined;
};

const Words: FunctionComponent = () => {
  const words = useSelector(selectWords);
  const validWords = useSelector(selectValidWords);
  const [alphabetical, setAlphabetical] = useState(false);
  const [definition, setDefinition] = useState<DefinedWord>();
  const [showWords, setShowWords] = useState(false);

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

  const displayWords = alphabetical
    ? Object.keys(words).sort()
    : Object.keys(words).reverse();
  if (displayWords.length === 0) {
    displayWords.push('');
  }

  const clickable = canGetDefinitions();

  const wordsContent = (
    <>
      <div className="Words-controls">
        <span className="Words-metrics">
          {Object.keys(words).length} / {validWords.length} words
        </span>
        <Button size="small" onClick={handleSortClick}>
          {alphabetical ? 'Chronological' : 'Alphabetical'}
        </Button>
      </div>
      <div className="Words-list-wrapper">
        <ul className="Words-list">
          {displayWords.map((word, i) => {
            const className = classNames({
              'Words-word': true,
              'Words-word-pangram': isPangram(word),
              'Words-word-clickable': clickable,
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
        ▲
      </Button>
    </>
  );

  return (
    <div
      className={classNames({
        Words: true,
        'Words-collapsed': !showWords,
      })}
    >
      {wordsContent}

      {definition && (
        <Modal onHide={handleHideModal}>
          {definition ? (
            definition.definition ? (
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
            )
          ) : (
            <div className="Words-modal">{wordsContent}</div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default Words;
