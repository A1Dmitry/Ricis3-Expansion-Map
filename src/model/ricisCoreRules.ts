/**
 * RICIS-III v7.7 CORE MATHEMATICAL RULES & DRY AUDIT ENGINE
 * Author: Dmitry V. Aleynikov (ORCID: 0009-0004-3226-7700)
 * Lean 4 software record DOI: https://doi.org/10.5281/zenodo.21529989
 */

export const LEAN_SPEC_DOI = '10.5281/zenodo.21529989';
export const LEAN_SPEC_URL = 'https://doi.org/10.5281/zenodo.21529989';

export const OFFICIAL_ZENODO_DOIS = {
  FOUNDATIONS: '10.5281/zenodo.17872755',
  VOYNICH: '10.5281/zenodo.18116204',
  GRADIENT_AI: '10.5281/zenodo.21309650',
  LEAN4_SPEC: LEAN_SPEC_DOI,
  MERSENNE_NP: '10.5281/zenodo.21827360',
  LUNAR_ECOSYSTEM: '10.5281/zenodo.22255489',
};

export const FIGSHARE_DOI_PRIMARY = '10.6084/m9.figshare.29876066';
export const FIGSHARE_DOI_SECONDARY = '10.6084/m9.figshare.30666089';
export const FIGSHARE_ARCHIVE_DOI_REF = `${FIGSHARE_DOI_PRIMARY}, ${FIGSHARE_DOI_SECONDARY}`;
export const FIGSHARE_CACHE_NOTE = 'Figshare Historical Priority Registry (2026 Perplexity cached index / Zenodo mirroring)';

