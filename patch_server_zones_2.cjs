const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const searchStr = `const { existingTitles, parentNode } = req.body || {};`;
const replaceStr = `const { existingTitles, parentNode, existingZones } = req.body || {};`;
code = code.replace(searchStr, replaceStr);

const promptSearchStr = `Уже на карте (не повторяй): \${(Array.isArray(existingTitles) ? existingTitles : []).slice(0, 50).join("; ")}
Верни СТРОГИЙ JSON массив объектов: title (строка), description (строка), targetFunction (строка), zoneId (строка - короткий ID научной области на английском. Если проблема не попадает в существующие области, ПРИДУМАЙ НОВЫЙ ID, например, sociology, finance, genetics), significance (число 0-1), singularityHint (строка).`;

const promptReplaceStr = `Уже на карте (не повторяй): \${(Array.isArray(existingTitles) ? existingTitles : []).slice(0, 50).join("; ")}
Существующие зоны науки: \${(Array.isArray(existingZones) ? existingZones : []).join(", ")}.
Верни СТРОГИЙ JSON массив объектов: title (строка), description (строка), targetFunction (строка), zoneId (строка - ID научной области на английском. Используй одну из существующих зон, ИЛИ если проблема совсем в них не попадает, придумай НОВЫЙ ID, например finance, ecology), significance (число 0-1), singularityHint (строка).`;

if (code.includes(promptSearchStr)) {
  code = code.replace(promptSearchStr, promptReplaceStr);
  fs.writeFileSync('server.ts', code);
  console.log('patched server.ts');
} else {
  console.log('prompt search string not found');
}
