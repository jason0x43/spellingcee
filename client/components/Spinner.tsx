import { React } from "../deps.ts";

export type SpinnerProps = {
  label?: string;
};

const tileSize = 100;

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
  return p.map((pt) => `${pt[0]},${pt[1]}`).join(" ");
})();

const hexagons = [0, 1, 2, "center", 3, 4, 5];

const Spinner: React.FC = () => {
  return (
    <div className="Spinner">
      {hexagons.map((id) => (
        <svg
          className={`Spinner-cell Spinner-cell-${id}`}
          key={id}
          viewBox={`0 0 ${tileSize} ${tileSize}`}
        >
          <polygon className="Spinner-cell-shape" points={points} />
        </svg>
      ))}
    </div>
  );
};

export default Spinner;
