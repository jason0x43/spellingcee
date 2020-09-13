import React, { useCallback, useState } from 'react';
import classNames from 'classnames';
import { createLogger } from './logging';
import { AppDispatch } from './state';
import Button from './Button';
import './Letters.css';

interface LettersProps {
  letters: string[];
  center: string;
  dispatch: AppDispatch;
  onSubmit(): void;
  disabled?: boolean;
  updating?: boolean;
}

const tileSize = 100;
const logger = createLogger({ prefix: 'Letters' });

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

type Indices = { [letter: string]: number | 'center' };

export default function Letters(props: LettersProps) {
  const {
    letters,
    center,
    disabled,
    dispatch,
    onSubmit
  } = props;
  const [activeLetter, setActiveLetter] = useState<string>();

  const centerIndex = letters.indexOf(center);
  const otherLetters = [
    ...letters.slice(0, centerIndex),
    ...letters.slice(centerIndex + 1),
  ];
  const renderLetters = otherLetters.slice().sort();
  const indices: Indices = { [center]: 'center' };
  for (let i = 0; i < otherLetters.length; i++) {
    indices[otherLetters[i]] = i;
  }

  const handleMouseDown = useCallback(
    (event) => {
      // Ignore clicks to the outer SVG; only pay attention to clicks of child
      // nodes
      if (disabled || event.target === event.currentTarget) {
        return;
      }
      // Prevent both touch and click events from firing for a given action
      event.preventDefault();
      const letter = event.currentTarget.textContent as string;
      dispatch({ type: 'addInput', payload: letter });
      setActiveLetter(letter);
    },
    [disabled, dispatch, setActiveLetter]
  );

  const handleMouseUp = useCallback(
    (event) => {
      // Prevent both touch and click events from firing for a given action
      if (disabled) {
        return;
      }
      event.preventDefault();
      setActiveLetter(undefined);
    },
    [disabled, setActiveLetter]
  );

  const renderLetter = useCallback(
    (letter: string) => {
      const letterClassName = `Letters-letter Letters-letter-${indices[letter]}`;
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
          onTouchStart={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
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
    },
    [activeLetter, handleMouseUp, handleMouseDown, indices]
  );

  const handleDelete = useCallback(() => {
    if (!disabled) {
      dispatch({ type: 'deleteInput' });
    }
  }, [disabled, dispatch]);

  const handleScramble = useCallback(() => {
    if (!disabled) {
      dispatch({ type: 'mixLetters' });
    }
  }, [disabled, dispatch]);

  return (
    <div className="Letters">
      <div className="Letters-letters">
        {renderLetter(center)}
        {renderLetters.map(renderLetter)}
      </div>
      <div className="Letters-controls">
        <Button onClick={handleDelete}>Delete</Button>
        <Button onClick={handleScramble}>Mix</Button>
        <Button onClick={onSubmit}>Enter</Button>
      </div>
    </div>
  );
}
