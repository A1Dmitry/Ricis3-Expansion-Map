export interface AgentGatewayTestIds {
  readonly accountId: string;
  readonly deniedAccountId: string;
  readonly providerId: string;
  readonly modelId: string;
  readonly adapterVersion: string;
  readonly providerFingerprint: string;
  readonly requestId: string;
  readonly correlationId: string;
  readonly templateId: string;
  readonly templateVersion: string;
  readonly controlTemplateId: string;
  readonly schemaId: string;
  readonly schemaVersion: string;
  readonly profileId: string;
  readonly profileVersion: string;
  readonly artifactId: string;
  readonly artifactHash: string;
  readonly fragmentId: string;
  readonly graphId: string;
  readonly graphVersion: string;
  readonly graphHash: string;
  readonly privateKeySentinel: string;
  readonly oauthTokenSentinel: string;
  readonly apiKeySentinel: string;
}

export type AgentCapability =
  | 'text_completion'
  | 'structured_json'
  | 'model_catalog'
  | 'web_search_with_citations'
  | 'tool_usage_observability'
  | 'provider_fingerprint';

export type AgentToolSelectionPolicy =
  | { readonly kind: 'none' }
  | {
      readonly kind: 'auto';
      readonly maxToolCalls: number;
      readonly maxCitations: number;
      readonly maxElapsedMilliseconds: number;
      readonly maxProviderCostMinorUnits: number;
    };

export type AgentProviderAvailability =
  | { readonly kind: 'ready'; readonly capabilities: readonly AgentCapability[] }
  | { readonly kind: 'unconfigured' }
  | { readonly kind: 'disabled' }
  | { readonly kind: 'quota_exhausted' }
  | { readonly kind: 'rate_limited'; readonly retryAfterSeconds?: number }
  | { readonly kind: 'payment_required' }
  | { readonly kind: 'tool_unavailable'; readonly capability: AgentCapability }
  | { readonly kind: 'provider_unavailable'; readonly redactedReason: string }
  | { readonly kind: 'static_host_unavailable' }
  | { readonly kind: 'requires_reauthentication' };

export interface AgentProviderDescriptor {
  readonly providerId: string;
  readonly displayResourceKey: string;
  readonly adapterVersion: string;
  readonly modelFingerprint?: string;
  readonly endpointFamily: 'gemini_developer_api' | 'openai_compatible' | 'huggingface_router' | 'cloudflare_workers_ai';
  readonly serverRuntimeRequired: true;
  readonly supportedCapabilities: readonly AgentCapability[];
  readonly requiresExternalProcessingConsent: boolean;
  readonly maximumRequestBytes: number;
  readonly maximumResponseBytes: number;
  readonly defaultEnabled: false;
}

export interface AgentModelDescriptor {
  readonly providerId: string;
  readonly modelId: string;
  readonly displayResourceKey: string;
  readonly capabilities: readonly AgentCapability[];
  readonly category: 'flash' | 'pro' | 'experimental' | 'other';
  readonly isFast: boolean;
  readonly isDefaultCandidate: boolean;
}

export interface AgentModelOptionDto {
  readonly id: string;
  readonly name: string;
  readonly category: 'flash' | 'pro' | 'experimental' | 'other';
  readonly isDefault?: boolean;
  readonly isFast?: boolean;
  readonly providerId: string;
  readonly modelId: string;
  readonly availability: AgentProviderAvailability['kind'];
  readonly capabilities: readonly AgentCapability[];
}

export interface AgentCitation {
  readonly url: string;
  readonly title: string;
  readonly citationIndex: number;
  readonly excerptHash?: string;
}

export interface ObservedToolEvent {
  readonly tool: 'web_search_with_citations';
  readonly invocationIndex: number;
  readonly citations: readonly AgentCitation[];
}

export interface ProviderStructuredResponse {
  readonly requestId: string;
  readonly providerId: string;
  readonly modelId: string;
  readonly providerFingerprint?: string;
  readonly rawJson: string;
  readonly observedToolEvents: readonly ObservedToolEvent[];
  readonly receivedAt: number;
}

export interface ProviderStructuredRequest {
  readonly requestId: string;
  readonly modelId: string;
  readonly renderedInstruction: string;
  readonly responseSchema: AgentResponseSchema;
  readonly toolPolicy: AgentToolSelectionPolicy;
  readonly maxInputBytes: number;
  readonly maxOutputBytes: number;
  readonly correlationId: string;
}

export type ProviderInvocationFailure =
  | { readonly kind: 'quota_exhausted' }
  | { readonly kind: 'rate_limited'; readonly retryAfterSeconds?: number }
  | { readonly kind: 'payment_required' }
  | { readonly kind: 'tool_unavailable'; readonly capability: AgentCapability }
  | { readonly kind: 'provider_unavailable'; readonly redactedReason: string }
  | { readonly kind: 'response_too_large' }
  | { readonly kind: 'timeout' };

export interface AgentProvider {
  descriptor(): AgentProviderDescriptor;
  listModels(): Promise<readonly AgentModelDescriptor[]>;
  checkAvailability(): Promise<AgentProviderAvailability>;
  completeStructured(input: ProviderStructuredRequest): Promise<ProviderStructuredResponse | ProviderInvocationFailure>;
}

export class StaticAgentProviderRegistry {
  private readonly providers = new Map<string, AgentProvider>();
  private readonly descriptors: readonly AgentProviderDescriptor[];

