import React, { useCallback, useState } from 'react';
import classNames from 'classnames';
import { isPangram } from './wordUtil';
import './Words.css';

interface WordsProps {
  words: string[];
}

export default function Words(props: WordsProps) {
  const { words } = props;
  const [alphabetical, setAlphabetical] = useState<boolean>(false);

  const handleClick = useCallback(() => {
    setAlphabetical(!alphabetical);
  }, [setAlphabetical, alphabetical]);

  const displayWords = alphabetical ? [...words].sort() : words;

  return (
    <div className="Words">
      <div className="Words-controls">
        <button onClick={handleClick}>
          {alphabetical ? 'Alphabetical' : 'Chronological'}
        </button>
      </div>
      <div className="Words-grid-wrapper">
        <div className="Words-grid">
          {displayWords.map((word, i) => {
            const className = classNames({
              'Words-word': true,
              'Words-word-pangram': isPangram(word),
            });
            return (
              <div key={i} className={className}>
                {word}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
