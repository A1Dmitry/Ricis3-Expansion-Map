const fs = require('fs');
let dsCode = fs.readFileSync('src/model/derivativeSearch.ts', 'utf-8');
const oldPromptStart = 'export function buildDerivativeSearchPrompt(existingTitles: string[]): string {';
const oldPromptEnd = '  ];\\n';

const match = dsCode.indexOf('export function buildDerivativeSearchPrompt');
if (match !== -1) {
  const end = dsCode.indexOf('export async function applyDerivativeSearch', match);
  if (end !== -1) {
    const replacement = `export function buildDerivativeSearchPrompt(existingTitles: string[]): string {
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
}

`;
    dsCode = dsCode.substring(0, match) + replacement + dsCode.substring(end);
    fs.writeFileSync('src/model/derivativeSearch.ts', dsCode);
    console.log('Fixed derivativeSearch.ts');
  }
}
