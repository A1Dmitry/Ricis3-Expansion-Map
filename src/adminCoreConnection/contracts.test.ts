import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  AdminCoreCommandResult,
  AdminCoreCreateAgentHostDraft,
  AdminCoreFeatureDecision,
  AdminCoreFeatureSnapshot,
  AdminCoreHostSummary,
  AdminCoreIssueEnrollment,
  AdminCoreRevokeHost,
  BoundedExternalCoreRequest,
  BoundedExternalCoreResponse,
  IAdminCoreCommandService,
  IBoundedExternalCoreGateway,
  IServerRoutedRicisCoreEngine,
} from './contracts';

const sentinel = 'PRIVATE_KEY_OR_OAUTH_TOKEN_MUST_NEVER_APPEAR';

const staticSnapshot = {
  feature: 'admin_core_manage',
  state: 'server_capability_unavailable',
  hosts: [],
  safeDetail: 'A server control plane is required to manage external Ricis.Core hosts.',
} as const satisfies AdminCoreFeatureSnapshot;

const activeAgentHost = {
  hostId: 'host-admin-core-a',
  displayName: 'Owner Core agent',
  mode: 'agent_tunnel',
  state: 'active',
  operations: ['core.health', 'expression.simplify'],
  coreBuildId: 'ricis-core-7.7.0',
  keyFingerprintSuffix: '…a1b2',
  redactedEndpoint: 'agent tunnel',
  updatedAt: 1_700_000_000,
} as const satisfies AdminCoreHostSummary;

const createDraft = {
  displayName: 'Owner Core agent',
  mode: 'agent_tunnel',
  expectedOperations: ['core.health', 'expression.simplify'],
  confirmation: 'connect_my_routing_host',
} as const satisfies AdminCoreCreateAgentHostDraft;

const issueEnrollment = {
  hostId: activeAgentHost.hostId,
  confirmation: 'reveal_one_time_enrollment',
} as const satisfies AdminCoreIssueEnrollment;

const revokeHost = {
  hostId: activeAgentHost.hostId,
  confirmation: 'revoke_external_core_host',
  reason: 'credential_compromised',
} as const satisfies AdminCoreRevokeHost;

const simplifyRequest = {
  kind: 'expression.simplify',
  request: {
    expression: '((x ** 2) - 25) / (x - 5)',
    contextProblemId: 'real-catalog-3',
  },
} as const satisfies BoundedExternalCoreRequest;

const coreResponse = {
  kind: 'core_result',
  result: {
    success: true,
    invariant: 'x + 5',
    isSingular: false,
    executionEngine: 'csharp_api',
    trace: [],
  },
  provenance: {
    hostId: activeAgentHost.hostId,
    coreBuildId: activeAgentHost.coreBuildId,
    routeDecisionId: 'route-decision-a',
    correlationId: 'correlation-admin-core-a',
  },
} as const satisfies BoundedExternalCoreResponse;

