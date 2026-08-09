const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

const hamburgerMenuRegex = /<div className="space-y-1\.5 border-t border-cyan-900\/30 pt-2">[\s\S]*?<\/div>\s*<\/div>/;

const oldMenuStr = code.match(hamburgerMenuRegex)[0];

const newMenuStr = oldMenuStr.replace('</div>\n                    </div>', `</div>
                      
                      <div className="space-y-1.5 border-t border-cyan-900/30 pt-2">
                        <p className="text-[9px] font-bold uppercase text-purple-500/80 tracking-wider">Экспорт для ИИ</p>
                        <button type="button" onClick={() => { handleGenerateJSON(); setIsMenuOpen(false); }} className="w-full mt-1 py-1.5 text-[10px] rounded border border-purple-700/50 bg-purple-950/50 text-purple-200 hover:bg-purple-900/60 transition-colors">
                          Генерировать JSON
                        </button>
                        {jsonMsg && <p className="text-[9px] text-purple-300/90 font-mono break-all mt-1">{jsonMsg}</p>}
                      </div>
                    </div>`);

if (oldMenuStr !== newMenuStr) {
  code = code.replace(oldMenuStr, newMenuStr);
  fs.writeFileSync('src/ui/Map3D.tsx', code);
  console.log('JSON menu button added');
} else {
  console.log('Failed to match hamburger menu');
}
