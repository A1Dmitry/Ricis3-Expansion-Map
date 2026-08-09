const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf-8');

const replacement = `      const prompt = \`Ты формальный агент RICIS-III. Докажи или построй решение для сингулярности/проблемы, используя ТОЛЬКО алгебру RICIS-III (индексированные нули/бесконечности, редукции SP2/A6, без классических пределов и интегралов). Отвечай строго на русском языке!

Название проблемы: \${title}
Целевая функция / выражение: \${targetFunction || "(нет)"}

Доступные аксиомы с карты (уже решенные):
\${axiomList}

ВЫВЕДИ СТРОГИЙ ТЕКСТ LaTeX (без \\\\section, без \\\\subsection, без documentclass). Используй \\\\textbf для заголовков. Предпочитай конструктивные шаги с нулями-индексами и SP2. Если решение частичное, четко укажи оставшиеся препятствия.\`;`;

code = code.replace(
/const prompt = `You are the RICIS-III formal agent[\s\S]*?obstacles clearly\.`;/,
replacement
);

fs.writeFileSync(file, code);
console.log('proof prompt patched correctly');
