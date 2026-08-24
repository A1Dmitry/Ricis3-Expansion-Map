import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const pageSource = readFileSync(resolve(process.cwd(), 'src/ui/CoreRecoveryPage.tsx'), 'utf8');
const projectionSourcePath = resolve(process.cwd(), 'src/ui/recoveryDiagnostics.ts');
const panelSourcePath = resolve(process.cwd(), 'src/ui/RecoveryDiagnosticsPanel.tsx');

describe('CoreRecoveryPage display-safe diagnostics topology', () => {
  it('composes the one approved projector and panel rather than maintaining a second recovery field inventory', () => {
    expect(pageSource).toContain("import { RecoveryDiagnosticsPanel } from './RecoveryDiagnosticsPanel';");
    expect(pageSource).toContain("from './recoveryDiagnostics';");
    expect(pageSource).toContain('projectRecoveryDiagnostics');
    expect(pageSource).toContain('toHealthProbeViewState');
    expect(pageSource).toContain('const diagnostics = projectRecoveryDiagnostics(recovery);');
    expect(pageSource).toContain('clipboard.writeText(diagnostics.clipboardText)');
    expect(pageSource).toContain('<RecoveryDiagnosticsPanel');
    expect(pageSource).toContain('projection={diagnostics}');
  });

  it('keeps Core Recovery presentation free of stored raw detail, proof transport, proof fallback, direct network and map mutation dependencies', () => {
    expect(pageSource).not.toMatch(/diagnostic\.safeDetail|safeDetail/);
    expect(pageSource).not.toMatch(/createRun|generateFormalProof|verifyProofChain|ProofRunResponse|correlationId|proofRunId/);
    expect(pageSource).not.toMatch(/fetch\(|axios|XMLHttpRequest/);
    expect(pageSource).not.toMatch(/useMapStore|setState\(|updateNode|resolved|LeanVerified/);
  });

  it('keeps the projector and panel as presentation-only modules with no transport, storage, proof or raw-detail edge', () => {
    const projectionSource = readFileSync(projectionSourcePath, 'utf8');
    const panelSource = readFileSync(panelSourcePath, 'utf8');

    for (const source of [projectionSource, panelSource]) {
      expect(source).not.toMatch(/safeDetail|createRun|generateFormalProof|verifyProofChain|ProofRunResponse|correlationId|proofRunId/);
      expect(source).not.toMatch(/from ['"].*(ricisCore|gateway|proof|lean|mapStore|persistence|apiClient)['"]/i);
      expect(source).not.toMatch(/fetch\(|axios|XMLHttpRequest|sessionStorage|localStorage|window\.location/);
    }
  });
});
