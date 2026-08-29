import { describe, expect, it, vi } from 'vitest';
import {
  createAgentGatewayRuntimeBoundary,
  type AgentGatewayRuntimeApplication,
  type AgentGatewayRuntimeRequest,
  type RedactedAgentAuditSink,
} from './agentGatewayRuntime';

const validRequest: AgentGatewayRuntimeRequest = {
  nodeId: 'real-catalog-98',
  templateId: 'map-node-explanation-v1',
  responseSchemaId: 'ricis.agent-answer.v1',
  locale: 'en',
  correlationId: 'corr-runtime-red-001',
  explicitUserRequest: true,
};

function createApplicationMock(): AgentGatewayRuntimeApplication {
  return {
    explain: vi.fn().mockResolvedValue({ kind: 'unconfigured' }),
  };
}

function createAuditMock(): RedactedAgentAuditSink {
  return { record: vi.fn() };
}

describe('AgentGatewayRuntimeBoundary — red baseline', () => {
  it('returns static_host_unavailable without invoking the application', async () => {
    const application = createApplicationMock();
    const audit = createAuditMock();
    const runtime = createAgentGatewayRuntimeBoundary({
      application,
      audit,
      host: 'static',
    });

    await expect(runtime.explain(validRequest)).resolves.toEqual({
      kind: 'static_host_unavailable',
    });
    expect(application.explain).not.toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledTimes(1);
  });

  it('returns the typed unconfigured result through the injected application', async () => {
    const application = createApplicationMock();
    const audit = createAuditMock();
    const runtime = createAgentGatewayRuntimeBoundary({
      application,
      audit,
      host: 'server',
    });

    await expect(runtime.explain(validRequest)).resolves.toEqual({
      kind: 'unconfigured',
    });
    expect(application.explain).toHaveBeenCalledWith(validRequest);
    expect(audit.record).toHaveBeenCalledTimes(1);
  });

  it.each([
    'prompt',
    'providerId',
    'modelId',
    'endpoint',
    'apiKey',
    'token',
    'proof',
    'state',
    'type',
    'formula',
    'leanSource',
  ])('rejects forbidden request field %s before application execution', async (field) => {
    const application = createApplicationMock();
    const audit = createAuditMock();
    const runtime = createAgentGatewayRuntimeBoundary({
      application,
      audit,
      host: 'server',
    });
    const request = { ...validRequest, [field]: 'must-be-rejected' } as unknown as AgentGatewayRuntimeRequest;

    await expect(runtime.explain(request)).resolves.toMatchObject({
      kind: 'invalid_request',
    });
    expect(application.explain).not.toHaveBeenCalled();
  });

  it('does not expose mutation or proof promotion fields in an external suggestion', async () => {
    const application: AgentGatewayRuntimeApplication = {
      explain: vi.fn().mockResolvedValue({
        kind: 'external_ai_suggestion',
        answerBasis: 'context_only',
        canonicalAnswerJson: '{"responseKind":"answer"}',
        provenance: {
          providerId: 'provider.test',
          modelId: 'model.test',
          adapterVersion: 'adapter-v1',
        },
      }),
    };
    const audit = createAuditMock();
    const runtime = createAgentGatewayRuntimeBoundary({
      application,
      audit,
      host: 'server',
    });

    const result = await runtime.explain(validRequest);
    expect(result).toEqual({
      kind: 'external_ai_suggestion',
      answerBasis: 'context_only',
      canonicalAnswerJson: '{"responseKind":"answer"}',
      provenance: {
        providerId: 'provider.test',
        modelId: 'model.test',
        adapterVersion: 'adapter-v1',
      },
    });
    expect(result).not.toHaveProperty('proof');
    expect(result).not.toHaveProperty('state');
    expect(result).not.toHaveProperty('mutation');
  });
});
