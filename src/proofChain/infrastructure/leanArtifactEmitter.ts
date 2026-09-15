/**
 * ILeanArtifactEmitter — Optional V1 stub behind port
 */
import type { ILeanArtifactEmitter } from '../application/ports';

export class LeanArtifactStub implements ILeanArtifactEmitter {
  emit(_proof: unknown): string | null {
    // Stub: Lean placeholder behind optional port, explicitly marked
    return `-- LEAN_STUB_V1 — not a kernel proof, behind optional port\n-- no LEAN_VERIFIED claim`;
  }
  isStub(): boolean {
    return true;
  }
}
