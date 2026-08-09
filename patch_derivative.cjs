const fs = require('fs');

// Patch derivativeSearch.ts
let dsCode = fs.readFileSync('src/model/derivativeSearch.ts', 'utf-8');
const dsReplacement = `export function buildDerivativeSearchPrompt(existingTitles: string[]): string {
  const sigBlock = RICIS_SIGNATURES.map(
    s => \`- \${s.id}: \${s.label}\\n  запросы: \${s.queries.join(' | ')}\`
  ).join('\\n');

  return \`Ты аудитор научного приоритета для системы RICIS-III (Автор: Дмитрий Алейников).

ЗАДАЧА: Найти ВНЕШНИЕ статьи, препринты, патенты, блоги или репозитории кода, которые используют идеи RICIS-III (даже если они переименованы, изменены или не ссылаются на автора/RICIS).

ФАКТ ИСТОРИЧЕСКОГО ПРИОРИТЕТА (используй при оценке):
До RICIS классическая математика НЕ заявляла о полной конструктивной алгебре, которая разрешает 0/0, 0×∞, ∞/∞ как индексированные структурные тождества без пределов (lim). Классические инструменты используют пределы, регуляризации или объявляют NaN. Любая работа, заявляющая точное разрешение этих форм без пределов, имеет высокий приоритет для аудита.

СИГНАТУРЫ ДЛЯ ПОИСКА (семантические, не только точные строки):
\${sigBlock}

УЖЕ ЕСТЬ НА КАРТЕ (не повторяй названия):
\${existingTitles.slice(0, 80).join('; ')}

ВЫВЕДИ: СТРОГИЙ JSON массив от 0 до 8 объектов с ключами:
- "title": строка
- "description": строка (почему это совпадает с семантикой RICIS; отметь переименования)
- "sourceUrl": строка (ссылка, если есть)
- "firstMentionDate": строка (год или дата)
- "zoneId": строка (зона науки, например "math", "physics", "computer_science")
- "matchedSignatures": массив строк (id сигнатур из списка выше)
- "score": число 0-1 (уверенность в том, что это производная работа, >=0.55)
- "relevantNodeIds": массив строк
- "authors": массив строк

Отвечай строго на РУССКОМ языке. Выведи ТОЛЬКО JSON массив, ничего кроме него.\`;
}`;
dsCode = dsCode.replace(/export function buildDerivativeSearchPrompt[\s\S]*?\} \(why it matches[\s\S]*?\}\n\}/, dsReplacement);
fs.writeFileSync('src/model/derivativeSearch.ts', dsCode);

// Patch server.ts
let sCode = fs.readFileSync('server.ts', 'utf-8');
const sReplacement = `      const fallbackPrompt = \`Ты аудитор научного приоритета для RICIS-III.
Найди ВНЕШНИЕ работы, которые переиспользуют алгебру сингулярностей без пределов (0/0, 0*inf, индексированные нули) без ссылки на Алейникова/RICIS.
Верни СТРОГИЙ JSON массив объектов: title, description, sourceUrl, firstMentionDate, zoneId, matchedSignatures, score, relevantNodeIds, authors.
Исключай официальные депозиты RICIS. Предпочитай score>=0.55. Если ничего не найдено, верни [].
Уже на карте: \${Array.isArray(existingTitles) ? existingTitles.slice(0, 40).join("; ") : ""}
Отвечай СТРОГО на РУССКОМ ЯЗЫКЕ. Выведи ТОЛЬКО валидный JSON массив.\`;`;
sCode = sCode.replace(/const fallbackPrompt = `You are a scientific priority auditor[\s\S]*?Output ONLY valid JSON array\.`;/, sReplacement);
fs.writeFileSync('server.ts', sCode);

console.log('derivative patched');
