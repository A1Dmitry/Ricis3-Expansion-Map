import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (relativePath: string): string =>
  readFileSync(resolve(process.cwd(), relativePath), 'utf8');

interface ConsumerExpectation {
  readonly path: string;
  readonly importPath: './apiClient' | '../model/apiClient';
  readonly endpoint: '/api/fillNodeParams' | '/api/generateProof' | '/api/aiAssistantNode';
  readonly preservedMarker: string;
}

const affectedConsumers: readonly ConsumerExpectation[] = [
  {
    path: 'src/model/audit.ts',
    importPath: './apiClient',
    endpoint: '/api/fillNodeParams',
    preservedMarker: 'if (!tf)',
  },
  {
    path: 'src/model/logic.ts',
    importPath: './apiClient',
    endpoint: '/api/generateProof',
    preservedMarker: 'buildCanonicalRicisProofLatex',
  },
  {
    path: 'src/store/mapStore.ts',
    importPath: '../model/apiClient',
    endpoint: '/api/aiAssistantNode',
    preservedMarker: 'isAutoFormulaRequest',
  },
  {
    path: 'src/ui/AddNodeModal.tsx',
    importPath: '../model/apiClient',
    endpoint: '/api/aiAssistantNode',
    preservedMarker: 'resolvedTargetFn =',
  },
];

describe('P-07 apiClient import topology', () => {
  it('uses one static postJson import in every affected consumer and removes all targeted dynamic imports', () => {
    for (const consumer of affectedConsumers) {
      const consumerSource = source(consumer.path);
      const importStatement = `import { postJson } from '${consumer.importPath}';`;

      expect(consumerSource, `${consumer.path} must use the existing static postJson seam`).toContain(importStatement);
      expect(consumerSource, `${consumer.path} must not retain ineffective apiClient dynamic import`).not.toMatch(
        /await\s+import\(['"](?:\.\.\/)?(?:model\/)?apiClient['"]\)/,
      );
      expect(consumerSource, `${consumer.path} must retain its endpoint`).toContain(consumer.endpoint);
      expect(consumerSource, `${consumer.path} must retain its existing fallback/guard`).toContain(consumer.preservedMarker);
    }
  });

  it('keeps AddNodeModal on one direct transport dependency shared by both AI actions', () => {
    const addNodeModal = source('src/ui/AddNodeModal.tsx');

    expect(addNodeModal.match(/import \{ postJson \} from '\.\.\/model\/apiClient';/g) ?? []).toHaveLength(1);
    expect(addNodeModal.match(/postJson(?:<[^>]+>)?\(/g)?.length).toBeGreaterThanOrEqual(2);
    expect(addNodeModal).not.toMatch(/await\s+import\(['"]\.\.\/model\/apiClient['"]\)/);
  });

  it('keeps apiClient independent of all affected consumers and free of import-time network behavior', () => {
    const apiClient = source('src/model/apiClient.ts');

    expect(apiClient).not.toMatch(/from ['"].*(audit|logic|mapStore|AddNodeModal)['"]/);
    expect(apiClient).toContain('export async function postJson');
    expect(apiClient).toContain('const STATIC_HOST_HINT');
    expect(apiClient).toContain('new AbortController()');
  });

  it('keeps the local proof diagnostic path independent from transport import strategy', () => {
    const logic = source('src/model/logic.ts');

    expect(logic).toContain('const fallback = buildCanonicalRicisProofLatex(');
    expect(logic).toContain("const finalResult = 'Axiom Extracted: ' + node.id + '_resolved';");
    expect(logic).toContain("state: node.state === 'resolved' ? 'resolved' : 'partial'");
    expect(logic).toContain("'proof.core.state.localDiagnosticOnly'");
  });
});
