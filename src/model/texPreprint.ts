import { MapState, ProblemNode, Proof, Axiom } from './types';
import { isRicisCore } from './access';
import { LEAN_SPEC_URL } from './ricisCoreRules';
import { APP_VERSION, APP_BUILD_LABEL } from '../version';
import {
  escText,
  escPath,
  sanitizeLabel,
  isUnsafeProofLatex,
  buildStructuralProofLatex,
  repairAgentLatex,
} from './latexGuard';

export type TexBridgeMode = 'ricis_pure' | 'classical_bridges';

export type TexPreprintOptions = {
  mode: TexBridgeMode;
  rootId?: string;
};

function parentsOf(node: ProblemNode, map: MapState): string[] {
  const fromDeps = node.dependencyIds || [];
  const fromEdges = map.edges.filter(e => e.toId === node.id).map(e => e.fromId);
  return Array.from(new Set([...fromDeps, ...fromEdges]));
}

export function expandToRoot(map: MapState, selectedId: string): ProblemNode[] {
  const byId = new Map(map.nodes.map(n => [n.id, n]));
  if (!byId.has(selectedId)) return [];
  const needed = new Set<string>();
  const stack = [selectedId];
  while (stack.length) {
    const id = stack.pop()!;
    if (needed.has(id)) continue;
    needed.add(id);
    const n = byId.get(id);
    if (!n) continue;
    for (const p of parentsOf(n, map)) stack.push(p);
  }
  const indeg = new Map<string, number>();
  for (const id of needed) indeg.set(id, 0);
  for (const id of needed) {
    const n = byId.get(id)!;
    for (const p of parentsOf(n, map)) {
      if (needed.has(p)) indeg.set(id, (indeg.get(id) || 0) + 1);
    }
  }
  const queue = [...needed].filter(id => (indeg.get(id) || 0) === 0);
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const n of map.nodes) {
      if (!needed.has(n.id)) continue;
      if (parentsOf(n, map).includes(id)) {
        const d = (indeg.get(n.id) || 1) - 1;
        indeg.set(n.id, d);
        if (d === 0) queue.push(n.id);
      }
    }
  }
  for (const id of needed) {
    if (!order.includes(id)) order.push(id);
  }
  return order.map(id => byId.get(id)!).filter(Boolean);
}

function modeTitle(mode: TexBridgeMode): string {
  return mode === 'ricis_pure'
    ? 'RICIS-pure (no classical limits)'
    : 'RICIS + classical bridges';
}

function modeAbstract(mode: TexBridgeMode): string {
  if (mode === 'ricis_pure') {
    return (
      'This preprint expands the selected singularity node to the graph roots along dependency edges. ' +
      'All reductions follow RICIS-III only: L0/L1, SP2, SP3, SP4, A1--A6. ' +
      "Classical limit processes and L'H\\^{o}pital-type bridges are excluded."
    );
  }
  return (
    'This preprint expands the selected singularity node to the graph roots. ' +
    'Primary reductions follow RICIS-III. Classical intermediates are allowed only as explicit bridges ' +
    'with re-indexing to $0_F$ / $\\infty_F$ so provenance is preserved.'
  );
}

function safeProofBody(node: ProblemNode, proof: Proof | undefined): string {
  // Old IndexedDB proofs often embed \\section* and $$ — unsafe under \\subsection.
  if (!proof || isUnsafeProofLatex(proof.latex)) {
    return buildStructuralProofLatex(
      node.title,
      node.targetFunction,
      node.id,
      proof?.steps
    );
  }
  const repaired = repairAgentLatex(proof.latex);
  if (isUnsafeProofLatex(repaired) || !repaired.trim()) {
    return buildStructuralProofLatex(node.title, node.targetFunction, node.id, proof.steps);
  }
  return repaired;
}

function sectionForNode(
  node: ProblemNode,
  map: MapState,
  mode: TexBridgeMode,
  index: number
): string {
  const proof: Proof | undefined = map.proofs[node.id];
  const axioms: Axiom[] = map.axioms.filter(a => a.sourceNodeId === node.id);
  const parentTitles = parentsOf(node, map)
    .map(id => map.nodes.find(n => n.id === id)?.title || id)
    .map(escText);
  const lab = sanitizeLabel(node.id);

  const lines: string[] = [];
  lines.push(`\\subsection{N${index}: ${escText(node.title)}}`);
  lines.push(`\\label{sec:${lab}}`);
  lines.push(`\\textbf{ID:} ${escPath(node.id)}\\quad`);
  lines.push(`\\textbf{State:} ${escText(node.state)}\\quad`);
  lines.push(`\\textbf{Depth:} ${node.fractalDepth}`);
  if (isRicisCore(node)) lines.push(`\\quad\\textbf{RICIS core}`);
  lines.push('');
  lines.push('\\paragraph{Target function.}');
  lines.push(`\\begin{quote}\\small ${escPath(node.targetFunction)}\\end{quote}`);
  lines.push('');
  lines.push('\\paragraph{Description.}');
  lines.push(escText(node.description || '---'));
  if (node.singularityHint) {
    lines.push('');
    lines.push('\\paragraph{Singularity hint.}');
    lines.push(escText(node.singularityHint));
  }
  if (parentTitles.length) {
    lines.push('');
    lines.push('\\paragraph{Dependencies (toward root).}');
    lines.push('\\begin{itemize}');
    for (const t of parentTitles) lines.push(`  \\item ${t}`);
    lines.push('\\end{itemize}');
  }

  lines.push('');
  if (mode === 'ricis_pure') {
    lines.push('\\paragraph{Reduction mode: RICIS-pure.}');
    lines.push(
      'Apply SP2 algebraic cancellation first; then SP3 $0_F/0_G = F/G$; never replace with classical $\\lim$ without indexing.'
    );
  } else {
    lines.push('\\paragraph{Reduction mode: classical bridges allowed.}');
    lines.push(
      'Classical intermediate (e.g. $\\lim_{x\\to a}$) only as an explicit bridge, then re-index under RICIS ($0_F$, $\\infty_F$).'
    );
  }

  lines.push('');
  lines.push('\\paragraph{Formal proof.}');
  if (proof && isUnsafeProofLatex(proof.latex)) {
    lines.push(
      '\\textit{Stored proof replaced by structural offline form (unsafe or invalid LaTeX).}'
    );
    lines.push('');
  }
  lines.push(safeProofBody(node, proof));

  if (axioms.length) {
    lines.push('');
    lines.push('\\paragraph{Extracted axioms.}');
    lines.push('\\begin{itemize}');
    for (const a of axioms) {
      lines.push(`  \\item ${escPath(a.id)}: ${escText(a.formalStatement)}`);
    }
    lines.push('\\end{itemize}');
  }

  return lines.join('\n');
}

