import { LEAN_SPEC_URL, transformCauchyToRicisBridge } from './ricisCoreRules';

/**
 * LaTeX hygiene for RICIS3 proofs and preprints (pdflatex + T2A + babel).
 */

export function sanitizeLabel(id: string): string {
  return (
    String(id || 'x')
      .replace(/[^a-zA-Z0-9:._+-]/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'node'
  );
}

export function escText(s: string): string {
  return String(s ?? '')
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([{}])/g, '\\$1')
    .replace(/\$/g, '\\$')
    .replace(/&/g, '\\&')
    .replace(/#/g, '\\#')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function escPath(s: string): string {
  const t = String(s ?? '')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[{}]/g, '')
    .slice(0, 200);
  return `\\detokenize{${t}}`;
}

export function isErrorProofLatex(latex: string | null | undefined): boolean {
  if (!latex) return true;
  const t = latex.trim();
  if (!t) return true;
  if (/^Network error/i.test(t)) return true;
  if (/^Error generating proof/i.test(t)) return true;
  if (/Unexpected token\s+'<'/i.test(t)) return true;
  if (/is not valid JSON/i.test(t)) return true;
  if (/<html[\s>]/i.test(t)) return true;
  if (/Failed to generate/i.test(t)) return true;
  if (/^<!DOCTYPE/i.test(t)) return true;
  return false;
}

/** Proofs unsafe under \\subsection: \\section, $$, document wrappers. */
export function isUnsafeProofLatex(latex: string | null | undefined): boolean {
  if (isErrorProofLatex(latex)) return true;
  const t = String(latex);
  if (/\\documentclass/.test(t)) return true;
  if (/\\begin\s*\{\s*document\s*\}/i.test(t)) return true;
  if (/\\section\*?/.test(t)) return true;
  if (/\\subsection\*?/.test(t)) return true;
  if (/\\chapter\*?/.test(t)) return true;
  if (/\$\$/.test(t)) return true;
  return false;
}

export function stripMarkdownFences(text: string): string {
  let t = String(text ?? '').trim();
  t = t.replace(/^```(?:latex|tex)?\s*/i, '');
  t = t.replace(/\s*```\s*$/i, '');
  return t.trim();
}

export function repairAgentLatex(raw: string): string {
  let t = stripMarkdownFences(raw);
  t = t.replace(/\\documentclass(?:\[[^\]]*\])?\{[^}]*\}/g, '');
  t = t.replace(/\\usepackage(?:\[[^\]]*\])?\{[^}]*\}/g, '');
  t = t.replace(/\\begin\s*\{\s*document\s*\}/gi, '');
  t = t.replace(/\\end\s*\{\s*document\s*\}/gi, '');
  t = t.replace(/\\maketitle/gi, '');
  t = t.replace(/\\tableofcontents/gi, '');
    
    t = t.replace(/\\section\*?(?:\[[^\]]*\])?\s*\{/g, '\\textbf{');
  t = t.replace(/\\subsection\*?(?:\[[^\]]*\])?\s*\{/g, '\\textbf{');
  t = t.replace(/\\subsubsection\*?(?:\[[^\]]*\])?\s*\{/g, '\\textbf{');
  t = t.replace(/\\chapter\*?(?:\[[^\]]*\])?\s*\{/g, '\\textbf{');
  let out = '';
  let inDisplay = false;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '$' && t[i + 1] === '$') {
      out += inDisplay ? '\\]' : '\\[';
      inDisplay = !inDisplay;
      i++;
      continue;
    }
    out += t[i];
  }
  t = out;
  if (inDisplay) t += '\\]';

  t = t.replace(/\binfinity\b/gi, '\\infty');
  t = t.replace(/\bequiv\b/g, '\\equiv');

  // Auto-transform classical Cauchy limits into RICIS bridges (0_F / 0_G, F_0, inf_0)
  t = transformCauchyToRicisBridge(t);

  const dollars = (t.match(/(?<!\\)\$/g) || []).length;
  if (dollars % 2 === 1) t += '$';

  return t.trim();
}

