const fs = require('fs');
let code = fs.readFileSync('src/model/texPreprint.ts', 'utf-8');

const oldFunc = `function safeProofBody(node: ProblemNode, proof: Proof | undefined): string {
  // Old IndexedDB proofs often embed \\\\section\\* and \\$\\$ — unsafe under \\\\subsection.
  if (!proof || isUnsafeProofLatex(proof.latex)) {
    return buildStructuralProofLatex(
      node.title,
      node.targetFunction,
      node.id,
      proof?.steps
    );
  }
  const repaired = repairAgentLatex(proof.latex);
  if (isUnsafeProofLatex(repaired) || !repaired.trim()) {
    return buildStructuralProofLatex(node.title, node.targetFunction, node.id, proof.steps);
  }
  return repaired;
}`;

const newFunc = `function safeProofBody(node: ProblemNode, proof: Proof | undefined): string {
  if (!proof) {
    return buildStructuralProofLatex(
      node.title,
      node.targetFunction,
      node.id,
      undefined
    );
  }
  const repaired = repairAgentLatex(proof.latex);
  if (isUnsafeProofLatex(repaired) || !repaired.trim()) {
    return buildStructuralProofLatex(node.title, node.targetFunction, node.id, proof.steps);
  }
  return repaired;
}`;

if (code.includes('if (!proof || isUnsafeProofLatex(proof.latex)) {')) {
    code = code.replace(oldFunc, newFunc);
    fs.writeFileSync('src/model/texPreprint.ts', code);
    console.log('Patched texPreprint.ts');
} else {
    console.log('Could not find oldFunc in texPreprint.ts');
}
