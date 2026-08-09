const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const helper = `
const MODELS_POOL = [
  "gemini-3.1-pro-preview",
  "gemini-2.5-pro",
  "gemini-3.6-flash"
];

async function callAIWithFallback(ai, prompt, responseMimeType = "text/plain") {
  let lastError = null;
  for (const model of MODELS_POOL) {
    try {
      console.log("[AI] Attempting to call model: " + model);
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType },
      });
      console.log("[AI] Successfully called model: " + model);
      return { text: response.text || "", model };
    } catch (e) {
      console.warn("[AI] Model " + model + " failed: " + e.message);
      lastError = e;
      continue;
    }
  }
  throw lastError || new Error("All AI models in the pool failed.");
}
`;

if (!code.includes('callAIWithFallback')) {
  code = code.replace('async function startServer() {', helper + '\nasync function startServer() {');
}

// 1. generateProof
code = code.replace(
  /const response = await ai\.models\.generateContent\(\{\s*model: "gemini-3\.6-flash",\s*contents: prompt,\s*config: \{ responseMimeType: "text\/plain" \},\s*\}\);/,
  'const response = await callAIWithFallback(ai, prompt, "text/plain");'
);

// 2. discoverTasks
code = code.replace(
  /const response = await ai\.models\.generateContent\(\{\s*model: "gemini-3\.6-flash",\s*contents: prompt,\s*config: \{ responseMimeType: "application\/json" \},\s*\}\);/,
  'const response = await callAIWithFallback(ai, prompt, "application/json");'
);

// 3. aiAssistantNode (note: replacing multiple occurrences if they match the discoverTasks one, but they do)
let lastLength = 0;
while (code.length !== lastLength) {
  lastLength = code.length;
  code = code.replace(
    /const response = await ai\.models\.generateContent\(\{\s*model: "gemini-3\.6-flash",\s*contents: prompt,\s*config: \{ responseMimeType: "application\/json" \},\s*\}\);/,
    'const response = await callAIWithFallback(ai, prompt, "application/json");'
  );
}

// 4. searchDerivatives
code = code.replace(
  /const response = await ai\.models\.generateContent\(\{\s*model: "gemini-3\.6-flash",\s*contents: typeof prompt === "string" && prompt\.length > 100 \? prompt : fallbackPrompt,\s*config: \{ responseMimeType: "application\/json" \},\s*\}\);/,
  'const response = await callAIWithFallback(ai, typeof prompt === "string" && prompt.length > 100 ? prompt : fallbackPrompt, "application/json");'
);

fs.writeFileSync('server.ts', code);
console.log('patched server.ts with pool');
