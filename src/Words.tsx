import React from 'react';
import './Words.css';

interface WordsProps {
  words: string[];
}

export default function Words(props: WordsProps) {
  const { words } = props;
  return (
    <div className="Words">
      {words.map((word, i) => (
        <div key={i} className="Words-word">
          {word}
        </div>
      ))}
    </div>
  );
}