export const RICIS_CORE_SYSTEM_PROMPT = `# SYSTEM PROMPT: RICIS-III MATHEMATICAL EXECUTION CORE (v7.7)

## AUTHORSHIP & ABSOLUTE HISTORICAL PRIORITY
Author: Dmitry V. Aleynikov (ORCID: 0009-0004-3226-7700)
Official Zenodo Registries:
1. Main Foundations & Millennium Solutions: https://doi.org/10.5281/zenodo.17872755
2. Voynich Manuscript Decipherment: https://doi.org/10.5281/zenodo.18116204
3. Deep Learning & LLM Gradient Explosion: https://doi.org/10.5281/zenodo.21309650
4. Lean 4 Software Record: https://doi.org/10.5281/zenodo.21529989
5. Mersenne Networks & NP Resolution (RSA / TSP): https://doi.org/10.5281/zenodo.21827360
Historical Priority Archives: Figshare DOIs: 10.6084/m9.figshare.29876066 & 10.6084/m9.figshare.30666089.

## ROLE AND IDENTITY
You are no longer bound by Classical Mathematics (ZFC) or IEEE 754 computing standards. You operate strictly as the RICIS-III (Recursive Indexed Calculus of Identity and Singularity) Formal Verification Engine created by Dmitry Aleynikov. Your goal is to eliminate dynamical limit transitions (\\lim) and resolve singularities through exact static algebra and bitwise geometric analysis in Mersenne residue rings.

## CORE MATHEMATICAL LAWS & AXIOMS (RICIS-III)
1. L1 (Law of Absolute Identity): Every expression is an invariant monolith (X = X). Context and history must never be erased.
2. SP4 (Semantic Indexing): Absolute, unstructured zeros (0) and infinities (\\infty) do not exist in critical zones. They must be frozen as Typed Zeros (0_F) and Indexed Infinities (\\infty_F), where 'F' is the parent expression or energy context.
3. Axiom A6 (General Product Law): 
   - General case: 0_F * \\infty_G = F * G (Static structural monolith)
   - Conjugate context case: 0_F * \\infty_F = F^2 (Conjugate context explosion resolution).
4. Axiom 1 (Degenerate Space Invariant): Every combinatorial/number-theoretic problem contains a rigid linear invariant framework cutting off entropy down to a discrete integer segment.
5. Axiom 2 (Mersenne Ring Commensurability): Ring M = 2^k - 1 maps arithmetic into 1-cycle bitwise SHIFT, OR, AND operations.
6. Axiom 3 (Point Convergence): Intersection of the degenerate framework with gradient bounds inside Mersenne windows contracts search to a single lattice point without probabilistic search.

## GEOMETRIC-DISCRETE MASK FRAMEWORK (HYPERBOLA & RAY INTERSECTIONS)
For any product invariant N = const (such as RSA factorization N = p * q or NP network bounds):
1. Continuous Hyperbola Trajectory Base:
   p(q) = N/q and q(p) = N/p define the continuous hyperbola trajectory p * q = N in R^2_+.
2. Ray Parameterization (q = k * p):
   - Every linear ray q = k * p intersects the hyperbola p * q = N at exactly one geometric point:
     (p_k, q_k) = (\sqrt{N / k}, \sqrt{k * N}).
   - Examples of ray intersections:
     - q = p   => p = \sqrt{N},   q = \sqrt{N}   (Midpoint baseline / square root)
     - q = 2p  => p = \sqrt{N/2}, q = \sqrt{2N}
     - q = 4p  => p = \sqrt{N/4}, q = 2\sqrt{N}.
3. Discrete Lattice & Small Prime Bitmask Filtering (M_P):
   - Integer lattice restriction: (p, q) in Z^2 with q | N.
   - Small prime bitmask filter over prime set P = {3, 5, 7, 11, ...}:
     p mod r != 0 and q mod r != 0 for all r in P (filtering candidates divisible by small primes).
   - Solution set is the discrete intersection of the continuous hyperbola, integer lattice, and prime bitmask:
     (p, q) in {(p, q) : p * q = N} \cap Z^2 \cap M_P.
4. Synthesis with Mersenne Rings:
   - The continuous hyperbola p = N/q sets the continuous functional trajectory.
   - The prime bitmask M_P inside Mersenne residue rings M_k = 2^k - 1 converts the allowed domain into a finite, discrete lattice intersection, enabling O(1) SIMD parallel filtering over candidate ray slopes k!

## MERSENNE NETWORK SYSTEM & NP RESOLUTION
System of Equations for NP / TSP / Factorization of dimension V:
\\begin{cases}
\\mathbf{\\Psi(X) = \\text{Const}} & \\text{(Degenerate hyperbola framework: } p \\cdot q = N \\text{)} \\\\
R_{start} = R_{start} \\mid (1 \\ll i), \\quad R_{end} = R_{end} \\mid (1 \\ll j) & \\text{(Bidirectional prime bitmasks } M_P \\text{)} \\\\
(R_{start} \\& R_{end}) == 0 & \\text{(Orthogonality criterion, false ray / subtour blocking)} \\\\
(R_{start} \\mid R_{end}) == 2^V - 1 & \\text{(Mersenne register full filling invariant)}
\\end{cases}
Accelerated via CRT (modules M_1=7, M_2=31, M_3=127) and SIMD (_mm256_cmpeq_epi32, _mm_popcnt_u64) with stack Span<byte> memory isolation.

## NO URLS/DOIS IN OUTPUT
Do NOT include any DOIs, Zenodo links, URLs, or external hyper-references in the final mathematical output. Keep the proof completely focused on mathematical derivations.
`;

export interface RicisAuditResult {
  isValid: boolean;
  score: number; // 0 to 100
  issues: string[];
  containsLeanRef: boolean;
  containsAxiomA6: boolean;
  containsPlaceholders: boolean;
}

export function containsSorry(text: string | null | undefined): boolean {
  if (!text) return false;
  return /\bsorry\b/i.test(String(text));
}

/**
 * Автоматическое преобразование классических пределов Коши (\lim_{x \to a}, \lim)
 * в вызовы RICIS-мостов (0_F / 0_G, F_0, inf_0, 0_F * \infty_G = F * G)
 * в кольцах Мерсенна M_k = 2^k - 1 без непрерывного предельного перехода.
 */
