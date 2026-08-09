const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

if (!code.includes('import { AddNodeModal }')) {
  code = code.replace(
    `import { OrbitControls } from '@react-three/drei';`,
    `import { OrbitControls } from '@react-three/drei';\nimport { AddNodeModal } from './AddNodeModal';`
  );

  code = code.replace(
    `  const [showProof, setShowProof] = useState(false);`,
    `  const [showProof, setShowProof] = useState(false);\n  const [showAddNode, setShowAddNode] = useState(false);`
  );

  const addNodeButton = `
          <section>
            <button type="button" onClick={() => setShowAddNode(true)} className="w-full text-left px-2 py-2 text-[11px] font-bold uppercase tracking-wider rounded border border-emerald-800/50 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-700/60 mb-2">
              + Добавить Ноду
            </button>
          </section>
`;

  code = code.replace(
    `<aside className="w-64 border-r border-cyan-900/20 bg-[#070707] p-4 flex flex-col gap-5 shrink-0 z-10 overflow-y-auto">`,
    `<aside className="w-64 border-r border-cyan-900/20 bg-[#070707] p-4 flex flex-col gap-5 shrink-0 z-10 overflow-y-auto">` + addNodeButton
  );
  
  const modalRender = `
      {showAddNode && (
        <AddNodeModal onClose={() => setShowAddNode(false)} parentId={selectedNodeId || undefined} />
      )}
  `;

  code = code.replace(
    `      <footer className="h-8 border-t border-cyan-900/20 bg-black flex items-center px-4 shrink-0">`,
    modalRender + `      <footer className="h-8 border-t border-cyan-900/20 bg-black flex items-center px-4 shrink-0">`
  );

  fs.writeFileSync('src/ui/Map3D.tsx', code);
  console.log('Patched Map3D.tsx to include AddNodeModal');
}
