<script type="ts">
  export let index: number;
  export let letter: string;
  export let activeLetter: string;

  const tileSize = 100;

  // Vertexes of hexagonal tiles
  const points = (function () {
    const round2 = (val: number) =>
      Math.round((val + Number.EPSILON) * 100) / 100;
    const r = tileSize / 2;
    const n = 6;
    const p: number[][] = [];
    for (let i = 0; i < n; i++) {
      p.push([
        round2(r + r * Math.cos((2 * Math.PI * i) / n)),
        round2(r + r * Math.sin((2 * Math.PI * i) / n))
      ]);
    }
    return p.map((pt) => `${pt[0]},${pt[1]}`).join(' ');
  })();
</script>

<svg
  class={`letter letter-${index === 0 ? 'center' : index}`}
  viewBox={`0 0 ${tileSize} ${tileSize}`}
  on:mousedown
  on:touchstart
  on:mouseup
  on:touchend
>
  <polygon class="shape" class:active={letter === activeLetter} {points} />
  <text x="50%" y="50%" dy="3%" dominant-baseline="middle" text-anchor="middle">
    {letter}
  </text>
</svg>

<style>
  .letter {
    font-size: calc(var(--letter-size) * 0.5);
    text-transform: capitalize;
    position: absolute;
    top: calc(95% / 3);
    left: calc(95% / 3);
    height: calc(110% / 3);
    width: calc(110% / 3);
    transition: transform 0.5s;
    user-select: none;
    -webkit-user-select: none;
  }

  .shape {
    fill: var(--shaded);
    transform: scale(1);
    transition: all 0.1s;
    cursor: pointer;
  }

  .active {
    fill: var(--shaded-active);
    transform: scale(0.9);
    transform-origin: center center;
  }

  text {
    fill: var(--text-color);
    cursor: pointer;
  }

  .letter-center .shape {
    fill: var(--highlight);
  }

  .letter-center .active {
    fill: var(--highlight-active);
  }

  .letter-1 {
    transform: translate(-84%, -48%);
  }

  .letter-2 {
    transform: translate(0%, -96%);
  }

  .letter-3 {
    transform: translate(84%, -48%);
  }

  .letter-center {
    fill: var(--highlight);
    transform: translate(0, 0);
  }

  .letter-4 {
    transform: translate(84%, 48%);
  }

  .letter-5 {
    transform: translate(0%, 96%);
  }

  .letter-6 {
    transform: translate(-84%, 48%);
  }

  @media screen and (max-width: 640px) {
    .letters {
      --letter-size: calc(12 * var(--unit));
    }
  }
</style>
