import { describe, expect, it } from 'vitest';
import { createLeanPassportProjection } from './leanPassportProjection.domain';

const fingerprint = `sha256:v1:${'f'.repeat(64)}` as const;

function presentSource(text: string) {
  const sourceBytes = new TextEncoder().encode(text);
  const source = {
    fingerprint,
    sourceName: 'owner.lean',
    sourceBytes,
    byteLength: sourceBytes.byteLength,
    idempotencyKey: 'cr-02-canonical-source',
  } as const;
  const projection = createLeanPassportProjection({
    findSource: () => ({ kind: 'FOUND', value: source } as const),
    listObservations: () => [],
    findKernelFact: () => ({ kind: 'ABSENT' } as const),
    findHumanDecision: () => ({ kind: 'ABSENT' } as const),
    findCorrelation: () => ({ kind: 'ABSENT' } as const),
    findRicisBasis: () => ({ kind: 'ABSENT' } as const),
    findAgentConflict: () => ({ kind: 'ABSENT' } as const),
    findLegacyExternalLean: () => ({ kind: 'ABSENT' } as const),
  });
  const view = projection.present({ sourceFingerprint: fingerprint, requestedDisclosure: 'SAFE_EVIDENCE_DETAILS' });
  return { source, view, serialized: JSON.stringify(view) };
}

describe('RICIS-CODE-REAUDIT-CORRECTION-01 valid-red: CR-02 source disclosure redaction', () => {
  it('CR02-QA-01 redacts a Bearer token from display-only source text', () => {
    const { source, view, serialized } = presentSource('theorem t : True := by\n-- Bearer abc.def.ghi');
    expect(serialized).not.toContain('abc.def.ghi');
    expect(view.source?.fingerprint).toBe(source.fingerprint);
    expect(view.source?.byteLength).toBe(source.byteLength);
  });

  it('CR02-QA-02 redacts secret/token/credential/API-key assignments from display-only source text', () => {
    const { source, view, serialized } = presentSource('def key := "x"\napi_key=private-key\ncredential=owner-secret');
    expect(serialized).not.toContain('private-key');
    expect(serialized).not.toContain('owner-secret');
    expect(view.source?.fingerprint).toBe(source.fingerprint);
    expect(view.source?.byteLength).toBe(source.byteLength);
  });

  it('CR02-QA-03 redacts a private local path from display-only source text', () => {
    const { source, view, serialized } = presentSource('-- file: /home/owner/private/project.lean');
    expect(serialized).not.toContain('/home/owner/private/project.lean');
    expect(view.source?.fingerprint).toBe(source.fingerprint);
    expect(view.source?.byteLength).toBe(source.byteLength);
  });

  it('CR02-QA-04 redacts a shell fragment from display-only source text', () => {
    const { source, view, serialized } = presentSource('-- $(rm -rf /)');
    expect(serialized).not.toContain('$(rm -rf /)');
    expect(view.source?.fingerprint).toBe(source.fingerprint);
    expect(view.source?.byteLength).toBe(source.byteLength);
  });
});
