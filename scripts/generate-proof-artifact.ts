import { mkdir, writeFile } from 'node:fs/promises';
import { RicisFallbackEngine } from '../src/services/ricisCore/RicisFallbackEngine';

const engine = new RicisFallbackEngine();
const claim = '0_5 * inf_3';
const method = 'geometric_bridge' as const;
const proof = await engine.generateFormalProof(claim, method, { problemId: 'database-a6-0_5-inf_3' });
const verification = await engine.verifyProofChain(proof);

await mkdir('artifacts/proofs', { recursive: true });
await writeFile(
  'artifacts/proofs/database-a6-0_5-inf_3.json',
  JSON.stringify({ source: 'RicisFallbackEngine', claim, method, proof, verification }, null, 2) + '\n',
  'utf8',
);
await writeFile(
  'artifacts/proofs/database-a6-0_5-inf_3.generated.lean',
  proof.lean4CodeSnippet + '\n',
  'utf8',
);
console.log(JSON.stringify({ claim, method, invariant: proof.conclusionInvariant, lean: proof.lean4CodeSnippet, verification }, null, 2));
