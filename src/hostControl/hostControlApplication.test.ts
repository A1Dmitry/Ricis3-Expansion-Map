import { describe, expect, it, vi } from 'vitest';
import {
  HostControlApplicationService,
  type HostControlApplicationDependencies,
  type HostControlTestIds,
} from './hostControlApplication';

/**
 * QA red contract suite.
 *
 * This suite deliberately imports the Step 4 public application surface before
 * runtime implementation exists. It must initially fail at module resolution;
 * no in-test implementation or skipped test is permitted to hide that gap.
 */

const ids = {
  ownerId: 'owner-a',
  foreignOwnerId: 'owner-b',
  hostId: 'host-a',
  foreignHostId: 'host-b',
  freshAuthenticationId: 'fresh-auth-a',
  assertion: 'test-enrollment-assertion',
  hostPublicKey: 'public-key-only-test-fixture',
  hostPrivateKeySentinel: 'PRIVATE_KEY_MUST_NEVER_APPEAR',
  directIp: '203.0.113.10',
  forbiddenIp: '127.0.0.1',
  vpnTunnelIp: '10.255.0.2',
  publicKeyFingerprint: 'sha256:test-public-key-fingerprint',
  correlationId: 'correlation-host-control-test',
} as const satisfies HostControlTestIds;

function createDependencies(
  overrides: Partial<HostControlApplicationDependencies> = {},
): HostControlApplicationDependencies {
  return {
    authorization: {
      hasHostManagementAccess: vi.fn().mockResolvedValue({ kind: 'allowed', ownerId: ids.ownerId }),
      requireFreshAuthentication: vi.fn().mockResolvedValue({
        kind: 'fresh',
        freshAuthenticationId: ids.freshAuthenticationId,
        expiresAt: 1_800_000_000,
      }),
    },
    registry: {
      createDraft: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(null),
      findOwnedBy: vi.fn().mockResolvedValue([]),
      transition: vi.fn(),
      bindPublicKey: vi.fn(),
      revoke: vi.fn().mockResolvedValue(undefined),
    },
    assertions: {
      issue: vi.fn().mockResolvedValue({
        hostId: ids.hostId,
        opaqueAssertion: ids.assertion,
        expiresAt: 1_800_000_000,
        shownOnce: true,
      }),
      consumeOnce: vi.fn(),
      revokeForHost: vi.fn().mockResolvedValue(undefined),
    },
    publicKeys: {
      verifyPossession: vi.fn().mockResolvedValue({
        kind: 'verified',
        fingerprint: ids.publicKeyFingerprint,
      }),
      verifyHealthAttestation: vi.fn().mockResolvedValue({ kind: 'verified', hostId: ids.hostId }),
    },
    transportPolicy: {
      evaluate: vi.fn().mockResolvedValue({ kind: 'allowed', policyVersion: 'policy-v1' }),
    },
    vpnPeers: {
      plan: vi.fn().mockResolvedValue({
        hostId: ids.hostId,
        hostPeerPublicKey: ids.hostPublicKey,
        assignedTunnelAddress: ids.vpnTunnelIp,
        allowedDestination: ids.vpnTunnelIp,
        allowedPort: 443,
        keyFingerprint: ids.publicKeyFingerprint,
        expiresAt: 1_800_000_000,
      }),
      revoke: vi.fn().mockResolvedValue(undefined),
    },
    routeDecisions: {
      issue: vi.fn().mockResolvedValue({
        kind: 'issued',
        routeDecision: {
          routeDecisionId: 'route-a',
          hostId: ids.hostId,
          operation: 'core.health',
          expiresAt: 1_800_000_000,
          maxRequestBytes: 1024,
          maxResponseBytes: 1024,
          maxOperationSeconds: 5,
          policyVersion: 'policy-v1',
        },
      }),
      invalidateHost: vi.fn().mockResolvedValue(undefined),
    },
    audit: { append: vi.fn().mockResolvedValue(undefined) },
    executionProviders: {
      resolve: vi.fn().mockResolvedValue({ kind: 'no_eligible_host' }),
    },
    clock: { now: vi.fn().mockReturnValue(1_700_000_000) },
    ids: {
      newHostId: vi.fn().mockReturnValue(ids.hostId),
      newTicketId: vi.fn().mockReturnValue('ticket-a'),
      newNonce: vi.fn().mockReturnValue('nonce-a'),
      newCorrelationId: vi.fn().mockReturnValue(ids.correlationId),
    },
    deployment: { kind: 'server' },
    ...overrides,
  } as unknown as HostControlApplicationDependencies;
}

function createSut(overrides: Partial<HostControlApplicationDependencies> = {}) {
  return new HostControlApplicationService(createDependencies(overrides));
}

