const fs = require('fs');
const path = require('path');
const p = path.resolve('src/ui/MapPatchImportModal.tsx');
let content = fs.readFileSync(p, 'utf8');

const target = `          {/* Direct JSON input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Или вставьте JSON вручную:</span>`;

const replacement = `          {/* JSON Template/Schema Description */}
          <div className="bg-cyan-950/20 border border-cyan-900/40 rounded-lg p-3 text-[11px] text-slate-300 font-mono space-y-1.5 mb-2">
            <div className="font-bold text-cyan-400 mb-1">Формат RICIS.MapStatePatch:</div>
            <div>- Корневое поле <span className="text-emerald-400">"@type"</span> должно быть <span className="text-amber-300">"RICIS.MapStatePatch"</span></div>
            <div>- Массив <span className="text-emerald-400">"nodePatches"</span>: элементы обязаны содержать <span className="text-emerald-400">"id"</span> (строка).</div>
            <div>- Опционально: <span className="text-emerald-400">"proofs"</span>, ключи которого соответствуют ID узлов.</div>
            <div className="text-cyan-500/70 pt-1 border-t border-cyan-900/50 mt-1.5">
              Также поддерживается полный экспорт карты (массивы "nodes" и "edges").
            </div>
          </div>

          {/* Direct JSON input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Или вставьте JSON вручную:</span>`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(p, content, 'utf8');
    console.log("Patched successfully");
} else {
    console.log("Target not found");
}