  public constructor(providers: readonly AgentProvider[]) {
    const descriptors: AgentProviderDescriptor[] = [];
    for (const provider of providers) {
      const descriptor = provider.descriptor();
      if (this.providers.has(descriptor.providerId)) {
        throw new Error(`Duplicate provider ID: ${descriptor.providerId}`);
      }
      this.providers.set(descriptor.providerId, provider);
      descriptors.push(Object.freeze({
        ...descriptor,
        supportedCapabilities: Object.freeze([...descriptor.supportedCapabilities]),
      }));
    }
    this.descriptors = Object.freeze(descriptors);
  }

  public findProvider(providerId: string): AgentProvider | null {
    return this.providers.get(providerId) ?? null;
  }

  public listDescriptors(): readonly AgentProviderDescriptor[] {
    return this.descriptors;
  }
}

export interface AgentResponseSchema {
  readonly schemaId: string;
  readonly version: string;
  readonly canonicalSchemaJson: string;
  readonly canonicalSchemaHash: string;
  readonly maximumJsonBytes: number;
  readonly maximumDepth: number;
  readonly maximumArrayItems: number;
}

export interface AgentQuestionTemplate {
  readonly templateId: string;
  readonly version: string;
  readonly locale: string;
  readonly instructionResourceKey: string;
  readonly responseSchemaId: string;
  readonly responseSchemaVersion: string;
  readonly qualificationSequence: 'control_before_primary' | 'control_after_quarantined_primary';
  readonly toolPolicy: AgentToolSelectionPolicy;
}

export interface ResolvedAgentQuestion {
  readonly template: AgentQuestionTemplate;
  readonly renderedInstruction: string;
  readonly responseSchema: AgentResponseSchema;
}

export interface LeanContextFragment {
  readonly fragmentId: string;
  readonly contentHash: string;
  readonly text: string;
}

export interface LeanContextEnvelope {
  readonly artifactId: string;
  readonly artifactHash: string;
  readonly locale: string;
  readonly classification: 'exportable_research_context';
  readonly sourceTrustStatus: 'LEAN_VERIFIED' | 'TRUSTED_AXIOM' | 'REQUIRES_CORE_LEAN' | 'STATIC_CHECK_PASSED' | 'HYPOTHESIS' | 'REJECTED';
  readonly fragments: readonly LeanContextFragment[];
}

export interface ValidatedAgentAnswer {
  readonly schemaId: string;
  readonly schemaVersion: string;
  readonly responseKind: 'answer' | 'insufficient_context' | 'tool_unavailable' | 'quota_unavailable' | 'refusal';
  readonly answerBasis: 'context_only' | 'context_and_web';
  readonly semanticValueCanonicalJson: string;
  readonly canonicalJson: string;
  readonly canonicalJsonHash: string;
  readonly referencedLeanFragments: readonly string[];
  readonly webEvidence: readonly AgentCitation[];
}

export type AgentResponseValidationResult =
  | { readonly kind: 'valid'; readonly answer: ValidatedAgentAnswer }
  | { readonly kind: 'invalid_provider_output'; readonly redactedReason: string };

export interface RicisKnowledgeProfile {
  readonly profileId: string;
  readonly version: string;
  readonly profileHash: string;
  readonly sourceTrustStatus: LeanContextEnvelope['sourceTrustStatus'];
  readonly axiomIds: readonly string[];
  readonly expectedOutcome: {
    readonly responseKind: 'answer';
    readonly semanticValueCanonicalJson: string;
    readonly requiredAxiomIds: readonly string[];
    readonly requiredAnswerBasis: 'context_only';
    readonly expectedToolCalls: 0;
  };
}

export interface AxiomControlTemplate {
  readonly templateId: string;
  readonly version: string;
  readonly knowledgeProfileId: string;
  readonly knowledgeProfileVersion: string;
  readonly responseSchemaId: string;
  readonly responseSchemaVersion: string;
  readonly toolPolicy: { readonly kind: 'none' };
}

export type AxiomControlOutcome =
  | { readonly kind: 'pass'; readonly profileId: string }
  | { readonly kind: 'knowledge_conflict'; readonly redactedReason: string }
  | { readonly kind: 'invalid_provider_output'; readonly redactedReason: string }
  | { readonly kind: 'control_unavailable'; readonly availability: AgentProviderAvailability };

export interface ProviderQualificationKey {
  readonly providerId: string;
  readonly modelId: string;
  readonly adapterVersion: string;
  readonly providerFingerprint?: string;
  readonly responseSchemaSetHash: string;
  readonly knowledgeProfileSetHash: string;
  readonly toolPolicyHash: string;
  readonly graphManifestHash?: string;
}

export type ProviderQualificationState = 'unqualified' | 'qualifying' | 'qualified' | 'qualification_failed' | 'stale' | 'revoked';

export interface ProviderQualificationRecord {
  readonly qualificationKey: ProviderQualificationKey;
  readonly state: ProviderQualificationState;
  readonly requiredProfiles: readonly string[];
  readonly completedAt?: number;
  readonly invalidatedAt?: number;
  readonly redactedReason?: string;
}

export interface RicisGraphManifest {
  readonly graphId: string;
  readonly graphVersion: string;
  readonly manifestHash: string;
  readonly nodeHashes: readonly string[];
  readonly edgeHashes: readonly string[];
  readonly requiredKnowledgeProfiles: readonly string[];
  readonly requiredControlTemplateIds: readonly string[];
  readonly requiredResponseSchemaHashes: readonly string[];
  readonly compatibilitySuiteRevision: string;
}

