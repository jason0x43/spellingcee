<script type="ts">
  export let input: string;
  export let invalid: boolean;
  export let validLetters: string;
</script>

<div class={`letter-input letter-input-${input.length}`} class:invalid>
  {#each input as letter, i (i)}
    <div class="letter" class:invalid={!validLetters?.includes(letter)}>
      {letter}
    </div>
  {/each}

  <div class="cursor" />
</div>

<style>
  .letter-input {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: var(--font-size-large);
    height: 1.5em;
    font-weight: var(--font-weight-bold);
    text-transform: capitalize;
  }

  .cursor {
    --blink: blinky steps(2, start) 1500ms infinite;
    animation: var(--blink);
    -webkit-animation: var(--blink);

    height: 90%;
    width: 2px;
    background: var(--highlight);
  }

  @keyframes blinky {
    to {
      visibility: hidden;
    }
  }

  .letter {
    margin-right: 4px;
    display: flex;
    align-items: center;
    color: var(--text-color);
  }

  .invalid {
    color: var(--text-color-dim);
    animation: shake ease-in-out 0.3s;
  }

  @keyframes shake {
    0% {
      transform: translateX(0px);
    }
    20% {
      transform: translateX(8px);
    }
    40% {
      transform: translateX(-8px);
    }
    60% {
      transform: translateX(8px);
    }
    80% {
      transform: translateX(-8px);
    }
    100% {
      transform: translateX(0px);
    }
  }

  .letter-input-11 .letter {
    font-size: calc(var(--font-size-large) * 0.95);
  }
  .letter-input-12 .letter {
    font-size: calc(var(--font-size-large) * 0.9);
  }
  .letter-input-13 .letter {
    font-size: calc(var(--font-size-large) * 0.85);
  }
  .letter-input-14 .letter {
    font-size: calc(var(--font-size-large) * 0.8);
    margin-right: 3px;
  }
  .letter-input-15 .letter {
    font-size: calc(var(--font-size-large) * 0.75);
    margin-right: 3px;
  }
  .letter-input-16 .letter {
    font-size: calc(var(--font-size-large) * 0.7);
    margin-right: 3px;
  }
  .letter-input-17 .letter {
    font-size: calc(var(--font-size-large) * 0.65);
    margin-right: 2px;
  }
  .letter-input-18 .letter {
    font-size: calc(var(--font-size-large) * 0.6);
    margin-right: 2px;
  }
  .letter-input-19 .letter {
    font-size: calc(var(--font-size-large) * 0.55);
    margin-right: 1px;
  }
  .letter-input-20 .letter {
    font-size: calc(var(--font-size-large) * 0.55);
    margin-right: 1px;
  }
</style>
