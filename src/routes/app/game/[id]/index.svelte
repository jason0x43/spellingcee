<script type="ts">
  import { onMediaQuery } from '$lib/browser';
  import { onMount } from 'svelte';
  import Progress from '$lib/components/Progress.svelte';
  import type { GameWithWords } from '$lib/db/game';
  import Words from '$lib/components/Words.svelte';
  import Activity from '$lib/components/Activity.svelte';
  import LetterInput from '$lib/components/LetterInput.svelte';
  import Letters from '$lib/components/Letters.svelte';
  import { post } from '$lib/request';
  import { invalidate } from '$app/navigation';

  export let game: GameWithWords | undefined;

  let wordListExpanded = false;
  let isVertical = false;
  let input = '';
  let order = 1;
  let invalid = false;

  async function handleKeyPress(event: KeyboardEvent) {
    const { key } = event;
    if (key.length > 1) {
      if (key === 'Backspace' || key === 'Delete') {
        input = input.slice(0, input.length - 1);
      } else if (key === 'Enter') {
        if (input && game) {
          try {
            await post(`/api/game/${game.id}/words`, { word: input });
            invalidate(`/app/game/${game.id}`);
            input = '';
          } catch (error) {
            invalid = true;
            setTimeout(() => {
              invalid = false;
              input = '';
            }, 750);
          }
        }
      }
    } else if (key === ' ') {
      order += 1;
    } else if ((key >= 'a' && key <= 'z') || (key >= 'A' && key <= 'Z')) {
      input += key.toLowerCase();
    }
  }

  onMount(() => {
    return onMediaQuery('(max-width: 640px)', (matches) => {
      isVertical = matches;
    });
  });
</script>

<svelte:window on:keypress={handleKeyPress} />

<div class="game" class:game-words-expanded={wordListExpanded}>
  {#if game}
    {#if isVertical}
      <div class="words">
        <Progress {game} />
        <Words {game} words={game.words} />
      </div>
    {/if}

    <div class="letters">
      <LetterInput {input} validLetters={game.key} {invalid} />
      <Letters letters={game.key} {order} />
      <!-- <div class="App-letters-controls"> -->
      <!--   <Button -->
      <!--     disabled={inputDisabled} -->
      <!--     onClick={() => popLetter()} -->
      <!--     label="Delete" -->
      <!--   /> -->
      <!--   <Button -->
      <!--     disabled={inputDisabled} -->
      <!--     onClick={() => scrambleLetters()} -->
      <!--     label="Mix" -->
      <!--   /> -->
      <!--   <Button -->
      <!--     disabled={inputDisabled} -->
      <!--     onClick={() => submitInput()} -->
      <!--     label="Enter" -->
      <!--   /> -->
      <!-- </div> -->
      <!-- <ToastMessage message={letterMessage} /> -->
    </div>

    {#if !isVertical}
      <div class="words">
        <Progress {game} />
        <Words {game} words={game.words} />
      </div>
    {/if}
  {/if}

  {#if !game}
    <Activity />
  {/if}
</div>

<style>
  .game {
    --content-margin: calc(var(--unit) * 4);
    --inner-content-padding: calc(var(--unit) * 6);
    display: flex;
    position: relative;
    margin: var(--content-margin) calc(var(--content-margin) * 2);
    gap: calc(var(--content-margin) * 2);
  }

  .words {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    width: 100%;
    justify-content: flex-start;
    position: relative;
    gap: var(--gap);
  }

  .letters {
    display: flex;
    flex-direction: column;
    gap: var(--content-margin);
  }

  @media screen and (max-width: 640px) {
    .game {
      flex-direction: column;
    }
  }
</style>
