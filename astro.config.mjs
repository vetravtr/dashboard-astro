// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  site: 'https://dashboard.vetravtr.com/',
  compressHTML: true,
  integrations: [react()],
  vite: {
    plugins: [
      nodePolyfills({
        globals: { Buffer: true, global: true, process: true },
        include: ['buffer', 'process', 'util'],
      }),
    ],
    build: { cssMinify: true },
  },
  build: { inlineStylesheets: 'auto' },
});
