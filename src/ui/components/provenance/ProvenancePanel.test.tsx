import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProvenancePanel, resolveEffectiveProvenance } from './ProvenancePanel';
import type { ProblemNode, Proof } from '../../../model/types';
import type { EvidenceProvenance } from '../../../model/governance';
import * as clipboard from '../../../services/clipboard';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLDivElement;

async function renderComponent(node: React.ReactNode): Promise<HTMLDivElement> {
  if (!container) {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  }
  await act(async () => root.render(node));
  return container;
}

afterEach(async () => {
  await act(async () => root?.unmount());
  container?.remove();
  container = undefined!;
});

describe('ProvenancePanel Component', () => {
  const mockNode: ProblemNode = {
    id: 'test-singularity-01',
    title: 'Schwarzschild Event Horizon Monolith',
    description: 'Division by zero singularity at r = 2M',
    state: 'resolved',
    type: 'core_singularity',
    targetFunction: '0_F * inf_G',
    zoneIds: ['zone-core'],
    dependencyIds: [],
    dependentIds: [],
    fractalDepth: 1,
    economic: {
      costUnresolved: 1000000,
      costToSolve: 50000,
      marketGain: 5000000,
      riskLoss: 200000,
    },
  };

  it('renders default SELF_REPORTED badge when no external verification is present', async () => {
    const el = await renderComponent(<ProvenancePanel node={mockNode} />);

    const badge = el.querySelector('[data-testid="provenance-status-badge"]');
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toContain('SELF_REPORTED');
    expect(el.textContent).toContain('САМОДЕКЛАРИРОВАНО');
    expect(el.textContent).toContain('Правило No Self-Certification');
  });

  it('renders EXTERNALLY_VERIFIED when explicit provenance is provided', async () => {
    const explicit: EvidenceProvenance = {
      provenance: 'EXTERNALLY_VERIFIED',
      result: 'Verified Invariant',
      timestamp: '2026-09-24T12:00:00Z',
      agentId: 'Lean 4.33.1 CI Kernel',
      environment: 'GitHub Actions / runner-35404189840',
      report: {
        originalGoal: 'Test Goal',
        result: 'Test Result',
        verification: 'EXTERNALLY_VERIFIED',
        positiveResults: ['Passed theorem 1'],
        negativeResults: [],
        tukhtaFound: [],
        rootCauses: [],
        repairs: [],
        remainingRisks: [],
        evidence: ['run #35404189840'],
        finalStatus: 'COMPLETED',
        confidence: 1.0,
      },
    };

    const el = await renderComponent(<ProvenancePanel provenance={explicit} node={mockNode} />);

    const badge = el.querySelector('[data-testid="provenance-status-badge"]');
    expect(badge?.textContent).toContain('EXTERNALLY_VERIFIED');
    expect(el.textContent).toContain('ВНЕШНЕ ВЕРИФИЦИРОВАНО');
    expect(el.textContent).not.toContain('Правило No Self-Certification');
    expect(el.textContent).toContain('Test Goal');
    expect(el.textContent).toContain('Test Result');
  });

  it('derives external verification from proof.externalLean with LEAN_VERIFIED trust status', async () => {
    const mockProof: Proof = {
      nodeId: mockNode.id,
      targetFunction: '0_F * inf_G',
      steps: [],
      finalResult: 'F * G',
      latex: 'F \\cdot G',
      externalLean: {
        sourceHash: 'sha256:abc1234567890',
        submittedAt: '2026-09-24T10:00:00Z',
        sourceLocked: true,
        trustStatus: 'LEAN_VERIFIED',
        kernelEvidence: {
          toolchain: 'leanprover/lean4:v4.33.1',
          command: 'lake build',
          compilerOutput: 'Build completed successfully (exit 0)',
          axiomReport: '[propext, Classical.choice, Quot.sound]',
          verifiedAt: '2026-09-24T10:05:00Z',
        },
      },
    };

    const el = await renderComponent(<ProvenancePanel node={mockNode} proof={mockProof} />);

    const badge = el.querySelector('[data-testid="provenance-status-badge"]');
    expect(badge?.textContent).toContain('EXTERNALLY_VERIFIED');
    expect(el.textContent).toContain('Lean 4 Kernel');
  });

  it('collapses and expands details when header is clicked', async () => {
    const el = await renderComponent(<ProvenancePanel node={mockNode} defaultExpanded={true} />);

    expect(el.textContent).toContain('Исполнитель / Агент');

    const header = el.querySelector('[aria-label="Toggle Provenance Panel"]') as HTMLDivElement;
    expect(header).not.toBeNull();

    await act(async () => {
      header.click();
    });

    expect(el.textContent).not.toContain('Исполнитель / Агент');

    await act(async () => {
      header.click();
    });

    expect(el.textContent).toContain('Исполнитель / Агент');
  });

  it('copies report to clipboard on button click', async () => {
    const copySpy = vi.spyOn(clipboard, 'copyTextToClipboard').mockResolvedValue(true);

    const el = await renderComponent(<ProvenancePanel node={mockNode} />);

    const copyBtn = el.querySelector('button[title="Скопировать отчёт доказательства"]') as HTMLButtonElement;
    expect(copyBtn).not.toBeNull();

    await act(async () => {
      copyBtn.click();
    });

    expect(copySpy).toHaveBeenCalled();
  });

  it('toggles raw result inspection panel', async () => {
    const el = await renderComponent(<ProvenancePanel node={mockNode} />);

    expect(el.querySelector('pre')).toBeNull();

    const rawButton = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Показать сырые данные результата'),
    );
    expect(rawButton).toBeDefined();

    await act(async () => {
      rawButton?.click();
    });

    expect(el.querySelector('pre')?.textContent).toContain('0_F * inf_G');
  });

  it('resolveEffectiveProvenance adheres to No Self-Certification law', () => {
    const resolved = resolveEffectiveProvenance(null, mockNode, null);
    expect(resolved.provenance).toBe('SELF_REPORTED');
    expect(resolved.agentId).toBe('ricis-v7.7-core');
    expect(resolved.report?.verification).toContain('SELF_REPORTED');
  });
});
