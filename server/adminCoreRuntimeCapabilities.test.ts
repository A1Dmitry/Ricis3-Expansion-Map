import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  AdminCoreBackendUnavailable,
  AdminCoreBackendUnavailableReason,
  AdminCoreRuntimeCapabilitySnapshot,
  IAdminCoreRuntimeCapabilities,
} from './adminCoreRuntimeCapabilities';

const secretSentinel = 'PRIVATE_KEY_TOKEN_OR_UPSTREAM_URL_MUST_NEVER_APPEAR';

class DeterministicUnavailableCapabilities implements IAdminCoreRuntimeCapabilities {
  public constructor(private readonly reasonCode: AdminCoreBackendUnavailableReason) {}

  public async inspect(): Promise<AdminCoreRuntimeCapabilitySnapshot> {
    return {
      kind: 'control_plane_unavailable',
      unavailable: {
        apiVersion: 'v1',
        kind: 'backend_unconfigured',
        authoritative: false,
        reasonCode: this.reasonCode,
        messageKey: 'adminCore.backend.unconfigured',
      },
    };
  }
}

describe('Admin Core deployment-optional runtime capability contract', () => {
  it('reports clean deployment as a typed non-authoritative unavailable state', async () => {
    const capabilities = new DeterministicUnavailableCapabilities('SERVER_CONTROL_PLANE_NOT_CONFIGURED');

    await expect(capabilities.inspect()).resolves.toEqual({
      kind: 'control_plane_unavailable',
      unavailable: {
        apiVersion: 'v1',
        kind: 'backend_unconfigured',
        authoritative: false,
        reasonCode: 'SERVER_CONTROL_PLANE_NOT_CONFIGURED',
        messageKey: 'adminCore.backend.unconfigured',
      },
    });
  });

  it('keeps every missing server prerequisite finite, typed and independent of a live platform component', async () => {
    const reasons = [
      'SERVER_CONTROL_PLANE_NOT_CONFIGURED',
      'DURABLE_IDENTITY_REQUIRED',
      'HOST_REGISTRY_REQUIRED',
      'FRESH_AUTH_REQUIRED',
      'HOST_CHANNEL_REQUIRED',
      'CORE_COMPATIBILITY_VALIDATOR_REQUIRED',
    ] as const satisfies readonly AdminCoreBackendUnavailableReason[];

    const snapshots = await Promise.all(
      reasons.map(async (reasonCode) => new DeterministicUnavailableCapabilities(reasonCode).inspect()),
    );

    expect(snapshots).toHaveLength(reasons.length);
    expect(snapshots.map((snapshot) =>
      snapshot.kind === 'control_plane_unavailable' ? snapshot.unavailable.reasonCode : 'unexpected_ready',
    )).toEqual(reasons);
  });

  it('serializes a stable safe response without identity, host, secret, route or exception detail', async () => {
    const snapshot = await new DeterministicUnavailableCapabilities('HOST_CHANNEL_REQUIRED').inspect();
    if (snapshot.kind !== 'control_plane_unavailable') throw new Error('Expected unavailable capability fixture.');

    const serialized = JSON.stringify(snapshot.unavailable satisfies AdminCoreBackendUnavailable);
    expect(serialized).toContain('HOST_CHANNEL_REQUIRED');
    for (const forbidden of [
      secretSentinel,
      'privateKey',
      'oauth',
      'token',
      'hostId',
      'baseUrl',
      'url',
      'stack',
      'exception',
      'RICIS_CORE_',
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it('keeps the capability port narrow: it can inspect configuration but cannot execute, route, authenticate or persist', () => {
    expectTypeOf<IAdminCoreRuntimeCapabilities>().toHaveProperty('inspect');
    expectTypeOf<IAdminCoreRuntimeCapabilities>().not.toHaveProperty('execute');
    expectTypeOf<IAdminCoreRuntimeCapabilities>().not.toHaveProperty('resolveRoute');
    expectTypeOf<IAdminCoreRuntimeCapabilities>().not.toHaveProperty('authenticate');
    expectTypeOf<IAdminCoreRuntimeCapabilities>().not.toHaveProperty('saveHost');
  });

  it('contains no runtime network, Core supervisor, environment, browser or secret dependency in the contract module', async () => {
    const source = await readFile(resolve(import.meta.dirname, 'adminCoreRuntimeCapabilities.ts'), 'utf8');
    for (const forbidden of [
      'fetch(',
      'spawn(',
      'ensureRicisCoreApi',
      'ricisCoreSupervisor',
      'process.env',
      'localStorage',
      'sessionStorage',
      'privateKey',
      'oauth',
      "from 'express'",
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });
});
