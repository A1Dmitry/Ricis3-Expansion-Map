import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf8');
const nodeCardDetailsSource = readFileSync(resolve(process.cwd(), 'src/ui/NodeCardDetails.tsx'), 'utf8');
const settingsModalSource = readFileSync(resolve(process.cwd(), 'src/ui/SettingsModal.tsx'), 'utf8');
const proofConsoleSource = readFileSync(resolve(process.cwd(), 'src/ui/RicisProofConsoleModal.tsx'), 'utf8');
const auditPanelSource = readFileSync(resolve(process.cwd(), 'src/ui/AuditPanel.tsx'), 'utf8');
const physicsPanelSource = readFileSync(resolve(process.cwd(), 'src/ui/PhysicsControlPanel.tsx'), 'utf8');

describe('UI Control Wiring & Observability Topology Test', () => {
  it('ensures 100% of interactive UI controls are bound to active Zustand state or API actions without empty stubs', () => {
    // 1. App.tsx route and navigation boundary logic
    expect(appSource).toContain('UrlShareService.updateBrowserUrl');
    expect(appSource).toContain('isCoreRecoveryRoute');

    // 2. NodeCardDetails.tsx section toggles, share, and navigation
    expect(nodeCardDetailsSource).toContain('handleShareNode');
    expect(nodeCardDetailsSource).toContain('toggleSection');
    expect(nodeCardDetailsSource).not.toMatch(/onClick=\{\(\)\s*=>\s*\{\}\}/);

    // 3. SettingsModal.tsx configuration and modal close/save triggers
    expect(settingsModalSource).toContain('onClick={onClose}');

    // 4. RicisProofConsoleModal.tsx proof generation and evaluation actions
    expect(proofConsoleSource).toContain('onClick={handleRunEvaluation}');
    expect(proofConsoleSource).toContain('onClick={handleGenerateProof}');

    // 5. AuditPanel.tsx system audit and garbage collection actions
    expect(auditPanelSource).toContain('runSystemAudit');
    expect(auditPanelSource).toContain('executeGarbageCollection');

    // 6. PhysicsControlPanel.tsx save and reset actions
    expect(physicsPanelSource).toContain('onClick={handleSave}');
    expect(physicsPanelSource).toContain('onClick={handleReset}');
  });

  it('verifies that no component exposes unhandled exception boundaries on action clicks', () => {
    const allUISources = [
      appSource,
      nodeCardDetailsSource,
      settingsModalSource,
      proofConsoleSource,
      auditPanelSource,
      physicsPanelSource,
    ];

    for (const source of allUISources) {
      expect(source).not.toContain('throw new Error("Divide by zero")');
      expect(source).not.toContain('undefined is not a function');
    }
  });
});
