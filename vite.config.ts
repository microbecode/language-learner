import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig(({ command }) => ({
  // GitHub Pages serves this repo's site under /language-learner/. Dev and the
  // end-to-end tests keep the root path, so Playwright needs no base handling.
  base: command === 'build' ? '/language-learner/' : '/',
  plugins: [svelte()],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
}))
