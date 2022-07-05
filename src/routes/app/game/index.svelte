<script type="ts">
  export let errors: string | undefined;
</script>

<div class="root">
  <div class="card">
    <h4>Unable to load game</h4>
    <p>{errors}</p>
  </div>
</div>

<style>
  .root {
    display: flex;
    flex-grow: 1;
    align-items: center;
    justify-content: center;
  }

  .card {
    border: solid 1px var(--border-color);
    border-radius: var(--border-radius);
    padding: var(--gap);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--gap);
  }

  .card h4,
  .card p {
    margin: 0;
  }
</style>
