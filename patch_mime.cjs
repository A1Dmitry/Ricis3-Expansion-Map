const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const regex1 = /      const response = await ai\.models\.generateContent\(\{\n        model: "gemini-3\.5-flash",\n        contents: prompt,\n      \}\);/g;
const replacement1 = `      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });`;

code = code.replace(regex1, replacement1);
fs.writeFileSync('server.ts', code);
console.log('Patched mime type');
