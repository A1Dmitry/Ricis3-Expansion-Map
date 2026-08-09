const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const newEndpoint = `  app.post("/api/aiAssistantNode", async (req, res) => {
    try {
      const { title, targetFunction } = req.body;
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy" });
      const prompt = \`You are a scientific AI assistant. The user wants to add a new problem to the RICIS-III map.
Title: \${title}
Target Function (rough): \${targetFunction || "Not provided"}

Please do the following:
1. Normalize and strictly formalize the "Target Function" into a mathematical expression or limit involving a singularity (e.g. lim x->0 ... or Formalize(...)).
2. Provide a short, rigorous scientific description of the problem (in Russian).
3. Provide a hint about where the singularity is (in Russian).
4. Provide a relevant Wikipedia or scientific link (URL).

Return the result STRICTLY as a JSON object with the keys:
- "normalizedFunction": string
- "description": string
- "hint": string
- "link": string

Output ONLY valid JSON.\`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash",
        contents: prompt,
      });

      let text = response.text || "{}";
      const match = text.match(/\\{[\\s\\S]*\\}/);
      if (match) {
        text = match[0];
      }
      res.json(JSON.parse(text.trim()));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });
`;

if (!code.includes('/api/aiAssistantNode')) {
  code = code.replace(/app\.listen\(PORT/, newEndpoint + '\n  app.listen(PORT');
  fs.writeFileSync('server.ts', code);
  console.log('Added /api/aiAssistantNode to server.ts');
}
