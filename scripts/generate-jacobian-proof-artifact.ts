import { mkdir, writeFile } from 'node:fs/promises';
import { RicisFallbackEngine } from '../src/services/ricisCore/RicisFallbackEngine';

const engine = new RicisFallbackEngine();
const databaseRecord = {
  nodeId: 'registry-120',
  title: 'Jacobian Conjecture',
  targetFunction: 'Resolve()',
  steps: [
    { phase: -1, name: 'L1_IDENTITY', action: 'Verify identity and types', expression: 'T(Resolve())' },
    { phase: 2, name: 'RICIS transform', action: 'Axiom A6', expression: '0_F x infinity_G = F * G' },
  ],
  finalResult: 'Axiom Extracted: registry-120_resolved',
};
const claim = '0_det(J) * inf_Inv(J)';
const proof = await engine.generateFormalProof(claim, 'geometric_bridge', { problemId: databaseRecord.nodeId });
const verification = await engine.verifyProofChain(proof);

await mkdir('artifacts/proofs', { recursive: true });
await writeFile(
  'artifacts/proofs/database-registry-120-jacobian.json',
  JSON.stringify({ source: 'RICIS3.core.typescript/src/model/initialMap.ts', databaseRecord, generated: proof, verification }, null, 2) + '\n',
  'utf8',
);
await writeFile(
  'artifacts/proofs/database-registry-120-jacobian.generated.lean',
  proof.lean4CodeSnippet + '\n',
  'utf8',
);
console.log(JSON.stringify({ claim, invariant: proof.conclusionInvariant, lean: proof.lean4CodeSnippet, verification }, null, 2));
