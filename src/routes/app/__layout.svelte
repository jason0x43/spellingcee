<script type="ts" context="module">
  import type { Load } from '@sveltejs/kit';

  export const load: Load = async ({ session }) => {
    const user = session.user;
    if (!user) {
      return {
        status: 302,
        redirect: '/login'
      };
    }

    return {};
  };
</script>

<script type="ts">
  import MenuBar from '$lib/components/MenuBar.svelte';
</script>

<MenuBar />
<slot />
