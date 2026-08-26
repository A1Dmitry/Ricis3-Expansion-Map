/// <reference types="vitest/globals" />

import { readFileSync } from 'node:fs';

const SOURCE_PATH = 'src/ui/EditNodeModal.tsx';
const source = () => readFileSync(SOURCE_PATH, 'utf8');

describe('RICIS-LEAN-PASSPORT-ROUTE-B1 — EditNodeModal composition red baseline', () => {
  it('LPB1-QA-31 imports the controlled Passport dialog', () => {
    expect(source()).toContain("import { LeanPassportSessionDialog } from './LeanPassportSessionDialog';");
  });

  it('LPB1-QA-32 imports the pure ephemeral Passport projector', () => {
    expect(source()).toContain('createEphemeralPassportSession');
    expect(source()).toContain("from '../leanPassportSession/leanPassportSession.domain'");
  });

  it('LPB1-QA-33 owns only local ephemeral Passport dialog state', () => {
    expect(source()).toContain('const [passportSession, setPassportSession] = useState');
  });

  it('LPB1-QA-34 derives a current external Lean provenance reference once', () => {
    expect(source()).toContain('const externalLeanReference = useMapStore');
  });

  it('LPB1-QA-35 requires a locked provenance record before exposing the opener', () => {
    expect(source()).toContain('externalLeanReference?.sourceLocked === true');
  });

  it('LPB1-QA-36 narrows the input to node ID and source fingerprint metadata', () => {
    expect(source()).toContain('nodeId: node.id,');
    expect(source()).toContain('sourceFingerprint: externalLeanReference.sourceHash,');
  });

  it('LPB1-QA-37 carries submitted timestamp metadata only', () => {
    expect(source()).toContain('submittedAt: externalLeanReference.submittedAt,');
  });

  it('LPB1-QA-38 carries displayed trust status metadata only', () => {
    expect(source()).toContain('trustStatus: externalLeanReference.trustStatus,');
  });

  it('LPB1-QA-39 sets the literal source-locked reference marker', () => {
    expect(source()).toContain('sourceLocked: true,');
  });

  it('LPB1-QA-40 exposes a named source Passport opener to the local user', () => {
    expect(source()).toContain('Открыть паспорт источника');
  });

  it('LPB1-QA-41 creates the session only inside the explicit open handler', () => {
    expect(source()).toContain('const handleOpenPassportSession = () =>');
    expect(source()).toContain('setPassportSession(createEphemeralPassportSession');
  });

  it('LPB1-QA-42 mounts the dialog only when local session state exists', () => {
    expect(source()).toContain('{passportSession !== null && (');
    expect(source()).toContain('<LeanPassportSessionDialog');
  });

  it('LPB1-QA-43 closes the dialog by clearing only local session state', () => {
    expect(source()).toContain('onClose={() => setPassportSession(null)}');
  });

  it('LPB1-QA-44 keeps the B1 opener reference-only with no raw source or writer call', () => {
    const content = source();
    const start = content.indexOf('const handleOpenPassportSession = () =>');
    const end = content.indexOf('// Real-time auditing for compiler-style feedback');
    const opener = content.slice(start, end);
    expect(opener).not.toMatch(/proofLatex|currentProof|saveMapToDb|updateProof|updateNode|submitExternalLeanProof|acceptVerifiedExternalLeanProof/);
  });
});
