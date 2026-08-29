import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

/** Canonical repository path for the public GitHub Pages deployment. */
const GITHUB_PAGES_BASE = '/Ricis3-Expansion-Map/';

export default defineConfig(() => {
  return {
    // GitHub Pages serves this repository at https://a1dmitry.github.io/Ricis3-Expansion-Map/.
    // The release-consistency test guards this repository-slug contract.
    base: process.env.GITHUB_PAGES === 'true' ? GITHUB_PAGES_BASE : '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: false,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
