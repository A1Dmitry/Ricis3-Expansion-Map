export type AgentGatewayRuntimeHost = 'server' | 'static';

export interface AgentGatewayRuntimeRequest {
  readonly nodeId: string;
  readonly templateId: string;
  readonly responseSchemaId: string;
  readonly locale: string;
  readonly correlationId: string;
  readonly explicitUserRequest: true;
}

export type AgentGatewayRuntimeResult =
  | { readonly kind: 'static_host_unavailable' }
  | { readonly kind: 'unconfigured' }
  | { readonly kind: 'provider_unavailable'; readonly redactedReason: string }
  | { readonly kind: 'invalid_provider_output'; readonly redactedReason: string }
  | { readonly kind: 'invalid_request'; readonly redactedReason: string }
  | {
      readonly kind: 'external_ai_suggestion';
      readonly answerBasis: 'context_only' | 'context_and_web';
      readonly canonicalAnswerJson: string;
      readonly provenance: Readonly<{
        providerId: string;
        modelId: string;
        adapterVersion: string;
      }>;
    };

export interface AgentGatewayRuntimeApplication {
  explain(request: AgentGatewayRuntimeRequest): Promise<AgentGatewayRuntimeResult>;
}

export interface RedactedAgentAuditEvent {
  readonly correlationId: string;
  readonly nodeIdHash: string;
  readonly templateId: string;
  readonly responseSchemaId: string;
  readonly outcome: AgentGatewayRuntimeResult['kind'];
}

export interface RedactedAgentAuditSink {
  record(event: RedactedAgentAuditEvent): void;
}

export interface AgentGatewayRuntimeBoundary {
  explain(request: AgentGatewayRuntimeRequest): Promise<AgentGatewayRuntimeResult>;
}

export interface CreateAgentGatewayRuntimeBoundaryOptions {
  readonly application: AgentGatewayRuntimeApplication;
  readonly audit: RedactedAgentAuditSink;
  readonly host: AgentGatewayRuntimeHost;
}

const allowedRequestFields = new Set([
  'nodeId',
  'templateId',
  'responseSchemaId',
  'locale',
  'correlationId',
  'explicitUserRequest',
]);

const forbiddenRequestFields = new Set([
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
]);

const maxIdentifierLength = 256;

function stableNodeIdHash(nodeId: string): string {
  let hash = 2166136261;
  for (let index = 0; index < nodeId.length; index += 1) {
    hash ^= nodeId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function record(
  audit: RedactedAgentAuditSink,
  request: AgentGatewayRuntimeRequest,
  outcome: AgentGatewayRuntimeResult['kind'],
): void {
  audit.record({
    correlationId: request.correlationId,
    nodeIdHash: stableNodeIdHash(request.nodeId),
    templateId: request.templateId,
    responseSchemaId: request.responseSchemaId,
    outcome,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidRequest(value: unknown): value is AgentGatewayRuntimeRequest {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value);
  if (keys.some((key) => forbiddenRequestFields.has(key))) return false;
  if (keys.some((key) => !allowedRequestFields.has(key))) return false;
  if (keys.length !== allowedRequestFields.size) return false;
  if (value.explicitUserRequest !== true) return false;
  return ['nodeId', 'templateId', 'responseSchemaId', 'locale', 'correlationId'].every((key) => {
    const field = value[key];
    return typeof field === 'string' && field.length > 0 && field.length <= maxIdentifierLength;
  });
}

function publicResult(result: AgentGatewayRuntimeResult): AgentGatewayRuntimeResult {
  if (result.kind === 'external_ai_suggestion') {
    return {
      kind: result.kind,
      answerBasis: result.answerBasis,
      canonicalAnswerJson: result.canonicalAnswerJson,
      provenance: {
        providerId: result.provenance.providerId,
        modelId: result.provenance.modelId,
        adapterVersion: result.provenance.adapterVersion,
      },
    };
  }
  if (result.kind === 'provider_unavailable' || result.kind === 'invalid_provider_output' || result.kind === 'invalid_request') {
    return { kind: result.kind, redactedReason: result.redactedReason };
  }
  return { kind: result.kind };
}

export function createAgentGatewayRuntimeBoundary(
  options: CreateAgentGatewayRuntimeBoundaryOptions,
): AgentGatewayRuntimeBoundary {
  return {
    async explain(request: AgentGatewayRuntimeRequest): Promise<AgentGatewayRuntimeResult> {
      const rawRequest: unknown = request;
      if (!isValidRequest(rawRequest)) {
        const safeRequest = isRecord(rawRequest)
          ? ({
              nodeId: typeof rawRequest.nodeId === 'string' ? rawRequest.nodeId : 'invalid',
              templateId: typeof rawRequest.templateId === 'string' ? rawRequest.templateId : 'invalid',
              responseSchemaId: typeof rawRequest.responseSchemaId === 'string' ? rawRequest.responseSchemaId : 'invalid',
              locale: typeof rawRequest.locale === 'string' ? rawRequest.locale : 'invalid',
              correlationId: typeof rawRequest.correlationId === 'string' ? rawRequest.correlationId : 'invalid',
              explicitUserRequest: true as const,
            } satisfies AgentGatewayRuntimeRequest)
          : ({
              nodeId: 'invalid',
              templateId: 'invalid',
              responseSchemaId: 'invalid',
              locale: 'invalid',
              correlationId: 'invalid',
              explicitUserRequest: true as const,
            } satisfies AgentGatewayRuntimeRequest);
        record(options.audit, safeRequest, 'invalid_request');
        return { kind: 'invalid_request', redactedReason: 'request_rejected' };
      }

      if (options.host === 'static') {
        record(options.audit, request, 'static_host_unavailable');
        return { kind: 'static_host_unavailable' };
      }

      const result = publicResult(await options.application.explain(request));
      record(options.audit, request, result.kind);
      return result;
    },
  };
}