describe('HostControlApplicationService adversarial contract tests', () => {
  it('creates an owner-scoped direct-IP draft only after entitlement and transport policy approval', async () => {
    const sut = createSut();

    const result = await sut.createDraft({
      ownerId: ids.ownerId,
      displayName: 'Test host',
      mode: 'direct_ip_webapi',
      transport: {
        kind: 'direct_ip_webapi',
        address: ids.directIp,
        port: 443,
        tlsIdentity: { kind: 'spki_pin', expectedPublicKeyFingerprint: ids.publicKeyFingerprint },
        requireMutualTls: true,
      },
      expectedCapabilities: ['core.health'],
      observedRequestIpHint: ids.directIp,
    });

    expect(result.kind).toBe('draft_created');
    if (result.kind !== 'draft_created') throw new Error('Expected draft_created result in direct positive test.');
    expect(result.hostId).toBe(ids.hostId);
  });

  it('denies a direct-IP draft for loopback address instead of making any network request', async () => {
    const sut = createSut({
      transportPolicy: {
        evaluate: vi.fn().mockResolvedValue({
          kind: 'direct_ip_denied',
          reason: 'loopback',
        }),
      } as never,
    });

    const result = await sut.createDraft({
      ownerId: ids.ownerId,
      displayName: 'Forbidden endpoint',
      mode: 'direct_ip_webapi',
      transport: {
        kind: 'direct_ip_webapi',
        address: ids.forbiddenIp,
        port: 443,
        tlsIdentity: { kind: 'spki_pin', expectedPublicKeyFingerprint: ids.publicKeyFingerprint },
        requireMutualTls: true,
      },
      expectedCapabilities: ['core.health'],
    });

    expect(result).toMatchObject({ kind: 'transport_policy_denied', reason: 'loopback' });
  });

  it('does not treat the browser-observed current IP as trusted ownership or automatic route authorization', async () => {
    const sut = createSut();

    const result = await sut.createDraft({
      ownerId: ids.ownerId,
      displayName: 'Suggested IP only',
      mode: 'direct_ip_webapi',
      transport: {
        kind: 'direct_ip_webapi',
        address: ids.directIp,
        port: 443,
        tlsIdentity: { kind: 'spki_pin', expectedPublicKeyFingerprint: ids.publicKeyFingerprint },
        requireMutualTls: true,
      },
      expectedCapabilities: ['core.health'],
      observedRequestIpHint: ids.directIp,
    });

    expect(result).toMatchObject({ kind: 'draft_created', ownershipProven: false });
  });

  it('issues a display-once enrollment assertion without OAuth material, private key, or route authority', async () => {
    const sut = createSut();

    const result = await sut.issueEnrollmentAssertion({
      hostId: ids.hostId,
      actorId: ids.ownerId,
      freshAuthenticationId: ids.freshAuthenticationId,
      requestedPublicKey: ids.hostPublicKey,
    });

    expect(result).toMatchObject({ kind: 'assertion_issued', shownOnce: true });
    expect(JSON.stringify(result)).not.toContain('oauth');
    expect(JSON.stringify(result)).not.toContain(ids.hostPrivateKeySentinel);
    expect(JSON.stringify(result)).not.toContain('routeDecisionId');
  });

  it('denies assertion issue when fresh authentication is unavailable even if the user is authenticated', async () => {
    const sut = createSut({
      authorization: {
        hasHostManagementAccess: vi.fn().mockResolvedValue({ kind: 'allowed', ownerId: ids.ownerId }),
        requireFreshAuthentication: vi.fn().mockResolvedValue({ kind: 'step_up_required', method: 'passkey' }),
      } as never,
    });

    const result = await sut.issueEnrollmentAssertion({
      hostId: ids.hostId,
      actorId: ids.ownerId,
      freshAuthenticationId: ids.freshAuthenticationId,
      requestedPublicKey: ids.hostPublicKey,
    });

    expect(result).toEqual({ kind: 'step_up_required', method: 'passkey' });
  });

  it('accepts enrollment only after one-time assertion consumption and verified public-key possession', async () => {
    const sut = createSut({
      assertions: {
        issue: vi.fn(),
        consumeOnce: vi.fn().mockResolvedValue({
          ticketId: 'ticket-a',
          hostId: ids.hostId,
          assertionHash: 'hash-a',
          nonce: 'nonce-a',
          expiresAt: 1_800_000_000,
        }),
        revokeForHost: vi.fn(),
      } as never,
    });

    const result = await sut.completeEnrollment({
      hostId: ids.hostId,
      assertion: ids.assertion,
      hostPublicKey: ids.hostPublicKey,
      capabilityManifest: {
        apiVersion: '1',
        coreBuildId: 'core-build-a',
        operations: ['core.health'],
        maxRequestBytes: 1024,
        maxResponseBytes: 1024,
        maxOperationSeconds: 5,
        manifestHash: 'manifest-a',
      },
      signedNonceResponse: 'signed-nonce-a',
    });

    expect(result).toMatchObject({ kind: 'host_verifying', hostId: ids.hostId });
  });

  it('returns typed replay denial for a consumed enrollment assertion', async () => {
    const sut = createSut({
      assertions: {
        issue: vi.fn(),
        consumeOnce: vi.fn().mockRejectedValue({ kind: 'assertion_replayed' }),
        revokeForHost: vi.fn(),
      } as never,
    });

    const result = await sut.completeEnrollment({
      hostId: ids.hostId,
      assertion: ids.assertion,
      hostPublicKey: ids.hostPublicKey,
      capabilityManifest: {
        apiVersion: '1',
        coreBuildId: 'core-build-a',
        operations: ['core.health'],
        maxRequestBytes: 1024,
        maxResponseBytes: 1024,
        maxOperationSeconds: 5,
        manifestHash: 'manifest-a',
      },
      signedNonceResponse: 'signed-nonce-a',
    });

    expect(result).toEqual({ kind: 'assertion_replayed' });
  });

  it('issues a VPN peer plan only with public key, single tunnel route, and no default route', async () => {
    const sut = createSut();

    const result = await sut.requestVpnPeerPlan({
      hostId: ids.hostId,
      actorId: ids.ownerId,
      freshAuthenticationId: ids.freshAuthenticationId,
      peerPublicKey: ids.hostPublicKey,
      tunnelAddress: ids.vpnTunnelIp,
      destination: ids.vpnTunnelIp,
      port: 443,
    });

    expect(result).toMatchObject({ kind: 'vpn_peer_plan_issued' });
    expect(JSON.stringify(result)).not.toContain(ids.hostPrivateKeySentinel);
    expect(JSON.stringify(result)).not.toContain('0.0.0.0/0');
  });

  it('denies a VPN plan that broadens a host to a default route', async () => {
    const sut = createSut({
      vpnPeers: {
        plan: vi.fn().mockResolvedValue({ kind: 'route_not_allowed' }),
        revoke: vi.fn(),
      } as never,
    });

    const result = await sut.requestVpnPeerPlan({
      hostId: ids.hostId,
      actorId: ids.ownerId,
      freshAuthenticationId: ids.freshAuthenticationId,
      peerPublicKey: ids.hostPublicKey,
      tunnelAddress: ids.vpnTunnelIp,
      destination: '0.0.0.0/0',
      port: 443,
    });

    expect(result).toEqual({ kind: 'vpn_policy_denied', reason: 'route_not_allowed' });
  });

  it('does not issue a route for a foreign owner or expose URL, method, path, ticket, or credential in the route decision', async () => {
    const sut = createSut({
      authorization: {
        hasHostManagementAccess: vi.fn().mockResolvedValue({ kind: 'tenant_access_denied' }),
        requireFreshAuthentication: vi.fn(),
      } as never,
    });

    const result = await sut.requestRouteDecision({
      hostId: ids.foreignHostId,
      ownerId: ids.foreignOwnerId,
      operation: 'core.health',
      correlationId: ids.correlationId,
    });

    expect(result).toEqual({ kind: 'tenant_access_denied' });
    expect(JSON.stringify(result)).not.toMatch(/url|method|path|assertion|private/i);
  });

  it('revokes host identity, pending assertion, VPN peer and route decisions atomically after fresh owner confirmation', async () => {
    const dependencies = createDependencies();
    const sut = new HostControlApplicationService(dependencies);

    const result = await sut.revokeHost({
      hostId: ids.hostId,
      actorId: ids.ownerId,
      freshAuthenticationId: ids.freshAuthenticationId,
      reason: 'owner_requested',
    });

    expect(result).toEqual({ kind: 'host_revoked', hostId: ids.hostId });
    expect(dependencies.assertions.revokeForHost).toHaveBeenCalledWith(ids.hostId, expect.any(Number));
    expect(dependencies.vpnPeers.revoke).toHaveBeenCalledWith(ids.hostId, expect.any(Number));
    expect(dependencies.routeDecisions.invalidateHost).toHaveBeenCalledWith(ids.hostId, expect.any(Number));
  });

  it('returns static-host denial rather than emulating admin control plane in browser storage', async () => {
    const sut = createSut({ deployment: { kind: 'static' } as never });

    const result = await sut.resolveExecutionProvider({
      accountId: ids.ownerId,
      operation: 'core.health',
      correlationId: ids.correlationId,
    });

    expect(result).toEqual({ kind: 'static_host_unavailable' });
  });

  it('keeps host provenance separate from Lean/formal trust status', async () => {
    const sut = createSut({
      executionProviders: {
        resolve: vi.fn().mockResolvedValue({
          kind: 'resolved',
          routeDecision: {
            routeDecisionId: 'route-a',
            hostId: ids.hostId,
            operation: 'core.health',
            expiresAt: 1_800_000_000,
            maxRequestBytes: 1024,
            maxResponseBytes: 1024,
            maxOperationSeconds: 5,
            policyVersion: 'policy-v1',
          },
        }),
      } as never,
    });

    const result = await sut.resolveExecutionProvider({
      accountId: ids.ownerId,
      operation: 'core.health',
      correlationId: ids.correlationId,
    });

    expect(JSON.stringify(result)).not.toContain('LEAN_VERIFIED');
    expect(JSON.stringify(result)).not.toContain('resolved_proof');
  });
});
