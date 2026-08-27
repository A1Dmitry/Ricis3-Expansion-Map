import { describe, expect, it, vi } from 'vitest';
import type { AgentInvocationResult, InvokeAgentQuestion } from './agentGatewayApplication';
import {
  createAgentGatewayRuntimeBoundary,
  type AgentGatewayRuntimeRequest,
} from './agentGatewayRuntimeBoundary';

/**
 * Revised G3 red contract for EXP-MAP-AGENT-GATEWAY-RUNTIME-RECONCILIATION-01.
 *
 * This suite intentionally imports the future single-file boundary before it
 * exists. It specifies only injected resolver/application/audit behavior. It
 * performs no provider, transport, storage, browser, Lean/Core or authority
 * operation and cannot manufacture server-owned invocation context from the
 * client-safe request.
 */

function clientSafeRequest(overrides: Partial<AgentGatewayRuntimeRequest> = {}): AgentGatewayRuntimeRequest {
  return {
    nodeId: 'node-42',
    templateId: 'ricis-question-v1',
    responseSchemaId: 'ricis-agent-answer-v1',
    locale: 'en',
    correlationId: 'runtime-correlation-42',
    explicitUserRequest: true,
    ...overrides,
  };
}

function serverOwnedInvocation(): InvokeAgentQuestion {
  return Object.freeze({
    requestId: 'server-request-42',
    accountId: 'server-account-42',
    selection: Object.freeze({ providerId: 'provider-server-owned', modelId: 'model-server-owned' }),
    templateId: 'ricis-question-v1',
    locale: 'en',
    templateParameters: Object.freeze({ nodeReference: 'server-derived' }),
    leanContext: Object.freeze({
      artifactId: 'server-artifact-42',
      artifactHash: 'sha256:server-artifact-42',
      locale: 'en',
      classification: 'exportable_research_context',
      sourceTrustStatus: 'REQUIRES_CORE_LEAN',
      fragments: Object.freeze([]),
    }),
    correlationId: 'runtime-correlation-42',
  });
}

function dependencies(options: {
  readonly staticHost?: boolean;
  readonly resolverResult?: { readonly kind: 'resolved'; readonly invocation: InvokeAgentQuestion } | {
    readonly kind: 'unavailable';
    readonly redactedReason: 'context_unavailable' | 'identity_unavailable' | 'selection_unavailable' | 'artifact_unavailable';
  };
  readonly resolverError?: Error;
  readonly applicationResult?: AgentInvocationResult;
  readonly applicationError?: Error;
  readonly auditError?: Error;
} = {}) {
  const invocation = serverOwnedInvocation();
  const resolver = {
    resolve: vi.fn(async () => {
      if (options.resolverError !== undefined) throw options.resolverError;
      return options.resolverResult ?? { kind: 'resolved' as const, invocation };
    }),
  };
  const application = {
    invoke: vi.fn<(input: InvokeAgentQuestion) => Promise<AgentInvocationResult>>(async (_input) => {
      if (options.applicationError !== undefined) throw options.applicationError;
      return options.applicationResult ?? ({ kind: 'static_host_unavailable' } as const);
    }),
  };
  const audit = {
    record: vi.fn<(event: Readonly<{ correlationId: string; nodeIdHash: string; templateId: string; responseSchemaId: string; outcome: string }>) => void>((_event) => {
      if (options.auditError !== undefined) throw options.auditError;
    }),
  };
  const boundary = createAgentGatewayRuntimeBoundary({
    isStaticHost: options.staticHost ?? false,
    resolver,
    application,
    audit,
  });
  return { application, audit, boundary, invocation, resolver };
}

