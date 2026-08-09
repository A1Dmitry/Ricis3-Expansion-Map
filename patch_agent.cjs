const fs = require('fs');
let code = fs.readFileSync('src/model/agent.ts', 'utf-8');

code = code.replace(
  `): Promise<{ nodes: ProblemNode[]; edges: DependencyEdge[] }> {`,
  `): Promise<{ nodes: ProblemNode[]; edges: DependencyEdge[]; error?: string }> {`
);

code = code.replace(
  `if (!anchor) return { nodes: [], edges: [] };`,
  `if (!anchor) return { nodes: [], edges: [] };`
);

const discoverBlock = `  try {
    const res = await fetch('/api/discoverTasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentNode: anchor, existingTitles }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { nodes: [], edges: [], error: data.error || 'Unknown server error' };
    }
    if (data.tasks && Array.isArray(data.tasks)) {
      fetchedTasks = data.tasks;
    }
  } catch (e: any) {
    console.error('Failed to discover tasks via API', e);
    return { nodes: [], edges: [], error: e.message };
  }`;

code = code.replace(/  try \{\n    const res = await fetch\('\/api\/discoverTasks'[\s\S]*?console\.error\('Failed to discover tasks via API', e\);\n  \}/, discoverBlock);

code = code.replace(
  `  return { nodes, edges };`,
  `  return { nodes, edges };`
);

const typeBlock = `export type DiscoveryReport = {
  map: MapState;
  added: number;
  expandedAnchors: string[];
  skippedDuplicates: number;
  frontierSize: number;
  error?: string;
};`;
code = code.replace(/export type DiscoveryReport = \{[\s\S]*?frontierSize: number;\n\};/, typeBlock);

const applyBlock = `    const { nodes, edges, error } = await discoverNewProblems(
      working,
      anchor.id,
      maxNewPerAnchor,
      keys
    );
    if (error) {
      return {
        map: working,
        added,
        expandedAnchors,
        skippedDuplicates,
        frontierSize: nodesWithoutLeaves(map).length,
        error
      };
    }`;
code = code.replace(/    const { nodes, edges } = await discoverNewProblems\([\s\S]*?keys\n    \);/, applyBlock);

fs.writeFileSync('src/model/agent.ts', code);
console.log('Patched agent.ts');
