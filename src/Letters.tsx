import React from 'react';
import classNames from 'classnames';
import './Letters.css';

interface LettersProps {
  letters: string[];
  center: string;
  updating?: boolean;
}

export default function Letters(props: LettersProps) {
  const { letters, center, updating } = props;
  const className = classNames({
    Letters: true,
    'Letters-updating': updating,
  });

  return (
    <div className={className}>
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