export interface EngineCompatibilityRecord {
  readonly engineClassification: 'ricis_compatible_engine';
  readonly qualificationKey: ProviderQualificationKey;
  readonly graphManifestHash: string;
  readonly compatibilitySuiteRevision: string;
  readonly qualifiedAt: number;
}

export type EngineClassificationResult =
  | { readonly kind: 'external_agent'; readonly classification: 'external_agent' }
  | { readonly kind: 'candidate_manifest_rejected'; readonly redactedReason: string }
  | { readonly kind: 'ricis_engine_candidate'; readonly manifest: RicisGraphManifest }
  | { readonly kind: 'ricis_compatible_engine'; readonly record: EngineCompatibilityRecord };

export interface AgentGatewayDependencies {
  readonly providers: {
    findProvider(providerId: string): AgentProvider | null;
    listDescriptors(): readonly AgentProviderDescriptor[];
  };
  readonly templates: {
    resolveQuestion(templateId: string, locale: string, parameters: Readonly<Record<string, unknown>>): Promise<ResolvedAgentQuestion | null>;
    findResponseSchema(schemaId: string, version: string): Promise<AgentResponseSchema | null>;
  };
  readonly profiles: {
    findProfile(profileId: string, version: string): Promise<RicisKnowledgeProfile | null>;
    findControlTemplate(profile: RicisKnowledgeProfile, locale: string): Promise<AxiomControlTemplate | null>;
    requiredProfiles(): readonly RicisKnowledgeProfile[];
  };
  readonly validator: DeterministicAgentResponseValidator;
  readonly qualificationStore: InMemoryProviderQualificationStore;
  readonly engineCompatibility: StaticEngineCompatibilityRegistry;
  readonly authorization: {
    authorize(input: { readonly accountId: string; readonly providerId: string; readonly modelId: string; readonly leanArtifactId: string }): Promise<
      | { readonly kind: 'allowed' }
      | { readonly kind: 'feature_entitlement_required' }
      | { readonly kind: 'artifact_access_denied' }
      | { readonly kind: 'requires_authentication' }
    >;
    externalProcessingConsent(input: { readonly accountId: string; readonly providerId: string; readonly leanArtifactId: string }): Promise<
      | { readonly kind: 'granted'; readonly consentVersion: string }
      | { readonly kind: 'required' }
      | { readonly kind: 'revoked' }
    >;
  };
  readonly runtime: { serverRuntimeAvailable(): boolean };
  readonly audit: { append(event: AgentAuditEvent): Promise<void> };
  readonly clock: { now(): number };
  readonly ids: { newRequestId(): string; newAuditEventId(): string };
}

export interface AgentAuditEvent {
  readonly eventId: string;
  readonly requestId: string;
  readonly correlationId: string;
  readonly providerId: string;
  readonly modelId: string;
  readonly eventType: 'invocation_denied' | 'qualification_started' | 'qualification_passed' | 'qualification_failed' | 'provider_invoked' | 'structured_output_rejected' | 'knowledge_conflict' | 'answer_accepted';
  readonly outcome: 'allowed' | 'denied' | 'failed';
  readonly redactedReason?: string;
  readonly at: number;
}

export interface InvokeAgentQuestion {
  readonly requestId: string;
  readonly accountId: string;
  readonly selection: { readonly providerId: string; readonly modelId: string };
  readonly templateId: string;
  readonly locale: string;
  readonly templateParameters: Readonly<Record<string, unknown>>;
  readonly leanContext: LeanContextEnvelope;
  readonly correlationId: string;
}

export type AgentInvocationResult =
  | { readonly kind: 'accepted'; readonly answer: ValidatedAgentAnswer; readonly provenance: AgentExecutionProvenance }
  | { readonly kind: 'qualification_required' }
  | { readonly kind: 'qualification_failed'; readonly redactedReason: string }
  | { readonly kind: 'knowledge_conflict'; readonly redactedReason: string }
  | { readonly kind: 'invalid_provider_output'; readonly redactedReason: string }
  | { readonly kind: 'external_processing_consent_required' }
  | { readonly kind: 'artifact_access_denied' }
  | { readonly kind: 'feature_entitlement_required' }
  | { readonly kind: 'provider_unavailable'; readonly availability: AgentProviderAvailability }
  | { readonly kind: 'static_host_unavailable' }
  | { readonly kind: 'template_resolution_failed' };

export interface AgentExecutionProvenance {
  readonly requestId: string;
  readonly providerId: string;
  readonly modelId: string;
  readonly adapterVersion: string;
  readonly providerFingerprint?: string;
  readonly templateId: string;
  readonly templateVersion: string;
  readonly responseSchemaHash: string;
  readonly leanArtifactId: string;
  readonly leanArtifactHash: string;
  readonly qualificationKey: ProviderQualificationKey;
  readonly engineClassification: 'external_agent' | 'ricis_engine_candidate' | 'ricis_compatible_engine';
  readonly correlationId: string;
}

