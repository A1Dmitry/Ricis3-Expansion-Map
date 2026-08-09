const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

const targetStr = `<span className="text-[9px] font-mono text-cyan-400">ID: {selectedNode.id}</span>
                </div>`;

const newStr = `<span className="text-[9px] font-mono text-cyan-400 block mb-1">ID: {selectedNode.id}</span>
                  {selectedNode.economic?.marketGain > 0 && (
                    <span className="text-[10px] font-bold text-green-400 bg-green-950/30 border border-green-900/50 px-1.5 py-0.5 rounded inline-block">
                      Оценка: {formatCurrency(selectedNode.economic.marketGain)}
                    </span>
                  )}
                </div>`;

if (code.includes('<span className="text-[9px] font-mono text-cyan-400">ID: {selectedNode.id}</span>\n                </div>')) {
  code = code.replace(
    '<span className="text-[9px] font-mono text-cyan-400">ID: {selectedNode.id}</span>\n                </div>',
    newStr
  );
  fs.writeFileSync('src/ui/Map3D.tsx', code);
  console.log('Patched Map3D card capitalization (with exact newline)');
} else {
  // try regex
  const regex = /<span className="text-\[9px\] font-mono text-cyan-400">ID: \{selectedNode\.id\}<\/span>\s*<\/div>/;
  code = code.replace(regex, newStr);
  fs.writeFileSync('src/ui/Map3D.tsx', code);
  console.log('Patched Map3D card capitalization (regex fallback)');
}

