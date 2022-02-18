import React, { useEffect, useState } from "react";
import { selectGameLetters, submitWord } from "../store/game.ts";
import { useAppDispatch, useAppSelector } from "../store/mod.ts";
import {
  addInput,
  removeInput,
  scrambleLetters,
  selectInput,
  selectInputDisabled,
  selectLetterIndices,
} from "../store/ui.ts";
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

const Letters: React.FC = () => {
  const [activeLetter, setActiveLetter] = useState<string>();
  const disabled = useAppSelector(selectInputDisabled);
  const letters = useAppSelector(selectGameLetters);
  const letterIndices = useAppSelector(selectLetterIndices);
  const input = useAppSelector(selectInput);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (disabled) {
        return;
      }

      // Ignore meta/control keys
      if (event.metaKey) {
        return;
      }

      const { key } = event;

      if (key.length > 1) {
        if (key === "Backspace" || key === "Delete") {
          dispatch(removeInput());
        } else if (key === "Enter") {
          if (input) {
            dispatch(submitWord());
          }
        }
      } else if (key === " ") {
        dispatch(scrambleLetters());
      } else if ((key >= "a" && key <= "z") || (key >= "A" && key <= "Z")) {
        dispatch(addInput(event.key));
      }
    };

    globalThis.addEventListener("keydown", handleKeyPress);

    return () => {
      globalThis.removeEventListener("keydown", handleKeyPress);
    };
  }, [disabled, dispatch, input]);

  const handleMouseDown = (event: React.MouseEvent | React.TouchEvent) => {
    // Ignore clicks to the outer SVG; only pay attention to clicks of child
    // nodes
    if (disabled || event.target === event.currentTarget) {
      return;
    }
    // Prevent both touch and click events from firing for a given action
    event.preventDefault();
    const letter = event.currentTarget.textContent as string;
    dispatch(addInput(letter));
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

  const renderLetter = (letter: string) => {
    const index = letters!.indexOf(letter);
    const letterIndex = letterIndices[index] || "center";
    const letterClassName = `Letters-letter Letters-letter-${letterIndex}`;
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
  };

  return (
    <div className="Letters">
      {letters && renderLetter(letters[0])}
      {letters && [...letters.slice(1)].map(renderLetter)}
    </div>
  );
};

export default Letters;
