import React, {
  Fragment,
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import classNames from 'classnames';
import { canGetDefinitions, getDefinition } from './dictionary';
import { Words } from './types';
import { isPangram } from './wordUtil';
import Button from './Button';
import Modal from './Modal';
import Spinner from './Spinner';
import './Words.css';

interface WordsProps {
  words: Words;
  validWords: string[];
}

type DefinedWord = {
  word: string;
  definition: string[] | undefined;
};

export default function Words(props: WordsProps) {
  const { words, validWords } = props;
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
    setShowWords(false);
  }, [setDefinition]);

  const handleShowWords = useCallback(() => {
    setShowWords(true);
  }, [setShowWords]);

  const displayWords = alphabetical
    ? Object.keys(words).sort()
    : Object.keys(words).reverse();
  if (displayWords.length === 0) {
    displayWords.push('');
  }

  const clickable = canGetDefinitions();

  const wordsContent = (
    <Fragment>
      <div className="Words-controls">
        <span className="Words-metrics">
          {Object.keys(words).length} / {validWords.length} words
        </span>
        <Button size="small" onClick={handleSortClick}>
          {alphabetical ? 'Chronological' : 'Alphabetical'}
        </Button>
      </div>
      <div className="Words-grid-wrapper">
        <div className="Words-grid">
          {displayWords.map((word, i) => {
            const className = classNames({
              'Words-word': true,
              'Words-word-pangram': isPangram(word),
              'Words-word-clickable': clickable,
            });
            return (
              <div key={i} className={className} onClick={handleWordClick}>
                {word}
              </div>
            );
          })}
        </div>
        <Button
          className="Words-show-list"
          size="small"
          onClick={handleShowWords}
        >
          ▲
        </Button>
      </div>
    </Fragment>
  );

  return (
    <div className="Words">
      {wordsContent}

      {(definition || showWords) && (
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
}
