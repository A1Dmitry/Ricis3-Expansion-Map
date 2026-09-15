/**
 * ILatexArtifactEmitter — Optional V1 stub behind port
 */
import type { ILatexArtifactEmitter } from '../application/ports';

export class LatexArtifactStub implements ILatexArtifactEmitter {
  emit(_proof: unknown): string | null {
    // Stub: returns LaTeX placeholder marked as STUB, not a real claim
    return `% LATEX_STUB_V1 — not a proof, behind optional port\n\\section*{Stub}\n% no claims`;
  }
  isStub(): boolean {
    return true;
  }
}
