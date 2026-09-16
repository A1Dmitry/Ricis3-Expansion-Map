import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { DEV_ALLOWED_HOSTS_ENV, resolveDevAllowedHosts } from './server/devHostPolicy.ts';

/** Canonical repository path for the public GitHub Pages deployment. */
const GITHUB_PAGES_BASE = '/Ricis3-Expansion-Map/';

export default defineConfig(() => {
  return {
    // GitHub Pages serves this repository at https://a1dmitry.github.io/Ricis3-Expansion-Map/.
    // The release-consistency test guards this repository-slug contract.
    base: process.env.GITHUB_PAGES === 'true' ? GITHUB_PAGES_BASE : '/',
    plugins: [react(), tailwindcss()],
    build: {
      rolldownOptions: {
        output: {
          // Keep lazily loaded applets lazy, then cap generated chunks below Vite's
          // 500 kB warning threshold. Rolldown may split large dependency graphs
          // (notably Three.js) without forcing them into the initial route.
          codeSplitting: {
            maxSize: 450_000,
            groups: [
              {
                name: 'vendor',
                test: /node_modules/,
              },
              {
                name: 'app',
                test: /\/src\//,
              },
            ],
          },
        },
      },
    },
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
      // Proxied preview hosts (sandbox / AI Studio / Cloud Run) must stay reachable;
      // Vite's host check otherwise answers `403 Blocked request…` before the SPA loads.
      // `npm run dev` (server.ts) applies the same policy — see server/devHostPolicy.ts.
      allowedHosts: resolveDevAllowedHosts(process.env[DEV_ALLOWED_HOSTS_ENV]),
    },
    preview: {
      // Same defect class as the dev server (yokoten of incident 2026-09-16): `vite preview`
      // keeps a separate host allowlist with the same blocking default. No package script
      // uses it today, so this only removes the trap for a future smoke-test script.
      allowedHosts: resolveDevAllowedHosts(process.env[DEV_ALLOWED_HOSTS_ENV]),
    },
  };
});
