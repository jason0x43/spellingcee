const thresholds = [
  { label: "beginner", threshold: 0.0 },
  { label: "good start", threshold: 0.02 },
  { label: "moving up", threshold: 0.05 },
  { label: "good", threshold: 0.08 },
  { label: "solid", threshold: 0.15 },
  { label: "nice", threshold: 0.25 },
  { label: "great", threshold: 0.4 },
  { label: "amazing", threshold: 0.5 },
  { label: "genius", threshold: 0.7 },
];

export function getProgressLabel(
  score: number,
  maxScore: number,
): string | undefined {
  const ratio = score / maxScore;
  let i = 0;
  while (i < thresholds.length && ratio > thresholds[i].threshold) {
    i++;
  }
  return thresholds[Math.max(i - 1, 0)].label;
}

export interface Threshold {
  label: string;
  threshold: number;
}

export function getProgressThresholds(maxScore: number): Threshold[] {
  return [
    { label: "beginner", threshold: 0 },
    { label: "good start", threshold: Math.ceil(0.02 * maxScore) },
    { label: "moving up", threshold: Math.ceil(0.05 * maxScore) },
    { label: "good", threshold: Math.ceil(0.08 * maxScore) },
    { label: "solid", threshold: Math.ceil(0.15 * maxScore) },
    { label: "nice", threshold: Math.ceil(0.25 * maxScore) },
    { label: "great", threshold: Math.ceil(0.4 * maxScore) },
    { label: "amazing", threshold: Math.ceil(0.5 * maxScore) },
    { label: "genius", threshold: Math.ceil(0.7 * maxScore) },
    { label: "queen bee", threshold: maxScore },
  ];
}
