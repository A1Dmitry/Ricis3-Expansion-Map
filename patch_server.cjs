const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf-8');

const replacement = `      const { existingTitles, parentNode } = req.body || {};
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY || "dummy",
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const zoneId = parentNode && parentNode.zoneIds && parentNode.zoneIds.length > 0 ? parentNode.zoneIds[0] : "any";
      const prompt = \`Ты агент-исследователь RICIS-III. Предложи новые научные или математические проблемы, которые можно свести к алгебре сингулярностей без пределов (SP2, A6, индексированные 0/∞).
Зона науки (zoneId): \${zoneId}. Опора: \${parentNode ? parentNode.title : "нет"}.
Уже на карте (не повторяй): \${(Array.isArray(existingTitles) ? existingTitles : []).slice(0, 50).join("; ")}
Верни СТРОГИЙ JSON массив объектов: title (строка), description (строка), targetFunction (строка), zoneId (строка - ДОЛЖНА БЫТЬ \${zoneId}), significance (число 0-1), singularityHint (строка).
Предпочитай проблемы, расширяющие ядро сингулярностей или применяющие RICIS к биологии, химии, экологии, медицине, физике, экономике. Максимум 8 элементов. Выведи ТОЛЬКО JSON массив.\`;`;

code = code.replace(
/const \{ existingTitles, zoneId, focus \} = req\.body \|\| \{\};\s*const ai = new GoogleGenAI\(\{\s*apiKey: process\.env\.GEMINI_API_KEY \|\| "dummy",\s*httpOptions: \{ headers: \{ "User-Agent": "aistudio-build" \} \},\s*\}\);\s*const prompt = `You are a RICIS-III discovery agent[\s\S]*?Output ONLY the JSON array\.`;/,
replacement
);

fs.writeFileSync(file, code);
console.log('server patched');
