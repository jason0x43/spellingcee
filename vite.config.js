import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    coverage: {
      all: true,
      include: ['src/**']
    },
    restoreMocks: true,
    environment: 'jsdom'
  }
});
