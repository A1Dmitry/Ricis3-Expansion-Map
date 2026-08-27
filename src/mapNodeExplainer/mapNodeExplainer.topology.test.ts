import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const moduleDirectory = resolve(process.cwd(), 'src/mapNodeExplainer');
const applicationFile = resolve(moduleDirectory, 'mapNodeExplainerApplication.ts');
const poolFile = resolve(moduleDirectory, 'boundedProviderWorkerPool.ts');

function readRequiredSource(path: string): string {
  expect(existsSync(path), `Expected future production source: ${path}`).toBe(true);
  return readFileSync(path, 'utf8');
}

function expectNoForbiddenTokens(source: string, forbiddenTokens: readonly string[]): void {
  for (const token of forbiddenTokens) {
    expect(source, `Forbidden token: ${token}`).not.toContain(token);
  }
}

describe('P1 Map Node Explainer shared-provider topology', () => {
  it('MNE-TOPO-01: exposes exactly one application-facing provider interface and an interface-only registry boundary', () => {
    const source = readRequiredSource(applicationFile);

    expect(source).toContain('export interface MapNodeExplainerProvider');
    expect(source).toContain('export interface MapNodeExplainerProviderRegistry');
    expect(source).toContain('find(providerId: MapAssistantProviderId): MapNodeExplainerProvider | null');
    expect(source).not.toContain('GeminiMapNodeExplainerAdapter');
    expect(source).not.toContain('OpenRouterMapNodeExplainerAdapter');
    expect(source).not.toContain('instanceof');
  });

  it('MNE-TOPO-02: assigns public explain lifecycle to the abstract base and keeps provider transport protected', () => {
    const source = readRequiredSource(applicationFile);

    expect(source).toContain('export abstract class AbstractMapNodeExplainerProvider implements MapNodeExplainerProvider');
    expect(source).toContain('public async explain(');
    expect(source).toContain('protected abstract executeProviderTransport(');
    expect(source).toContain('protected abstract resolveConfiguredModelId(');
  });

  it('MNE-TOPO-03/MNE-TOPO-04: common application and pool contracts exclude SDK, network, credentials, browser, map mutation and legacy-agent routes', () => {
    const applicationSource = readRequiredSource(applicationFile);
    const poolSource = readRequiredSource(poolFile);
    const commonSource = `${applicationSource}\n${poolSource}`;

    expectNoForbiddenTokens(commonSource, [
      '@google/genai',
      'openai',
      'OpenAI',
      'GoogleGenAI',
      'fetch(',
      'WebSocket',
      'GEMINI_API_KEY',
      'OPENROUTER_API_KEY',
      'process.env',
      'localStorage',
      'indexedDB',
      'saveMapToDb',
      'Map3D',
      'useMapStore',
      '/api/aiAssistantNode',
      '/api/discoverTasks',
      '/api/fillNodeParams',
      '/api/generateProof',
      'RicisWasmBridge',
      'Ricis3.lean',
      'worker_threads',
    ]);
  });

  it('MNE-TOPO-05: response contracts cannot represent proof, Core/Lean promotion or graph mutation', () => {
    const source = readRequiredSource(applicationFile);

    expect(source).toContain("classification: 'external_ai_suggestion'");
    expect(source).toContain("proofDisclaimer: 'not_a_proof_or_state_change'");
    expectNoForbiddenTokens(source, [
      'LEAN_VERIFIED',
      'QED_VERIFIED',
      'authoritative_ricis_core',
      'createNode',
      'createEdge',
      'saveMap',
      'writeProof',
      'evaluate(',
      'NaN',
    ]);
  });

  it('MNE-TOPO-06: bounded worker pool is finite, provider-isolated and cannot use unbounded Promise.all fan-out', () => {
    const source = readRequiredSource(poolFile);

    expect(source).toContain('maximumActiveJobs');
    expect(source).toContain('maximumQueuedJobs');
    expect(source).toContain('maximumActiveJobsPerProvider');
    expect(source).toContain("kind: 'queue_saturated'");
    expect(source).toContain('activeJobsByProvider');
    expectNoForbiddenTokens(source, [
      'Promise.all(',
      'worker_threads',
      'setInterval(',
      'setTimeout(',
      'process.env',
      'fetch(',
      'NaN',
      'Infinity',
    ]);
  });
});
