const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const oldAI = `const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy" });`;
const newAI = `const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY || "dummy",
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });`;

code = code.replace(oldAI, newAI);

const oldGen = `      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });`;
const newGen = `      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });`;

code = code.replace(oldGen, newGen);

fs.writeFileSync('server.ts', code);
console.log('Patched server.ts aiAssistantNode');
