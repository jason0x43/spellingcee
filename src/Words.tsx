import React from 'react';
import classNames from 'classnames';
import { isPangram } from './wordUtil';
import './Words.css';

interface WordsProps {
  words: string[];
}

export default function Words(props: WordsProps) {
  const { words } = props;
  return (
    <div className="Words">
      <div className="Words-grid">
        {words.sort().map((word, i) => {
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
  );
}
