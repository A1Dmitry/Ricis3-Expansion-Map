const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf-8');

const replacement = `      const { title, description, zoneIds } = req.body || {};
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY || "dummy",
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const zoneStr = Array.isArray(zoneIds) && zoneIds.length > 0 ? zoneIds.join(", ") : "math";
      const prompt = \`Заполни недостающие параметры узла RICIS-III.
Название: \${title || ""}
Описание: \${description || ""}
Зона: \${zoneStr}
Верни СТРОГИЙ JSON: targetFunction (строка, предпочтительно выражение RICIS-III), significance (число 0-1), shortProofSketch (простой текст без секций), tags (массив строк).
Выведи ТОЛЬКО JSON объект.\`;`;

code = code.replace(
/const \{ title, description, zoneId \} = req\.body \|\| \{\};\s*const ai = new GoogleGenAI\(\{\s*apiKey: process\.env\.GEMINI_API_KEY \|\| "dummy",\s*httpOptions: \{ headers: \{ "User-Agent": "aistudio-build" \} \},\s*\}\);\s*const prompt = `Fill missing RICIS-III node parameters[\s\S]*?Output ONLY JSON\.`;/,
replacement
);

fs.writeFileSync(file, code);
console.log('server fill patched');
