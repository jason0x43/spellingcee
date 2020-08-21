import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import './Letters.css';

interface LettersProps {
  letters: string[];
  center: string;
  updating?: boolean;
}

const letterSwapTimeout = 400;

export default function Letters(props: LettersProps) {
  const { letters: lettersProp, center } = props;
  const [letters, setLetters] = useState<string[]>([]);
  const [updating, setUpdating] = useState<boolean>(false);

  // Update and re-show letters
  useEffect(() => {
    setUpdating(true);
    const timer = setTimeout(() => {
      setLetters(lettersProp);
      setUpdating(false);
    }, letterSwapTimeout);
    return () => clearTimeout(timer);
  }, [lettersProp]);

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
