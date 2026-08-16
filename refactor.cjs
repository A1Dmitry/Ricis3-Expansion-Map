const fs = require('fs');
let code = fs.readFileSync('src/ui/NodeCardDetails.tsx', 'utf-8');

// Replace the main wrapper for the accordion (lines around 229 onwards)
// Wait, the outer div of the whole component is:
// <div className={`space-y-2.5 ${isExpanded ? 'text-[12px]' : 'text-[11px]'}`}>
// We'll leave that outer div alone, but inside it, we will wrap the accordion items in a single div:
// <div className="border border-neutral-800/80 rounded-xl overflow-hidden bg-[#0d1117] flex flex-col">
// And remove the individual <div className="border ... rounded-lg ..."> wrappers.

code = code.replace(
  /\/\* 1\. СЕКЦИЯ АККОРДЕОНА: ЦЕЛЕВАЯ ФУНКЦИЯ И СИНГУЛЯРНОСТЬ \*\/\s*<div className="border border-neutral-800\/80 rounded-lg overflow-hidden bg-neutral-950\/60">/g,
  '/* 1. СЕКЦИЯ АККОРДЕОНА: ЦЕЛЕВАЯ ФУНКЦИЯ И СИНГУЛЯРНОСТЬ */\n      <div className="border border-neutral-800/80 rounded-xl overflow-hidden bg-[#0d1117] flex flex-col">\n        <div className="flex flex-col border-b border-neutral-800/50">'
);

// We need to change the headers of toggle buttons
// For target section:
code = code.replace(
  /onClick=\{\(\) => toggleSection\('target'\)\}\s*className="w-full flex items-center justify-between p-2\.5 bg-neutral-900\/80 hover:bg-neutral-900 text-left cursor-pointer transition-colors border-b border-neutral-800\/60"/g,
  'onClick={() => toggleSection(\'target\')}\n          className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 bg-[#0d1117] hover:bg-neutral-900 text-left cursor-pointer transition-colors"'
);

