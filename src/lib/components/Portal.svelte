<script context="module" type="ts">
  export type Position = {
    vert: 'above' | 'below';
    horz: 'left' | 'right';
  };
</script>

<script lang="ts">
  import { getAppContext } from '$lib/contexts';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  const context = getAppContext();

  export let target: HTMLElement | null | undefined = undefined;
  /** The location or element to anchor to */
  export let anchor:
    | HTMLElement
    | { x: number; y: number }
    | 'modal'
    | undefined = undefined;
  /**
   * The position of the portal in relation to the anchor. If the position is
   * above-left, the bottom-left corner of the portal will be placed at the
   * bottom left corner of the anchor. Similarly, if the position is
   * bottom-right, the top-right corner of the portal will be placed at the
   * bottom-right corner of the anchor.
   */
  export let position: Position | undefined = undefined;

  let ref: HTMLElement;
  let style: string | undefined;

  $: {
    const translateY = position?.vert === 'above' ? '-100%' : '0%';
    const translateX = position?.horz === 'right' ? '-100%' : '0%';

    console.log('position:', position);

    if (anchor instanceof HTMLElement) {
      const box = anchor.getBoundingClientRect();
      const top = position?.vert === 'above' ? box.top : box.bottom;
      const left = position?.horz === 'left' ? box.left : box.right;
      console.log('box.left: ' + box.left);
      style = [
        `top:${top}px`,
        `left:${left}px`,
        `transform:translate(${translateX}, ${translateY})`
      ].join(';');
      console.log('style: ' + style);
    } else if (anchor && typeof anchor === 'object') {
      style = [
        `top:${anchor.y}px`,
        `left:${anchor.x}px`,
        `transform:translate(${translateX}, ${translateY})`
      ].join(';');
    } else if (!anchor) {
      style = `top:50%;left:50%;transform:translate(-50%,-50%)`;
    } else {
      style = undefined;
    }
  }

  onMount(() => {
    const elem = target ?? context.getRoot() ?? globalThis.document?.body;
    elem?.append(ref);
  });
</script>

<div
  class="portal"
  class:modal={anchor === 'modal'}
  bind:this={ref}
  {style}
  in:fade={{ duration: anchor === 'modal' ? 150 : 0 }}
  out:fade={{ duration: anchor === 'modal' ? 150 : 0 }}
>
  <slot />
</div>

<style>
  .portal {
    position: absolute;
    z-index: 200;
  }

  .modal {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(128, 128, 128, 0.85);
  }
</style>
