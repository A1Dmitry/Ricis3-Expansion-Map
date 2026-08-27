import type { AgentInvocationResult, InvokeAgentQuestion } from './agentGatewayApplication';

export interface AgentGatewayRuntimeRequest {
  readonly nodeId: string;
  readonly templateId: string;
  readonly responseSchemaId: string;
  readonly locale: string;
  readonly correlationId: string;
  readonly explicitUserRequest: true;
}

export type ServerOwnedInvocationResolution =
  | { readonly kind: 'resolved'; readonly invocation: InvokeAgentQuestion }
  | {
      readonly kind: 'unavailable';
      readonly redactedReason:
        | 'context_unavailable'
        | 'identity_unavailable'
        | 'selection_unavailable'
        | 'artifact_unavailable';
    };

export interface ServerOwnedAgentInvocationResolver {
  resolve(request: AgentGatewayRuntimeRequest): Promise<ServerOwnedInvocationResolution>;
}

export interface PublishedAgentGatewayApplication {
  invoke(input: InvokeAgentQuestion): Promise<AgentInvocationResult>;
}

export interface RedactedAgentRuntimeAuditSink {
  record(event: Readonly<{
    correlationId: string;
    nodeIdHash: string;
    templateId: string;
    responseSchemaId: string;
    outcome: 'invalid_request' | 'static_host_unavailable' | 'runtime_unavailable' | AgentInvocationResult['kind'];
  }>): void;
}

export type AgentGatewayRuntimeResult =
  | AgentInvocationResult
  | { readonly kind: 'invalid_request'; readonly redactedReason: 'invalid_request' }
  | { readonly kind: 'runtime_unavailable'; readonly redactedReason: 'runtime_unavailable' };

export interface AgentGatewayRuntimeBoundary {
  invoke(input: unknown): Promise<AgentGatewayRuntimeResult>;
}

export interface AgentGatewayRuntimeBoundaryDependencies {
  readonly isStaticHost: boolean;
  readonly resolver: ServerOwnedAgentInvocationResolver;
  readonly application: PublishedAgentGatewayApplication;
  readonly audit: RedactedAgentRuntimeAuditSink;
}

const REQUIRED_REQUEST_KEYS = [
  'nodeId',
  'templateId',
  'responseSchemaId',
  'locale',
  'correlationId',
  'explicitUserRequest',
] as const;

const MAX_FIELD_LENGTH = 256;

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteText(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_FIELD_LENGTH;
}

function isRuntimeRequest(value: unknown): value is AgentGatewayRuntimeRequest {
  try {
    if (!isRecord(value)) return false;
    const keys = Object.keys(value).sort();
    if (keys.length !== REQUIRED_REQUEST_KEYS.length) return false;
    if (!REQUIRED_REQUEST_KEYS.every((key) => keys.includes(key))) return false;

    return (
      isFiniteText(value.nodeId) &&
      isFiniteText(value.templateId) &&
      isFiniteText(value.responseSchemaId) &&
      isFiniteText(value.locale) &&
      isFiniteText(value.correlationId) &&
      value.explicitUserRequest === true
    );
  } catch {
    return false;
  }
}

function redactedText(value: unknown): string {
  return isFiniteText(value) ? value : '';
}

function stableNodeIdHash(nodeId: string): string {
  let hash = 2166136261;
  for (let index = 0; index < nodeId.length; index += 1) {
    hash ^= nodeId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16)}`;
}

function invalidRequest(): AgentGatewayRuntimeResult {
  return { kind: 'invalid_request', redactedReason: 'invalid_request' };
}

function runtimeUnavailable(): AgentGatewayRuntimeResult {
  return { kind: 'runtime_unavailable', redactedReason: 'runtime_unavailable' };
}

function auditInput(value: unknown): Readonly<{
  correlationId: string;
  nodeIdHash: string;
  templateId: string;
  responseSchemaId: string;
}> {
  const record = isRecord(value) ? value : {};
  return {
    correlationId: redactedText(record.correlationId),
    nodeIdHash: stableNodeIdHash(redactedText(record.nodeId)),
    templateId: redactedText(record.templateId),
    responseSchemaId: redactedText(record.responseSchemaId),
  };
}

function recordTerminal(
  audit: RedactedAgentRuntimeAuditSink,
  input: unknown,
  outcome: AgentGatewayRuntimeResult['kind'],
): boolean {
  try {
    audit.record({ ...auditInput(input), outcome });
    return true;
  } catch {
    return false;
  }
}

export function createAgentGatewayRuntimeBoundary(
  dependencies: AgentGatewayRuntimeBoundaryDependencies,
): AgentGatewayRuntimeBoundary {
  return {
    async invoke(input: unknown): Promise<AgentGatewayRuntimeResult> {
      if (!isRuntimeRequest(input)) {
        const result = invalidRequest();
        return recordTerminal(dependencies.audit, input, result.kind) ? result : runtimeUnavailable();
      }

      if (dependencies.isStaticHost) {
        const result: AgentInvocationResult = { kind: 'static_host_unavailable' };
        return recordTerminal(dependencies.audit, input, result.kind) ? result : runtimeUnavailable();
      }

      let resolution: ServerOwnedInvocationResolution;
      try {
        resolution = await dependencies.resolver.resolve(input);
      } catch {
        const result = runtimeUnavailable();
        return recordTerminal(dependencies.audit, input, result.kind) ? result : result;
      }

      if (resolution.kind === 'unavailable') {
        const result = runtimeUnavailable();
        return recordTerminal(dependencies.audit, input, result.kind) ? result : result;
      }

      let result: AgentInvocationResult;
      try {
        result = await dependencies.application.invoke(resolution.invocation);
      } catch {
        const unavailable = runtimeUnavailable();
        return recordTerminal(dependencies.audit, input, unavailable.kind) ? unavailable : unavailable;
      }

      return recordTerminal(dependencies.audit, input, result.kind) ? result : runtimeUnavailable();
    },
  };
}
