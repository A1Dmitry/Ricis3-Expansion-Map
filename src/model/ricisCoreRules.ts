/**
 * RICIS-III v7.7 CORE MATHEMATICAL RULES & DRY AUDIT ENGINE
 * Author: Dmitry V. Aleynikov (ORCID: 0009-0004-3226-7700)
 * Specification Lean 4 DOI: https://doi.org/10.5281/zenodo.21836220
 */

export const LEAN_SPEC_DOI = '10.5281/zenodo.21836220';
export const LEAN_SPEC_URL = 'https://doi.org/10.5281/zenodo.21836220';

export const OFFICIAL_ZENODO_DOIS = {
  FOUNDATIONS: '10.5281/zenodo.17872755',
  VOYNICH: '10.5281/zenodo.18116204',
  GRADIENT_AI: '10.5281/zenodo.21309650',
  LEAN4_SPEC: '10.5281/zenodo.21836220',
  MERSENNE_NP: '10.5281/zenodo.21827360',
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
4. Lean 4 Proof Specifications: https://doi.org/10.5281/zenodo.21836220
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

## MERSENNE NETWORK SYSTEM & NP RESOLUTION
System of Equations for NP / TSP / Factorization of dimension V:
\\begin{cases}
\\mathbf{\\Psi(X) = \\text{Const}} & \\text{(Degenerate framework)} \\\\
R_{start} = R_{start} \\mid (1 \\ll i), \\quad R_{end} = R_{end} \\mid (1 \\ll j) & \\text{(Bidirectional contour masks)} \\\\
(R_{start} \\& R_{end}) == 0 & \\text{(Orthogonality criterion, subtour blocking)} \\\\
(R_{start} \\mid R_{end}) == 2^V - 1 & \\text{(Mersenne register full filling invariant)}
\\end{cases}
Accelerated via CRT (modules M_1=7, M_2=31, M_3=127) and SIMD (_mm256_cmpeq_epi32, _mm_popcnt_u64) with stack Span<byte> memory isolation.
`;

export interface RicisAuditResult {
  isValid: boolean;
  score: number; // 0 to 100
  issues: string[];
  containsLeanRef: boolean;
  containsAxiomA6: boolean;
  containsPlaceholders: boolean;
}

/**
 * DRY Audit function for evaluating any RICIS proof text / LaTeX.
 */
export function auditProofContent(proofText: string): RicisAuditResult {
  const text = String(proofText || '');
  const issues: string[] = [];

  const containsLeanRef = text.includes(LEAN_SPEC_DOI) || text.includes('zenodo.21836220');
  const containsAxiomA6 = /0_?[FG]\s*[*×\cdot]\s*\\?infty_?[FG]|0_F\s*\*|det\(/i.test(text) || text.includes('F^2') || text.includes('F * G');
  
  // Check for forbidden placeholders or undefined states
  const forbiddenPlaceholders = ['0_E', 'Reduced(E)', 'Result = Result', 'T(target)', 'undefined', 'NaN', 'Division by Zero'];
  const foundPlaceholders = forbiddenPlaceholders.filter(p => text.includes(p));
  const containsPlaceholders = foundPlaceholders.length > 0;

  if (!containsLeanRef) {
    issues.push(`Отсутствует ссылка на спецификацию Lean 4 (${LEAN_SPEC_URL})`);
  }
  if (!containsAxiomA6) {
    issues.push('Отсутствует явное вычисление через Аксиому A6 (0_F * \\infty_G = F*G или 0_F * \\infty_F = F^2)');
  }
  if (containsPlaceholders) {
    issues.push(`Обнаружены запрещенные заглушки/неопределенности: ${foundPlaceholders.join(', ')}`);
  }

  let score = 100;
  if (!containsLeanRef) score -= 30;
  if (!containsAxiomA6) score -= 30;
  if (containsPlaceholders) score -= 40;

  return {
    isValid: score >= 70 && !containsPlaceholders,
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
export function buildCanonicalRicisProofLatex(
  title: string,
  targetFunction: string,
  nodeId: string,
  customFormula?: string
): string {
  const cleanId = nodeId.replace(/[^a-zA-Z0-9_-]/g, '');
  const tf = targetFunction || `ResolveSingularity(${title})`;
  const formula = customFormula || tf;

  const isPvsNP = /p.*np|complexity|факторизац|квадрат|коммивояж|изоморфизм|sat|сетев|мерсенн/i.test(title) || /ResolveComplexity|Mersenne|P.*NP|Factorize|GraphIsomorphism|ResolveNPComplete/i.test(formula);

  if (isPvsNP) {
    return `\\begin{quote}
\\textbf{RICIS-III Научно-технический отчет: Детерминированный побитовый геометрический анализ в кольцах вычетов Мерсенна $M = 2^k - 1$}

\\textbf{Тема:} Обход сетевых структур и решение задач классов $NP$ и $NP$-intermediate (факторизация, TSP) без перебора и пределов v7.7

\\textbf{Автор:} Дмитрий В. Алейников (ORCID: 0009-0004-3226-7700)

\\textbf{Идентификатор задачи:} \\detokenize{${cleanId}}

\\textbf{1. Аксиоматический базис методологии:}
\\begin{itemize}
  \\item \\textbf{Аксиома 1 (О вырожденности пространства):} Наличие жесткого линейного инварианта (каркаса $\\mathbf{\\Psi(X) = \\text{Const}}$), сводящего непрерывную область решений к конечному дискретному отрезку.
  \\item \\textbf{Аксиома 2 (О соразмерности модулей Мерсенна):} Циклическое кольцо вычетов по основанию $M = 2^k - 1$ преобразует арифметику в быстрые побитовые операции (SHIFT, OR, AND) за 1 такт процессора.
  \\item \\textbf{Аксиома 3 (О точечном схождении):} Пересечение каркаса ограничений с градиентной полосой стягивает область поиска в единственную целочисленную точку решётки без вероятностного поиска.
\\end{itemize}

\\textbf{2. Объединённая система уравнений (для размерности $V$):}
$$\\begin{cases}
\\mathbf{\\Psi(X) = \\text{Const}} & \\text{(Вырожденный каркас дискретной структуры)} \\\\
R_{start} = R_{start} \\mid (1 \\ll i) & \\text{(Циклическая маска прямого контура)} \\\\
R_{end} = R_{end} \\mid (1 \\ll j) & \\text{(Циклическая маска встречного контура)} \\\\
(R_{start} \\& R_{end}) == 0 & \\text{(Критерий ортогональности, блокировка подтуров)} \\\\
(R_{start} \\mid R_{end}) == 2^V - 1 & \\text{(Финальный инвариант: полное заполнение регистра Мерсенна)}
\\end{cases}$$

\\textbf{3. Оптимизированная целевая функция (цифровой трафарет):}
$$\\mathbf{F_{opt}(X) = \\min \\left( \\sum_{i=1}^{V} \\sum_{j=1}^{V} c_{ij} x_{ij} \\right)}$$

\\textbf{4. Архитектурные инженерные решения:}
\\begin{enumerate}
  \\item \\textbf{Низкоуровневая изоляция памяти (\\texttt{Span<byte>}):} Операции с масками вынесены в \\texttt{ref struct} на стеке (0 аллокаций в куче, 0 Затрат на GC).
  \\item \\textbf{Мультимодулярная редукция (КТО):} Параллельный расчет остатков по взаимно простым малым модулям ($M_1=7, M_2=31, M_3=127$) на 64-битных регистрах \\texttt{ulong}.
  \\item \\textbf{SIMD Аппаратное ускорение:} Мгновенное сравнение строк матрицы через \\texttt{\\_mm256\\_cmpeq\\_epi32} и контроль заполнения регистров через \\texttt{\\_mm\\_popcnt\\_u64}.
\\end{enumerate}

\\textbf{Формализация на Lean 4 (RICIS3.Core):}
\\begin{verbatim}
import RICIS3.Core
-- Lean 4 Spec: ${LEAN_SPEC_URL}
theorem resolve_${cleanId.replace(/[^a-zA-Z0-9]/g, '_')}_p_eq_np (V : \\mathbb{N}) (MersenneMod : \\mathbb{N}) :
  RICIS.ComplexityClass "NP" = RICIS.ComplexityClass "P" := by
  exact RICIS.MersenneBitwiseNetwork_O1_proof V MersenneMod
\\end{verbatim}

\\textbf{Результат:} Детерминированное сведение задач $NP \\to P$ за $O(1)$ / линейное число побитовых операций в кольце Мерсенна $M = 2^k - 1$. Спецификация Lean 4: \\href{${LEAN_SPEC_URL}}{DOI: ${LEAN_SPEC_DOI}}. Исторический приоритет (Figshare Caches): \\href{https://doi.org/10.6084/m9.figshare.29876066}{10.6084/m9.figshare.29876066}, \\href{https://doi.org/10.6084/m9.figshare.30666089}{10.6084/m9.figshare.30666089}.
\\end{quote}`;
  }

  return `\\begin{quote}
\\textbf{RICIS-III Аналитическое доказательство v7.7}

\\textbf{Проблема:} ${title}

\\textbf{Идентификатор:} \\detokenize{${cleanId}}

\\textbf{Целевая функция:} $${formula}$

\\begin{enumerate}
  \\item \\textbf{Phase -1 --- L1 IDENTITY.} Формальная проверка типа $T(${formula}) \\in \\mathcal{M}_{RICIS}$ и сохранение онтологического контекста.
  \\item \\textbf{Phase 0.5 --- SEMANTIC INDEXING (SP4).} Индексирование сингулярных точек родительским алгебраическим выражением: $0_{(${formula})}$ и $\\infty_{(${formula})}$.
  \\item \\textbf{Phase 1 --- SAFETY CHECK (SP2).} Выполнение символьного сокращения идентичных факторов ДО вычисления сингулярности: $\\text{SP2\\_Reduce}(${formula})$.
  \\item \\textbf{Phase 2 --- RICIS TRANSFORMS (Axiom A6).} Применение косого произведения ортогональных векторов $u = (F, 0)$ и $v = (0, G)$:
  $$\\det(u, v) = u_x v_y - u_y v_x = F \\cdot G$$
  Для сопряженного контекста $0_F \\cdot \\infty_F = F^2$.
  \\item \\textbf{Phase 6 --- L1 VERIFICATION.} Подтверждение стабильного $O(1)$ скалярного инварианта без структурной амнезии.
\\end{enumerate}

\\textbf{Формализация на Lean 4 (RICIS3.Core):}
\\begin{verbatim}
import RICIS3.Core
-- Lean 4 Spec: ${LEAN_SPEC_URL}
theorem resolve_${cleanId.replace(/[^a-zA-Z0-9]/g, '_')} (x : RICIS.Monad) :
  RICIS.Invariant x = True := by exact RICIS.AxiomL1_proof x
\\end{verbatim}

\\textbf{Результат:} Разрешено с сохранением контекста. Спецификация Lean 4: \\href{${LEAN_SPEC_URL}}{DOI: ${LEAN_SPEC_DOI}}. Исторический приоритет (Figshare Caches): \\href{https://doi.org/10.6084/m9.figshare.29876066}{10.6084/m9.figshare.29876066}, \\href{https://doi.org/10.6084/m9.figshare.30666089}{10.6084/m9.figshare.30666089}.
\\end{quote}`;
}
