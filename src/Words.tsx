import React, { MouseEventHandler, useCallback, useState } from 'react';
import classNames from 'classnames';
import { canGetDefinitions, getDefinition } from './dictionary';
import { isPangram } from './wordUtil';
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
  const [alphabetical, setAlphabetical] = useState<boolean>(false);
  const [definition, setDefinition] = useState<DefinedWord>();

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
  }, [setDefinition]);

  const displayWords = alphabetical ? [...words].sort() : [...words].reverse();

  return (
    <div className="Words">
      <div className="Words-controls">
        <span className="Words-metrics">
          {words.length} / {validWords.length} words
        </span>
        <button onClick={handleSortClick}>
          {alphabetical ? 'Chronological' : 'Alphabetical'}
        </button>
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
      </div>
      {definition && (
        <Modal onHide={handleHideModal}>
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
        </Modal>
      )}
    </div>
  );
}