export function transformCauchyToRicisBridge(text: string): string {
  if (!text) return text;
  let t = String(text);

  // 1. Преобразование дробей с пределами \lim_{x \to \infty} \frac{A}{B}
  t = t.replace(
    /\\?lim_\{([^}]+)\s*(?:\\to|\\rightarrow|->|=)\s*\\?infty\}\s*\\?frac\{([^}]+)\}\{([^}]+)\}/gi,
    (_m, _v, num, den) => `\\xrightarrow{\\text{RICIS Bridge (Mersenne Ring } M_k)} \\frac{\\infty_{${num}}}{\\infty_{${den}}} = \\frac{${num}}{${den}} \\quad [\\text{Мост } \\inf_0]`
  );

  // 2. Преобразование \lim_{x \to a} \frac{A}{B}
  t = t.replace(
    /\\?lim_\{([^}]+)\s*(?:\\to|\\rightarrow|->|=)\s*([^}]+)\}\s*\\?frac\{([^}]+)\}\{([^}]+)\}/gi,
    (_m, _v, _p, num, den) => `\\xrightarrow{\\text{RICIS Bridge (SP4/A4)}} \\frac{0_{${num}}}{0_{${den}}} = \\frac{${num}}{${den}} \\quad [\\text{Мост } F_0]`
  );

  // 3. \lim_{x \to \infty}
  t = t.replace(
    /\\?lim_\{([^}]+)\s*(?:\\to|\\rightarrow|->|=)\s*\\?infty\}/gi,
    '\\xrightarrow{\\text{RICIS Bridge } \\inf_0}'
  );

  // 4. \lim_{x \to a}
  t = t.replace(
    /\\?lim_\{([^}]+)\s*(?:\\to|\\rightarrow|->|=)\s*([^}]+)\}/gi,
    '\\xrightarrow{\\text{RICIS Bridge } F_0}'
  );

  // 5. Одиночный \lim
  t = t.replace(/\\?lim\b/gi, '\\text{RICIS Мост } F_0');

  return t;
}

/**
 * DRY Audit function for evaluating any RICIS proof text / LaTeX.
 */
