<script type="ts">
  import { session } from '$app/stores';
  import UserIcon from '$lib/icons/User.svelte';
  import Menu from './Menu.svelte';

  const user = $session.user;

  let loginButton: HTMLButtonElement;
  let classifyButton: HTMLButtonElement;
  let activeMenu: string | undefined;

  async function logout() {
    await fetch('/auth/logout');
    $session.user = undefined;
  }

  function toggleMenu(id?: string) {
    if (id && !activeMenu) {
      activeMenu = id;
    } else {
      activeMenu = undefined;
    }
  }
</script>

<div class="menubar">
  <div class="left">
    <button
      class="user-menu"
      class:highlight={activeMenu === 'classify'}
      on:click={(event) => {
        toggleMenu('classify');
        event.stopPropagation();
      }}
      bind:this={classifyButton}>Classify</button
    >
    <a href="/app/game">Game</a>
  </div>
  <div class="right">
    <button
      class="user-menu"
      class:highlight={activeMenu === 'user'}
      on:click={(event) => {
        toggleMenu('user');
        event.stopPropagation();
      }}
      bind:this={loginButton}><UserIcon size={20} /></button
    >
  </div>
</div>

{#if activeMenu === 'user'}
  <Menu
    items={[user?.username ?? 'User', { label: 'Logout', value: 'logout' }]}
    anchor={loginButton}
    position={{ vert: 'below', horz: 'right' }}
    onClose={() => toggleMenu()}
    onSelect={(value) => {
      if (value === 'logout') {
        logout();
      }
    }}
  />
{/if}

{#if activeMenu === 'classify'}
  <Menu
    items={[
      { label: 'Classify', type: 'link', value: '/app/classify' },
      { label: 'Word list', type: 'link', value: '/api/words' }
    ]}
    anchor={classifyButton}
    position={{ vert: 'below', horz: 'left' }}
    onClose={() => toggleMenu()}
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
