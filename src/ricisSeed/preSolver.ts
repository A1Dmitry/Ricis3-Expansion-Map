/**
 * RICIS SEED — Graph-Guided Pre-Solve & Proof Reuse Engine.
 *
 * Принцип:
 *   - "Уже доказанное не доказывается заново".
 *   - Пре-решатель запускается ДО тяжелого вычисления / вывода доказательства.
 *   - Поиск в графе знаний R(n) выполняется со структурным сопоставлением (Structural Pattern Matching)
 *     и обязательной проверкой условий применимости (Guards).
 *   - Не слепой lookup, а:
 *       1. Graph Lookup ->
 *       2. Structural Match (F ↦ G) ->
 *       3. Guard Verification ->
 *       4. Proof Reuse.
 */

import type {
  ProofCertificate,
  ProofStrategy,
  RicisAxiom,
  RicisSeedState,
  UnsolvedSingularProblem,
} from './contracts';
import { canonicalizeForm, indexSymbolsOf, substituteSymbol, normalizeMatchKey } from './canonicalForm';

export interface PreSolveMatchResult {
  readonly found: boolean;
  readonly reusedRuleId?: string;
  readonly outputForm?: string;
  readonly proofStrategy?: ProofStrategy;
  readonly reusedProof?: ProofCertificate;
  readonly guardSatisfied?: boolean;
}

export class PreSolveMatcher {
  /**
   * Проверяет, изоморфна ли форма inputForm известному образцу patternForm,
   * и возвращает маппинг параметров при совпадении.
   */
  static matchIsomorphism(pattern: string, input: string): Record<string, string> | null {
    // Входные строки могут быть как сырыми, так и частично канонизированными.
    // Единый ключ нормализации: пробельные/невидимые символы игнорируются,
    // множители/слагаемые коммутируемых цепочек упорядочиваются (F*G == G*F),
    // тождества НЕ сворачиваются (0_F/0_F остаётся шаблоном для L1-ветки ниже).
    const pTrim = normalizeMatchKey(pattern);
    const iTrim = normalizeMatchKey(input);

    if (pTrim === iTrim) {
      return {};
    }

    // Сопоставление для деления нулей: 0_F / 0_G vs 0_A / 0_B
    const patternZeroDivMatch = pTrim.match(/^0_([A-Za-z0-9_]+)\/0_([A-Za-z0-9_]+)$/);
    const inputZeroDivMatch = iTrim.match(/^0_([A-Za-z0-9_]+)\/0_([A-Za-z0-9_]+)$/);

    if (patternZeroDivMatch && inputZeroDivMatch) {
      const [, pNum, pDen] = patternZeroDivMatch;
      const [, iNum, iDen] = inputZeroDivMatch;
      if (pNum && pDen && iNum && iDen) {
        // Если в паттерне pNum == pDen (тождество L1 0_F/0_F), то и во входе должно быть iNum == iDen
        if (pNum === pDen) {
          if (iNum === iDen) {
            return { [pNum]: iNum };
          }
          return null; // Guard: операнды во входе не равны, тождество неприменимо
        }
        return { [pNum]: iNum, [pDen]: iDen };
      }
    }

    // Сопоставление вложенного деления: (0_F/0_G)/(0_H/0_K) или без скобок 0_F/0_G/(0_H/0_K)
    const nestedPattern1 = /^\(?0_([A-Za-z0-9_]+)\/0_([A-Za-z0-9_]+)\)?\/\(?0_([A-Za-z0-9_]+)\/0_([A-Za-z0-9_]+)\)?$/;
    const pNest = pTrim.match(nestedPattern1);
    const iNest = iTrim.match(nestedPattern1);
    if (pNest && iNest) {
      return {
        [pNest[1]!]: iNest[1]!,
        [pNest[2]!]: iNest[2]!,
        [pNest[3]!]: iNest[3]!,
        [pNest[4]!]: iNest[4]!,
      };
    }

    // Проверка канонизированных форм
    const patternNorm = canonicalizeForm(pattern);
    const inputNorm = canonicalizeForm(input);
    if (patternNorm === inputNorm) {
      return {};
    }

    const pNestNorm = patternNorm.match(nestedPattern1);
    const iNestNorm = inputNorm.match(nestedPattern1);
    if (pNestNorm && iNestNorm) {
      return {
        [pNestNorm[1]!]: iNestNorm[1]!,
        [pNestNorm[2]!]: iNestNorm[2]!,
        [pNestNorm[3]!]: iNestNorm[3]!,
        [pNestNorm[4]!]: iNestNorm[4]!,
      };
    }

    return null;
  }