describe('Agent Gateway runtime boundary — revised G3 resolver contract', () => {
  it('AGRCR-G3-01: rejects an unknown client field without invoking resolver or application', async () => {
    const { application, audit, boundary, resolver } = dependencies();

    const result = await boundary.invoke({ ...clientSafeRequest(), prompt: 'client must not submit a prompt' });

    expect(result.kind).toBe('invalid_request');
    expect(resolver.resolve).not.toHaveBeenCalled();
    expect(application.invoke).not.toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledTimes(1);
  });

  it('AGRCR-G3-01A: rejects uninspectable client input without invoking resolver or application', async () => {
    const { application, audit, boundary, resolver } = dependencies();
    const hostileInput = new Proxy({}, { ownKeys: () => { throw new Error('enumeration must not escape'); } });

    const result = await boundary.invoke(hostileInput);

    expect(result.kind).toBe('invalid_request');
    expect(resolver.resolve).not.toHaveBeenCalled();
    expect(application.invoke).not.toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledTimes(1);
  });

  it('AGRCR-G3-02: static-host input invokes neither resolver nor application', async () => {
    const { application, audit, boundary, resolver } = dependencies({ staticHost: true });

    const result = await boundary.invoke(clientSafeRequest());

    expect(result.kind).toBe('static_host_unavailable');
    expect(resolver.resolve).not.toHaveBeenCalled();
    expect(application.invoke).not.toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledTimes(1);
  });

  it('AGRCR-G3-03: resolver unavailable produces only redacted runtime_unavailable and invokes no application', async () => {
    const { application, audit, boundary, resolver } = dependencies({
      resolverResult: { kind: 'unavailable', redactedReason: 'identity_unavailable' },
    });

    const result = await boundary.invoke(clientSafeRequest());

    expect(result.kind).toBe('runtime_unavailable');
    expect(JSON.stringify(result)).not.toContain('identity_unavailable');
    expect(application.invoke).not.toHaveBeenCalled();
    expect(resolver.resolve).toHaveBeenCalledTimes(1);
    expect(audit.record).toHaveBeenCalledTimes(1);
  });

  it('AGRCR-G3-04: resolver failure produces runtime_unavailable without application, retry or fallback', async () => {
    const { application, audit, boundary, resolver } = dependencies({ resolverError: new Error('server resolver failure') });

    const result = await boundary.invoke(clientSafeRequest());

    expect(result.kind).toBe('runtime_unavailable');
    expect(resolver.resolve).toHaveBeenCalledTimes(1);
    expect(application.invoke).not.toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledTimes(1);
  });

  it('AGRCR-G3-05: passes the resolver-produced full invocation by exact object identity once and preserves the application result', async () => {
    const applicationResult: AgentInvocationResult = { kind: 'static_host_unavailable' };
    const { application, audit, boundary, invocation, resolver } = dependencies({ applicationResult });

    const result = await boundary.invoke(clientSafeRequest());

    expect(resolver.resolve).toHaveBeenCalledTimes(1);
    expect(application.invoke).toHaveBeenCalledTimes(1);
    expect(application.invoke.mock.calls[0]?.[0]).toBe(invocation);
    expect(result).toBe(applicationResult);
    expect(audit.record).toHaveBeenCalledTimes(1);
    const event = audit.record.mock.calls[0]?.[0];
    expect(event?.nodeIdHash).toMatch(/^fnv1a-/);
    expect(JSON.stringify(event)).not.toContain('node-42');
  });

  it('AGRCR-G3-06: application failure is terminal: one resolver call, one application call, no retry and redacted runtime_unavailable', async () => {
    const { application, audit, boundary, resolver } = dependencies({ applicationError: new Error('provider detail must not escape') });

    const result = await boundary.invoke(clientSafeRequest());

    expect(result.kind).toBe('runtime_unavailable');
    expect(JSON.stringify(result)).not.toContain('provider detail');
    expect(resolver.resolve).toHaveBeenCalledTimes(1);
    expect(application.invoke).toHaveBeenCalledTimes(1);
    expect(audit.record).toHaveBeenCalledTimes(1);
  });

  it('AGRCR-G3-07: audit failure cannot create retry or fallback and returns terminal runtime_unavailable after the one application attempt', async () => {
    const { application, audit, boundary, resolver } = dependencies({ auditError: new Error('audit sink unavailable') });

    const result = await boundary.invoke(clientSafeRequest());

    expect(result.kind).toBe('runtime_unavailable');
    expect(resolver.resolve).toHaveBeenCalledTimes(1);
    expect(application.invoke).toHaveBeenCalledTimes(1);
    expect(audit.record).toHaveBeenCalledTimes(1);
  });
});
