import { describe, expect, it, vi } from 'vitest';
import {
  AgentGatewayApplicationService,
  DeterministicAgentResponseValidator,
  InMemoryProviderQualificationStore,
  StaticAgentProviderRegistry,
  StaticEngineCompatibilityRegistry,
  createRicisTypedZeroSameGeneratorProfile,
  projectAgentModelOptions,
  type AgentGatewayDependencies,
  type AgentGatewayTestIds,
  type AgentProvider,
  type AgentProviderAvailability,
  type InvokeAgentQuestion,
  type ProviderQualificationKey,
  type ProviderStructuredResponse,
  type RicisGraphManifest,
} from './agentGatewayApplication';

/**
 * QA red contract suite for the approved Agent Gateway architecture.
 *
 * This imports the Step 4 application surface before its implementation exists.
 * It must initially fail at module resolution. The suite is deterministic: it
 * performs no real HTTP/WebSocket/browser call and contains no credential.
 */

const ids = {
  accountId: 'account-a',
  deniedAccountId: 'account-denied',
  providerId: 'gemini',
  modelId: 'gemini-3.7-flash',
  adapterVersion: 'adapter-v1',
  providerFingerprint: 'provider-model-fingerprint-v1',
  requestId: 'agent-request-a',
  correlationId: 'agent-correlation-a',
  templateId: 'ricis-question-v1',
  templateVersion: 'template-v1',
  controlTemplateId: 'ricis-control-typed-zero-v1',
  schemaId: 'ricis-agent-answer-v1',
  schemaVersion: 'schema-v1',
  profileId: 'RICIS_TYPED_ZERO_SAME_GENERATOR_RATIO_V1',
  profileVersion: 'profile-v1',
  artifactId: 'lean-artifact-a',
  artifactHash: 'artifact-hash-a',
  fragmentId: 'lean-fragment-a',
  graphId: 'ricis-graph-v1',
  graphVersion: 'graph-v1',
  graphHash: 'graph-hash-v1',
  privateKeySentinel: 'PRIVATE_KEY_MUST_NEVER_APPEAR',
  oauthTokenSentinel: 'OAUTH_TOKEN_MUST_NEVER_APPEAR',
  apiKeySentinel: 'API_KEY_MUST_NEVER_APPEAR',
} as const satisfies AgentGatewayTestIds;

const fixedNow = 1_700_000_000;

function answerJson(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    schemaVersion: ids.schemaVersion,
    responseKind: 'answer',
    answerBasis: 'context_only',
    semanticValue: 1,
    referencedLeanFragments: [ids.fragmentId],
    webEvidence: [],
    toolUsage: { webSearchInvoked: false, count: 0 },
    sourceTrustStatus: 'TRUSTED_AXIOM',
    axiomIds: ['SP3', 'A4'],
    limitations: ['external_agent_result'],
    ...overrides,
  });
}

function createValidResponse(overrides: Partial<ProviderStructuredResponse> = {}): ProviderStructuredResponse {
  return {
    requestId: ids.requestId,
    providerId: ids.providerId,
    modelId: ids.modelId,
    providerFingerprint: ids.providerFingerprint,
    rawJson: answerJson(),
    observedToolEvents: [],
    receivedAt: fixedNow,
    ...overrides,
  } as ProviderStructuredResponse;
}

function createProvider(
  response: ProviderStructuredResponse = createValidResponse(),
  availability: AgentProviderAvailability = { kind: 'ready', capabilities: ['text_completion', 'structured_json'] },
): AgentProvider {
  return {
    descriptor: vi.fn().mockReturnValue({
      providerId: ids.providerId,
      adapterVersion: ids.adapterVersion,
      endpointFamily: 'gemini_developer_api',
      serverRuntimeRequired: true,
      supportedCapabilities: ['text_completion', 'structured_json'],
      requiresExternalProcessingConsent: true,
      maximumRequestBytes: 4096,
      maximumResponseBytes: 4096,
      defaultEnabled: false,
      displayResourceKey: 'provider.gemini',
    }),
    listModels: vi.fn().mockResolvedValue([
      {
        providerId: ids.providerId,
        modelId: ids.modelId,
        displayResourceKey: 'provider.gemini.3_7_flash',
        category: 'flash',
        isFast: true,
        isDefaultCandidate: true,
        capabilities: ['text_completion', 'structured_json'],
      },
    ]),
    checkAvailability: vi.fn().mockResolvedValue(availability),
    completeStructured: vi.fn().mockResolvedValue(response),
  } as AgentProvider;
}

