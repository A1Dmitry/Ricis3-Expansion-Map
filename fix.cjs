const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

// The broken part starts at:
// className="w-full mt-1"                             {parents.length > 0 ? (
// We need to restore the menu.

const fix = `                        >
                          Генерировать TEX
                        </ActionButton>
                      </div>
                      
                      <div className="space-y-1.5 border-t border-cyan-900/30 pt-2">
                        <p className="text-[9px] font-bold uppercase text-purple-500/80 tracking-wider">Экспорт для ИИ</p>
                        <ActionButton
                          onClick={() => { handleGenerateJSON(); setIsMenuOpen(false); }}
                          variant="violet"
                          className="w-full mt-1"
                        >
                          {showOnlyDerivatives ? 'JSON: только фиолетовые' : 'Генерировать JSON'}
                        </ActionButton>
                        {jsonMsg && <p className="text-[9px] text-purple-300/90 font-mono break-all mt-1">{jsonMsg}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {(() => {
                const parents = map.nodes.filter(n => selectedNode.dependencyIds.includes(n.id));
                return (
                  <div className="text-[10px] font-mono text-cyan-500/80 mb-1.5 flex flex-wrap items-center gap-1">
                    <span className="text-gray-500">{map.zones.find(z => z.id === selectedNode.zoneIds[0])?.name || 'Zone'}</span>
                    <span className="text-gray-600">/</span>
                    {parents.length > 0 ? (`;

code = code.replace(/className="w-full mt-1"\s*\{parents\.length > 0 \? \(/g, fix);

// And we need to remove the duplicate chip render block at the bottom
code = code.replace(/            <\/div>   <\/div>\s*\);\s*\}\)\(\)\}\s*<div className="mb-3 flex gap-2 flex-wrap">[\s\S]*?RICIS CORE<\/span>\s*\)\}\s*<\/div>/, '            </div>');

fs.writeFileSync('src/ui/Map3D.tsx', code);
