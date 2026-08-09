const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

// 1. Add expandToRoot import
code = code.replace(
  "import { downloadTexPreprint, type TexBridgeMode } from '../model/texPreprint';",
  "import { downloadTexPreprint, type TexBridgeMode, expandToRoot } from '../model/texPreprint';"
);

// 2. Add handleGenerateJSON logic
const texMsgRegex = /const \[texMsg, setTexMsg\] = useState<string \| null>\(null\);/;
code = code.replace(
  texMsgRegex,
  "const [texMsg, setTexMsg] = useState<string | null>(null);\n  const [jsonMsg, setJsonMsg] = useState<string | null>(null);"
);

const handleGenerateTexRegex = /const handleGenerateTex = \(\) => {[\s\S]*?};\n/m;
const handleGenerateTexBlock = code.match(handleGenerateTexRegex)[0];

const handleGenerateJSON = `
  const handleGenerateJSON = () => {
    if (!selectedNodeId) return;
    try {
      const nodes = expandToRoot(map, selectedNodeId);
      const allIds = new Set(nodes.map(n => n.id));
      const edges = map.edges.filter(e => allIds.has(e.fromId) && allIds.has(e.toId));
      const zones = map.zones.filter(z => nodes.some(n => n.zoneIds.includes(z.id)));
      
      const payload = {
        meta: {
          app: "RICIS-III",
          build: APP_BUILD_LABEL,
          generatedAt: new Date().toISOString(),
          targetNodeId: selectedNodeId
        },
        zones,
        nodes,
        edges
      };
      
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`ricis-ai-context-\${selectedNodeId}.json\`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setJsonMsg('JSON скачан');
      setTimeout(() => setJsonMsg(null), 3000);
    } catch (e) {
      setJsonMsg('Ошибка генерации JSON');
      setTimeout(() => setJsonMsg(null), 3000);
    }
  };
`;

code = code.replace(handleGenerateTexBlock, handleGenerateTexBlock + handleGenerateJSON);

fs.writeFileSync('src/ui/Map3D.tsx', code);
console.log('JSON export logic added');
