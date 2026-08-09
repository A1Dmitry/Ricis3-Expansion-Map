const { GoogleGenAI } = require("@google/genai");

async function run() {
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || "dummy",
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });
  
  try {
    const response = await ai.models.list();
    for await (const m of response) {
      console.log(m.name);
    }
  } catch (e) {
    console.error("ERROR:", e);
  }
}

run();
