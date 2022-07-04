<script type="ts">
  import ChevronLeft from '$lib/icons/ChevronLeft.svelte';
  import ChevronRight from '$lib/icons/ChevronRight.svelte';
  import { put } from '$lib/request';
  import { ratingNames, type Rating } from '$lib/words';
  import type {
    UpdateWordRequest,
    UpdateWordResponse
  } from 'src/routes/api/words';
  import type { WordAndRating } from '.';

  export let words: WordAndRating[];

  let index = 0;

  async function rateWord(rating: Rating) {
    const entry = words[index];
    try {
      await put<UpdateWordRequest, UpdateWordResponse>('/api/words', {
        word: entry[0],
        rating
      });
      words = [
        ...words.slice(0, index),
        [entry[0], rating],
        ...words.slice(index + 1)
      ];
      index++;
    } catch (error) {
      console.warn(error);
    }
  }
</script>

<div class="root">
  <div class="card">
    <div class="center">
      <button
        on:click={(event) => {
          index = Math.max(index - 1, 0);
          event.preventDefault();
        }}><ChevronLeft size={30} /></button
      >
      <div class="content">
        <div class="word-wrapper">
          <h3
            class="word"
            class:easy={words[index][1] === ratingNames.easy}
            class:medium={words[index][1] === ratingNames.medium}
            class:hard={words[index][1] === ratingNames.hard}
          >
            {words[index][0]}
          </h3>
        </div>
        <p>{index + 1} / {words.length}</p>
      </div>
      <button
        on:click={(event) => {
          index = Math.min(index + 1, words.length - 1);
          event.preventDefault();
        }}><ChevronRight size={30} /></button
      >
    </div>
    <div class="controls">
      <button on:click={() => rateWord(ratingNames.easy)} class="easy"
        >Easy</button
      >
      <button on:click={() => rateWord(ratingNames.medium)} class="medium"
        >Medium</button
      >
      <button on:click={() => rateWord(ratingNames.hard)} class="hard"
        >Hard</button
      >
    </div>
  </div>
</div>

<style>
  .root {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-grow: 1;
    --easy: #0c0;
    --medium: #fa0;
    --hard: #f00;
  }

  .card {
    border: solid 1px var(--border-color);
    display: flex;
    flex-direction: column;
    border-radius: var(--border-radius);
    overflow: hidden;
    width: 30rem;
  }

  .center {
    display: flex;
  }

  .center button {
    border: none;
    border-radius: 0;
    background: none;
  }

  .center button:hover {
    background: var(--shaded);
  }

  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-grow: 1;
  }

  .card h3 {
    margin-top: 3rem;
    margin-bottom: 1rem;
    font-size: 40px;
  }

  .controls {
    display: flex;
    gap: 1px;
    background: var(--border-color);
    width: 100%;
  }

  .controls button {
    border-radius: 0;
    border: none;
    color: white;
    flex-basis: 10px;
    flex-grow: 1;
    display: block;
    padding: var(--gap) 0;
  }

  button.easy {
    background: var(--easy);
  }
  button.medium {
    background: var(--medium);
  }
  button.hard {
    background: var(--hard);
  }

  .word.easy {
    color: var(--easy);
  }
  .word.medium {
    color: var(--medium);
  }
  .word.hard {
    color: var(--hard);
  }

  @media screen and (max-width: 640px) {
    .root {
      align-items: stretch;
      justify-content: stretch;
    }

    .card {
      border: none;
      border-radius: 0;
    }

    .word-wrapper {
      display: flex;
      flex-grow: 1;
      align-items: center;
    }

    .center {
      flex-grow: 1;
    }

    .center button:hover {
      background: inherit;
    }
  }
</style>
