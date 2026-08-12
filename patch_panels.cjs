const fs = require('fs');

const path = 'src/ui/Map3D.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetStart = `{/* Render active panels */}`;
const targetEnd = `                  </div>\n                )}\n              </section>\n            );\n          })}\n`;

const startIndex = code.indexOf(targetStart);
const endIndex = code.indexOf(targetEnd) + targetEnd.length;

if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    console.error("Could not find block to replace.");
    process.exit(1);
}

const replacement = `{/* Render active panels */}
          <div className="accordion-container flex flex-col gap-0 border-0 bg-transparent overflow-visible w-full">
          {[...visibleElements.map((el: any) => ({ ...el, isHidden: false })), ...hiddenElements.map((el: any) => ({ ...el, isHidden: true }))].map(({ id, isHidden }: any) => {
            if (isHidden && !showOverflow) return null;
            
            // PHYSICS PANEL IS UNIQUE
            if (id === 'physics') {
              return (
                <div key="physics" className={\`accordion-item border border-neutral-800/80 rounded-lg overflow-hidden bg-neutral-900/40 mb-2 \${isHidden ? 'opacity-80 border-dashed' : ''}\`}>
                  <PhysicsControlPanel
                    params={physicsParams}
                    onChange={setPhysicsParams}
                  />
                </div>
              );
            }

            // OTHER PANELS
            return (
              <div key={id} className={\`accordion-item border border-neutral-800/80 rounded-lg overflow-hidden bg-neutral-900/40 mb-2 relative \${isHidden ? 'opacity-90 border-dashed border-neutral-700' : ''}\`}>
                <input type="checkbox" id={\`accordion-\${id}\`} className="accordion-trigger" />
                <label htmlFor={\`accordion-\${id}\`} className="accordion-header bg-neutral-950/80 hover:bg-neutral-900/90 transition-colors cursor-pointer w-full flex flex-col items-start px-3.5 py-2.5 h-auto rounded-none border-0 m-0" onClick={() => handleElementClick(id)}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                       {id === 'actions' && <Plus size={16} className="text-emerald-400" />}
                       {id === 'search' && <Search size={16} className="text-cyan-400" />}
                       {id === 'zones' && <Layers size={16} className="text-cyan-400" />}
                       {id === 'available' && <CheckCircle2 size={16} className="text-emerald-400" />}
                       {id === 'agent' && <Bot size={16} className="text-violet-400" />}
                       {id === 'persistence' && <Database size={16} className="text-cyan-400" />}
                       
                       <span className="text-xs font-bold text-slate-100 uppercase tracking-wider accordion-title p-0">
                         {UI_ELEMENTS.find(e => e.id === id)?.label}
                       </span>

                       {id === 'search' && searchQuery.trim() && (
                         <span className={\`text-xs font-mono px-2 py-0.5 rounded-full border \${searchMatchCount > 0 ? 'bg-cyan-950/80 text-cyan-200 border-cyan-700/80 font-bold' : 'bg-rose-950/80 text-rose-200 border-rose-700/80 font-bold'}\`}>
                           {searchMatchCount}
                         </span>
                       )}
                       {id === 'zones' && (
                         <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-neutral-900 text-cyan-300 border border-neutral-700">
                           {map.zones.length - hiddenZones.size} / {map.zones.length}
                         </span>
                       )}
                       {id === 'available' && (
                         <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-neutral-900 text-emerald-300 border border-neutral-700">
                           {availableNodes.length}
                         </span>
                       )}
                       {id === 'agent' && (
                         <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono bg-neutral-900 border border-neutral-700 text-emerald-400">
                           <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                           <span>ONLINE</span>
                         </span>
                       )}
                    </div>
                    <span className="accordion-icon" aria-hidden="true">▼</span>
                  </div>

                  <div className="accordion-summary mt-2 pt-1.5 border-t border-neutral-800/40 flex flex-wrap gap-1 text-xs font-mono truncate w-full">
                    {id === 'actions' && (
                      <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-slate-200 text-emerald-300">+ Добавить новую задачу</span>
                    )}
                    {id === 'search' && (
                      searchQuery.trim() ? (
                        <span className="bg-neutral-900 border border-cyan-800/70 px-2 py-0.5 rounded text-cyan-200 truncate max-w-full">
                          🔍 "{searchQuery}" ({searchMatchCount} совп.)
                        </span>
                      ) : (
                        <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-slate-300">
                          Поиск не активен
                        </span>
                      )
                    )}
                    {id === 'zones' && (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {map.zones.filter(z => !hiddenZones.has(z.id)).length === 0 ? (
                          <span className="text-xs text-amber-400 font-medium italic">Все сферы скрыты</span>
                        ) : (
                          map.zones.filter(z => !hiddenZones.has(z.id)).map(z => (
                            <span key={z.id} className="inline-flex items-center gap-1.5 bg-neutral-900 border border-neutral-700/80 px-2 py-0.5 rounded-full text-xs text-slate-200">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getZoneColor(z.id) }} />
                              <span className="truncate max-w-[130px] font-medium">{z.name}</span>
                              <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); setHiddenZones(prev => new Set(prev).add(z.id)); }} className="text-slate-400 hover:text-rose-400 font-bold ml-0.5 cursor-pointer">✕</span>
                            </span>
                          ))
                        )}
                      </div>
                    )}
                    {id === 'available' && (
                      selectedNode ? (
                        <span className="bg-emerald-950/80 border border-emerald-700/80 px-2.5 py-0.5 rounded-full text-emerald-200 inline-flex items-center gap-1.5 max-w-full font-medium">
                          <span className="truncate">🎯 {selectedNode.title}</span>
                          <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedNodeId(null); }} className="text-slate-400 hover:text-rose-400 font-bold cursor-pointer">✕</span>
                        </span>
                      ) : availableNodes.length > 0 ? (
                        <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-slate-300 truncate max-w-full">
                          Доступно: <strong className="text-emerald-400">{availableNodes.length}</strong> задач
                        </span>
                      ) : (
                        <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-slate-400">Нет открытых задач</span>
                      )
                    )}
                    {id === 'agent' && (
                      <>
                        <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-slate-200 text-violet-300">🤖 {selectedModel}</span>
                        <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-slate-300 text-violet-300">Telegram Bot</span>
                      </>
                    )}
                    {id === 'persistence' && (
                      <>
                        <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-slate-200 text-cyan-300">💾 IndexedDB</span>
                        <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-slate-200 text-cyan-300">📥 .json</span>
                      </>
                    )}
                  </div>
                </label>

                <div className={\`accordion-content\`}>
                  <div className={\`accordion-inner p-3 border-t border-neutral-800/60 bg-neutral-950/40 relative overflow-y-auto \${id === 'search' ? 'max-h-60' : id === 'zones' || id === 'available' || id === 'agent' ? 'max-h-64' : 'max-h-56'}\`}>
                    
                    {id === 'actions' && (
                      <ActionButton onClick={() => setShowAddNode(true)} variant="emerald" className="w-full uppercase font-bold tracking-wider cursor-pointer py-2 text-xs">
                        + Добавить новую задачу
                      </ActionButton>
                    )}

                    {id === 'search' && (
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Поиск узлов по названию или ID..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          onFocus={() => setIsSearchFocused(true)}
                          onBlur={() => { saveToHistory(searchQuery); setTimeout(() => setIsSearchFocused(false), 200); }}
                          onKeyDown={e => {
                            if (e.key === 'ArrowDown') { e.preventDefault(); if (!filteredHistory.length) return; setSelectedHistoryIndex(prev => (prev < filteredHistory.length - 1 ? prev + 1 : 0)); }
                            else if (e.key === 'ArrowUp') { e.preventDefault(); if (!filteredHistory.length) return; setSelectedHistoryIndex(prev => (prev > 0 ? prev - 1 : filteredHistory.length - 1)); }
                            else if (e.key === 'Enter') {
                              e.preventDefault();
                              if (selectedHistoryIndex >= 0 && selectedHistoryIndex < filteredHistory.length) {
                                setSearchQuery(filteredHistory[selectedHistoryIndex]);
                                setIsSearchFocused(false);
                                return;
                              }
                              saveToHistory(searchQuery);
                            }
                          }}
                          className="w-full bg-[#050810] border border-cyan-900/60 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                        />
                        
                        {isSearchFocused && filteredHistory.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-[#050810] border border-cyan-900/80 rounded-md shadow-2xl z-50 py-1 max-h-48 overflow-y-auto">
                            {filteredHistory.map((query, index) => (
                              <button
                                key={query}
                                type="button"
                                className={\`w-full text-left px-3 py-1.5 text-xs font-mono cursor-pointer flex items-center justify-between \${index === selectedHistoryIndex ? 'bg-cyan-950 text-cyan-300' : 'text-slate-400 hover:bg-neutral-900 hover:text-slate-200'}\`}
                                onMouseDown={(e) => { e.preventDefault(); setSearchQuery(query); setIsSearchFocused(false); saveToHistory(query); }}
                              >
                                <span>{query}</span>
                                <span className="opacity-50 text-[10px]">История</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {id === 'zones' && (
                      <div className="space-y-1">
                        {map.zones.map(z => (
                          <label key={z.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-neutral-800/40 rounded cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={!hiddenZones.has(z.id)}
                              onChange={(e) => {
                                setHiddenZones(prev => {
                                  const next = new Set(prev);
                                  if (e.target.checked) next.delete(z.id);
                                  else next.add(z.id);
                                  return next;
                                });
                              }}
                              className="w-3.5 h-3.5 rounded border-neutral-600 bg-neutral-900 checked:bg-cyan-500 cursor-pointer"
                            />
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getZoneColor(z.id) }} />
                            <span className="text-xs text-slate-300 group-hover:text-slate-100 font-medium truncate flex-1">{z.name}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {id === 'available' && (
                      <div className="space-y-1">
                        {availableNodes.map(node => (
                          <button
                            key={node.id}
                            type="button"
                            onClick={() => setSelectedNodeId(node.id)}
                            className={\`w-full text-left px-2 py-2 rounded text-xs transition-colors cursor-pointer border \${selectedNodeId === node.id ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300' : 'bg-transparent border-transparent hover:bg-neutral-800/40 text-slate-300 hover:text-slate-100'}\`}
                          >
                            <div className="font-bold truncate">{node.title}</div>
                            {node.economic?.marketGain && (
                              <div className="text-[10px] text-emerald-500/70 font-mono mt-0.5">
                                Ценность: {formatCurrency(node.economic.marketGain)}
                              </div>
                            )}
                          </button>
                        ))}
                        {availableNodes.length === 0 && (
                          <div className="text-xs text-slate-500 text-center py-4 italic">
                            Все узлы заблокированы или решены
                          </div>
                        )}
                      </div>
                    )}

                    {id === 'agent' && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Нейросеть (Gemini)</label>
                          <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value as LLMModelName)}
                            className="w-full bg-[#050810] border border-cyan-900/40 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                          >
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast)</option>
                            <option value="gemini-2.5-pro">Gemini 2.5 Pro (Smart)</option>
                          </select>
                        </div>
                        <div className="pt-2 border-t border-neutral-800/40 flex items-center justify-between">
                          <span className="text-xs text-slate-300">Telegram Агент</span>
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/60">
                            АКТИВЕН
                          </span>
                        </div>
                      </div>
                    )}

                    {id === 'persistence' && (
                      <div className="space-y-2.5">
                        <ActionButton
                          onClick={() => { void map.saveNow(); }}
                          variant="cyan"
                          className="w-full cursor-pointer py-2 text-xs"
                        >
                          💾 Сохранить в IndexedDB
                        </ActionButton>
                        <ActionButton
                          onClick={() => map.downloadJson()}
                          variant="neutral"
                          className="w-full cursor-pointer py-2 text-xs"
                        >
                          📥 Скачать .json
                        </ActionButton>
                        <ActionButton
                          onClick={() => { if (window.confirm('Сбросить карту?')) void map.resetMap(); }}
                          variant="red"
                          className="w-full cursor-pointer py-2 text-xs"
                        >
                          ⚠️ Сброс карты
                        </ActionButton>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
`;

code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
fs.writeFileSync(path, code);
console.log("Replaced successfully!");
