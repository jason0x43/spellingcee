import React from 'react';
import classNames from 'classnames';
import './Letters.css';

interface LettersProps {
  letters: string[];
  center: string;
}

export default function Letters(props: LettersProps) {
  const { letters, center } = props;
  return (
    <div className="Letters">
      {letters.map((letter) => {
        const className = classNames({
          'Letters-letter': true,
          'Letters-letter-center': letter === center,
        });

        return (
          <div key={letter} className={className}>
            {letter}
          </div>
        );
      })}
    </div>
  );
}
