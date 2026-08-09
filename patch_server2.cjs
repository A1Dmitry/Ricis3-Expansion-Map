const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const oldParse = `      let text = response.text || "[]";
      if (text.startsWith("\`\`\`json")) text = text.substring(7);
      if (text.startsWith("\`\`\`")) text = text.substring(3);
      if (text.endsWith("\`\`\`")) text = text.substring(0, text.length - 3);
      res.json({ tasks: JSON.parse(text.trim()) });`;

const newParse = `      let text = response.text || "[]";
      const match = text.match(/\\[[\\s\\S]*\\]/);
      if (match) {
        text = match[0];
      }
      res.json({ tasks: JSON.parse(text.trim()) });`;

if (code.includes('if (text.startsWith("\`\`\`json"))')) {
    code = code.replace(oldParse, newParse);
    fs.writeFileSync('server.ts', code);
    console.log('Patched server.ts JSON parsing');
} else {
    console.log('Could not find old parse block');
}
