const fs = require('fs');
let code = fs.readFileSync('src/model/persistence.ts', 'utf-8');

code = code.replace(
  "  return {\n    nodes: initialMap.nodes.map(n => ({ ...n, economic: { ...n.economic } })),",
  "  return sanitizeMap({\n    nodes: initialMap.nodes.map(n => ({ ...n, economic: { ...n.economic } })),"
);
code = code.replace(
  "    axioms: [...initialMap.axioms],\n    proofs: { ...initialMap.proofs },\n  };\n}",
  "    axioms: [...initialMap.axioms],\n    proofs: { ...initialMap.proofs },\n  });\n}"
);

fs.writeFileSync('src/model/persistence.ts', code);
console.log('patched persistence end');
