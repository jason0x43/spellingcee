import { React, useMemo } from "../deps.ts";
import { classNames } from "../util.ts";
import { getProgressLabel, getProgressThresholds } from "../wordUtil.ts";
import { GameData } from "../../types.ts";

export interface ProgressProps {
  gameData: GameData;
}

const Progress: React.FC<ProgressProps> = (props) => {
  const { gameData } = props;
  const { score, maxScore } = gameData;
  const thresholds = useMemo(() => getProgressThresholds(maxScore), [maxScore]);
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
