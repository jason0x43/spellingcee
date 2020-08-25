import React, {
  useCallback,
  useEffect,
  useState,
  MouseEventHandler,
} from 'react';
import classNames from 'classnames';
import './Letters.css';

interface LettersProps {
  letters: string[];
  center: string;
  updating?: boolean;
  onLetter(letter: string): void;
}

const letterSwapTimeout = 300;
const updatingTimeout = 100;
const tileSize = 100;

// Vertexes of hexagonal tiles
const points = (function () {
  const r = tileSize / 2;
  const n = 6;
  const p: number[][] = [];
  for (let i = 0; i < n; i++) {
    p.push([
      r + r * Math.cos((2 * Math.PI * i) / n),
      r + r * Math.sin((2 * Math.PI * i) / n),
    ]);
  }
  return p.map((pt) => `${pt[0]},${pt[1]}`).join(' ');
})();

export default function Letters(props: LettersProps) {
  const { letters: lettersProp, center, onLetter } = props;
  const [letters, setLetters] = useState<string[]>(lettersProp);
  const [activeLetter, setActiveLetter] = useState<string>();
  const [updating, setUpdating] = useState<boolean>(false);

  // Start updating, set timer to swap letters
  useEffect(() => {
    setUpdating(true);
    const timer = setTimeout(() => setLetters(lettersProp), letterSwapTimeout);
    return () => clearTimeout(timer);
  }, [lettersProp]);

  // Re-show letters
  useEffect(() => {
    const timer = setTimeout(() => setUpdating(false), updatingTimeout);
    return () => clearTimeout(timer);
  }, [letters]);

  const className = classNames({
    Letters: true,
    'Letters-updating': updating,
  });

  const handleMouseDown: MouseEventHandler = useCallback(
    (event) => {
      const letter = event.currentTarget.textContent as string;
      onLetter(letter);
      setActiveLetter(letter);
    },
    [onLetter]
  );

  const handleMouseUp: MouseEventHandler = useCallback(() => {
    setActiveLetter(undefined);
  }, []);

  const centerIndex = letters.indexOf(center);
  const otherLetters = [
    ...letters.slice(0, centerIndex),
    ...letters.slice(centerIndex + 1),
  ];
  const renderLetters = [
    ...otherLetters.slice(0, otherLetters.length / 2),
    center,
    ...otherLetters.slice(otherLetters.length / 2),
  ];

  return (
    <div className={className}>
      <div className="Letters-letters">
        {renderLetters.map((letter) => {
          const letterClassName = classNames({
            'Letters-letter': true,
            'Letters-letter-center': letter === center,
          });
          const shapeClassName = classNames({
            'Letters-letter-shape': true,
            'Letters-letter-shape-active': letter === activeLetter,
          });

          return (
            <svg
              key={letter}
              className={letterClassName}
              viewBox={`0 0 ${tileSize} ${tileSize}`}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
              <polygon className={shapeClassName} points={points} />
              <text
                x="50%"
                y="50%"
                dy="3%"
                dominantBaseline="middle"
                textAnchor="middle"
              >
                {letter}
              </text>
            </svg>
          );
        })}
      </div>
    </div>
  );
}
