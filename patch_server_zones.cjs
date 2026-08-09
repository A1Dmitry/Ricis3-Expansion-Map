const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const oldStr = `      const prompt = \`Ты агент-исследователь RICIS-III. Предложи новые научные или математические проблемы, которые можно свести к алгебре сингулярностей без пределов (SP2, A6, индексированные 0/∞).
Зона науки (zoneId): \${zoneId}. Опора: \${parentNode ? parentNode.title : "нет"}.
Уже на карте (не повторяй): \${(Array.isArray(existingTitles) ? existingTitles : []).slice(0, 50).join("; ")}
Верни СТРОГИЙ JSON массив объектов: title (строка), description (строка), targetFunction (строка), zoneId (строка - ДОЛЖНА БЫТЬ \${zoneId}), significance (число 0-1), singularityHint (строка).
Предпочитай проблемы, расширяющие ядро сингулярностей или применяющие RICIS к биологии, химии, экологии, медицине, физике, экономике. Максимум 8 элементов. Выведи ТОЛЬКО JSON массив.\`;`;

const newStr = `      const prompt = \`Ты агент-исследователь RICIS-III. Предложи новые научные или математические проблемы, которые можно свести к алгебре сингулярностей без пределов (SP2, A6, индексированные 0/∞).
Опора: \${parentNode ? parentNode.title : "нет"}. Зона опоры: \${zoneId}.
Уже на карте (не повторяй): \${(Array.isArray(existingTitles) ? existingTitles : []).slice(0, 50).join("; ")}
Верни СТРОГИЙ JSON массив объектов: title (строка), description (строка), targetFunction (строка), zoneId (строка - короткий ID научной области на английском. Если проблема не попадает в существующие области, ПРИДУМАЙ НОВЫЙ ID, например, sociology, finance, genetics), significance (число 0-1), singularityHint (строка).
Предпочитай проблемы, расширяющие ядро сингулярностей или применяющие RICIS к новым дисциплинам. Максимум 8 элементов. Выведи ТОЛЬКО JSON массив.\`;`;

if (code.includes(oldStr)) {
  code = code.replace(oldStr, newStr);
  fs.writeFileSync('server.ts', code);
  console.log('patched server.ts');
} else {
  console.log('oldStr not found in server.ts');
}
