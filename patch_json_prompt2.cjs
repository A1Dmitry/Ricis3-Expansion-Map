const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

const regex = /const handleGenerateJSON = \(\) => \{[\s\S]*?setTimeout\(\(\) => setJsonMsg\(null\), 3000\);\n    \} catch \(e\) \{/m;

const newHandleJSON = `const handleGenerateJSON = () => {
    if (!selectedNodeId) return;
    try {
      const nodes = expandToRoot(map, selectedNodeId);
      
      const payload = {
        _instruction: "Это контекстный промпт, описывающий логическую цепь решения проблемы до корневых узлов в системе RICIS-III. Выведены полные доказательства и шаги решения, координаты графа исключены.",
        target_problem_id: selectedNodeId,
        target_problem_title: map.nodes.find(n => n.id === selectedNodeId)?.title,
        resolution_chain: nodes.map(n => {
          const proof = map.proofs[n.id];
          return {
            id: n.id,
            title: n.title,
            zone: map.zones.find(z => n.zoneIds.includes(z.id))?.name || n.zoneIds[0],
            description: n.description,
            target_function: n.targetFunction,
            singularity_hint: n.singularityHint,
            state: n.state,
            economic_valuation: n.economic?.marketGain,
            proof: proof ? {
              final_result: proof.finalResult,
              steps: proof.steps.map(s => \`[Phase \${s.phase}] \${s.name} | \${s.action} => \${s.expression}\`),
              latex_math: proof.latex
            } : null
          };
        })
      };
      
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`ricis-ai-prompt-\${selectedNodeId}.json\`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setJsonMsg('Промпт скачан');
      setTimeout(() => setJsonMsg(null), 3000);
    } catch (e) {`;

if (code.match(regex)) {
  code = code.replace(regex, newHandleJSON);
  fs.writeFileSync('src/ui/Map3D.tsx', code);
  console.log('JSON export updated to prompt format');
} else {
  console.log('Regex failed');
}
