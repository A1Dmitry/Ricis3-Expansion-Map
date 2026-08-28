import { describe, expect, it } from 'vitest';
import { extractDbKnowledge } from './agent';
import { deepCopyInitialMap } from './initialMap';
import { buildStructuralProofLatex } from './latexGuard';
import {
  LEAN_SPEC_DOI,
  LEAN_SPEC_URL,
  OFFICIAL_ZENODO_DOIS,
  auditProofContent,
} from './ricisCoreRules';
import { buildTexPreprint } from './texPreprint';
import { getReferencesForNode } from '../ui/NodeCardDetails';

const LEAN_SOFTWARE_DOI = '10.5281/zenodo.21529989';
const PUBLICATION_DOI = '10.5281/zenodo.21836220';

describe('Lean software provenance', () => {
  it('keeps the Lean specification DOI distinct from the RICIS publication DOI across every emitted reference', () => {
    const map = deepCopyInitialMap();
    const structuralLatex = buildStructuralProofLatex('Identity', '0_F * \\infty_G = F * G', 'provenance-node');
    const preprint = buildTexPreprint(map, 'math-singularity', { mode: 'ricis_pure' });
    const leanReference = getReferencesForNode({
      ...map.nodes.find(node => node.id === 'math-singularity')!,
      title: 'Lean 4 verification reference',
    });
    const agentPatterns = extractDbKnowledge(map).canonicalPatterns.join('\n');
    const softwareAudit = auditProofContent(`RICIS A6: 0_F * \\infty_G = F * G ${LEAN_SPEC_URL}`);
    const publicationAudit = auditProofContent(`RICIS A6: 0_F * \\infty_G = F * G https://doi.org/${PUBLICATION_DOI}`);
    const foundationsAudit = auditProofContent('RICIS A6: 0_F * \\infty_G = F * G https://doi.org/10.5281/zenodo.17872755');

    expect(LEAN_SPEC_DOI).toBe(LEAN_SOFTWARE_DOI);
    expect(LEAN_SPEC_URL).toBe(`https://doi.org/${LEAN_SOFTWARE_DOI}`);
    expect(OFFICIAL_ZENODO_DOIS.LEAN4_SPEC).toBe(LEAN_SOFTWARE_DOI);
    expect(LEAN_SPEC_DOI).not.toBe(PUBLICATION_DOI);
    expect(softwareAudit.containsLeanRef).toBe(true);
    expect(publicationAudit.containsLeanRef).toBe(false);
    expect(foundationsAudit.containsLeanRef).toBe(false);

    expect(structuralLatex).toContain(LEAN_SOFTWARE_DOI);
    expect(structuralLatex).not.toContain(PUBLICATION_DOI);
    expect(preprint).toContain(LEAN_SOFTWARE_DOI);
    expect(preprint).not.toContain(PUBLICATION_DOI);
    expect(leanReference.doiUrl).toBe(`https://doi.org/${LEAN_SOFTWARE_DOI}`);
    expect(leanReference.doiLabel).toContain(LEAN_SOFTWARE_DOI);
    expect(agentPatterns).toContain(LEAN_SOFTWARE_DOI);
    expect(agentPatterns).not.toContain(PUBLICATION_DOI);
  });
});
