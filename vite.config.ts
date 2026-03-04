import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  envPrefix: 'CTP_',
  base: '/ct-storefront/',
});
