const fs = require('fs');
let code = fs.readFileSync('src/model/logic.ts', 'utf-8');

// Replace generateProof
code = code.replace(
  /export function generateProof[\s\S]*?return \{\s*nodeId: node\.id,\s*targetFunction: node\.targetFunction,\s*steps,\s*finalResult,\s*latex: latexSteps\.join\('\\n\\n'\)\s*\};\s*\}/,
  `export async function generateProof(node: ProblemNode, allAxioms: Axiom[]): Promise<Proof> {
  const steps: ProofStep[] = [
    { phase: -1, name: 'L1_IDENTITY', action: 'Verify identity and types', expression: 'T(' + node.targetFunction + ')' },
    { phase: 0.5, name: 'SEMANTIC INDEXING (SP4)', action: 'Index singularities by parent expression', expression: '0_{' + node.targetFunction + '}' },
    { phase: 1, name: 'SAFETY CHECK (SP2)', action: 'Algebraic reduction before singularity evaluation', expression: 'Reduced(' + node.targetFunction + ')' },
    { phase: 2, name: 'RICIS transforms', action: 'Apply A6 (General) and available network axioms', expression: '0_F x infinity_G = F * G' },
    { phase: 6, name: 'L1 verification', action: 'Final consistency check', expression: 'Result equiv Result' }
  ];

  let latex = "";
  try {
    const res = await fetch('/api/generateProof', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title: node.title,
        targetFunction: node.targetFunction,
        axioms: allAxioms
      })
    });
    const data = await res.json();
    if (data.proofLatex) {
      latex = data.proofLatex;
    } else {
      latex = "Error generating proof: " + (data.error || "Unknown error");
    }
  } catch (e: any) {
    latex = "Network error while generating proof: " + e.message;
  }

  const finalResult = 'Axiom Extracted: ' + node.id + '_resolved';
  return {
    nodeId: node.id,
    targetFunction: node.targetFunction,
    steps,
    finalResult,
    latex
  };
}`
);

// Replace solveNodeLogic to be async
code = code.replace(
  /export function solveNodeLogic\(map: MapState, nodeId: string\): MapState \{/,
  `export async function solveNodeLogic(map: MapState, nodeId: string): Promise<MapState> {`
);

code = code.replace(
  /const proof = generateProof\(node, map\.axioms\);/,
  `const proof = await generateProof(node, map.axioms);`
);

fs.writeFileSync('src/model/logic.ts', code);
console.log('PATCHED logic.ts');
