<script type="ts">
  import Portal, { type Position } from './Portal.svelte';

  type Item =
    | string
    | { label?: string; type?: never; value: string }
    | { label: string; type: 'link'; value: string };

  export let items: Item[];
  export let anchor: HTMLElement;
  export let position: Position | undefined = undefined;
  export let onClose: () => void;
  export let onSelect: ((value: string) => void) | undefined = undefined;

  let listElem: HTMLUListElement;

  function handleClick(event: MouseEvent) {
    if (!event.target || !listElem.contains(event.target as HTMLElement)) {
      onClose();
    }
  }

  function handleItemClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName === 'A') {
      onClose();
    } else {
      const value = target.getAttribute('data-value');
      if (value) {
        onSelect?.(value);
        onClose();
      }
    }
  }
</script>

<svelte:window on:click={handleClick} />

<Portal {anchor} {position}>
  <ul class="menu" bind:this={listElem} on:click={handleItemClick}>
    {#each items as item (typeof item === 'string' ? item : item.value)}
      {#if typeof item === 'string'}
        <li class="label">{item}</li>
      {/if}
      {#if typeof item !== 'string'}
        {#if item.type === 'link'}
          <li><a href={item.value}>{item.label}</a></li>
        {/if}
        {#if item.type !== 'link'}
          <li data-value={item.value}>
            {item.label ?? item.value}
          </li>
        {/if}
      {/if}
    {/each}
  </ul>
</Portal>

<style>
  .menu {
    background: var(--background);
    border: solid 1px var(--border);
    border-radius: var(--border-radius);
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    box-shadow: 2px 4px 8px rgba(0, 0, 0, 0.2);
    color: var(--foreground);
    list-style-type: none;
    padding: 0;
    margin: 0;
    margin-top: 1px;
    min-width: 100px;
    overflow: hidden;
  }

  li {
    padding: 0.5rem;
    white-space: nowrap;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
  }

  li[data-value] {
    cursor: pointer;
  }

  a {
    text-decoration: none;
  }

  @media (hover: hover) {
    li[data-value]:hover {
      background: var(--shaded-hover);
    }
  }
</style>
