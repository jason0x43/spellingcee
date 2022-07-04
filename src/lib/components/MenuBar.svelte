<script type="ts">
  import { session } from '$app/stores';
  import UserIcon from '$lib/icons/User.svelte';
  import Menu from './Menu.svelte';

  const user = $session.user;

  let loginButton: HTMLButtonElement;
  let showMenu = false;

  async function logout() {
    await fetch('/auth/logout');
    $session.user = undefined;
  }
</script>

<div class="menubar">
  <div class="left">
    <a href="/app/classify">Classify</a>
    <a href="/app/game">Play</a>
  </div>
  <div class="right">
    {user?.username}
    <button
      class="user-menu"
      class:highlight={showMenu}
      on:click={(event) => {
        showMenu = !showMenu;
        event.stopPropagation();
      }}
      bind:this={loginButton}><UserIcon size={20} /></button
    >
  </div>
</div>

{#if showMenu}
  <Menu
    items={[{ label: 'Logout', value: 'logout' }]}
    anchor={loginButton}
    onClose={() => (showMenu = false)}
    onSelect={(value) => {
      if (value === 'logout') {
        logout();
      }
    }}
  />
{/if}

<style>
  .menubar {
    width: 100%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    height: 30px;
    box-sizing: border-box;
    border-bottom: solid 1px #ddd;
  }

  .menubar a {
    text-decoration: none;
  }

  .menubar > .left {
    flex-grow: 1;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: calc(var(--gap) / 2);
    gap: var(--gap);
  }

  .menubar > .right {
    flex-grow: 1;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 1ex;
  }

  .user-menu {
    border: none;
    background: none;
    display: flex;
    align-items: center;
    border-radius: 0;
  }

  .highlight {
    background: var(--shaded-hover);
  }
</style>