function createGraphManifest(overrides: Partial<RicisGraphManifest> = {}): RicisGraphManifest {
  return {
    graphId: ids.graphId,
    graphVersion: ids.graphVersion,
    manifestHash: ids.graphHash,
    nodeHashes: ['node-hash-a'],
    edgeHashes: ['edge-hash-a'],
    requiredKnowledgeProfiles: [ids.profileId],
    requiredControlTemplateIds: [ids.controlTemplateId],
    requiredResponseSchemaHashes: ['schema-hash-a'],
    compatibilitySuiteRevision: 'suite-v1',
    ...overrides,
  } as RicisGraphManifest;
}

function createDependencies(
  overrides: Partial<AgentGatewayDependencies> = {},
): AgentGatewayDependencies {
  const provider = createProvider();
  const qualificationStore = new InMemoryProviderQualificationStore();
  const profile = createRicisTypedZeroSameGeneratorProfile({
    profileId: ids.profileId,
    version: ids.profileVersion,
    profileHash: 'profile-hash-a',
  });

  return {
    providers: {
      findProvider: vi.fn().mockReturnValue(provider),
      listDescriptors: vi.fn().mockReturnValue([provider.descriptor()]),
    },
    templates: {
      resolveQuestion: vi.fn().mockImplementation(async (templateId: string) => ({
        template: {
          templateId,
          version: ids.templateVersion,
          locale: 'ru-RU',
          instructionResourceKey: templateId === ids.controlTemplateId
            ? 'agent.control.ricis_typed_zero'
            : 'agent.question.ricis',
          responseSchemaId: ids.schemaId,
          responseSchemaVersion: ids.schemaVersion,
          qualificationSequence: 'control_before_primary',
          toolPolicy: { kind: 'none' },
        },
        renderedInstruction: templateId === ids.controlTemplateId
          ? 'external-control-template-instruction'
          : 'resource-resolved-test-instruction',
        responseSchema: {
          schemaId: ids.schemaId,
          version: ids.schemaVersion,
          canonicalSchemaJson: '{}',
          canonicalSchemaHash: 'schema-hash-a',
          maximumJsonBytes: 4096,
          maximumDepth: 12,
          maximumArrayItems: 16,
        },
      })),
      findResponseSchema: vi.fn().mockResolvedValue({
        schemaId: ids.schemaId,
        version: ids.schemaVersion,
        canonicalSchemaJson: '{}',
        canonicalSchemaHash: 'schema-hash-a',
        maximumJsonBytes: 4096,
        maximumDepth: 12,
        maximumArrayItems: 16,
      }),
    },
    profiles: {
      findProfile: vi.fn().mockResolvedValue(profile),
      findControlTemplate: vi.fn().mockResolvedValue({
        templateId: ids.controlTemplateId,
        version: ids.templateVersion,
        knowledgeProfileId: ids.profileId,
        knowledgeProfileVersion: ids.profileVersion,
        responseSchemaId: ids.schemaId,
        responseSchemaVersion: ids.schemaVersion,
        toolPolicy: { kind: 'none' },
      }),
      requiredProfiles: vi.fn().mockReturnValue([profile]),
    },
    validator: new DeterministicAgentResponseValidator(),
    qualificationStore,
    engineCompatibility: new StaticEngineCompatibilityRegistry({
      canonicalGraphManifest: createGraphManifest(),
    }),
    authorization: {
      authorize: vi.fn().mockResolvedValue({ kind: 'allowed' }),
      externalProcessingConsent: vi.fn().mockResolvedValue({ kind: 'granted', consentVersion: 'consent-v1' }),
    },
    runtime: { serverRuntimeAvailable: vi.fn().mockReturnValue(true) },
    audit: { append: vi.fn().mockResolvedValue(undefined) },
    clock: { now: vi.fn().mockReturnValue(fixedNow) },
    ids: {
      newRequestId: vi.fn().mockReturnValue(ids.requestId),
      newAuditEventId: vi.fn().mockReturnValue('audit-a'),
    },
    ...overrides,
  } as unknown as AgentGatewayDependencies;
}

