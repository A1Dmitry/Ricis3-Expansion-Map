import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

interface CatalogVisibilityModule {
  readonly CanonicalCatalogReconciliationPlanner: new () => unknown;
  readonly CatalogReconciliationApplication: new () => unknown;
  readonly CanonicalNodeSearchMatcher: new () => unknown;
  readonly DeepLinkFocusResolver: new () => unknown;
  readonly NodeVisibilityProjector: new () => unknown;
}

const CONTRACT_PATH = './catalogVisibility.domain';
const future = () => import(/* @vite-ignore */ CONTRACT_PATH) as Promise<CatalogVisibilityModule>;
const source = async (relativePath: string): Promise<string> => readFile(resolve(import.meta.dirname, '..', relativePath), 'utf8');

describe('P1 catalog visibility — Step 3 red-first integration and topology QA', () => {
  it('CVN-INT-01: provides one dedicated catalog visibility domain owner rather than a Map3D-local canonical node clone loop', async () => {
    const module = await future();
    const map3d = await source('ui/Map3D.tsx');

    expect(module.CanonicalCatalogReconciliationPlanner).toBeTypeOf('function');
    expect(module.CatalogReconciliationApplication).toBeTypeOf('function');
    expect(map3d).toMatch(/from ['"]\.\.\/catalogVisibility\/catalogVisibility\.domain['"]/);
    expect(map3d).not.toMatch(/KNOWN_SINGULARITY_PROBLEMS/);
    expect(map3d).not.toMatch(/\.push\(\{[^}]*real-catalog-/s);
  });

  it('CVN-INT-02: composes the same visibility projection for the 3D scene and AccessibleMapFallback instead of filtering each surface independently', async () => {
    const module = await future();
    const map3d = await source('ui/Map3D.tsx');

    expect(module.NodeVisibilityProjector).toBeTypeOf('function');
    expect(map3d).toMatch(/new NodeVisibilityProjector\(\)\.project\(/);
    expect(map3d).toMatch(/<AccessibleMapFallback[\s\S]*nodes=\{[^}]*visibilityProjection[^}]*\}/);
    expect(map3d).toMatch(/visibleNodeIds\.has\(node\.id\)/);
    expect(map3d).not.toMatch(/<AccessibleMapFallback[\s\S]*nodes=\{map\.nodes\.filter\(node => visibleNodeIds\.has\(node\.id\)\)\}/);
  });

  it('CVN-INT-03: resolves initial URL focus only after hydrated catalog state and preserves a valid selected ID until the camera adapter is ready', async () => {
    const module = await future();
    const map3d = await source('ui/Map3D.tsx');

    expect(module.DeepLinkFocusResolver).toBeTypeOf('function');
    expect(map3d).toMatch(/map\.hydrated/);
    expect(map3d).toMatch(/new DeepLinkFocusResolver\(\)\.resolve\(/);
    expect(map3d).toMatch(/cameraControlsReady/);
    expect(map3d).toMatch(/triggerFlight\(.*'url_restore'/s);
    expect(map3d).not.toMatch(/setSelectedNodeId\(['"]core-agi-target['"]\)/);
  });

  it('CVN-INT-04: displays a closed unknown deep-link disclosure without calling it a Core, Lean or proof failure', async () => {
    const module = await future();
    const map3d = await source('ui/Map3D.tsx');

    expect(module.DeepLinkFocusResolver).toBeTypeOf('function');
    expect(map3d).toMatch(/unknown_deep_link_target/);
    expect(map3d).toMatch(/deepLinkDiagnostic/);
    expect(map3d).toContain('Requested map node ID');
    expect(map3d).not.toMatch(/Requested map node ID[\s\S]{0,320}(core|lean|proof)/i);
  });

  it('CVN-INT-05: keeps the new pure module free from React, Zustand, browser persistence, Three.js, Core, Lean, proof, importer and passport dependencies', async () => {
    const sourceText = await source('catalogVisibility/catalogVisibility.domain.ts');

    for (const forbiddenImport of [
      'react',
      'zustand',
      'three',
      'persistence',
      'ricisCore',
      'lean',
      'proof',
      'mapPatchIngestion',
      'passport',
    ]) {
      expect(sourceText).not.toMatch(new RegExp(`from\\s+['\"][^'\"]*${forbiddenImport}`, 'i'));
    }
    for (const forbiddenGlobal of ['window', 'document', 'localStorage', 'indexedDB']) {
      expect(sourceText).not.toMatch(new RegExp(`\\b${forbiddenGlobal}\\b`, 'i'));
    }
  });

  it('CVN-INT-06: preserves the separate explicit graph-link boundary by forbidding DependencyEdge construction and P1 importer dependency in catalog visibility', async () => {
    const sourceText = await source('catalogVisibility/catalogVisibility.domain.ts');

    expect(sourceText).not.toContain('DependencyEdge');
    expect(sourceText).not.toContain('MapPatchIngestionService');
    expect(sourceText).not.toMatch(/fromId\s*:/);
    expect(sourceText).not.toMatch(/toId\s*:/);
    expect(sourceText).not.toMatch(/edge-/);
  });
});
