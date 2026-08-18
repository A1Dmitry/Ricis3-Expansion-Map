import { containsSorry } from './ricisCoreRules';

/**
 * RICIS-III v7.7 Lean 4 Proof Verification Engine
 * Author: Dmitry V. Aleynikov (ORCID: 0009-0004-3226-7700)
 */

export type LeanVerificationStatus =
  | 'NOT_LEAN'
  | 'STATIC_CHECK_FAILED'
  | 'STATIC_CHECK_PASSED'
  | 'LEAN_VERIFIED';

export interface LeanAuditResult {
  /** True only for the local static check; it is not a Lean kernel result. */
  isValid: boolean;
  status: LeanVerificationStatus;
  errors: string[];
  warnings: string[];
}

/**
 * Parses Lean 4 proof code and checks for syntax, structural, and semantic alignment with RICIS-III axioms.
 */
export function verifyLeanProof(leanCode: string, nodeTitle: string, targetFunction: string): LeanAuditResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!leanCode || leanCode.trim() === '') {
    return { isValid: true, status: 'NOT_LEAN', errors: [], warnings: [] };
  }

  // Check if Lean syntax is present (keywords)
  const hasLeanKeywords = /\btheorem\b|\blemma\b|\bdef\b|\binductive\b|\bstructure\b|\baxiom\b|\bimport\b/i.test(leanCode);
  if (!hasLeanKeywords) {
    if (leanCode.toLowerCase().includes('lean')) {
      warnings.push("Обнаружено упоминание Lean, но ключевые слова (theorem, lemma, def) отсутствуют. Код трактуется как LaTeX/текстовое описание.");
    }
    return { isValid: true, status: 'NOT_LEAN', errors: [], warnings };
  }

  const lines = leanCode.split('\n');

  // 1. Balance and brackets verification
  const delimiters: { [key: string]: string } = { '(': ')', '[': ']', '{': '}' };
  const stack: { char: string; line: number; col: number }[] = [];
  let inBlockComment = false;
  let inString = false;

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    let inLineComment = false;

    for (let c = 0; c < line.length; c++) {
      const char = line[c];

      // Handle block comments /- ... -/
      if (!inString && !inLineComment) {
        if (!inBlockComment && char === '/' && line[c + 1] === '-') {
          inBlockComment = true;
          c++;
          continue;
        }
        if (inBlockComment && char === '-' && line[c + 1] === '/') {
          inBlockComment = false;
          c++;
          continue;
        }
      }

      if (inBlockComment) continue;

      // Handle line comments -- ...
      if (!inString && char === '-' && line[c + 1] === '-') {
        inLineComment = true;
        break; // skip rest of line
      }

      // Handle strings "..."
      if (char === '"' && (c === 0 || line[c - 1] !== '\\')) {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      // Track open brackets
      if (char === '(' || char === '[' || char === '{') {
        stack.push({ char, line: l + 1, col: c + 1 });
      } else if (char === ')' || char === ']' || char === '}') {
        const top = stack.pop();
        if (!top) {
          errors.push(`Строка ${l + 1}: Лишний закрывающий символ '${char}' без открывающего.`);
        } else if (delimiters[top.char] !== char) {
          errors.push(`Строка ${l + 1}: Несоответствие скобок: открыта '${top.char}' на строке ${top.line}, но встречена закрывающая '${char}'.`);
        }
      }
    }
  }

  while (stack.length > 0) {
    const unclosed = stack.pop()!;
    errors.push(`Строка ${unclosed.line}: Обнаружена незакрытая скобка '${unclosed.char}'.`);
  }

  // 2. Structural & semantic verification (sorry, admit, placeholders)
  let hasSorry = false;
  let hasTheorem = false;
  const hasRicisNamespace = /RICIS|RICIS3|Mersenne|M_P/i.test(leanCode);

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l].trim();
    // Skip comment lines for validation of stubs
    if (line.startsWith('--') || line.startsWith('/-') || line.endsWith('-/')) continue;

    // Detect unfinished proofs
    if (containsSorry(line) || /\bsorryAx\b/i.test(line)) {
      errors.push(`Строка ${l + 1}: Обнаружена заглушка 'sorry' или 'admit'. Формальное доказательство не является полным!`);
      hasSorry = true;
    }

    if (/\btheorem\b|\blemma\b/i.test(line)) {
      hasTheorem = true;
      // Check if theorem declared but lacks tactics
      if (line.includes(':=') && !lines.slice(l).some(next => {
        const nTrim = next.trim();
        return nTrim.includes('exact') || nTrim.includes('reflexivity') || nTrim.includes('rfl') || 
               nTrim.includes('simp') || nTrim.includes('rw') || containsSorry(nTrim) || nTrim.includes('intro');
      })) {
        warnings.push(`Строка ${l + 1}: Теорема объявлена, но не обнаружено явных тактик доказательства (exact, rfl, simp, rw).`);
      }
    }
  }

  if (!hasTheorem) {
    warnings.push("В коде Lean 4 не найдено объявлений теорем (theorem) или лемм (lemma).");
  }

  if (!hasRicisNamespace) {
    warnings.push("Код Lean 4 не использует пространство имен RICIS/RICIS3. Рекомендуется импортировать 'RICIS3.Core' для верификации.");
  }

  // Check for classical ZFC limits / Cauchy traps (only unindexed limit transitions, ignoring valid RICIS \infty_F / \infty_G objects)
  if (/\bClassical\b|lim_\{|limit\b|\bepsilon-delta\b/i.test(leanCode)) {
    warnings.push("Обнаружено использование классических бесконечных пределов (Cauchy limits / ZFC). В рамках RICIS-III пределы автоматически преобразуются в вызовы RICIS-мостов F_0 или inf_0 в кольце Мерсенна M_k.");
  }

  // Check for division of unindexed zeroes
  if (leanCode.includes('/') && leanCode.includes('0') && !/0_[a-zA-Z]/i.test(leanCode) && leanCode.includes('0/0')) {
    warnings.push("Обнаружено выражение '0/0'. По закону L1C2 и аксиоме A3, нули должны иметь индексацию происхождения (например, 0_F / 0_G) для избежания сингулярности.");
  }

  const staticCheckPassed = errors.length === 0 && !hasSorry;
  if (staticCheckPassed) {
    warnings.push('Локальная статическая проверка пройдена, но Lean kernel/toolchain не запускался. Статус остаётся REQUIRES_CORE_LEAN.');
  }

  return {
    isValid: staticCheckPassed,
    status: staticCheckPassed ? 'STATIC_CHECK_PASSED' : 'STATIC_CHECK_FAILED',
    errors,
    warnings
  };
}
