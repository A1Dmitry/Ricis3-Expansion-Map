/**
 * Development-server host policy — single source of truth.
 *
 * ============================================================================
 * WHY THIS FILE EXISTS (incident 2026-09-16, "приложение не отображается")
 * ============================================================================
 * Vite rejects every request whose `Host` header is not explicitly allowed
 * (`server.allowedHosts`, default `[]`), as a DNS-rebinding protection. Requests
 * are answered with `403 Blocked request. This host ("<host>") is not allowed.`
 *
 * This application is *always* reached by the browser through a platform reverse
 * proxy in the sandbox / AI Studio preview (`https://<port>-<sandbox-id>.e2b.app`)
 * and under Cloud Run, so the `Host` header never matches `localhost`, `*.localhost`
 * or an IP literal — the only values Vite allows out of the box. The host check runs
 * *before* the SPA middleware, so not only the document but every module request was
 * rejected: the preview rendered an empty screen and no client-side error existed to
 * inspect, because no application code ever executed.
 *
 * The previous opt-in switch (`VITE_ALLOWED_HOSTS=true`) did not restore the preview:
 * nothing sets that variable in the sandbox, so the effective policy stayed
 * "block every proxied host". The policy is therefore opt-OUT — proxied preview hosts
 * are allowed unless an operator explicitly narrows it to a list or to localhost-only.
 *
 * ============================================================================
 * TRUST BOUNDARY
 * ============================================================================
 * This is a dev-only transport setting; it never reaches a published artifact:
 * GitHub Pages is built by `vite build` (server options are not used at all) and
 * `npm start` serves `dist/` straight from Express, without Vite. Therefore
 * relaxing the check here cannot widen the attack surface of the deployed site.
 * Operators who expose a dev server on an untrusted network can still narrow it:
 *   VITE_ALLOWED_HOSTS=false              → localhost/IP literals only (Vite default)
 *   VITE_ALLOWED_HOSTS=.e2b.app,foo.test  → explicit suffixes/names only
 */

/** Environment variable that overrides the development host policy. */
export const DEV_ALLOWED_HOSTS_ENV = 'VITE_ALLOWED_HOSTS';

/** Value accepted by `server.allowedHosts` (`true` disables the host check). */
export type DevAllowedHosts = true | string[];

/**
 * Resolves the effective development host policy.
 *
 * - unset / blank → `true`: sandbox, AI Studio and Cloud Run previews are proxied,
 *   so an unreachable host check is a total outage, not a hardening measure;
 * - `true` → `true` (explicit form of the same);
 * - `false` → `[]`: strict mode — only `localhost`, `*.localhost` and IP literals,
 *   which Vite always allows;
 * - comma-separated list → those exact names or `.suffix` patterns.
 *
 * A value that carries no usable entries falls back to the documented default
 * instead of silently locking the preview out.
 */
export function resolveDevAllowedHosts(raw: string | undefined | null): DevAllowedHosts {
  const value = raw?.trim();
  if (!value) return true;

  const lowered = value.toLowerCase();
  if (lowered === 'true') return true;
  if (lowered === 'false') return [];

  const hosts = value
    .split(',')
    .map(host => host.trim())
    .filter(host => host.length > 0);

  return hosts.length > 0 ? hosts : true;
}

/** Human-readable policy description for the startup log (diagnosability of this exact failure). */
export function describeDevAllowedHosts(policy: DevAllowedHosts): string {
  if (policy === true) return 'all hosts (proxied preview hosts allowed)';
  if (policy.length === 0) return 'localhost/IP literals only (strict)';
  return `${policy.join(', ')} (+ localhost/IP literals)`;
}
