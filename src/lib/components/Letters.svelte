<script type="ts">
  import { permute } from '$lib/util';
  import Letter from './Letter.svelte';

  export let letters: string;
  export let order: number;

  let activeLetter: string;
  let lastOrder = order;

  $: indexes = letters.split('').map((_, i) => i);

  $: {
    if (order !== lastOrder) {
      indexes = [indexes[0], ...permute(indexes.slice(1))];
      lastOrder = order;
    }
  }
</script>

<div class="letters">
  {#if letters}
    {#each letters as letter, i}
      <Letter index={indexes[i]} {letter} {activeLetter} />
    {/each}
  {/if}
</div>

<style>
  .letters {
    --letter-size: calc(10 * var(--unit));
    --letter-pad: calc(4 * var(--unit));
    margin: 0 auto;
    font-weight: var(--font-weight-bold);
    user-select: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    position: relative;
    width: calc(var(--letter-size) * 3 + var(--letter-pad) * 2);
    height: calc(var(--letter-size) * 3 + var(--letter-pad) * 2);
  }
</style>
