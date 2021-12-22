import { React, useCallback, useMemo, useState } from "../deps.ts";
import { classNames } from "../util.ts";

const tileSize = 100;

// Vertexes of hexagonal tiles
const points = (function () {
  const round2 = (val: number) =>
    Math.round((val + Number.EPSILON) * 100) /
    100;
  const r = tileSize / 2;
  const n = 6;
  const p: number[][] = [];
  for (let i = 0; i < n; i++) {
    p.push([
      round2(r + r * Math.cos((2 * Math.PI * i) / n)),
      round2(r + r * Math.sin((2 * Math.PI * i) / n)),
    ]);
  }
  return p.map((pt) => `${pt[0]},${pt[1]}`).join(" ");
})();

type Indices = { [letter: string]: number | "center" };

export interface LettersProps {
  addInput: (char: string) => void;
  disabled: boolean;
  letters: string[];
}

const Letters: React.FC<LettersProps> = (props) => {
  const { letters, disabled, addInput } = props;
  const [activeLetter, setActiveLetter] = useState<string>();

  const indices: Indices = useMemo(() => {
    const newIndices: Indices = { [letters[0]]: "center" };
    const nonCenter = letters.slice(1);
    for (let i = 0; i < nonCenter.length; i++) {
      newIndices[nonCenter[i]] = i;
    }
    return newIndices;
  }, [letters]);

  const handleMouseDown = (event: React.MouseEvent | React.TouchEvent) => {
    // Ignore clicks to the outer SVG; only pay attention to clicks of child
    // nodes
    if (disabled || event.target === event.currentTarget) {
      return;
    }
    // Prevent both touch and click events from firing for a given action
    event.preventDefault();
    const letter = event.currentTarget.textContent as string;
    addInput(letter);
    setActiveLetter(letter);
  };

  const handleMouseUp = (event: React.MouseEvent | React.TouchEvent) => {
    // Prevent both touch and click events from firing for a given action
    if (disabled) {
      return;
    }
    event.preventDefault();
    setActiveLetter(undefined);
  };

  const renderLetter = useCallback(
    (letter: string) => {
      const letterClassName = `Letters-letter Letters-letter-${
        indices[letter]
      }`;
      const shapeClassName = classNames({
        "Letters-letter-shape": true,
        "Letters-letter-shape-active": letter === activeLetter,
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
    [activeLetter, handleMouseUp, handleMouseDown, indices],
  );

  return (
    <div className="Letters">
      {renderLetter(letters[0])}
      {letters.slice(1).map(renderLetter)}
    </div>
  );
};

export default Letters;
