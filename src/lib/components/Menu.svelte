<script type="ts">
  import Portal from './Portal.svelte';

  type Item = string | { label?: string; value: string };

  export let items: Item[];
  export let anchor: HTMLElement;
  export let onClose: () => void;
  export let onSelect: (value: string) => void;

  let listElem: HTMLUListElement;

  function handleClick(event: MouseEvent) {
    if (!event.target || !listElem.contains(event.target as HTMLElement)) {
      onClose();
    }
  }

  function handleItemClick(
    event: MouseEvent & { currentTarget: EventTarget & HTMLElement }
  ) {
    const value = event.currentTarget.getAttribute('data-value');
    if (value) {
      onSelect(value);
      onClose();
    }
  }
</script>

<svelte:window on:click={handleClick} />

<Portal {anchor}>
  <ul class="menu" bind:this={listElem} on:click={handleItemClick}>
    {#each items as item (typeof item === 'string' ? item : item.value)}
      {#if typeof item === 'string'}
        <li class="label">{item}</li>
      {/if}
      {#if typeof item !== 'string'}
        <li data-value={item.value}>
          {item.label ?? item.value}
        </li>
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

  @media (hover: hover) {
    li[data-value]:hover {
      background: var(--shaded-hover);
    }
  }
</style>
