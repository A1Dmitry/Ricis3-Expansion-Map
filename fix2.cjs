const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

const search = `                return (
                  <div className="text-[10px] font-mono text-cyan-500/80 mb-1.5 flex flex-wrap items-center gap-1">
                    <span className="text-gray-500">{map.zones.find(z => z.id === selectedNode.zoneIds[0])?.name || 'Zone'}</span>
                    <span className="text-gray-600">/</span>
                    {parents.length > 0 ? (
                      <>
                        <span className="flex gap-1 flex-wrap">
                          {parents.map((p, idx) => (
                            <span key={p.id}>
                              <button type="button" onClick={() => setSelectedNodeId(p.id)} className="hover:text-cyan-300 transition-colors underline decoration-cyan-900/50 underline-offset-2">{p.title}</button>
                              {idx < parents.length - 1 && <span className="text-gray-600">,</span>}
                            </span>
                          ))}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-500">RICIS Core</span>
                      </>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-slate-100 tracking-tight leading-tight mb-3">
                    {selectedNode.title}
                  </h2>
                </div>
              );
            })()}`;

const replace = `                return (
                  <div>
                    <div className="text-[10px] font-mono text-cyan-500/80 mb-1.5 flex flex-wrap items-center gap-1">
                      <span className="text-gray-500">{map.zones.find(z => z.id === selectedNode.zoneIds[0])?.name || 'Zone'}</span>
                      <span className="text-gray-600">/</span>
                      {parents.length > 0 ? (
                        <>
                          <span className="flex gap-1 flex-wrap">
                            {parents.map((p, idx) => (
                              <span key={p.id}>
                                <button type="button" onClick={() => setSelectedNodeId(p.id)} className="hover:text-cyan-300 transition-colors underline decoration-cyan-900/50 underline-offset-2">{p.title}</button>
                                {idx < parents.length - 1 && <span className="text-gray-600">,</span>}
                              </span>
                            ))}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-500">RICIS Core</span>
                        </>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-slate-100 tracking-tight leading-tight mb-3">
                      {selectedNode.title}
                    </h2>
                  </div>
                );
              })()}`;

code = code.replace(search, replace);
fs.writeFileSync('src/ui/Map3D.tsx', code);
