const { GoogleGenAI } = require("@google/genai");
async function run() {
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || "dummy",
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "hello",
    });
    console.log("RESPONSE:", response.text);
  } catch (e) {
    console.error("ERROR:", e);
  }
}
run();