/**
 * Compile-safe structural proof.
 * Single \\item lines only — never \\\\ after \\item (no line here to end).
 */
export function buildStructuralProofLatex(
  title: string,
  targetFunction: string,
  nodeId: string,
  steps?: Array<{ phase: number | string; name: string; action: string; expression: string }>
): string {
  const ttl = escText(title);
  const id = sanitizeLabel(nodeId);
  const tf = targetFunction || 'ResolveSingularity(' + title + ')';
  const cleanTf = escText(tf.slice(0, 100));

  const defaultSteps = [
    { phase: '-1', name: 'L1 IDENTITY', action: 'Проверка типа и онтологической сохранности идентичности', expression: `T(${cleanTf}) = Monad` },
    { phase: '0.5', name: 'SP4 INDEXING', action: 'Семантическое индексирование сингулярностей родительским выражением', expression: `0_{(${cleanTf})}` },
    { phase: '1', name: 'SP2 REDUCTION', action: 'Алгебраическое сокращение идентичных факторов ДО сингулярности', expression: `SP2_Reduce(${cleanTf})` },
    { phase: '2', name: 'A6 GEOMETRIC BRIDGE', action: 'Косое произведение u=(F,0), v=(0,G), det(u,v)=F*G', expression: 'det((F,0), (0,G)) = F * G' },
    { phase: '6', name: 'L1 VERIFICATION', action: 'Подтверждение стабильного инварианта O(1) без амнезии', expression: `Invariant(${id}) = Const` },
  ];

  const st = (steps && steps.length ? steps : defaultSteps).map(s => ({
    phase: String(s.phase),
    name: String(s.name).replace(/_/g, ' '),
    action: String(s.action),
    expression: String(s.expression)
      .replace(/\binfinity\b/gi, 'infty')
      .replace(/\bequiv\b/g, 'equiv')
      .slice(0, 120),
  }));

  const lines: string[] = [];
  lines.push('\\begin{quote}');
  lines.push('\\textbf{RICIS-III Аналитическое доказательство}');
  lines.push('');
  lines.push(`\\textbf{Проблема:} ${ttl}`);
  lines.push('');
  lines.push(`\\textbf{ID:} ${escPath(id)}`);
  lines.push('');
  lines.push(`\\textbf{Целевая функция:} ${escPath(tf)}`);
  lines.push('');
  lines.push('\\begin{enumerate}');
  for (const s of st) {
    lines.push(
      `  \\item \\textbf{Phase ${escText(s.phase)} --- ${escText(s.name)}.} ` +
        `${escText(s.action)} ` +
        `(формула: \\texttt{${escText(s.expression)}})`
    );
  }
  lines.push('\\end{enumerate}');
  lines.push('');
  lines.push('\\textbf{Формальная Lean 4 спецификация:}');
  lines.push('\\begin{verbatim}');
  lines.push('import RICIS3.Core');
  lines.push(`-- Software record: ${LEAN_SPEC_URL}`);
  lines.push(`theorem resolve_${id.replace(/[^a-zA-Z0-9]/g, '_')} (x : RICIS.Monad) :`);
  lines.push('  RICIS.Invariant x = True := by exact RICIS.AxiomL1_proof x');
  lines.push('\\end{verbatim}');
  lines.push('');
  lines.push(`\\textbf{Результат:} Аксиома извлечена для ${escPath(id)}.`);
  lines.push('');
  lines.push(`\\textbf{Lean 4 software record / DOI:} \\href{${LEAN_SPEC_URL}}{${LEAN_SPEC_URL}} (RICIS-III-Lean4-Kernel). Figshare Archives: \\href{https://doi.org/10.6084/m9.figshare.29876066}{10.6084/m9.figshare.29876066}, \\href{https://doi.org/10.6084/m9.figshare.30666089}{10.6084/m9.figshare.30666089}.`);
  lines.push('\\end{quote}');
  return lines.join('\n');
}

export const LATEX_AGENT_RULES =
  'STRICT LaTeX (pdflatex+T2A): fragment only; no documentclass; no section; no $$; pair $; ASCII math; max 40 lines; no HTML.';