function createSut(overrides: Partial<AgentGatewayDependencies> = {}) {
  return new AgentGatewayApplicationService(createDependencies(overrides));
}

function invokeInput(overrides: Partial<InvokeAgentQuestion> = {}): InvokeAgentQuestion {
  return {
    requestId: ids.requestId,
    accountId: ids.accountId,
    selection: { providerId: ids.providerId, modelId: ids.modelId },
    templateId: ids.templateId,
    locale: 'ru-RU',
    templateParameters: {},
    leanContext: {
      artifactId: ids.artifactId,
      artifactHash: ids.artifactHash,
      locale: 'ru-RU',
      classification: 'exportable_research_context',
      sourceTrustStatus: 'TRUSTED_AXIOM',
      fragments: [{ fragmentId: ids.fragmentId, contentHash: 'fragment-hash-a', text: 'permitted-lean-fragment' }],
    },
    correlationId: ids.correlationId,
    ...overrides,
  };
}

describe('Agent Gateway approved adversarial contract tests', () => {
  describe('AGP — provider adapter and registry', () => {
    it('keeps descriptor server-only, immutable and without credential material', async () => {
      const provider = createProvider();
      const descriptor = provider.descriptor();

      expect(descriptor.serverRuntimeRequired).toBe(true);
      expect(descriptor.defaultEnabled).toBe(false);
      expect(JSON.stringify(descriptor)).not.toContain(ids.apiKeySentinel);
      expect(JSON.stringify(descriptor)).not.toContain('credential');
    });

    it.each([
      { kind: 'unconfigured' },
      { kind: 'disabled' },
      { kind: 'quota_exhausted' },
      { kind: 'rate_limited', retryAfterSeconds: 15 },
      { kind: 'payment_required' },
      { kind: 'tool_unavailable', capability: 'web_search_with_citations' },
      { kind: 'provider_unavailable', redactedReason: 'test-unavailable' },
      { kind: 'static_host_unavailable' },
    ])('preserves the typed provider availability state %#', async (availability) => {
      const provider = createProvider(createValidResponse(), availability as AgentProviderAvailability);
      await expect(provider.checkAvailability()).resolves.toEqual(availability);
    });

    it('maps Gemini model descriptor to the existing non-breaking model option shape', () => {
      const projected = projectAgentModelOptions([
        {
          providerId: ids.providerId,
          modelId: ids.modelId,
          displayResourceKey: 'provider.gemini.3_7_flash',
          category: 'flash',
          isFast: true,
          isDefaultCandidate: true,
          capabilities: ['text_completion', 'structured_json'],
        },
      ] as never, { kind: 'ready', capabilities: ['text_completion', 'structured_json'] });

      expect(projected).toContainEqual(expect.objectContaining({
        id: ids.modelId,
        category: 'flash',
        isDefault: true,
        isFast: true,
        providerId: ids.providerId,
      }));
    });
  });

  describe('AGR — direct immutable provider registry methods', () => {
    it('finds reviewed providers, denies unknown IDs, exposes descriptors and rejects duplicate registration', () => {
      const provider = createProvider();
      const registry = new StaticAgentProviderRegistry([provider]);

      expect(registry.findProvider(ids.providerId)).toBe(provider);
      expect(registry.findProvider('unknown-provider')).toBeNull();
      expect(registry.listDescriptors()).toEqual([provider.descriptor()]);
      expect(() => new StaticAgentProviderRegistry([provider, provider])).toThrow('Duplicate provider ID');
    });
  });

  describe('AGP.1 — direct adapter public methods', () => {
    it('directly lists reviewed models and returns a structured provider response without any credential input', async () => {
      const provider = createProvider();
      const models = await provider.listModels();
      const result = await provider.completeStructured({
        requestId: ids.requestId,
        modelId: ids.modelId,
        renderedInstruction: 'resource-resolved-test-instruction',
        responseSchema: (await createDependencies().templates.findResponseSchema(ids.schemaId, ids.schemaVersion))!,
        toolPolicy: { kind: 'none' },
        maxInputBytes: 1024,
        maxOutputBytes: 1024,
        correlationId: ids.correlationId,
      });

      expect(models).toHaveLength(1);
      expect(models[0]).toMatchObject({ providerId: ids.providerId, modelId: ids.modelId });
      expect('kind' in result).toBe(false);
      expect(JSON.stringify(result)).not.toContain(ids.apiKeySentinel);
    });
  });

  describe('AGJ — deterministic structured JSON validation', () => {
    it('accepts valid context-only structured JSON with permitted Lean reference', async () => {
      const validator = new DeterministicAgentResponseValidator();
      const result = await validator.validate(
        createValidResponse(),
        (await createDependencies().templates.findResponseSchema(ids.schemaId, ids.schemaVersion))!,
        invokeInput().leanContext as never,
        { kind: 'none' },
      );

      expect(result.kind).toBe('valid');
    });

    it.each([
      ['prose-prefix', `not-json ${answerJson()}`],
      ['duplicate-key', '{"schemaVersion":"schema-v1","schemaVersion":"schema-v1"}'],
      ['wrong-enum', answerJson({ responseKind: 'proved' })],
      ['forged-proof-status', answerJson({ LEAN_VERIFIED: true })],
      ['unknown-lean-fragment', answerJson({ referencedLeanFragments: ['foreign-fragment'] })],
      ['context-only-with-web-evidence', answerJson({ webEvidence: [{ url: 'https://example.test', title: 'x', citationIndex: 0 }] })],
    ])('rejects %s without free-form recovery', async (_name, rawJson) => {
      const validator = new DeterministicAgentResponseValidator();
      const result = await validator.validate(
        createValidResponse({ rawJson }),
        (await createDependencies().templates.findResponseSchema(ids.schemaId, ids.schemaVersion))!,
        invokeInput().leanContext as never,
        { kind: 'none' },
      );

      expect(result.kind).toBe('invalid_provider_output');
    });

    it('rejects a forged web-search declaration when gateway observed no tool event', async () => {
      const validator = new DeterministicAgentResponseValidator();
      const result = await validator.validate(
        createValidResponse({
          rawJson: answerJson({
            answerBasis: 'context_and_web',
            webEvidence: [{ url: 'https://example.test', title: 'citation', citationIndex: 0 }],
            toolUsage: { webSearchInvoked: true, count: 1 },
          }),
        }),
        (await createDependencies().templates.findResponseSchema(ids.schemaId, ids.schemaVersion))!,
        invokeInput().leanContext as never,
        { kind: 'auto', maxToolCalls: 1, maxCitations: 2, maxElapsedMilliseconds: 1000, maxProviderCostMinorUnits: 0 },
      );

      expect(result.kind).toBe('invalid_provider_output');
    });
  });

  describe('AGK/AGQ — SP3/A4 control interview and qualification', () => {
    it('resolves the compact external control template separately from the primary question', async () => {
      const dependencies = createDependencies();
      const sut = new AgentGatewayApplicationService(dependencies);

      await sut.invoke(invokeInput());
      expect(dependencies.templates.resolveQuestion).toHaveBeenCalledWith(ids.templateId, 'ru-RU', {});
      expect(dependencies.templates.resolveQuestion).toHaveBeenCalledWith(ids.controlTemplateId, 'ru-RU', {});
    });

    it('rejects a substituted primary template returned for the compact control-template request', async () => {
      const base = createDependencies();
      const templates = {
        ...base.templates,
        resolveQuestion: vi.fn().mockImplementation(async (templateId: string) => {
          const resolved = await base.templates.resolveQuestion(ids.templateId, 'ru-RU', {});
          return templateId === ids.controlTemplateId && resolved !== null
            ? { ...resolved, template: { ...resolved.template, templateId: ids.templateId } }
            : resolved;
        }),
      };
      const sut = new AgentGatewayApplicationService({ ...base, templates } as never);

      const result = await sut.invoke(invokeInput());
      expect(result).toMatchObject({ kind: 'qualification_failed' });
    });

    it('qualifies only after the exact zero-tool SP3/A4 same-generator control returns JSON value 1', async () => {
      const sut = createSut();
      const result = await sut.invoke(invokeInput());

      expect(result.kind).toBe('accepted');
      expect(JSON.stringify(result)).toContain('TRUSTED_AXIOM');
      expect(JSON.stringify(result)).not.toContain('LEAN_VERIFIED');
    });

    it.each([
      ['wrong-number', answerJson({ semanticValue: 0 })],
      ['string-instead-of-number', answerJson({ semanticValue: '1' })],
      ['missing-SP3', answerJson({ axiomIds: ['A4'] })],
      ['missing-A4', answerJson({ axiomIds: ['SP3'] })],
      ['forbidden-tool-use', answerJson({ toolUsage: { webSearchInvoked: true, count: 1 } })],
    ])('denies qualification for control %s and never releases a primary answer', async (_name, rawJson) => {
      const provider = createProvider(createValidResponse({ rawJson }));
      const sut = createSut({
        providers: { findProvider: vi.fn().mockReturnValue(provider), listDescriptors: vi.fn().mockReturnValue([provider.descriptor()]) },
      } as never);

      const result = await sut.invoke(invokeInput());
      expect(['qualification_failed', 'knowledge_conflict', 'invalid_provider_output']).toContain(result.kind);
      expect(JSON.stringify(result)).not.toContain('accepted');
    });

    it('invalidates a qualification record when model, adapter, schema, profile, policy or graph changes', async () => {
      const store = new InMemoryProviderQualificationStore();
      const key = {
        providerId: ids.providerId,
        modelId: ids.modelId,
        adapterVersion: ids.adapterVersion,
        providerFingerprint: ids.providerFingerprint,
        responseSchemaSetHash: 'schema-set-a',
        knowledgeProfileSetHash: 'profile-set-a',
        toolPolicyHash: 'policy-a',
        graphManifestHash: ids.graphHash,
      } satisfies ProviderQualificationKey;
      await store.save({ qualificationKey: key, state: 'qualified', requiredProfiles: [ids.profileId], completedAt: fixedNow });
      await store.invalidate({ ...key, modelId: 'different-model' } as never, fixedNow, 'fingerprint_changed');

      await expect(store.find(key)).resolves.toMatchObject({ state: 'qualified' });
      await expect(store.find({ ...key, modelId: 'different-model' } as never)).resolves.toMatchObject({ state: 'stale' });
    });
  });

  describe('AGK.1 — direct profile and qualification-store public methods', () => {
    it('creates the immutable SP3/A4 profile with value 1 and preserves trusted-axiom source status', () => {
      const profile = createRicisTypedZeroSameGeneratorProfile({
        profileId: ids.profileId,
        version: ids.profileVersion,
        profileHash: 'profile-hash-a',
      });

      expect(profile.expectedOutcome.semanticValueCanonicalJson).toBe('1');
      expect(profile.axiomIds).toEqual(['SP3', 'A4']);
      expect(profile.sourceTrustStatus).toBe('TRUSTED_AXIOM');
    });

    it('rejects a qualified store write with no mandatory control profile', async () => {
      const store = new InMemoryProviderQualificationStore();
      await expect(store.save({
        qualificationKey: {
          providerId: ids.providerId,
          modelId: ids.modelId,
          adapterVersion: ids.adapterVersion,
          responseSchemaSetHash: 'schema-set-a',
          knowledgeProfileSetHash: 'profile-set-a',
          toolPolicyHash: 'policy-a',
        },
        state: 'qualified',
        requiredProfiles: [],
      })).rejects.toThrow('requires at least one control profile');
    });
  });

  describe('AGE — alternative engine graph manifest', () => {
    it('does not accept a provider claim that it was trained on RICIS without an immutable graph manifest', async () => {
      const registry = new StaticEngineCompatibilityRegistry({ canonicalGraphManifest: createGraphManifest() });
      const result = await registry.classify({ providerId: ids.providerId, modelId: ids.modelId } as never, null);

      expect(result).toEqual({ kind: 'external_agent', classification: 'external_agent' });
    });

    it('rejects graph manifests missing required edge/profile/schema controls', async () => {
      const registry = new StaticEngineCompatibilityRegistry({ canonicalGraphManifest: createGraphManifest() });
      const result = await registry.classify(
        { providerId: ids.providerId, modelId: ids.modelId } as never,
        createGraphManifest({ edgeHashes: [] }),
      );

      expect(result.kind).toBe('candidate_manifest_rejected');
    });

    it('classifies only an explicitly qualified exact graph configuration as a compatible alternative engine', async () => {
      const key = {
        providerId: ids.providerId,
        modelId: ids.modelId,
        adapterVersion: ids.adapterVersion,
        responseSchemaSetHash: 'schema-set-a',
        knowledgeProfileSetHash: 'profile-set-a',
        toolPolicyHash: 'policy-a',
        graphManifestHash: ids.graphHash,
      } satisfies ProviderQualificationKey;
      const registry = new StaticEngineCompatibilityRegistry({
        canonicalGraphManifest: createGraphManifest(),
        compatibleQualificationKeys: [key],
      });

      const result = await registry.classify(key, createGraphManifest());
      expect(result).toMatchObject({ kind: 'ricis_compatible_engine' });
      await expect(registry.findCompatible(key)).resolves.toMatchObject({ engineClassification: 'ricis_compatible_engine' });
    });

    it('returns no compatible-engine record until a future concrete engine suite implementation exists', async () => {
      const registry = new StaticEngineCompatibilityRegistry({ canonicalGraphManifest: createGraphManifest() });
      await expect(registry.findCompatible({ providerId: ids.providerId, modelId: ids.modelId } as never)).resolves.toBeNull();
    });

    it('never emits authoritative Ricis.Core classification from an external engine registry', async () => {
      const registry = new StaticEngineCompatibilityRegistry({ canonicalGraphManifest: createGraphManifest() });
      const result = await registry.classify(
        { providerId: ids.providerId, modelId: ids.modelId } as never,
        createGraphManifest(),
      );

      expect(JSON.stringify(result)).not.toContain('authoritative_ricis_core');
      expect(JSON.stringify(result)).not.toContain('LEAN_VERIFIED');
    });
  });

  describe('AGA/AGI — authorization, consent, quarantine and Core authority', () => {
    it('returns static-host denial before authorization, template, audit or provider call', async () => {
      const dependencies = createDependencies({ runtime: { serverRuntimeAvailable: vi.fn().mockReturnValue(false) } } as never);
      const sut = new AgentGatewayApplicationService(dependencies);

      const result = await sut.invoke(invokeInput());
      expect(result).toEqual({ kind: 'static_host_unavailable' });
      expect(dependencies.authorization.authorize).not.toHaveBeenCalled();
      expect(dependencies.providers.findProvider).not.toHaveBeenCalled();
    });

    it.each([
      [{ kind: 'feature_entitlement_required' }, 'feature_entitlement_required'],
      [{ kind: 'artifact_access_denied' }, 'artifact_access_denied'],
    ])('denies authorization %o before provider invocation', async (authorizationResult, expectedKind) => {
      const provider = createProvider();
      const sut = createSut({
        providers: { findProvider: vi.fn().mockReturnValue(provider), listDescriptors: vi.fn().mockReturnValue([provider.descriptor()]) },
        authorization: {
          authorize: vi.fn().mockResolvedValue(authorizationResult),
          externalProcessingConsent: vi.fn(),
        },
      } as never);

      const result = await sut.invoke(invokeInput());
      expect(result.kind).toBe(expectedKind);
      expect(provider.completeStructured).not.toHaveBeenCalled();
    });

    it.each([{ kind: 'required' }, { kind: 'revoked' }])('denies external processing consent %o before provider invocation', async (consentResult) => {
      const provider = createProvider();
      const sut = createSut({
        providers: { findProvider: vi.fn().mockReturnValue(provider), listDescriptors: vi.fn().mockReturnValue([provider.descriptor()]) },
        authorization: {
          authorize: vi.fn().mockResolvedValue({ kind: 'allowed' }),
          externalProcessingConsent: vi.fn().mockResolvedValue(consentResult),
        },
      } as never);

      const result = await sut.invoke(invokeInput());
      expect(result.kind).toBe('external_processing_consent_required');
      expect(provider.completeStructured).not.toHaveBeenCalled();
    });

    it('quarantines and discards an after-control primary response when an agent glitches on control JSON', async () => {
      const primary = createValidResponse();
      const brokenControl = createValidResponse({ rawJson: answerJson({ semanticValue: 0 }) });
      const provider = createProvider(primary);
      (provider.completeStructured as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(primary)
        .mockResolvedValueOnce(brokenControl);

      const sut = createSut({
        providers: { findProvider: vi.fn().mockReturnValue(provider), listDescriptors: vi.fn().mockReturnValue([provider.descriptor()]) },
        templates: {
          ...createDependencies().templates,
          resolveQuestion: vi.fn().mockResolvedValue({
            template: {
              templateId: ids.templateId,
              version: ids.templateVersion,
              locale: 'ru-RU',
              instructionResourceKey: 'agent.question.ricis',
              responseSchemaId: ids.schemaId,
              responseSchemaVersion: ids.schemaVersion,
              qualificationSequence: 'control_after_quarantined_primary',
              toolPolicy: { kind: 'none' },
            },
            renderedInstruction: 'resource-resolved-test-instruction',
            responseSchema: {
              schemaId: ids.schemaId,
              version: ids.schemaVersion,
              canonicalSchemaJson: '{}',
              canonicalSchemaHash: 'schema-hash-a',
              maximumJsonBytes: 4096,
              maximumDepth: 12,
              maximumArrayItems: 16,
            },
          }),
        },
      } as never);

      const result = await sut.invoke(invokeInput());
      expect(['qualification_failed', 'knowledge_conflict', 'invalid_provider_output']).toContain(result.kind);
      expect(JSON.stringify(result)).not.toContain('accepted');
    });

    it('never accepts OAuth/private-key/API-key material as Lean context or emits it into audit output', async () => {
      const auditAppend = vi.fn().mockResolvedValue(undefined);
      const dependencies = createDependencies({ audit: { append: auditAppend } } as never);
      const sut = new AgentGatewayApplicationService(dependencies);
      const result = await sut.invoke(invokeInput({
        leanContext: {
          ...invokeInput().leanContext,
          fragments: [{
            fragmentId: ids.fragmentId,
            contentHash: 'fragment-hash-a',
            text: `${ids.oauthTokenSentinel} ${ids.privateKeySentinel} ${ids.apiKeySentinel}`,
          }],
        },
      }));

      expect(['artifact_access_denied', 'invalid_provider_output']).toContain(result.kind);
      expect(JSON.stringify(auditAppend.mock.calls)).not.toContain(ids.oauthTokenSentinel);
      expect(JSON.stringify(auditAppend.mock.calls)).not.toContain(ids.privateKeySentinel);
      expect(JSON.stringify(auditAppend.mock.calls)).not.toContain(ids.apiKeySentinel);
    });
  });
});
