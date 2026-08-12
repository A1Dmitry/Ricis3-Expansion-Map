const fs = require('fs');
let code = fs.readFileSync('src/hooks/useAdaptiveUI.ts', 'utf8');

// There's a clone reported inside useAdaptiveUI (lines 52 to 89).
// Let's refactor.

const target = `    if (currentWidth >= 1280) {
      nextMode = 'DESKTOP';
    } else if (currentWidth >= 768) {
      nextMode = 'TABLET';
    } else {
      nextMode = 'MOBILE';
    }`;

// Assuming there might be two blocks calculating layout mode
if (code.includes(target)) {
  const helper = `
function resolveLayoutMode(width: number): 'DESKTOP' | 'TABLET' | 'MOBILE' {
  if (width >= 1280) return 'DESKTOP';
  if (width >= 768) return 'TABLET';
  return 'MOBILE';
}
`;
  code = helper + code;
  code = code.replace(target, `    nextMode = resolveLayoutMode(currentWidth);`);
  code = code.replace(target, `    nextMode = resolveLayoutMode(currentWidth);`);
  code = code.replace(target, `    nextMode = resolveLayoutMode(currentWidth);`); // just in case
  fs.writeFileSync('src/hooks/useAdaptiveUI.ts', code);
  console.log("useAdaptiveUI patched");
}
