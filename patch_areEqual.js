const fs = require('fs');
const file = 'packages/ricis-core-ts/src/engine/AlgebraicSimplifier.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /if \(this\.areEqual\(left, right\)\) return AST\.Const\(1\);/g,
  'if (this.areEqual(left, right) && (left.nodeType !== "Constant" || (left as any).value !== 0)) return AST.Const(1);'
);

fs.writeFileSync(file, code);
