import React from "react";
import { classNames } from "../util.ts";
import { getProgressLabel, getProgressThresholds } from "../wordUtil.ts";
import { useAppSelector } from "../store/mod.ts";
import { selectGame, selectWords } from "../store/game.ts";
import { computeScore } from "../../shared/util.ts";

const Progress: React.FC = () => {
  const game = useAppSelector(selectGame);
  const words = useAppSelector(selectWords);
  const { maxScore = 0 } = game ?? {};
  const thresholds = getProgressThresholds(maxScore);
  const score = computeScore(Object.values(words).map(({ word }) => word));
  const label = getProgressLabel(score, maxScore);
  const currentThreshold = thresholds.findIndex((item) => item.label === label);

  return (
    <div className="Progress">
      <span className="Progress-label">{label}</span>
      <ul className="Progress-thresholds">
        {thresholds.map((entry, i) => {
          const className = classNames({
            "Progress-threshold": true,
            "Progress-threshold-met": score >= entry.threshold,
            "Progress-threshold-current": i === currentThreshold,
            "Progress-threshold-next": i === currentThreshold + 1,
          });
          return (
            <li key={i} className={className}>
              {label === entry.label ? score : entry.threshold}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Progress;
