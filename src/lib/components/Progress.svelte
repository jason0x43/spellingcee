<script type="ts">
  import type { GameWithWords } from '../db/game';
  import { computeScore } from '../words';

  export let game: GameWithWords | undefined;

  const thresholds = [
    { label: 'beginner', threshold: 0.0 },
    { label: 'good start', threshold: 0.02 },
    { label: 'moving up', threshold: 0.05 },
    { label: 'good', threshold: 0.08 },
    { label: 'solid', threshold: 0.15 },
    { label: 'nice', threshold: 0.25 },
    { label: 'great', threshold: 0.4 },
    { label: 'amazing', threshold: 0.5 },
    { label: 'genius', threshold: 0.7 }
  ];

  $: maxScore = game?.maxScore ?? 0;
  $: score = computeScore(game?.words.map(({ word }) => word) ?? []);

  let label: string;
  let currentThreshold: number;

  $: {
    const ratio = score / maxScore;
    let i = 0;
    while (i < thresholds.length && ratio > thresholds[i].threshold) {
      i++;
    }
    label = thresholds[Math.max(i - 1, 0)].label;
    currentThreshold = thresholds.findIndex((item) => item.label === label);
  }
</script>

<div class="progress">
  <span class="label">{label}</span>
  <ul class="thresholds">
    {#each thresholds as entry, i}
      <li
        class="threshold"
        class:met={score >= maxScore * entry.threshold}
        class:current={i === currentThreshold}
        class:next={i === currentThreshold + 1}
      >
        {label === entry.label ? score : Math.floor(maxScore * entry.threshold)}
      </li>
    {/each}
  </ul>
</div>

<style>
  .progress {
    display: flex;
    align-items: center;
    text-transform: capitalize;
    justify-content: center;
    user-select: none;
    flex-shrink: 0;
  }

  .label {
    white-space: nowrap;
  }

  .thresholds {
    display: flex;
    list-style-type: none;
    margin: 0;
    padding: 0;
    flex-grow: 1;
    align-items: center;
    justify-content: space-between;
    margin-left: 1em;
  }

  .threshold {
    --size: calc(var(--unit) * 3);
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    cursor: default;
    font-size: calc(var(--size) / 2);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: calc(var(--size) / 4);
    width: var(--size);
    height: var(--size);
    background: var(--shaded);
    color: var(--text-color-dim);
    margin-left: calc(var(--unit) * 1.5);
  }

  .met {
    background: var(--highlight);
    color: var(--highlight);
  }

  .current,
  :not(.met) {
    padding-left: var(--unit);
    padding-right: var(--unit);
  }

  .current,
  .next {
    --size: var(--font-size-large);
  }

  .next,
  :not(.met) {
    color: var(--text-color);
  }

  .current {
    color: var(--text-color-bright);
  }

  @media screen and (max-width: 480px) {
    .thresholds {
      flex-grow: 0;
    }

    .threshold {
      display: none;
    }

    .current,
    .next {
      display: flex;
      padding-left: var(--unit);
      padding-right: var(--unit);
    }
  }

  @media screen and (min-width: 641px) and (max-width: 800px) {
    .thresholds {
      flex-grow: 0;
    }

    .threshold {
      display: none;
    }

    .current,
    .next {
      display: flex;
      padding-left: var(--unit);
      padding-right: var(--unit);
    }
  }
</style>
