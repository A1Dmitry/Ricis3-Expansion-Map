const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

if (!code.includes('const [isNodeExpanded, setIsNodeExpanded] = useState(false);')) {
  code = code.replace(
    'const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);',
    'const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);\n  const [isNodeExpanded, setIsNodeExpanded] = useState(false);'
  );
}

// when node changes, we can reset or keep it, probably keep it or reset
code = code.replace(
  '<button onClick={() => setSelectedNodeId(null)} className="text-neutral-500 hover:text-white ml-3">✕</button>',
  `<button onClick={() => setIsNodeExpanded(!isNodeExpanded)} className="text-neutral-500 hover:text-cyan-400 ml-3" title="Expand/Collapse">
                    {isNodeExpanded ? '▶' : '◀'}
                  </button>
                  <button onClick={() => setSelectedNodeId(null)} className="text-neutral-500 hover:text-white ml-3">✕</button>`
);

code = code.replace(
  'w-80 bg-black/80 backdrop-blur-md border border-cyan-500/30 rounded-lg p-5 shadow-2xl pointer-events-auto max-h-[90%] overflow-y-auto',
  `\${isNodeExpanded ? 'w-[500px]' : 'w-80'} bg-black/80 backdrop-blur-md border border-cyan-500/30 rounded-lg p-5 shadow-2xl pointer-events-auto max-h-[90%] overflow-y-auto transition-all duration-300`
);

// expand text limit
code = code.replace(
  '<p className="text-[11px] text-gray-400 leading-relaxed mb-3">{selectedNode.description}</p>',
  `<p className={\`text-[11px] text-gray-400 leading-relaxed mb-3 \${!isNodeExpanded && 'line-clamp-4'}\`}>{selectedNode.description}</p>`
);

fs.writeFileSync('src/ui/Map3D.tsx', code);
console.log('Patched Map3D.tsx for expand button');
