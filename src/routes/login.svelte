<script type="ts">
  import { goto } from '$app/navigation';
  import { session } from '$app/stores';
  import { post } from '$lib/request';
  import type { LoginRequest, LoginResponse } from './auth/login';

  let errors: LoginResponse['errors'] | null = null;
  let username = '';
  let password = '';

  async function submit() {
    const response = await post<LoginRequest, LoginResponse>('/auth/login', {
      username,
      password
    });
    errors = response.errors;

    if (response.user) {
      $session.user = response.user;
      goto('/');
    }
  }
</script>

<section class="login">
  <form on:submit|preventDefault={submit}>
    <input
      name="username"
      autocapitalize="off"
      placeholder="Username"
      bind:value={username}
    />
    <input
      name="password"
      placeholder="Password"
      type="password"
      bind:value={password}
    />
    <button type="submit">Login</button>

    {#if errors?.username}
      <div id="username-error">{errors.username}</div>
    {/if}

    {#if errors?.password}
      <div id="password-error">{errors.password}</div>
    {/if}
  </form>
</section>

<style>
  .login {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  form {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }
</style>