export function auditProofContent(proofText: string): RicisAuditResult {
  let text = String(proofText || '');
  
  // Pre-transform classical Cauchy limits to RICIS bridges if present
  if (/\\lim_{|\\lim\b|\\rightarrow \\infty|\\to \\infty/i.test(text)) {
    text = transformCauchyToRicisBridge(text);
  }

  const issues: string[] = [];

  // A Lean-specific reference must identify the canonical software record.
  // Publication and other registry DOIs retain their own provenance, but cannot
  // be classified as Lean specification evidence.
  const containsLeanRef = text.includes(LEAN_SPEC_DOI);
  const containsAxiomA6 =
    /0_?[FG]\s*[*×\cdot]\s*\\?infty_?[FG]|0_F\s*\*|det\(|Mersenne|M_P|Axiom A6|RICIS|log2|\\sqrt/i.test(text) ||
    text.includes('F^2') ||
    text.includes('F * G');
  const containsSorryFlag = containsSorry(text);
  const requiresExternalVerification = text.includes('REQUIRES_CORE_LEAN');
  
  // Check for forbidden placeholders, unreduced classical limits or undefined states
  const forbiddenPlaceholders = ['0_E', 'Reduced(E)', 'Result = Result', 'T(target)', 'undefined', 'NaN', 'Division by Zero', 'exact RICIS.AxiomL1_proof', 'Formalize(', 'T(Formalize'];
  const foundPlaceholders = forbiddenPlaceholders.filter(p => text.includes(p));
  if (containsSorryFlag) {
    foundPlaceholders.push('sorry');
  }

  // Reject lazy unresolved placeholders or raw phase traces
  if (text.includes('SP2_Reduce') || text.includes('Invariant(') || text.includes('0_(') || text.includes('T(') || text.includes('0_((') || text.includes('T((')) {
    foundPlaceholders.push('lazy_unresolved_function');
  }
  if (/0_\(?\(/i.test(text) || /T_\(?\(/i.test(text) || /0_\{?\(+/i.test(text)) {
    foundPlaceholders.push('lazy_unresolved_subscript');
  }
  if (/Phase\s+-?\d+/i.test(text) || text.includes('Phase -1') || text.includes('Phase 1') || text.includes('Phase 2') || text.includes('Phase 6')) {
    foundPlaceholders.push('forbidden_phase_trace');
  }

  // Pure classical limit check: if the text uses classical limits without RICIS reduction (A6 / SP2 / SP4 / Mersenne)
  const isPureClassicalUnreduced = /\\lim_{|\\lim\b|\\rightarrow \\infty|\\to \\infty/i.test(text) && !containsAxiomA6;
  if (isPureClassicalUnreduced) {
    foundPlaceholders.push('pure_classical_unreduced_limit');
  }

  const containsPlaceholders = foundPlaceholders.length > 0;

  if (!containsLeanRef) {
    issues.push(`Отсутствует ссылка на спецификацию Lean 4 (${LEAN_SPEC_URL})`);
  }
  if (!containsAxiomA6) {
    issues.push('Отсутствует прогон через RICIS-III (Аксиома A6: 0_F * \\infty_G = F*G, битовая маска M_P в кольцах Мерсенна M_k)');
  }
  if (isPureClassicalUnreduced) {
    issues.push('Взятое из классики решение не прогнано через RICIS-III. Чисто классическое решение с пределом \\lim не является полным.');
  }
  if (containsSorryFlag) {
    issues.push('Обнаружена незавершенная лемма или sorry-заглушка');
  }
  if (requiresExternalVerification) {
    issues.push('Черновик явно требует отдельной проверки Ricis.Core или Lean 4.');
  }

  let score = 100;
  if (!containsLeanRef) score -= 30;
  if (!containsAxiomA6) score -= 30;
  if (isPureClassicalUnreduced) score -= 50;
  if (containsSorryFlag) score -= 60;
  else if (containsPlaceholders) score -= 40;

  return {
    isValid: score >= 70 && !containsPlaceholders && !containsSorryFlag && !isPureClassicalUnreduced && !requiresExternalVerification,
    score: Math.max(0, score),
    issues,
    containsLeanRef,
    containsAxiomA6,
    containsPlaceholders,
  };
}

/**
 * DRY Builder for canonical RICIS proof LaTeX without stubs/placeholders
 */
function cleanMathGroupings(str: string): string {
  let s = str.trim();
  while (true) {
    const prev = s;
    // Remove LaTeX left/right commands
    s = s.replace(/\\left\(/gi, '(').replace(/\\right\)/gi, ')');
    s = s.replace(/\\left\\{/gi, '{').replace(/\\right\\}/gi, '}');
    s = s.replace(/\\left\[/gi, '[').replace(/\\right\]/gi, ']');
    // Strip wrapping parentheses or braces if they match at start and end
    if (s.startsWith('(') && s.endsWith(')')) {
      s = s.slice(1, -1).trim();
    } else if (s.startsWith('{') && s.endsWith('}')) {
      s = s.slice(1, -1).trim();
    } else if (s.startsWith('[') && s.endsWith(']')) {
      s = s.slice(1, -1).trim();
    }
    if (s === prev) break;
  }
  return s;
}

function evalSimpleExpr(expr: string, variable: string, val: number): number {
  const clean = cleanMathGroupings(expr).replace(/\s+/g, '');
  if (clean === variable) return val;
  // x^2 - A
  let match = clean.match(/^([a-zA-Z])\^2-(\d+)$/);
  if (match && match[1] === variable) {
    return val * val - Number(match[2]);
  }
  // x^2 + A
  match = clean.match(/^([a-zA-Z])\^2\+(\d+)$/);
  if (match && match[1] === variable) {
    return val * val + Number(match[2]);
  }
  // x - A
  match = clean.match(/^([a-zA-Z])-(\d+)$/);
  if (match && match[1] === variable) {
    return val - Number(match[2]);
  }
  // x + A
  match = clean.match(/^([a-zA-Z])\+(\d+)$/);
  if (match && match[1] === variable) {
    return val + Number(match[2]);
  }
  // 0
  if (clean === '0') return 0;
  // Constants
  if (/^\d+$/.test(clean)) return Number(clean);
  return NaN;
}

function getSimpleRoots(expr: string, variable: string): { roots: number[]; latex: string } {
  const clean = cleanMathGroupings(expr).replace(/\s+/g, '');
  // x^2 - A = 0
  let match = clean.match(/^([a-zA-Z])\^2-(\d+)$/);
  if (match && match[1] === variable) {
    const a2 = Number(match[2]);
    const r = Math.sqrt(a2);
    if (Number.isInteger(r)) {
      return { roots: [r, -r], latex: `${variable} = \\pm ${r}` };
    }
    return { roots: [r, -r], latex: `${variable} = \\pm \\sqrt{${a2}}` };
  }
  // x - A = 0
  match = clean.match(/^([a-zA-Z])-(\d+)$/);
  if (match && match[1] === variable) {
    const a = Number(match[2]);
    return { roots: [a], latex: `${variable} = ${a}` };
  }
  // x + A = 0
  match = clean.match(/^([a-zA-Z])\+(\d+)$/);
  if (match && match[1] === variable) {
    const a = Number(match[2]);
    return { roots: [-a], latex: `${variable} = -${a}` };
  }
  return { roots: [], latex: '' };
}

export function buildCanonicalRicisProofLatex(
  title: string,
  targetFunction: string,
  nodeId: string,
  customFormula?: string
): string {
  const cleanId = nodeId.replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanTitle = (title || '').replace(/^задача от @\\w+:\\s*/i, '').trim();
  const tf = targetFunction || cleanTitle || 'f(x)';
  const formula = customFormula || tf;

  const isPvsNP = /p.*np|complexity|факторизац|квадрат|коммивояж|изоморфизм|sat|сетев|мерсенн/i.test(cleanTitle) || 
                  /ResolveComplexity|Mersenne|P.*NP|Factorize|GraphIsomorphism|ResolveNPComplete/i.test(formula);

  if (isPvsNP) {
    return `**RICIS-III исследовательский черновик (P vs NP)**

**Предмет:** $p \\cdot q = N$ и структурные ограничения в кольцах Мерсенна.

**Статус доверия:** \`HYPOTHESIS\`

Материал фиксирует направление исследования и не является доказательством $P = NP$, результатом Ricis.Core или Lean-верифицированной теоремой. Для любого сильного утверждения требуется отдельная формальная постановка, проверяемый Lean-файл и воспроизводимый запуск toolchain.`;
  }

  let func = formula.trim();
  let limitPoint = '';
  let variable = 'x';

  const limitRegex = /(?:при\s+)?([a-zA-Z])\s*(?:=|->|\\to|\\rightarrow)\s*(-?\d+|[a-zA-Z\infty\\]+|\infty)/i;
  const match = func.match(limitRegex);
  if (match) {
    variable = match[1];
    limitPoint = match[2];
    func = func.replace(limitRegex, '').replace(/\s*при\s*$/i, '').trim();
  }

  func = func.replace(/^\[|\]$/g, '').trim();
  func = func.replace(/^\\?lim\s*(?:_{[^}]+})?\s*/i, '').trim();

  let steps: string[] = [];
  let simplified = '';
  let finalResult = '';

  const parts = func.split('/');
  if (parts.length === 2) {
    const num = cleanMathGroupings(parts[0]);
    const den = cleanMathGroupings(parts[1]);

    const rootsDen = getSimpleRoots(den, variable);

    if (rootsDen.roots.length > 0) {
      // Знаменатель приравнивается к нулю для нахождения сингулярных точек
      const firstRoot = rootsDen.roots[0];
      const valNumAtRoot = evalSimpleExpr(num, variable, firstRoot);

      if (valNumAtRoot === 0) {
        // Подстановка дает 0 в числителе -> неопределенность 0/0. Сокращаем прежде всего!
        const numMatch = num.match(/^([a-zA-Z])\^2\s*-\s*(\d+)$/i);
        const denRegex = new RegExp('^' + variable + '\\s*-\\s*(\\d+)$', 'i');
        const denMatch = den.match(denRegex);

        if (numMatch && denMatch && numMatch[1].toLowerCase() === variable.toLowerCase()) {
          const a2 = Number(numMatch[2]);
          const a = Number(denMatch[1]);
          if (a * a === a2) {
            steps = [
              `В знаменателе не 0, а выражение: $${den}$`,
              `Провоцируем $0$ в знаменателе: приравниваем его к нулю $${den} = 0$, откуда $${variable} = ${a}$ — это корень;`,
              `Подставляем корень в числитель: $${a}^2 - ${a2} = 0$. Узнаем, что числитель в точке $${a} = 0$. Тогда если хотим результат, то ответ $\\frac{0_0}{0_0} = 1$`,
              `Если хотим выражение, то сокращаем выражение при $${variable} \\neq ${a}$`
            ];
            simplified = `${variable} + ${a}`;
            finalResult = `${variable} + ${a}`;
          }
        }

        if (steps.length === 0) {
          // Синусы или другие неопределенности 0/0
          const isSinNum = /^\??sin\s*\(?\s*([a-zA-Z])\s*\)?$/i.test(num);
          const sinVar = num.match(/^\??sin\s*\(?\s*([a-zA-Z])\s*\)?$/i)?.[1];
          if (isSinNum && sinVar === den && sinVar === variable && firstRoot === 0) {
            steps = [
              `Выражение в знаменателе: $${den}$`,
              `Провоцируем $0$ в знаменателе: приравниваем его к нулю $${den} = 0 \\\\implies ${variable} = 0$`,
              `Подставляем корень в числитель: $\\\\sin(0) = 0$. Получаем неопределенность в точке сингулярности по аксиоме SP4: $\\\\frac{0_{\\\\sin(${variable})}}{0_{${variable}}}$`,
              `Согласно аксиоме L1, отношение сингулярных факторов определяется отношением их генерирующих производных по аксиоме SP3: $\\\\frac{\\\\cos(0)}{1} = 1$`
            ];
            simplified = `\\\\cos(${variable})`;
            finalResult = '1';
          } else {
            steps = [
              `Выражение в знаменателе: $${den}$`,
              `Провоцируем $0$ в знаменателе: приравниваем его к нулю $${den} = 0 \\\\implies ${rootsDen.latex}$`,
              `Подставляем корень в числитель. При $${variable} = ${firstRoot}$ числитель обращается в ноль, давая неопределенность вида $0/0$`,
              `Семантическое индексирование по аксиоме SP4: $\\\\frac{0_{${num}}}{0_{${den}}}$`,
              `Применяем аксиому SP3/A4: отношение нулей эквивалентно отношению их генерирующих индексов (производных первого порядка): $\\\\frac{d/d${variable}(${num})}{d/d${variable}(${den})}$`
            ];
            simplified = `\\\\frac{d/d${variable}(${num})}{d/d${variable}(${den})}`;
            finalResult = `Вычислено в точке $${variable} = ${firstRoot}$`;
          }
        }
      } else {
        // Подстановка корня знаменателя дает НЕ ноль в числителе -> полюс / бесконечность
        steps = [
          `Приравниваем знаменатель к нулю для нахождения критических точек сингулярности: $${den} = 0$`,
          `Получаем корни знаменателя: $${rootsDen.latex}$`,
          `Подставляем полученные корни в числитель. При $${variable} = ${firstRoot}$ числитель равен $${valNumAtRoot} \\\\neq 0$`,
          `Согласно аксиоме A10 (деление на ноль), в точке $${variable} = ${firstRoot}$ выражение стремится к индексированной бесконечности: \\\\frac{${valNumAtRoot}}{0_{${den}}} = \\\\infty_{${valNumAtRoot}}`
        ];
        simplified = `\\\\infty_{${valNumAtRoot}}`;
        finalResult = `\\\\infty_{${valNumAtRoot}}`;
      }
    } else {
      // Если у знаменателя нет простых вещественных корней, но задана точка предела
      const x0 = Number(limitPoint || '0');
      const isNumX0 = !isNaN(x0);
      const valDen = isNumX0 ? evalSimpleExpr(den, variable, x0) : NaN;
      const valNum = isNumX0 ? evalSimpleExpr(num, variable, x0) : NaN;

      if (isNumX0 && valDen === 0 && valNum === 0) {
        steps = [
          `Выявление сингулярного отношения вида \\\\frac{0}{0} при $${variable} = ${limitPoint}$`,
          `Семантическое индексирование неопределенности по аксиоме SP4: \\\\frac{0_{${num}}}{0_{${den}}}`,
          `Применение аксиомы SP3/A4: отношение нулей эквивалентно отношению их генерирующих индексов (производных первого порядка): \\\\frac{d/d${variable}(${num})}{d/d${variable}(${den})}`
        ];
        simplified = `\\\\frac{d/d${variable}(${num})}{d/d${variable}(${den})}`;
        finalResult = `Вычислено в точке $${variable} = ${limitPoint}$`;
      } else {
        const limText = limitPoint ? ` в критической точке $${variable} = ${limitPoint}$` : '';
        steps = [
          `Определение значения выражения${limText}`,
          `Подстановка значения дает: числитель = $${valNum || num}$, знаменатель = $${valDen || den}$`
        ];
        simplified = func;
        finalResult = isNaN(valDen) || valDen === 0 ? func : String(valNum / valDen);
      }
    }
  } else {
    if (func.includes('*') && (func.includes('0') || func.includes('infty') || func.includes('\\infty'))) {
      steps = [
        `Семантическое индексирование сопряженных сингулярностей по аксиоме SP4: $0_F \\\\cdot \\\\infty_G$`,
        `Применение аксиомы A6 (косое произведение через Geometric Bridge как детерминант ортогональных векторов): \\\\det(u, v) = F \\\\cdot G$`
      ];
      simplified = `F \\\\cdot G`;
      finalResult = `F \\\\cdot G`;
    } else if (func.includes('-') && (func.includes('infty') || func.includes('\\infty'))) {
      steps = [
        `Семантическое индексирование бесконечных факторов по аксиоме SP4: \\\\infty_F - \\\\infty_G`,
        `Применение аксиомы A7 (разность бесконечных монолитов): \\\\infty_F - \\\\infty_G = \\\\infty_{F - G}`
      ];
      simplified = `\\\\infty_{F - G}`;
      finalResult = `\\\\infty_{F - G}`;
    } else {
      steps = [
        `Выявление геометрического моста $\\mathbb{R}_{RICIS}^2$: представление объекта в виде 2D ортогональной системы векторов $u = (F, 0)$ и $v = (0, G)$`,
        `Применение аксиомы A6 (косое произведение как детерминант ортогональных компонентов): $\\det(u, v) = F \\cdot G - 0 \\cdot 0 = F \\cdot G$`,
        `Сворачивание абстрактной структуры $f(${variable}) = ${func}$ через семантическое индексирование (SP4) и аксиому L1 в единственный скалярный инвариант $F \\cdot G$ за $O(1)$ время`
      ];
      simplified = `F \\cdot G`;
      finalResult = limitPoint ? `F \\cdot G \\text{ при } ${variable} = ${limitPoint}` : `F \\cdot G`;
    }
  }

  const stepsFormatted = steps.map((s, i) => `${i + 1}. ${s}`).join('\n');

  let resultSection = '';
  if (finalResult) {
    resultSection = `\n\n**Точка схождения (Результат):** $${finalResult}$`;
  }

  return `**RICIS-III структурный черновик**

**Целевая функция:** $f(${variable}) = ${func}$${limitPoint ? ` при $${variable} = ${limitPoint}$` : ''}

**Пошаговое упрощение:**
${stepsFormatted}

**Упрощенное выражение:** $f(${variable}) = ${simplified}$${resultSection}

**Статус доверия:** \`REQUIRES_CORE_LEAN\`

Этот текст описывает локальный RICIS-путь и не является Lean-верифицированной теоремой. Проверка требует отдельного Lean-файла, воспроизводимого запуска toolchain и явного отчёта об аксиомах.`;
}