describe('Admin Core Connection QA contract', () => {
  it('keeps static deployment an explicit unavailable state without host enumeration or browser secret fallback', () => {
    expect(staticSnapshot).toMatchObject({
      feature: 'admin_core_manage',
      state: 'server_capability_unavailable',
      hosts: [],
    });
    const serialized = JSON.stringify(staticSnapshot);
    expect(serialized).not.toContain(sentinel);
    expect(serialized).not.toContain('opaqueAssertion');
    expect(serialized).not.toContain('privateKey');
    expect(serialized).not.toContain('oauth');
  });

  it('models all feature denial states as typed server decisions rather than UI visibility flags', () => {
    const decisions = [
      { kind: 'allowed', accountId: 'owner-a' },
      { kind: 'server_capability_unavailable' },
      { kind: 'requires_authentication' },
      { kind: 'requires_entitlement', entitlement: 'host:manage:self' },
      { kind: 'policy_unavailable' },
    ] as const satisfies readonly AdminCoreFeatureDecision[];

    expect(decisions.map((decision) => decision.kind)).toEqual([
      'allowed',
      'server_capability_unavailable',
      'requires_authentication',
      'requires_entitlement',
      'policy_unavailable',
    ]);
  });

  it('admits only personal agent-tunnel draft capability requests and explicit irreversible confirmations', () => {
    expect(createDraft.mode).toBe('agent_tunnel');
    expect(createDraft.expectedOperations).toEqual(['core.health', 'expression.simplify']);
    expect(createDraft.confirmation).toBe('connect_my_routing_host');
    expect(issueEnrollment.confirmation).toBe('reveal_one_time_enrollment');
    expect(revokeHost.confirmation).toBe('revoke_external_core_host');

    const serialized = JSON.stringify({ createDraft, issueEnrollment, revokeHost });
    expect(serialized).not.toContain('baseUrl');
    expect(serialized).not.toContain('authorization');
    expect(serialized).not.toContain('privateKey');
    expect(serialized).not.toContain('freshAuthenticationId');
  });

  it('keeps enrollment display one-time, scoped and free of private-key/OAuth/route authority fields', () => {
    const result = {
      kind: 'enrollment_issued',
      display: {
        hostId: activeAgentHost.hostId,
        opaqueAssertion: 'one-time-assertion-fixture',
        expiresAt: 1_700_000_600,
        shownOnce: true,
        copyInstructionResourceKey: 'admin_core.enrollment.copy_to_host_agent',
      },
    } as const satisfies AdminCoreCommandResult;

    expect(result).toMatchObject({ kind: 'enrollment_issued', display: { shownOnce: true } });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(sentinel);
    expect(serialized).not.toContain('privateKey');
    expect(serialized).not.toContain('oauth');
    expect(serialized).not.toContain('routeDecisionId');
  });

  it('has a closed bounded Core request union with no generic routing or credential fields', () => {
    expect(simplifyRequest.kind).toBe('expression.simplify');
    expect(simplifyRequest.request.expression).toContain('x');
    expectTypeOf<BoundedExternalCoreRequest>().not.toHaveProperty('url');
    expectTypeOf<BoundedExternalCoreRequest>().not.toHaveProperty('baseUrl');
    expectTypeOf<BoundedExternalCoreRequest>().not.toHaveProperty('method');
    expectTypeOf<BoundedExternalCoreRequest>().not.toHaveProperty('headers');
    expectTypeOf<BoundedExternalCoreRequest>().not.toHaveProperty('authorization');
    expectTypeOf<BoundedExternalCoreRequest>().not.toHaveProperty('hostId');
  });

  it('attaches operational provenance to an existing Core result without proof-trust promotion fields', () => {
    expect(coreResponse).toMatchObject({
      kind: 'core_result',
      result: { success: true, executionEngine: 'csharp_api' },
      provenance: { hostId: activeAgentHost.hostId, coreBuildId: activeAgentHost.coreBuildId },
    });
    const serialized = JSON.stringify(coreResponse);
    expect(serialized).not.toContain('LEAN_VERIFIED');
    expect(serialized).not.toContain('resolved');
    expect(serialized).not.toContain('trusted_axiom');
  });

  it('exposes only server-composition ports for bounded Core routing and keeps Settings commands separate', () => {
    expectTypeOf<IAdminCoreCommandService>().toHaveProperty('createAgentHostDraft');
    expectTypeOf<IAdminCoreCommandService>().toHaveProperty('issueEnrollment');
    expectTypeOf<IAdminCoreCommandService>().toHaveProperty('revokeHost');
    expectTypeOf<IBoundedExternalCoreGateway>().toHaveProperty('execute');
    expectTypeOf<IServerRoutedRicisCoreEngine>().toHaveProperty('evaluateThroughApprovedHost');
    expectTypeOf<IAdminCoreCommandService>().not.toHaveProperty('execute');
  });

  it('contains no runtime browser, network, secret, or UI dependency in the contract module', async () => {
    const source = await readFile(resolve(import.meta.dirname, 'contracts.ts'), 'utf8');
    for (const forbidden of [
      "from 'react'",
      'localStorage',
      'sessionStorage',
      'window.',
      'document.',
      'fetch(',
      'process.env',
      'WebSocket',
      'privateKey',
      'oauthToken',
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });
});
