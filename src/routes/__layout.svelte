<script type="ts">
  import { onMount } from 'svelte';
  import { displayType } from '$lib/stores';
  import { setAppContext } from '$lib/contexts';

  let ref: HTMLDivElement;

  $: setAppContext({ getRoot: () => ref });

  onMount(() => {
    const matcher = globalThis.matchMedia('(max-width: 640px)');
    const listener = (event: MediaQueryListEvent) => {
      $displayType = event.matches ? 'mobile' : 'desktop';
    };
    matcher.addEventListener('change', listener);
    $displayType = matcher.matches ? 'mobile' : 'desktop';

    return () => {
      matcher.removeEventListener('change', listener);
    };
  });
</script>

<div id="root" bind:this={ref}>
  <slot />
</div>

<style>
  #root {
    --unit: min(1vh, 6px);
    --background: #ffffff;
    --background-glass: rgba(225, 225, 225, 0.8);
    --text-color: #222;
    --text-color-dim: #999;
    --text-color-bright: #111;
    --font-weight-normal: 400;
    --font-weight-bold: 700;
    --font-size: calc(var(--unit) * 2.8);
    --font-size-small: calc(var(--font-size) * 0.875);
    --font-size-large: calc(var(--font-size) * 1.5);
    --gap: 1rem;
    --highlight: #bbddff;
    --highlight-active: #99ccff;
    --shaded: #eeeeee;
    --shaded-active: #bbbbbb;
    --shaded-hover: #dddddd;
    --border-color: #cccccc;
    --shadow-color: rgba(100, 100, 100, 0.07);
    --big-space: calc(var(--unit) * 2);
    --border-radius: 6px;
    --warn-background: orange;
    --warn-foreground: var(--text-color);
    font-family: sans-serif;
    height: 100%;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  :global(*:focus) {
    outline: none;
  }

  :global(a) {
    color: var(--link);
  }

  :global(input) {
    background: var(--hover-matte);
    border: solid 1px var(--border-color);
    border-radius: var(--border-radius);
    font-size: var(--font-size);
    margin: 0;
    padding: 4px;
  }

  :global(button) {
    background: var(--shaded-hover);
    border: solid 1px var(--border-color);
    border-radius: var(--border-radius);
    color: var(--foreground);
    font-size: var(--font-size);
    padding: 4px 6px;
    margin: 0;
    cursor: pointer;
  }

  :global(button:active) {
    background: var(--shaded-active);
  }

  /* Mobile */
  @media only screen and (max-width: 800px) {
    #root {
      --sidebar-width: 100%;
      --font-size: 18px;
    }
  }
</style>
