const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const apiBlockRegex = /    app\.post\("\/api\/aiAssistantNode", async \(req, res\) => \{[\s\S]*?    \} catch \(e\) \{\n      console\.error\(e\);\n      res\.status\(500\)\.json\(\{ error: e\.message \}\);\n    \}\n  \}\);/;

const match = code.match(apiBlockRegex);
if (match) {
  const apiBlock = match[0];
  code = code.replace(apiBlock, '');
  
  code = code.replace(
    '  // Vite middleware for development',
    apiBlock + '\n\n  // Vite middleware for development'
  );
  fs.writeFileSync('server.ts', code);
  console.log('Fixed server.ts route order');
} else {
  console.log('Could not find apiAssistantNode block');
}
