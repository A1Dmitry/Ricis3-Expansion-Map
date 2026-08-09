const fs = require('fs');
let code = fs.readFileSync('src/store/mapStore.ts', 'utf-8');

code = code.replace(
  `runAgentDiscovery: (anchorNodeId?: string) => Promise<number>;`,
  `runAgentDiscovery: (anchorNodeId?: string) => Promise<{ added: number; error?: string }>;`
);

code = code.replace(
  `    return report.added;`,
  `    return { added: report.added, error: report.error };`
);

fs.writeFileSync('src/store/mapStore.ts', code);
console.log('Patched mapStore.ts');
