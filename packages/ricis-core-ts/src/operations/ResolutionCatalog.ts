import { ResolutionPriority } from './ResolutionPriority';

export type RuleKind = 'axiom' | 'convenience';

export interface ResolutionRuleMeta {
  readonly name: string;
  /** Онтологический приоритет разрешения (R-08): меньше = выше. */
  readonly priority: number;
  readonly kind: RuleKind;
  readonly axiomRef?: string; // 'A4'|'A6'|'A7'|'A10' для аксиом Main
  /** Где правило реально исполняется — чтобы не дублировать логику. */
  readonly implementedIn: string;
}

/**
 * R-08 / R-09 — декларативный каталог правил СУЩЕСТВУЮЩЕГО движка.
 *
 * ВАЖНО (бритва Оккама / DRY): этот модуль НЕ исполняет редукцию. Исполнение
 * остаётся единственным — в `RicisTypeScriptEngine`. Здесь только явно
 * зафиксированы две вещи, которые аудит требовал сделать явными:
 *   1. порядок pattern matching = Resolution Priority (SP2 → A6 → A7 → A4 → TypeConsistency);
 *   2. разделение аксиом Main и conveniences классической алгебры.
 */
export const RESOLUTION_CATALOG: readonly ResolutionRuleMeta[] = [
  // SP2-слой (структурные/алгебраические сокращения — conveniences классической алгебры)
  { name: 'L1/IdentityCancel', priority: ResolutionPriority.SP2, kind: 'convenience', implementedIn: 'RicisTypeScriptEngine' },
  { name: 'Algebraic/(c*X)/X', priority: ResolutionPriority.SP2, kind: 'convenience', implementedIn: 'RicisTypeScriptEngine' },
  // A6 — 0_F * ∞_G = F·G
  { name: 'A6/ZeroInf', priority: ResolutionPriority.A6, kind: 'axiom', axiomRef: 'A6', implementedIn: 'RicisTypeScriptEngine' },
  // A7 — ∞_F - ∞_G = ∞_(F-G)
  { name: 'A7/InfMinusInf', priority: ResolutionPriority.A7, kind: 'axiom', axiomRef: 'A7', implementedIn: 'RicisTypeScriptEngine' },
  // A4 — 0_F / 0_G = F/G
  { name: 'A4/ZeroZero', priority: ResolutionPriority.A4, kind: 'axiom', axiomRef: 'A4', implementedIn: 'RicisTypeScriptEngine' },
  // A10 — F / 0_G = F * ∞_G
  { name: 'A10/DivideByZero', priority: ResolutionPriority.A4, kind: 'axiom', axiomRef: 'A10', implementedIn: 'RicisTypeScriptEngine' },
  // TypeConsistency — conveniences классической алгебры (нет в перечне Main)
  { name: 'A-A=0', priority: ResolutionPriority.TypeConsistency, kind: 'convenience', implementedIn: 'RicisTypeScriptEngine' },
  { name: '0/X', priority: ResolutionPriority.TypeConsistency, kind: 'convenience', implementedIn: 'RicisTypeScriptEngine' },
  { name: 'X/(c*X)', priority: ResolutionPriority.TypeConsistency, kind: 'convenience', implementedIn: 'RicisTypeScriptEngine' },
  { name: '(A/B)/A', priority: ResolutionPriority.TypeConsistency, kind: 'convenience', implementedIn: 'RicisTypeScriptEngine' },
];

export function resolutionRulesOrdered(): readonly ResolutionRuleMeta[] {
  return [...RESOLUTION_CATALOG].sort((a, b) => a.priority - b.priority);
}

export function listAxiomsMeta(): readonly ResolutionRuleMeta[] {
  return resolutionRulesOrdered().filter((r) => r.kind === 'axiom');
}

export function listConveniencesMeta(): readonly ResolutionRuleMeta[] {
  return resolutionRulesOrdered().filter((r) => r.kind === 'convenience');
}
