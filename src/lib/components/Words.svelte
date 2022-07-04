<script type="ts">
  import type { GameWord } from '@prisma/client';
  import { isPangram } from '$lib/words';
  import { session } from '$app/stores';
  import Dialog from './Dialog.svelte';
  import Activity from './Activity.svelte';
  import Portal from './Portal.svelte';
  import type { GameWithWords } from '$lib/db/game';

  export let game: GameWithWords | undefined;
  export let words: GameWord[] | undefined = [];

  function byWord(a: GameWord, b: GameWord) {
    if (a.word <= b.word) {
      return -1;
    }
    if (a.word > b.word) {
      return 1;
    }
    return 0;
  }

  function byTime(a: GameWord, b: GameWord) {
    if (a.addedAt <= b.addedAt) {
      return -1;
    }
    if (a.addedAt > b.addedAt) {
      return 1;
    }
    return 0;
  }

  function defineWord(word: string) {
    console.log(`defining ${word}`);
  }

  let sort: 'time' | 'alpha' = 'time';
  let isVertical = false;
  let wordListExpanded = true;
  let definition: { word: string; definition: string[] } | undefined;

  $: user = $session.user;

  $: displayWords =
    sort === 'alpha' && (!isVertical || wordListExpanded)
      ? (words ?? []).slice().sort(byWord)
      : (words ?? []).slice().sort(byTime);
</script>

<div
  class="words"
  class:collapsed={!wordListExpanded}
  class:expanded={wordListExpanded}
>
  <div class="list-wrapper">
    <ul class="list list-clickable">
      {#each displayWords as word (word.word)}
        <li
          class="word"
          class:word-pangram={isPangram(word.word)}
          class:word-own={word.userId === user?.id}
          on:click={() => defineWord(word.word)}
        >
          {word.word}
        </li>
      {/each}
    </ul>
  </div>
  <button
    class="show-list"
    on:click={() => (wordListExpanded = !wordListExpanded)}>▼</button
  >
  <div class="controls">
    <span class="metrics">
      {words?.length} / {game?.maxWords} words
    </span>
    <div class="buttons">
      <button
        class="button sort-button"
        on:click={() => {
          sort = sort === 'alpha' ? 'time' : 'alpha';
        }}>{sort === 'time' ? 'Time' : 'Alpha'}</button
      >
    </div>
  </div>

  {#if definition}
    <Portal anchor="modal">
      {#if definition.definition}
        <Dialog onClose={() => (definition = undefined)}>
          <div class="definitions">
            <div class="word">{definition.word}</div>
            <ol class="definitions-list">
              {#each definition.definition as def (def)}
                <li class="definition">
                  {def}
                </li>
              {/each}
            </ol>
          </div>
        </Dialog>
      {/if}

      {#if !definition.definition}
        <Activity />
      {/if}
    </Portal>
  {/if}
</div>

<style>
  .words {
    border: solid 1px var(--border-color);
    border-radius: var(--border-radius);
    font-weight: var(--font-weight-normal);
    flex: 1;
    width: 100%;
    background: var(--background);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--unit);
    padding-left: var(--big-space);
  }

  .metrics {
    font-size: var(--font-size-small);
    color: var(--text-color-dim);
  }

  .list-wrapper {
    position: relative;
    flex: 1;
    display: block;
    padding-right: 25px;
    overflow: hidden;
  }

  .list {
    list-style-type: none;
    overflow-x: auto;
    overflow-y: hidden;
    margin: 0;
    padding: 0;
    display: flex;
    flex-flow: column wrap;
    align-content: flex-start;
    position: absolute;
    bottom: 0;
    left: 0;
    top: 0;
    right: 0;
  }

  .word-pangram {
    font-weight: var(--font-weight-bold);
  }

  .word {
    display: block;
    padding: var(--unit) var(--big-space);
    text-align: left;
    margin-right: calc(var(--unit) * 8);
  }

  .word:not(.word-own) {
    color: var(--text-color-dim);
  }

  .list-clickable .word {
    cursor: pointer;
  }

  .list-clickable .word:hover {
    text-decoration: underline;
  }

  .show-list {
    display: none;
  }

  .definitions {
    font-family: serif;
    font-size: var(--font-size-normal);
    padding: calc(var(--big-space) * 2);
  }

  .definitions .word {
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-large);
  }

  .definitions-list {
    text-align: left;
    margin: 0;
    margin-top: 1em;
    padding-left: 1.5em;
    font-style: italic;
    max-width: 20em;
  }

  .definitions .definition {
    margin-bottom: 1em;
    font-style: italic;
  }

  .definition:last-child {
    margin-bottom: 0;
  }

  .buttons {
    display: flex;
    gap: 8px;
  }

  .button {
    font-size: var(--font-size-small);
    padding: 1px 6px;
    border-radius: 4px;
    border: solid 1px var(--border-color);
    background: var(--shaded-hover);
    text-decoration: none;
  }

  @media screen and (max-width: 640px) {
    .words {
      position: relative;
      bottom: 0;
      min-height: 38px;
      flex: 0;
      transition: all 0.25s;
    }

    .words:not(.collapsed) {
      height: calc(100% - 40px);
      flex: 1;
    }

    .words:not(.expanded) .controls {
      display: none;
    }

    /* Hide the words list as it transitions */
    .words:not(.expanded):not(.collapsed) .list {
      display: none;
    }

    .collapsed .list {
      flex-direction: row;
      flex-wrap: nowrap;
      align-items: center;
      padding-bottom: 0;
    }

    .collapsed .word {
      margin-right: 0;
    }

    .list .word {
      padding: 8px;
    }

    .words .show-list {
      display: block;
      position: absolute;
      right: 0;
      top: 1px;
      margin: 0;
      height: calc(var(--unit) * 6);
      background: var(--background);
      border: none;
      box-shadow: -8px 0 8px var(--background);
    }
  }
</style>
