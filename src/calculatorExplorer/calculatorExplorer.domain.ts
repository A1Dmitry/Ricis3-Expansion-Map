import {
  INITIAL_SOLUTION_CATALOG,
  buildCalculatorLaunchLink,
  type CalculatorLaunchResult,
  type SolutionMonolithDefinition,
} from '../ricisSolutionCatalog';
import { CALCULATOR_GRAPH_STATIC_SEED } from '../calculatorGraphDescriptor/calculatorGraphDescriptor.seed';

type ProjectionRejection =
  | 'REJECTED_CLOSED_INVENTORY'
  | 'REJECTED_DESCRIPTOR_IDENTITY'
  | 'REJECTED_NODE_IDENTITY';

export interface CalculatorExplorerEntry {
  readonly monolith: SolutionMonolithDefinition;
  readonly nodeId: string;
  readonly semanticIndexExpression: string;
  readonly launch: CalculatorLaunchResult;
  readonly researchOnlyDisclosure: string;
}

export type CalculatorExplorerProjection =
  | Readonly<{
    readonly kind: 'PROJECTED';
    readonly entries: readonly CalculatorExplorerEntry[];
  }>
  | Readonly<{
    readonly kind: 'REJECTED';
    readonly reason: ProjectionRejection;
  }>;

export interface CalculatorExplorerProjectionInput {
  readonly baseUrl?: string;
}

const KINEMATIC_DISCLOSURE = 'Источник-обусловленная визуализация исследования. Не запускает расчёт в Expansion Map, не подключается к манипулятору, не производит команду управления, оценку безопасности или сертификационный вывод.';
const DEFAULT_DISCLOSURE = 'Источник-обусловленное раскрытие calculator case. Не запускает расчёт в Expansion Map и не изменяет source, proof, state, trust или authority.';
const cache = new Map<string, CalculatorExplorerProjection>();

function freeze<T>(value: T): T {
  return Object.freeze(value);
}

function cacheKey(baseUrl?: string): string {
  return baseUrl?.trim() ?? '__UNCONFIGURED__';
}

function descriptorNodeIds(): ReadonlyMap<string, string> | ProjectionRejection {
  const descriptors = CALCULATOR_GRAPH_STATIC_SEED.descriptors;
  if (descriptors.length !== 10 || new Set(descriptors.map(item => item.monolithId)).size !== 10) return 'REJECTED_CLOSED_INVENTORY';

  const records = new Map<string, string>();
  for (const descriptor of descriptors) {
    if (descriptor.nodeId === 'registry-120' || records.has(descriptor.monolithId)) return 'REJECTED_NODE_IDENTITY';
    const source = INITIAL_SOLUTION_CATALOG.monoliths.find(item => item.id === descriptor.monolithId);
    if (!source || source.sourceEvidence.semanticIndexExpression !== descriptor.semanticIndexExpression) return 'REJECTED_DESCRIPTOR_IDENTITY';
    if (source.sourceEvidence.source.commit !== descriptor.source.commit || source.sourceEvidence.source.contentHash !== descriptor.source.contentHash) return 'REJECTED_DESCRIPTOR_IDENTITY';
    records.set(descriptor.monolithId, descriptor.nodeId);
  }
  return records;
}

function nodeIdsByMonolith(): ReadonlyMap<string, string> | ProjectionRejection {
  const descriptorIds = descriptorNodeIds();
  if (typeof descriptorIds === 'string') return descriptorIds;

  const records = new Map<string, string>();
  for (const binding of INITIAL_SOLUTION_CATALOG.existingNodeBindings) {
    if (binding.nodeId === 'registry-120' || records.has(binding.monolithId)) return 'REJECTED_NODE_IDENTITY';
    records.set(binding.monolithId, binding.nodeId);
  }
  for (const [monolithId, nodeId] of descriptorIds.entries()) {
    if (records.has(monolithId) || nodeId === 'registry-120') return 'REJECTED_NODE_IDENTITY';
    records.set(monolithId, nodeId);
  }
  return records.size === INITIAL_SOLUTION_CATALOG.monoliths.length
    ? records
    : 'REJECTED_CLOSED_INVENTORY';
}

function buildUncached(input: CalculatorExplorerProjectionInput): CalculatorExplorerProjection {
  const nodeIds = nodeIdsByMonolith();
  if (typeof nodeIds === 'string') return freeze({ kind: 'REJECTED', reason: nodeIds });

  const entries: CalculatorExplorerEntry[] = [];
  for (const monolith of INITIAL_SOLUTION_CATALOG.monoliths) {
    const nodeId = nodeIds.get(monolith.id);
    if (!nodeId || nodeId === 'registry-120') return freeze({ kind: 'REJECTED', reason: 'REJECTED_NODE_IDENTITY' });
    entries.push(freeze({
      monolith,
      nodeId,
      semanticIndexExpression: monolith.sourceEvidence.semanticIndexExpression,
      launch: freeze(buildCalculatorLaunchLink({ baseUrl: input.baseUrl, definition: monolith })),
      researchOnlyDisclosure: monolith.calculator.mode === 'KINEMATIC' ? KINEMATIC_DISCLOSURE : DEFAULT_DISCLOSURE,
    }));
  }

  const nodeIdsUnique = new Set(entries.map(item => item.nodeId));
  const modesUnique = new Set(entries.map(item => item.monolith.calculator.mode));
  if (entries.length !== 14 || nodeIdsUnique.size !== 14 || modesUnique.size !== 14) return freeze({ kind: 'REJECTED', reason: 'REJECTED_CLOSED_INVENTORY' });
  return freeze({ kind: 'PROJECTED', entries: freeze(entries) });
}

export function buildCalculatorExplorerProjection(input: CalculatorExplorerProjectionInput = {}): CalculatorExplorerProjection {
  const key = cacheKey(input.baseUrl);
  const existing = cache.get(key);
  if (existing) return existing;
  const created = buildUncached(input);
  cache.set(key, created);
  return created;
}

export function getCalculatorExplorerEntryForNodeId(input: { readonly nodeId: string; readonly baseUrl?: string }): CalculatorExplorerEntry | undefined {
  const projection = buildCalculatorExplorerProjection({ baseUrl: input.baseUrl });
  if (projection.kind !== 'PROJECTED') return undefined;
  return projection.entries.find(item => item.nodeId === input.nodeId);
}