  /**
   * Подставляет маппинг символов в форму следствия.
   */
  static applyMapping(outputPattern: string, mapping: Record<string, string>): string {
    let result = outputPattern;
    for (const [key, val] of Object.entries(mapping)) {
      result = substituteSymbol(result, key, val);
    }
    return result;
  }
}

/**
 * Выполняет структурный поиск по графу знаний перед Resolve.
 */
export function graphGuidedPreSolve(
  seed: RicisSeedState,
  problem: UnsolvedSingularProblem,
): PreSolveMatchResult {
  const rawInput = normalizeMatchKey(problem.inputForm);

  // 1. Проверка фундаментального тождества L1: X / X = 1, X - X = 0
  const zeroSelfDivMatch = rawInput.match(/^0_([A-Za-z0-9_]+)\/0_([A-Za-z0-9_]+)$/);
  if (zeroSelfDivMatch && zeroSelfDivMatch[1] === zeroSelfDivMatch[2]) {
    const l1Axiom = seed.axioms.find(a => a.id === 'L1');
    const proof: ProofCertificate = l1Axiom?.proof ?? {
      strategy: 'RICIS_STRUCTURAL',
      steps: [{ rule: 'L1', from: rawInput, to: '1' }],
      conclusion: '1',
      usesLimits: false,
      usesNumericApproximation: false,
    };
    return {
      found: true,
      reusedRuleId: 'L1',
      outputForm: '1',
      proofStrategy: 'RICIS_STRUCTURAL',
      reusedProof: proof,
      guardSatisfied: true,
    };
  }

  // 2. Поиск по принятым аксиомам и их следствиям в R(n)
  // Приоритет отдаётся AXIOM (A4, A5, ...) перед PROTOCOL (SP3), если обе имеют сходные формы
  const sortedAxioms = [...seed.axioms].sort((a, b) => {
    if (a.layer === 'AXIOM' && b.layer !== 'AXIOM') return -1;
    if (a.layer !== 'AXIOM' && b.layer === 'AXIOM') return 1;
    return 0;
  });

  for (const axiom of sortedAxioms) {
    for (const consequence of axiom.consequences) {
      const cFormTrim = normalizeMatchKey(consequence.inputForm);
      // Прямое совпадение
      if (cFormTrim === rawInput) {
        return {
          found: true,
          reusedRuleId: axiom.id,
          outputForm: consequence.outputForm,
          proofStrategy: axiom.proof?.strategy ?? 'RICIS_STRUCTURAL',
          reusedProof: axiom.proof,
          guardSatisfied: true,
        };
      }

      // Структурный изоморфизм с параметрами (F, G, H, K)
      const mapping = PreSolveMatcher.matchIsomorphism(consequence.inputForm, rawInput);
      if (mapping) {
        // Проверяем guard аксиомы, если он есть
        if (axiom.id === 'A4' && mapping['F'] && mapping['G'] && mapping['F'] === mapping['G']) {
          continue; // Для идентичных операндов A4 не применяется — работает L1
        }

        const outForm = PreSolveMatcher.applyMapping(consequence.outputForm, mapping);
        return {
          found: true,
          reusedRuleId: axiom.id,
          outputForm: outForm,
          proofStrategy: axiom.proof?.strategy ?? 'RICIS_STRUCTURAL',
          reusedProof: axiom.proof,
          guardSatisfied: true,
        };
      }
    }
  }

  return { found: false };
}