code = code.replace(
  /\{\/\* 2\. СЕКЦИЯ АККОРДЕОНА: РАЗБЛОКИРУЕТ СЛЕДУЮЩИЕ ЗАДАЧИ \*\/\}\s*\{unlockedReport\.allDependentTargets\.length > 0 && \(\s*<div className="border border-emerald-900\/50 rounded-lg overflow-hidden bg-emerald-950\/15">/g,
  '{/* 2. СЕКЦИЯ АККОРДЕОНА: РАЗБЛОКИРУЕТ СЛЕДУЮЩИЕ ЗАДАЧИ */}\n      {unlockedReport.allDependentTargets.length > 0 && (\n        <div className="flex flex-col border-b border-neutral-800/50">'
);
code = code.replace(
  /onClick=\{\(\) => toggleSection\('forward'\)\}\s*className="w-full flex items-center justify-between p-2\.5 bg-emerald-950\/40 hover:bg-emerald-950\/60 text-left cursor-pointer transition-colors border-b border-emerald-900\/40"/g,
  'onClick={() => toggleSection(\'forward\')}\n            className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 bg-[#0d1117] hover:bg-neutral-900 text-left cursor-pointer transition-colors"'
);

code = code.replace(
  /\{\/\* 3\. СЕКЦИЯ АККОРДЕОНА: ТРЕБУЕМЫЕ ПРЕДПОСЫЛКИ \(ПРЕРЕКВИЗИТЫ\) \*\/\}\s*\{unlockRequirements\.length > 0 && node\.state !== 'resolved' && \(\s*<div className="border border-amber-900\/50 rounded-lg overflow-hidden bg-amber-950\/15">/g,
  '{/* 3. СЕКЦИЯ АККОРДЕОНА: ТРЕБУЕМЫЕ ПРЕДПОСЫЛКИ (ПРЕРЕКВИЗИТЫ) */}\n      {unlockRequirements.length > 0 && node.state !== \'resolved\' && (\n        <div className="flex flex-col border-b border-neutral-800/50">'
);
code = code.replace(
  /onClick=\{\(\) => toggleSection\('prereqs'\)\}\s*className="w-full flex items-center justify-between p-2\.5 bg-amber-950\/40 hover:bg-amber-950\/60 text-left cursor-pointer transition-colors border-b border-amber-900\/40"/g,
  'onClick={() => toggleSection(\'prereqs\')}\n            className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 bg-[#0d1117] hover:bg-neutral-900 text-left cursor-pointer transition-colors"'
);

code = code.replace(
  /\{\/\* 4\. СЕКЦИЯ АККОРДЕОНА: ФОРМАЛЬНАЯ ВЕРИФИКАЦИЯ \(LEAN 4 \/ RICIS\) \*\/\}\s*<div className="border border-neutral-800\/80 rounded-lg overflow-hidden bg-neutral-950\/60">/g,
  '{/* 4. СЕКЦИЯ АККОРДЕОНА: ФОРМАЛЬНАЯ ВЕРИФИКАЦИЯ (LEAN 4 / RICIS) */}\n        <div className="flex flex-col border-b border-neutral-800/50">'
);
code = code.replace(
  /onClick=\{\(\) => toggleSection\('verification'\)\}\s*className="w-full flex items-center justify-between p-2\.5 bg-neutral-900\/80 hover:bg-neutral-900 text-left cursor-pointer transition-colors border-b border-neutral-800\/60"/g,
  'onClick={() => toggleSection(\'verification\')}\n          className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 bg-[#0d1117] hover:bg-neutral-900 text-left cursor-pointer transition-colors"'
);

code = code.replace(
  /\{\/\* 4\.5\. СЕКЦИЯ АККОРДЕОНА: ТРАССИРОВКА RICIS-III \*\/\}\s*<div className="border border-neutral-800\/80 rounded-lg overflow-hidden bg-neutral-950\/60">/g,
  '{/* 4.5. СЕКЦИЯ АККОРДЕОНА: ТРАССИРОВКА RICIS-III */}\n        <div className="flex flex-col border-b border-neutral-800/50">'
);
code = code.replace(
  /onClick=\{\(\) => toggleSection\('trace'\)\}\s*className="w-full flex items-center justify-between p-2\.5 bg-neutral-900\/80 hover:bg-neutral-900 text-left cursor-pointer transition-colors border-b border-neutral-800\/60"/g,
  'onClick={() => toggleSection(\'trace\')}\n          className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 bg-[#0d1117] hover:bg-neutral-900 text-left cursor-pointer transition-colors"'
);

code = code.replace(
  /\{\/\* 5\. СЕКЦИЯ АККОРДЕОНА: ПЕРВОИСТОЧНИКИ, СТАТЬИ И DOI \*\/\}\s*<div className="border border-neutral-800\/80 rounded-lg overflow-hidden bg-neutral-950\/60">/g,
  '{/* 5. СЕКЦИЯ АККОРДЕОНА: ПЕРВОИСТОЧНИКИ, СТАТЬИ И DOI */}\n        <div className="flex flex-col border-b border-neutral-800/50">'
);
code = code.replace(
  /onClick=\{\(\) => toggleSection\('sources'\)\}\s*className="w-full flex items-center justify-between p-2\.5 bg-neutral-900\/80 hover:bg-neutral-900 text-left cursor-pointer transition-colors border-b border-neutral-800\/60"/g,
  'onClick={() => toggleSection(\'sources\')}\n          className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 bg-[#0d1117] hover:bg-neutral-900 text-left cursor-pointer transition-colors"'
);

code = code.replace(
  /\{\/\* 6\. СЕКЦИЯ АККОРДЕОНА: ЭКОНОМИКА И ОЦЕНКА \*\/\}\s*\{node\.economic && \(\s*<div className="border border-emerald-900\/40 rounded-lg overflow-hidden bg-emerald-950\/15">/g,
  '{/* 6. СЕКЦИЯ АККОРДЕОНА: ЭКОНОМИКА И ОЦЕНКА */}\n      {node.economic && (\n        <div className="flex flex-col border-b border-neutral-800/50">'
);
code = code.replace(
  /onClick=\{\(\) => toggleSection\('economics'\)\}\s*className="w-full flex items-center justify-between p-2\.5 bg-emerald-950\/30 hover:bg-emerald-950\/50 text-left cursor-pointer transition-colors border-b border-emerald-900\/30"/g,
  'onClick={() => toggleSection(\'economics\')}\n            className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 bg-[#0d1117] hover:bg-neutral-900 text-left cursor-pointer transition-colors"'
);

code = code.replace(
  /\{\/\* 7\. СЕКЦИЯ АККОРДЕОНА: ДОКАЗАТЕЛЬСТВО АВТОРСТВА ИЛИ АУДИТ ПРИОРИТЕТА \*\/\}\s*\{\(node\.id === 'ai-authorship-provenance' \|\| node\.title\.toLowerCase\(\)\.includes\('авторств'\) \|\| node\.type === 'derivative_claim'\) && \(\s*<div className="border border-cyan-800\/60 rounded-lg overflow-hidden bg-cyan-950\/20">/g,
  '{/* 7. СЕКЦИЯ АККОРДЕОНА: ДОКАЗАТЕЛЬСТВО АВТОРСТВА ИЛИ АУДИТ ПРИОРИТЕТА */}\n      {(node.id === \'ai-authorship-provenance\' || node.title.toLowerCase().includes(\'авторств\') || node.type === \'derivative_claim\') && (\n        <div className="flex flex-col">'
);
code = code.replace(
  /onClick=\{\(\) => toggleSection\('provenance'\)\}\s*className="w-full flex items-center justify-between p-2\.5 bg-cyan-950\/40 hover:bg-cyan-950\/60 text-left cursor-pointer transition-colors border-b border-cyan-800\/50"/g,
  'onClick={() => toggleSection(\'provenance\')}\n            className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 bg-[#0d1117] hover:bg-neutral-900 text-left cursor-pointer transition-colors"'
);

// Add the closing tag for the main container at the end of the provenance section or economic section
code = code.replace(
  /\{\/\* Мета-информация узла \*\/\}/g,
  '</div>\n      {/* Мета-информация узла */}'
);

// Fix Target Function Typography
code = code.replace(
  /className="bg-black\/90 p-2 rounded border border-neutral-800 break-all whitespace-pre-wrap"/g,
  'className="p-4 break-all whitespace-pre-wrap bg-neutral-900/50 rounded-lg"'
);
code = code.replace(
  /text-\[10\.5px\] font-mono text-cyan-200/g,
  'text-sm font-mono text-cyan-200'
);

fs.writeFileSync('src/ui/NodeCardDetails.tsx', code);
console.log('Refactoring complete');