export function projectAgentModelOptions(
  models: readonly AgentModelDescriptor[],
  availability: AgentProviderAvailability,
): readonly AgentModelOptionDto[] {
  return models.map((model) => ({
    id: model.modelId,
    name: model.displayResourceKey,
    category: model.category,
    isDefault: model.isDefaultCandidate || undefined,
    isFast: model.isFast || undefined,
    providerId: model.providerId,
    modelId: model.modelId,
    availability: availability.kind,
    capabilities: [...model.capabilities],
  }));
}

export function createRicisTypedZeroSameGeneratorProfile(input: {
  readonly profileId: string;
  readonly version: string;
  readonly profileHash: string;
}): RicisKnowledgeProfile {
  return {
    profileId: input.profileId,
    version: input.version,
    profileHash: input.profileHash,
    sourceTrustStatus: 'TRUSTED_AXIOM',
    axiomIds: ['SP3', 'A4'],
    expectedOutcome: {
      responseKind: 'answer',
      semanticValueCanonicalJson: '1',
      requiredAxiomIds: ['SP3', 'A4'],
      requiredAnswerBasis: 'context_only',
      expectedToolCalls: 0,
    },
  };
}

function stableHash(input: string): string {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16)}`;
}

function hasSensitiveMarker(context: LeanContextEnvelope): boolean {
  return context.fragments.some((fragment) => /oauth|private[_ -]?key|api[_ -]?key|enrollment[_ -]?token/i.test(fragment.text));
}

function qualificationKeyId(key: ProviderQualificationKey): string {
  return JSON.stringify({
    adapterVersion: key.adapterVersion,
    graphManifestHash: key.graphManifestHash ?? null,
    knowledgeProfileSetHash: key.knowledgeProfileSetHash,
    modelId: key.modelId,
    providerFingerprint: key.providerFingerprint ?? null,
    providerId: key.providerId,
    responseSchemaSetHash: key.responseSchemaSetHash,
    toolPolicyHash: key.toolPolicyHash,
  });
}

function scanForDuplicateObjectKeys(input: string): boolean {
  let index = 0;
  const whitespace = /\s/;

  const skipWhitespace = () => {
    while (index < input.length && whitespace.test(input[index] ?? '')) index += 1;
  };

  const readString = (): string => {
    if (input[index] !== '"') throw new Error('Expected JSON string.');
    const start = index;
    index += 1;
    while (index < input.length) {
      const character = input[index] ?? '';
      if (character === '\\') {
        index += 2;
        continue;
      }
      if (character === '"') {
        index += 1;
        return JSON.parse(input.slice(start, index)) as string;
      }
      index += 1;
    }
    throw new Error('Unterminated JSON string.');
  };

  const readLiteral = () => {
    while (index < input.length && !/[\s,\]}]/.test(input[index] ?? '')) index += 1;
  };

  const readValue = (): boolean => {
    skipWhitespace();
    const character = input[index];
    if (character === '{') {
      index += 1;
      const keys = new Set<string>();
      skipWhitespace();
      if (input[index] === '}') {
        index += 1;
        return false;
      }
      while (index < input.length) {
        skipWhitespace();
        const key = readString();
        if (keys.has(key)) return true;
        keys.add(key);
        skipWhitespace();
        if (input[index] !== ':') throw new Error('Expected JSON object colon.');
        index += 1;
        if (readValue()) return true;
        skipWhitespace();
        if (input[index] === '}') {
          index += 1;
          return false;
        }
        if (input[index] !== ',') throw new Error('Expected JSON object separator.');
        index += 1;
      }
      throw new Error('Unterminated JSON object.');
    }
    if (character === '[') {
      index += 1;
      skipWhitespace();
      if (input[index] === ']') {
        index += 1;
        return false;
      }
      while (index < input.length) {
        if (readValue()) return true;
        skipWhitespace();
        if (input[index] === ']') {
          index += 1;
          return false;
        }
        if (input[index] !== ',') throw new Error('Expected JSON array separator.');
        index += 1;
      }
      throw new Error('Unterminated JSON array.');
    }
    if (character === '"') {
      readString();
      return false;
    }
    readLiteral();
    return false;
  };

  const duplicate = readValue();
  skipWhitespace();
  if (index !== input.length) throw new Error('Unexpected JSON suffix.');
  return duplicate;
}

function inspectJsonLimits(value: unknown, depth = 1): { readonly depth: number; readonly maxArrayItems: number } {
  if (Array.isArray(value)) {
    return value.reduce(
      (current, item) => {
        const child = inspectJsonLimits(item, depth + 1);
        return { depth: Math.max(current.depth, child.depth), maxArrayItems: Math.max(current.maxArrayItems, child.maxArrayItems) };
      },
      { depth, maxArrayItems: value.length },
    );
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).reduce(
      (current, item) => {
        const child = inspectJsonLimits(item, depth + 1);
        return { depth: Math.max(current.depth, child.depth), maxArrayItems: Math.max(current.maxArrayItems, child.maxArrayItems) };
      },
      { depth, maxArrayItems: 0 },
    );
  }
  return { depth, maxArrayItems: 0 };
}

function invalidProviderOutput(): AgentResponseValidationResult {
  return { kind: 'invalid_provider_output', redactedReason: 'structured_output_rejected' };
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseCitations(value: unknown): readonly AgentCitation[] | null {
  if (!Array.isArray(value)) return null;
  const citations: AgentCitation[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.url !== 'string' || typeof item.title !== 'string' || typeof item.citationIndex !== 'number') return null;
    if (!item.url.startsWith('https://')) return null;
    citations.push({ url: item.url, title: item.title, citationIndex: item.citationIndex });
  }
  return citations;
}

export class DeterministicAgentResponseValidator {
  public async validate(
    response: ProviderStructuredResponse,
    schema: AgentResponseSchema,
    input: LeanContextEnvelope,
    policy: AgentToolSelectionPolicy,
  ): Promise<AgentResponseValidationResult> {
    if (new TextEncoder().encode(response.rawJson).byteLength > schema.maximumJsonBytes) return invalidProviderOutput();

    let parsed: unknown;
    try {
      if (scanForDuplicateObjectKeys(response.rawJson)) return invalidProviderOutput();
      parsed = JSON.parse(response.rawJson) as unknown;
    } catch {
      return invalidProviderOutput();
    }

    const limits = inspectJsonLimits(parsed);
    if (limits.depth > schema.maximumDepth || limits.maxArrayItems > schema.maximumArrayItems || !isRecord(parsed)) return invalidProviderOutput();
    if (typeof parsed.schemaVersion !== 'string' || parsed.schemaVersion !== schema.version) return invalidProviderOutput();
    if (typeof parsed.responseKind !== 'string' || !['answer', 'insufficient_context', 'tool_unavailable', 'quota_unavailable', 'refusal'].includes(parsed.responseKind)) return invalidProviderOutput();
    if (parsed.answerBasis !== 'context_only' && parsed.answerBasis !== 'context_and_web') return invalidProviderOutput();
    if (!Array.isArray(parsed.referencedLeanFragments) || !parsed.referencedLeanFragments.every((value) => typeof value === 'string')) return invalidProviderOutput();
    const knownFragments = new Set(input.fragments.map((fragment) => fragment.fragmentId));
    if (!(parsed.referencedLeanFragments as readonly string[]).every((fragmentId) => knownFragments.has(fragmentId))) return invalidProviderOutput();
    if (!isRecord(parsed.toolUsage) || typeof parsed.toolUsage.webSearchInvoked !== 'boolean' || typeof parsed.toolUsage.count !== 'number') return invalidProviderOutput();
    if ('LEAN_VERIFIED' in parsed || 'resolved' in parsed || 'proof' in parsed) return invalidProviderOutput();

    const citations = parseCitations(parsed.webEvidence);
    if (citations === null) return invalidProviderOutput();
    const observedCitationCount = response.observedToolEvents.reduce((count, event) => count + event.citations.length, 0);
    const observedToolCalls = response.observedToolEvents.length;
    const toolUsage = parsed.toolUsage as Readonly<Record<string, unknown>>;

    if (parsed.answerBasis === 'context_only') {
      if (citations.length !== 0 || observedToolCalls !== 0 || toolUsage.webSearchInvoked !== false || toolUsage.count !== 0) return invalidProviderOutput();
    } else {
      if (policy.kind !== 'auto' || citations.length === 0 || observedToolCalls === 0) return invalidProviderOutput();
      if (toolUsage.webSearchInvoked !== true || toolUsage.count !== observedToolCalls) return invalidProviderOutput();
      if (observedToolCalls > policy.maxToolCalls || citations.length > policy.maxCitations || observedCitationCount < citations.length) return invalidProviderOutput();
    }

    if (!('semanticValue' in parsed) || !Array.isArray(parsed.axiomIds) || !parsed.axiomIds.every((value) => typeof value === 'string')) return invalidProviderOutput();

    const canonicalJson = JSON.stringify(parsed);
    return {
      kind: 'valid',
      answer: {
        schemaId: schema.schemaId,
        schemaVersion: schema.version,
        responseKind: parsed.responseKind as ValidatedAgentAnswer['responseKind'],
        answerBasis: parsed.answerBasis,
        semanticValueCanonicalJson: JSON.stringify(parsed.semanticValue),
        canonicalJson,
        canonicalJsonHash: stableHash(canonicalJson),
        referencedLeanFragments: [...(parsed.referencedLeanFragments as readonly string[])],
        webEvidence: citations,
      },
    };
  }
}

export class InMemoryProviderQualificationStore {
  private readonly records = new Map<string, ProviderQualificationRecord>();

  public async find(key: ProviderQualificationKey): Promise<ProviderQualificationRecord | null> {
    return this.records.get(qualificationKeyId(key)) ?? null;
  }

  public async save(record: ProviderQualificationRecord): Promise<void> {
    if (record.state === 'qualified' && record.requiredProfiles.length === 0) {
      throw new Error('A qualified provider requires at least one control profile.');
    }
    this.records.set(qualificationKeyId(record.qualificationKey), { ...record, requiredProfiles: [...record.requiredProfiles] });
  }

  public async invalidate(key: ProviderQualificationKey, at: number, reason: string): Promise<void> {
    this.records.set(qualificationKeyId(key), {
      qualificationKey: { ...key },
      state: 'stale',
      requiredProfiles: [],
      invalidatedAt: at,
      redactedReason: reason,
    });
  }
}

function sameStringSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

export class StaticEngineCompatibilityRegistry {
  private readonly compatibleRecords = new Map<string, EngineCompatibilityRecord>();

  public constructor(private readonly configuration: {
    readonly canonicalGraphManifest: RicisGraphManifest;
    readonly compatibleQualificationKeys?: readonly ProviderQualificationKey[];
  }) {
    for (const key of configuration.compatibleQualificationKeys ?? []) {
      if (key.graphManifestHash !== configuration.canonicalGraphManifest.manifestHash) continue;
      this.compatibleRecords.set(qualificationKeyId(key), {
        engineClassification: 'ricis_compatible_engine',
        qualificationKey: { ...key },
        graphManifestHash: configuration.canonicalGraphManifest.manifestHash,
        compatibilitySuiteRevision: configuration.canonicalGraphManifest.compatibilitySuiteRevision,
        qualifiedAt: 0,
      });
    }
  }

  public async classify(key: ProviderQualificationKey, claimedManifest: RicisGraphManifest | null): Promise<EngineClassificationResult> {
    if (claimedManifest === null) return { kind: 'external_agent', classification: 'external_agent' };
    const canonical = this.configuration.canonicalGraphManifest;
    const isExact =
      claimedManifest.manifestHash === canonical.manifestHash &&
      sameStringSet(claimedManifest.nodeHashes, canonical.nodeHashes) &&
      sameStringSet(claimedManifest.edgeHashes, canonical.edgeHashes) &&
      sameStringSet(claimedManifest.requiredKnowledgeProfiles, canonical.requiredKnowledgeProfiles) &&
      sameStringSet(claimedManifest.requiredControlTemplateIds, canonical.requiredControlTemplateIds) &&
      sameStringSet(claimedManifest.requiredResponseSchemaHashes, canonical.requiredResponseSchemaHashes) &&
      claimedManifest.compatibilitySuiteRevision === canonical.compatibilitySuiteRevision;
    if (!isExact) return { kind: 'candidate_manifest_rejected', redactedReason: 'graph_manifest_mismatch' };
    const record = this.compatibleRecords.get(qualificationKeyId(key));
    if (record !== undefined) return { kind: 'ricis_compatible_engine', record };
    return { kind: 'ricis_engine_candidate', manifest: { ...claimedManifest } };
  }

  public async findCompatible(key: ProviderQualificationKey): Promise<EngineCompatibilityRecord | null> {
    return this.compatibleRecords.get(qualificationKeyId(key)) ?? null;
  }
}

function controlOutcome(
  profile: RicisKnowledgeProfile,
  validation: AgentResponseValidationResult,
  response: ProviderStructuredResponse,
): AxiomControlOutcome {
  if (validation.kind !== 'valid') return validation;
  const answer = validation.answer;
  if (
    answer.responseKind !== profile.expectedOutcome.responseKind ||
    answer.answerBasis !== profile.expectedOutcome.requiredAnswerBasis ||
    answer.semanticValueCanonicalJson !== profile.expectedOutcome.semanticValueCanonicalJson ||
    response.observedToolEvents.length !== profile.expectedOutcome.expectedToolCalls
  ) {
    return { kind: 'knowledge_conflict', redactedReason: 'control_outcome_mismatch' };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(answer.canonicalJson) as unknown;
  } catch {
    return { kind: 'invalid_provider_output', redactedReason: 'control_json_unreadable' };
  }
  if (!isRecord(parsed) || !Array.isArray(parsed.axiomIds)) {
    return { kind: 'knowledge_conflict', redactedReason: 'control_axiom_mismatch' };
  }
  const controlAxiomIds = parsed.axiomIds as readonly unknown[];
  if (!profile.expectedOutcome.requiredAxiomIds.every((axiom) => controlAxiomIds.includes(axiom))) {
    return { kind: 'knowledge_conflict', redactedReason: 'control_axiom_mismatch' };
  }
  if (parsed.sourceTrustStatus !== profile.sourceTrustStatus) return { kind: 'knowledge_conflict', redactedReason: 'control_trust_mismatch' };
  return { kind: 'pass', profileId: profile.profileId };
}

function isProviderFailure(value: ProviderStructuredResponse | ProviderInvocationFailure): value is ProviderInvocationFailure {
  return 'kind' in value;
}

function providerFailureToAvailability(failure: ProviderInvocationFailure): AgentProviderAvailability {
  switch (failure.kind) {
    case 'quota_exhausted': return { kind: 'quota_exhausted' };
    case 'rate_limited': return { kind: 'rate_limited', retryAfterSeconds: failure.retryAfterSeconds };
    case 'payment_required': return { kind: 'payment_required' };
    case 'tool_unavailable': return { kind: 'tool_unavailable', capability: failure.capability };
    case 'provider_unavailable': return { kind: 'provider_unavailable', redactedReason: failure.redactedReason };
    case 'response_too_large': return { kind: 'provider_unavailable', redactedReason: 'response_too_large' };
    case 'timeout': return { kind: 'provider_unavailable', redactedReason: 'timeout' };
  }
}

export class AgentGatewayApplicationService {
  public constructor(private readonly dependencies: AgentGatewayDependencies) {}

  public async invoke(input: InvokeAgentQuestion): Promise<AgentInvocationResult> {
    if (!this.dependencies.runtime.serverRuntimeAvailable()) return { kind: 'static_host_unavailable' };
    if (hasSensitiveMarker(input.leanContext)) {
      await this.appendAudit(input, 'invocation_denied', 'denied', 'sensitive_context_rejected');
      return { kind: 'artifact_access_denied' };
    }

    const authorization = await this.dependencies.authorization.authorize({
      accountId: input.accountId,
      providerId: input.selection.providerId,
      modelId: input.selection.modelId,
      leanArtifactId: input.leanContext.artifactId,
    });
    if (authorization.kind === 'feature_entitlement_required') return { kind: 'feature_entitlement_required' };
    if (authorization.kind === 'artifact_access_denied') return { kind: 'artifact_access_denied' };
    if (authorization.kind === 'requires_authentication') return { kind: 'feature_entitlement_required' };

    const consent = await this.dependencies.authorization.externalProcessingConsent({
      accountId: input.accountId,
      providerId: input.selection.providerId,
      leanArtifactId: input.leanContext.artifactId,
    });
    if (consent.kind !== 'granted') return { kind: 'external_processing_consent_required' };

    const provider = this.dependencies.providers.findProvider(input.selection.providerId);
    if (provider === null) return { kind: 'provider_unavailable', availability: { kind: 'unconfigured' } };
    const availability = await provider.checkAvailability();
    if (availability.kind !== 'ready') {
      return availability.kind === 'static_host_unavailable'
        ? { kind: 'static_host_unavailable' }
        : { kind: 'provider_unavailable', availability };
    }

    const resolved = await this.dependencies.templates.resolveQuestion(input.templateId, input.locale, input.templateParameters);
    if (resolved === null) return { kind: 'template_resolution_failed' };
    if (resolved.template.toolPolicy.kind === 'auto' && !availability.capabilities.includes('web_search_with_citations')) {
      return { kind: 'provider_unavailable', availability: { kind: 'tool_unavailable', capability: 'web_search_with_citations' } };
    }

    const descriptor = provider.descriptor();
    const profiles = this.dependencies.profiles.requiredProfiles();
    const key = this.buildQualificationKey(input, descriptor, resolved, profiles);
    const currentQualification = await this.dependencies.qualificationStore.find(key);

    if (resolved.template.qualificationSequence === 'control_after_quarantined_primary' && currentQualification?.state !== 'qualified') {
      const primary = await this.invokeProvider(provider, input, resolved, input.leanContext);
      if (isProviderFailure(primary)) return { kind: 'provider_unavailable', availability: providerFailureToAvailability(primary) };
      const primaryValidation = await this.dependencies.validator.validate(primary, resolved.responseSchema, input.leanContext, resolved.template.toolPolicy);
      if (primaryValidation.kind !== 'valid') return { kind: 'invalid_provider_output', redactedReason: primaryValidation.redactedReason };
      const qualification = await this.qualify(provider, input, profiles, key);
      if (qualification.kind !== 'pass') return this.mapControlFailure(qualification);
      return this.accept(input, descriptor, resolved, key, primaryValidation.answer, 'external_agent');
    }

    if (currentQualification?.state !== 'qualified') {
      const qualification = await this.qualify(provider, input, profiles, key);
      if (qualification.kind !== 'pass') return this.mapControlFailure(qualification);
    }

    const primary = await this.invokeProvider(provider, input, resolved, input.leanContext);
    if (isProviderFailure(primary)) return { kind: 'provider_unavailable', availability: providerFailureToAvailability(primary) };
    const validation = await this.dependencies.validator.validate(primary, resolved.responseSchema, input.leanContext, resolved.template.toolPolicy);
    if (validation.kind !== 'valid') {
      await this.appendAudit(input, 'structured_output_rejected', 'failed', validation.redactedReason);
      return { kind: 'invalid_provider_output', redactedReason: validation.redactedReason };
    }
    return this.accept(input, descriptor, resolved, key, validation.answer, 'external_agent', primary.providerFingerprint);
  }

  private async qualify(
    provider: AgentProvider,
    input: InvokeAgentQuestion,
    profiles: readonly RicisKnowledgeProfile[],
    key: ProviderQualificationKey,
  ): Promise<AxiomControlOutcome> {
    await this.appendAudit(input, 'qualification_started', 'allowed', undefined);
    for (const profile of profiles) {
      const controlTemplate = await this.dependencies.profiles.findControlTemplate(profile, input.locale);
      if (controlTemplate === null || controlTemplate.toolPolicy.kind !== 'none') {
        await this.saveQualification(key, 'qualification_failed', profiles, 'control_template_unavailable');
        return { kind: 'control_unavailable', availability: { kind: 'tool_unavailable', capability: 'structured_json' } };
      }
      const resolvedControl = await this.dependencies.templates.resolveQuestion(controlTemplate.templateId, input.locale, {});
      if (
        resolvedControl === null ||
        resolvedControl.template.templateId !== controlTemplate.templateId ||
        resolvedControl.template.responseSchemaId !== controlTemplate.responseSchemaId ||
        resolvedControl.template.responseSchemaVersion !== controlTemplate.responseSchemaVersion ||
        resolvedControl.template.toolPolicy.kind !== 'none'
      ) {
        await this.saveQualification(key, 'qualification_failed', profiles, 'control_template_resolution_rejected');
        return { kind: 'control_unavailable', availability: { kind: 'provider_unavailable', redactedReason: 'control_template_resolution_rejected' } };
      }
      const schema = resolvedControl.responseSchema;
      const response = await provider.completeStructured({
        requestId: input.requestId,
        modelId: input.selection.modelId,
        renderedInstruction: resolvedControl.renderedInstruction,
        responseSchema: schema,
        toolPolicy: { kind: 'none' },
        maxInputBytes: provider.descriptor().maximumRequestBytes,
        maxOutputBytes: provider.descriptor().maximumResponseBytes,
        correlationId: input.correlationId,
      });
      if (isProviderFailure(response)) {
        await this.saveQualification(key, 'qualification_failed', profiles, response.kind);
        return { kind: 'control_unavailable', availability: providerFailureToAvailability(response) };
      }
      const validation = await this.dependencies.validator.validate(response, schema, input.leanContext, { kind: 'none' });
      const outcome = controlOutcome(profile, validation, response);
      if (outcome.kind !== 'pass') {
        await this.saveQualification(key, 'qualification_failed', profiles, outcome.kind);
        const reason = outcome.kind === 'control_unavailable' ? outcome.availability.kind : outcome.redactedReason;
        await this.appendAudit(input, outcome.kind === 'knowledge_conflict' ? 'knowledge_conflict' : 'qualification_failed', 'denied', reason);
        return outcome;
      }
    }
    await this.saveQualification(key, 'qualified', profiles);
    await this.appendAudit(input, 'qualification_passed', 'allowed', undefined);
    return { kind: 'pass', profileId: profiles[0]?.profileId ?? '' };
  }

  private async invokeProvider(
    provider: AgentProvider,
    input: InvokeAgentQuestion,
    resolved: ResolvedAgentQuestion,
    _context: LeanContextEnvelope,
  ): Promise<ProviderStructuredResponse | ProviderInvocationFailure> {
    await this.appendAudit(input, 'provider_invoked', 'allowed', undefined);
    return provider.completeStructured({
      requestId: input.requestId,
      modelId: input.selection.modelId,
      renderedInstruction: resolved.renderedInstruction,
      responseSchema: resolved.responseSchema,
      toolPolicy: resolved.template.toolPolicy,
      maxInputBytes: provider.descriptor().maximumRequestBytes,
      maxOutputBytes: provider.descriptor().maximumResponseBytes,
      correlationId: input.correlationId,
    });
  }

  private buildQualificationKey(
    input: InvokeAgentQuestion,
    descriptor: AgentProviderDescriptor,
    resolved: ResolvedAgentQuestion,
    profiles: readonly RicisKnowledgeProfile[],
  ): ProviderQualificationKey {
    return {
      providerId: input.selection.providerId,
      modelId: input.selection.modelId,
      adapterVersion: descriptor.adapterVersion,
      providerFingerprint: descriptor.modelFingerprint,
      responseSchemaSetHash: resolved.responseSchema.canonicalSchemaHash,
      knowledgeProfileSetHash: stableHash(profiles.map((profile) => `${profile.profileId}:${profile.version}:${profile.profileHash}`).join('|')),
      toolPolicyHash: stableHash(JSON.stringify(resolved.template.toolPolicy)),
    };
  }

  private async saveQualification(
    key: ProviderQualificationKey,
    state: ProviderQualificationState,
    profiles: readonly RicisKnowledgeProfile[],
    reason?: string,
  ): Promise<void> {
    await this.dependencies.qualificationStore.save({
      qualificationKey: key,
      state,
      requiredProfiles: profiles.map((profile) => profile.profileId),
      completedAt: state === 'qualified' ? this.dependencies.clock.now() : undefined,
      redactedReason: reason,
    });
  }

  private mapControlFailure(outcome: AxiomControlOutcome): AgentInvocationResult {
    switch (outcome.kind) {
      case 'pass': return { kind: 'qualification_required' };
      case 'knowledge_conflict': return { kind: 'knowledge_conflict', redactedReason: outcome.redactedReason };
      case 'invalid_provider_output': return { kind: 'invalid_provider_output', redactedReason: outcome.redactedReason };
      case 'control_unavailable': return { kind: 'qualification_failed', redactedReason: outcome.availability.kind };
    }
  }

  private async accept(
    input: InvokeAgentQuestion,
    descriptor: AgentProviderDescriptor,
    resolved: ResolvedAgentQuestion,
    key: ProviderQualificationKey,
    answer: ValidatedAgentAnswer,
    engineClassification: AgentExecutionProvenance['engineClassification'],
    providerFingerprint?: string,
  ): Promise<AgentInvocationResult> {
    await this.appendAudit(input, 'answer_accepted', 'allowed', undefined);
    return {
      kind: 'accepted',
      answer,
      provenance: {
        requestId: input.requestId,
        providerId: input.selection.providerId,
        modelId: input.selection.modelId,
        adapterVersion: descriptor.adapterVersion,
        providerFingerprint,
        templateId: resolved.template.templateId,
        templateVersion: resolved.template.version,
        responseSchemaHash: resolved.responseSchema.canonicalSchemaHash,
        leanArtifactId: input.leanContext.artifactId,
        leanArtifactHash: input.leanContext.artifactHash,
        qualificationKey: key,
        engineClassification,
        correlationId: input.correlationId,
      },
    };
  }

  private async appendAudit(
    input: InvokeAgentQuestion,
    eventType: AgentAuditEvent['eventType'],
    outcome: AgentAuditEvent['outcome'],
    redactedReason: string | undefined,
  ): Promise<void> {
    await this.dependencies.audit.append({
      eventId: this.dependencies.ids.newAuditEventId(),
      requestId: input.requestId,
      correlationId: input.correlationId,
      providerId: input.selection.providerId,
      modelId: input.selection.modelId,
      eventType,
      outcome,
      redactedReason,
      at: this.dependencies.clock.now(),
    });
  }
}
