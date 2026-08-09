const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

const breadcrumbOld = `<div className="text-[9px] font-mono text-cyan-500/80 mb-3 flex flex-wrap items-center gap-1">
                <span className="text-gray-500">{map.zones.find(z => z.id === selectedNode.zoneIds[0])?.name || 'Zone'}</span>
                <span className="text-gray-600">/</span>
                <span className="text-cyan-400 font-bold">{selectedNode.title}</span>
              </div>`;

const breadcrumbNew = `{(() => {
                const parents = map.nodes.filter(n => selectedNode.dependencyIds.includes(n.id));
                return (
                  <div className="text-[9px] font-mono text-cyan-500/80 mb-3 flex flex-wrap items-center gap-1">
                    <span className="text-gray-500">{map.zones.find(z => z.id === selectedNode.zoneIds[0])?.name || 'Zone'}</span>
                    <span className="text-gray-600">/</span>
                    {parents.length > 0 ? (
                      <>
                        <span className="flex gap-1 flex-wrap">
                          {parents.map((p, idx) => (
                            <React.Fragment key={p.id}>
                              <button type="button" onClick={() => setSelectedNodeId(p.id)} className="hover:text-cyan-300 transition-colors underline decoration-cyan-900/50 underline-offset-2">{p.title}</button>
                              {idx < parents.length - 1 && <span className="text-gray-600">,</span>}
                            </React.Fragment>
                          ))}
                        </span>
                        <span className="text-gray-600">/</span>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-500">RICIS Core</span>
                        <span className="text-gray-600">/</span>
                      </>
                    )}
                    <span className="text-cyan-400 font-bold">{selectedNode.title}</span>
                  </div>
                );
              })()}`;

code = code.replace(breadcrumbOld, breadcrumbNew);

// Since React might not be explicitly imported if not used as React.Fragment,
// let's replace React.Fragment with just <React.Fragment> or <Fragment> if it fails.
// I'll just use a fragment <key> wrapper if it's simpler? No, just replace React.Fragment with standard tag, but React is probably in scope.

fs.writeFileSync('src/ui/Map3D.tsx', code);
console.log('Patched breadcrumb');
