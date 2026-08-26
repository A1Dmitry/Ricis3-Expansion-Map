import {
  buildCalculatorExplorerProjection,
  type CalculatorExplorerEntry,
  type CalculatorExplorerProjection,
} from '../calculatorExplorer/calculatorExplorer.domain';
import { INITIAL_SOLUTION_RELATIONS } from '../ricisSolutionCatalog';

export type MonolithGuidedCaseTrailRejection =
  | 'REJECTED_EXPLORER'
  | 'REJECTED_RELATION_ENDPOINT'
  | 'REJECTED_CLOSED_INVENTORY';

export interface GuidedCaseTrailEntry {
  readonly entry: CalculatorExplorerEntry;
  readonly familyId: string;
  readonly isInitialAnchor: boolean;
  readonly outgoing: readonly GuidedCaseRelation[];
}

export interface GuidedCaseRelation {
  readonly relationId: string;
  readonly kind: 'SOLVED_HIERARCHY';
  readonly sourceRationale: string;
  readonly from: GuidedCaseTrailEntry;
  readonly to: GuidedCaseTrailEntry;
}

export type MonolithGuidedCaseTrail =
  | Readonly<{
    readonly kind: 'PROJECTED';
    readonly entries: readonly GuidedCaseTrailEntry[];
  }>
  | Readonly<{
    readonly kind: 'REJECTED';
    readonly reason: MonolithGuidedCaseTrailRejection;
  }>;

export interface MonolithGuidedCaseTrailInput {
  readonly explorer: CalculatorExplorerProjection;
}

interface MutableGuidedCaseTrailEntry {
  readonly entry: CalculatorExplorerEntry;
  readonly familyId: string;
  readonly isInitialAnchor: boolean;
  readonly outgoing: GuidedCaseRelation[];
}

const INITIAL_ANCHOR_ID = 'calculator-mandelbrot';
const EXPECTED_ENTRY_COUNT = 14;

function freeze<T>(value: T): T {
  return Object.freeze(value);
}

function rejected(reason: MonolithGuidedCaseTrailRejection): MonolithGuidedCaseTrail {
  return freeze({ kind: 'REJECTED', reason });
}

function canonicalEntries(): readonly CalculatorExplorerEntry[] | undefined {
  const canonical = buildCalculatorExplorerProjection();
  return canonical.kind === 'PROJECTED' ? canonical.entries : undefined;
}

function hasClosedExplorerIdentity(entries: readonly CalculatorExplorerEntry[]): boolean {
  const canonical = canonicalEntries();
  if (!canonical || entries.length !== EXPECTED_ENTRY_COUNT || canonical.length !== EXPECTED_ENTRY_COUNT) return false;

  const monolithIds = new Set<string>();
  const nodeIds = new Set<string>();
  for (let index = 0; index < canonical.length; index += 1) {
    const entry = entries[index];
    const expected = canonical[index];
    if (!entry || !expected || entry.monolith !== expected.monolith || entry.nodeId !== expected.nodeId) return false;
    if (entry.nodeId === 'registry-120' || monolithIds.has(entry.monolith.id) || nodeIds.has(entry.nodeId)) return false;
    monolithIds.add(entry.monolith.id);
    nodeIds.add(entry.nodeId);
  }
  return monolithIds.size === EXPECTED_ENTRY_COUNT && nodeIds.size === EXPECTED_ENTRY_COUNT;
}

export function buildMonolithGuidedCaseTrail(input: MonolithGuidedCaseTrailInput): MonolithGuidedCaseTrail {
  if (input.explorer.kind !== 'PROJECTED') return rejected('REJECTED_EXPLORER');
  const explorerEntries = input.explorer.entries;
  if (!hasClosedExplorerIdentity(explorerEntries)) return rejected('REJECTED_CLOSED_INVENTORY');

  const entries: MutableGuidedCaseTrailEntry[] = explorerEntries.map(entry => ({
    entry,
    familyId: entry.monolith.familyId,
    isInitialAnchor: entry.monolith.id === INITIAL_ANCHOR_ID,
    outgoing: [],
  }));
  const entriesByMonolithId = new Map(entries.map(entry => [entry.entry.monolith.id, entry]));
  if (entriesByMonolithId.size !== EXPECTED_ENTRY_COUNT) return rejected('REJECTED_CLOSED_INVENTORY');

  for (const relation of INITIAL_SOLUTION_RELATIONS) {
    if (relation.kind !== 'SOLVED_HIERARCHY') continue;
    if (!relation.toMonolithId) return rejected('REJECTED_RELATION_ENDPOINT');
    const from = entriesByMonolithId.get(relation.fromMonolithId);
    const to = entriesByMonolithId.get(relation.toMonolithId);
    if (!from || !to || from === to || from.entry.nodeId === 'registry-120' || to.entry.nodeId === 'registry-120') {
      return rejected('REJECTED_RELATION_ENDPOINT');
    }
    const item: GuidedCaseRelation = freeze({
      relationId: relation.id,
      kind: 'SOLVED_HIERARCHY',
      sourceRationale: relation.sourceRationale,
      from,
      to,
    });
    from.outgoing.push(item);
  }

  const frozenEntries = entries.map(entry => {
    freeze(entry.outgoing);
    return freeze(entry) as GuidedCaseTrailEntry;
  });
  const anchors = frozenEntries.filter(entry => entry.isInitialAnchor);
  if (anchors.length !== 1 || anchors[0]?.entry.monolith.id !== INITIAL_ANCHOR_ID) return rejected('REJECTED_CLOSED_INVENTORY');
  return freeze({ kind: 'PROJECTED', entries: freeze(frozenEntries) });
}
