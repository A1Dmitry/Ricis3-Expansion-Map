import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function readSource(relativePath: string): string {
  return readFileSync(join(repositoryRoot, relativePath), 'utf8');
}

describe('public proof-trust boundary', () => {
  it('keeps the unique Lean trust presenter evidence-based', () => {
    const presenter = readSource('src/ui/ProofTrustBadge.tsx');

    expect(presenter).toContain("code: 'LEAN_VERIFIED'");
    expect(presenter).toContain('externalLean?.trustStatus === \'LEAN_VERIFIED\'');
    expect(presenter).toContain('NODE_STATE_ONLY');
    expect(presenter).toContain('state is deliberately never upgraded into Lean kernel verification');
  });

  it('does not present local proof-chain outcomes as Lean or Q.E.D. verification', () => {
    const proofConsole = readSource('src/ui/RicisProofConsoleModal.tsx');
    const theoremViewer = readSource('src/ui/TheoremReportViewer.tsx');
    const terminal = readSource('src/ui/RicisTerminalModal.tsx');
    const mapStore = readSource('src/store/mapStore.ts');

    expect(proofConsole).toContain('Lean-статус требует отдельного воспроизводимого kernel evidence');
    expect(proofConsole).not.toContain('Q.E.D. VERIFIED');
    expect(theoremViewer).toContain('Lean kernel не запускался');
    expect(terminal).toContain('требуется Core/Lean evidence');
    expect(mapStore).toContain('требуется отдельное Core/Lean evidence');
    expect(mapStore).not.toContain('Доказательство Lean 4 успешно сформировано');
  });

  it('does not synthesize a Lean theorem or invent a kernel check in the source viewer', () => {
    const leanViewer = readSource('src/ui/Lean4ReportViewer.tsx');

    expect(leanViewer).toContain('does not synthesize a theorem or execute the Lean kernel');
    expect(leanViewer).toContain('No kernel run in this view');
    expect(leanViewer).not.toContain('O(1) Kernel Check');
  });
});
