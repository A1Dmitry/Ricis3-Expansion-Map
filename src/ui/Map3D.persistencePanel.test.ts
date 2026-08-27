import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const mapSource = readFileSync(resolve(process.cwd(), 'src/ui/Map3D.tsx'), 'utf8');

describe('Persistence & Export accordion action panel', () => {
  it('PEA-QA-01 exposes a stable discoverable persistence panel contract', () => {
    expect(mapSource).toContain('persistence-export-panel');
    expect(mapSource).toContain('const discoverablePanelIds');
    expect(mapSource).toContain("'persistence'");
  });

  it('PEA-QA-02 exposes all persistence actions inside the expanded accordion in order', () => {
    expect(mapSource).toContain('data-testid="persistence-export-actions"');
    expect(mapSource).toContain('data-testid="persistence-save"');
    expect(mapSource).toContain('data-testid="persistence-import-json"');
    expect(mapSource).toContain('data-testid="persistence-download-json"');
    expect(mapSource).toContain('data-testid="persistence-reset"');

    const saveIndex = mapSource.indexOf('data-testid="persistence-save"');
    const importIndex = mapSource.indexOf('data-testid="persistence-import-json"');
    const downloadIndex = mapSource.indexOf('data-testid="persistence-download-json"');
    const resetIndex = mapSource.indexOf('data-testid="persistence-reset"');

    expect(saveIndex).toBeGreaterThan(-1);
    expect(importIndex).toBeGreaterThan(saveIndex);
    expect(downloadIndex).toBeGreaterThan(importIndex);
    expect(resetIndex).toBeGreaterThan(downloadIndex);
  });

  it('PEA-QA-03 keeps JSON import as an explicit modal-opening action', () => {
    expect(mapSource).toContain('data-testid="persistence-import-json"');
    expect(mapSource).toContain('onClick={() => setShowPatchImportModal(true)}');
    expect(mapSource).not.toContain('onClick={() => { void defaultMapPatchIngestionService.applyPatch');
  });

  it('PEA-QA-04 makes the persistence accordion body explicit and accessible', () => {
    expect(mapSource).toContain('persistence-export-panel');
    expect(mapSource).toContain('aria-expanded={openPanelIds.has(id as PanelId)}');
    expect(mapSource).toContain('aria-controls={`accordion-content-${id}`}');
    expect(mapSource).toContain('data-testid="persistence-export-actions"');
  });

  it('PEA-QA-05 keeps panel opening presentation-only and mutation callbacks on action controls', () => {
    expect(mapSource).toContain('const toggleAccordion = useCallback');
    expect(mapSource).toContain('onClick={() => { void map.saveNow(); }}');
    expect(mapSource).toContain('onClick={() => setShowPatchImportModal(true)}');
    expect(mapSource).toContain('onClick={() => map.downloadJson()}');
    expect(mapSource).toContain("window.confirm('Сбросить карту?')");
  });

  it('PEA-QA-06 prevents adaptive hidden/overflow state from hiding persistence by default', () => {
    expect(mapSource).toContain('const discoverablePanelIds');
    expect(mapSource).toContain('const projectedVisibleElements');
    expect(mapSource).toContain('projectedVisibleElements.map');
    expect(mapSource).toContain('userDisabledPanelIds.has(id)');
  });

  it('PEA-QA-07 retains one UI owner without provider or network dependencies', () => {
    const persistenceBranches = mapSource.match(/id === 'persistence'/g) ?? [];
    expect(persistenceBranches.length).toBeGreaterThan(0);
    expect(mapSource).not.toMatch(/from ['"].*(openrouter|google-genai|provider|agentGateway).*['"]/i);
    expect(mapSource).not.toMatch(/fetch\(|axios|XMLHttpRequest/);
  });

  it('PEA-QA-08 preserves compact responsive action presentation and focusable controls', () => {
    expect(mapSource).toContain('persistence-export-actions');
    expect(mapSource).toContain('focus-visible');
    expect(mapSource).toContain('sm:grid-cols-2');
    expect(mapSource).toContain('min-h-');
  });
});
