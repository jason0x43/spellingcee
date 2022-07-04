<script type="ts">
  const tileSize = 100;

  const points = (function () {
    const r = tileSize / 2;
    const n = 6;
    const p: number[][] = [];
    for (let i = 0; i < n; i++) {
      p.push([
        r + r * Math.cos((2 * Math.PI * i) / n),
        r + r * Math.sin((2 * Math.PI * i) / n)
      ]);
    }
    return p.map((pt) => `${pt[0]},${pt[1]}`).join(' ');
  })();

  const hexagons = [0, 1, 2, 'center', 3, 4, 5];
</script>

<div class="activity">
  {#each hexagons as id (id)}
    <svg class={`cell cell-${id}`} viewBox={`0 0 ${tileSize} ${tileSize}`}>
      <polygon class="cell-shape" {points} />
    </svg>
  {/each}
</div>

<style>
  .activity {
    display: flex;
    width: 64px;
    height: 64px;
    margin: var(--unit);
    position: relative;
  }

  .cell-shape {
    transform: scale(0.8);
    transition: all 0.1s;
    cursor: pointer;
  }

  .cell-shape-active {
    fill: var(--shaded-active);
    transform: scale(0.9);
    transform-origin: center center;
  }

  .cell {
    fill: var(--shaded);
    position: absolute;
    top: calc(95% / 3);
    left: calc(95% / 3);
    height: calc(110% / 3);
    width: calc(110% / 3);
    transition: transform 0.5s;
    animation: color-cycle 2s infinite;
  }

  .cell-0 {
    transform: translate(-80%, -46%);
    animation-delay: 0s;
  }

  .cell-1 {
    transform: translate(0%, -92%);
    animation-delay: 0.1s;
  }

  .cell-2 {
    transform: translate(80%, -46%);
    animation-delay: 0.2s;
  }

  .cell-center {
    fill: var(--highlight);
    transform: translate(0, 0);
    animation-delay: 0.6s;
  }

  .cell-3 {
    transform: translate(80%, 46%);
    animation-delay: 0.3s;
  }

  .cell-4 {
    transform: translate(0%, 92%);
    animation-delay: 0.4s;
  }

  .cell-5 {
    transform: translate(-80%, 46%);
    animation-delay: 0.5s;
  }

  @keyframes color-cycle {
    0% {
      fill: transparent;
    }
    33% {
      fill: var(--shaded);
    }
    66% {
      fill: var(--highlight);
    }
    100% {
      fill: transparent;
    }
  }
</style>
