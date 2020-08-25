import React, {
  MouseEventHandler,
  useCallback,
  useEffect,
  useState,
} from 'react';
import classNames from 'classnames';
import { canGetDefinitions, getDefinition } from './dictionary';
import { isPangram } from './wordUtil';
import Button from './Button';
import Modal from './Modal';
import './Words.css';

interface WordsProps {
  words: string[];
  validWords: string[];
}

type DefinedWord = {
  word: string;
  definition: string[];
};

export default function Words(props: WordsProps) {
  const { words, validWords } = props;
  const [alphabetical, setAlphabetical] = useState(false);
  const [definition, setDefinition] = useState<DefinedWord>();
  const [showWords, setShowWords] = useState(false);

  const handleSortClick = useCallback(() => {
    setAlphabetical(!alphabetical);
  }, [setAlphabetical, alphabetical]);

  const handleWordClick: MouseEventHandler = useCallback(
    async (event) => {
      if (canGetDefinitions()) {
        const word = event.currentTarget.textContent as string;
        const definition = await getDefinition(word);
        setDefinition({ word, definition });
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

  const displayWords = alphabetical ? [...words].sort() : [...words].reverse();
  if (displayWords.length === 0) {
    displayWords.push('');
  }

  return (
    <div className="Words">
      <div className="Words-controls">
        <span className="Words-metrics">
          {words.length} / {validWords.length} words
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
              'Words-word-clickable': canGetDefinitions(),
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

      {(definition || showWords) && (
        <Modal onHide={handleHideModal}>
          {definition ? (
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
            <ul className="Words-grid">
              {words.map((word) => (
                <li className="Words-word" key={word} onClick={handleWordClick}>
                  {word}
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </div>
  );
}