export function buildTexPreprint(
  map: MapState,
  selectedId: string,
  options: TexPreprintOptions
): string {
  const mode = options.mode;
  const chain = expandToRoot(map, selectedId);
  const selected = map.nodes.find(n => n.id === selectedId);
  const title = selected?.title || selectedId;
  const date = new Date().toISOString().slice(0, 10);

  const roots = chain.filter(n => parentsOf(n, map).length === 0);
  const rootNote =
    roots.length > 0 ? roots.map(r => r.title).join('; ') : 'graph roots';

  const header = `\\documentclass[11pt,a4paper]{article}
\\usepackage[T2A,T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage[russian,english]{babel}
\\usepackage[margin=2.2cm]{geometry}
\\usepackage{amsmath,amssymb,amsthm}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{lmodern}

\\hypersetup{unicode=true,pdftitle={RICIS-III Preprint},pdfauthor={RICIS3-Expansion}}

\\title{RICIS-III Preprint Expansion\\\\[0.4em]
\\large ${escText(title)}}
\\author{Generated by RICIS3-Expansion ${escText(APP_BUILD_LABEL)}}
\\date{${date}}

\\begin{document}
\\maketitle

\\begin{abstract}
${modeAbstract(mode)}
Selected node: \\textbf{${escText(title)}} (${escPath(selectedId)}).
Chain length: ${chain.length} nodes to root(s): ${escText(rootNote)}.
Mode: \\emph{${escText(modeTitle(mode))}}.
\\end{abstract}

\\tableofcontents
\\newpage

\\section{Meta}
\\begin{itemize}
  \\item Application: RICIS-III Singularity Map
  \\item Version: ${escText(APP_VERSION)}
  \\item Bridge mode: \\texttt{${escText(mode)}}
  \\item Expansion: dependency closure to graph roots (edges + dependencyIds)
\\end{itemize}

\\section{Bridge policy}
`;

  const policy =
    mode === 'ricis_pure'
      ? `In \\textbf{ricis\\_pure} mode every singularity is handled by indexed zeros and infinities.
Classical $\\lim$ is not a proof step. Identity L1 and continuity L0 are laws, not numerical checks.
`
      : `In \\textbf{classical\\_bridges} mode a classical intermediate may appear only as an explicit bridge:
\\begin{enumerate}
  \\item State the classical step (limit, series, L'H\\^{o}pital, blow-up).
  \\item Re-index the outcome under RICIS ($0_F$, $\\infty_F$) with provenance.
  \\item Continue with SP2--SP4 so the bridge cannot erase identity.
\\end{enumerate}
`;

  const sections = chain
    .map((n, i) => sectionForNode(n, map, mode, i + 1))
    .join('\n\n');

  const closing = `
\\section{Closure}
The expansion above lists every ancestor of the selected node up to the graph root(s).
Downstream dependents are omitted; regenerate from a child node to include a longer branch.

\\noindent\\footnotesize
Generated automatically by RICIS3-Expansion. Lean 4 software record: \\href{${LEAN_SPEC_URL}}{${LEAN_SPEC_URL}} (RICIS-III-Lean4-Kernel). Figshare Archives: \\href{https://doi.org/10.6084/m9.figshare.29876066}{10.6084/m9.figshare.29876066}, \\href{https://doi.org/10.6084/m9.figshare.30666089}{10.6084/m9.figshare.30666089}.
\\end{document}
`;

  return (
    header +
    policy +
    '\n\\section{Expanded dependency chain (root $\\rightarrow$ selected)}\n\n' +
    sections +
    closing
  );
}

export function downloadTexPreprint(
  map: MapState,
  selectedId: string,
  options: TexPreprintOptions
): { filename: string; nodeCount: number } {
  const tex = buildTexPreprint(map, selectedId, options);
  const chain = expandToRoot(map, selectedId);
  const modeTag = options.mode === 'ricis_pure' ? 'ricis' : 'classical';
  const filename = `ricis3-preprint-${sanitizeLabel(selectedId).slice(0, 24)}-${modeTag}-${new Date()
    .toISOString()
    .slice(0, 10)}.tex`;
  const blob = new Blob([tex], { type: 'application/x-tex;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return { filename, nodeCount: chain.length };
}
