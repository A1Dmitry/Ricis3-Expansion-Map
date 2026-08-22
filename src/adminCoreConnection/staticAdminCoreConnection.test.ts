import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STATIC_ADMIN_CORE_SAFE_DETAIL, STATIC_ADMIN_CORE_SNAPSHOT, StaticAdminCoreConnection } from './staticAdminCoreConnection';

describe('StaticAdminCoreConnection', () => {
  it('exposes only an explicit server-capability-unavailable snapshot without host records', () => {
    expect(STATIC_ADMIN_CORE_SNAPSHOT).toEqual({
      feature: 'admin_core_manage',
      state: 'server_capability_unavailable',
      hosts: [],
      safeDetail: STATIC_ADMIN_CORE_SAFE_DETAIL,
    });
  });

  it('fails closed for every browser-originated management command', async () => {
    const sut = new StaticAdminCoreConnection();

    await expect(sut.readForCurrentSession()).resolves.toEqual({ kind: 'server_capability_unavailable' });
    await expect(sut.snapshotForCurrentSession()).resolves.toBe(STATIC_ADMIN_CORE_SNAPSHOT);
    await expect(sut.createAgentHostDraft({
      displayName: 'No browser host',
      mode: 'agent_tunnel',
      expectedOperations: ['core.health', 'expression.simplify'],
      confirmation: 'connect_my_routing_host',
    })).resolves.toEqual({ kind: 'server_capability_unavailable' });
    await expect(sut.issueEnrollment({
      hostId: 'host-a',
      confirmation: 'reveal_one_time_enrollment',
    })).resolves.toEqual({ kind: 'server_capability_unavailable' });
    await expect(sut.revokeHost({
      hostId: 'host-a',
      confirmation: 'revoke_external_core_host',
      reason: 'owner_requested',
    })).resolves.toEqual({ kind: 'server_capability_unavailable' });
  });

  it('keeps static facade free of network, browser storage, secrets and mutable endpoint configuration', async () => {
    const source = await readFile(resolve(import.meta.dirname, 'staticAdminCoreConnection.ts'), 'utf8');
    for (const forbidden of [
      'fetch(',
      'XMLHttpRequest',
      'WebSocket',
      'localStorage',
      'sessionStorage',
      'VITE_RICIS_CORE_API_BASE_URL',
      'process.env',
      'privateKey',
      'oauth',
      'baseUrl',
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });

  it('passes the typed snapshot through the sole Map3D Settings composition seam and renders only an unavailable status panel', async () => {
    const [mapSource, settingsSource] = await Promise.all([
      readFile(resolve(import.meta.dirname, '..', 'ui', 'Map3D.tsx'), 'utf8'),
      readFile(resolve(import.meta.dirname, '..', 'ui', 'SettingsModal.tsx'), 'utf8'),
    ]);

    expect(mapSource).toContain('adminCoreSnapshot={STATIC_ADMIN_CORE_SNAPSHOT}');
    expect(settingsSource).toContain('data-testid="admin-core-settings-section"');
    expect(settingsSource).toContain("adminCoreSnapshot.state === 'server_capability_unavailable'");
    expect(settingsSource).not.toContain('VITE_RICIS_CORE_API_BASE_URL');
    expect(settingsSource).not.toContain('type="url"');
    expect(settingsSource).not.toContain('API key');
  });
});
