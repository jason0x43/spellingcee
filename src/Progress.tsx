import React, { useMemo } from 'react';
import classNames from 'classnames';
import { getProgressLabel, getProgressThresholds } from './wordUtil';
import './Progress.css';

interface ProgressProps {
  score: number;
  maxScore: number;
}

export default function Progress(props: ProgressProps) {
  const { score, maxScore } = props;
  const thresholds = useMemo(() => getProgressThresholds(maxScore), [maxScore]);
  const label = getProgressLabel(score, maxScore);
  return (
    <div className="Progress">
      <span>{label}</span>
      <ul className="Progress-thresholds">
        {thresholds.map((entry) => {
          const className = classNames({
            'Progress-threshold': true,
            'Progress-threshold-met': score >= entry.threshold,
            'Progress-threshold-current': label === entry.label
          });
          return (
            <li key={entry.threshold}>
              <span className={className}>{entry.threshold}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}