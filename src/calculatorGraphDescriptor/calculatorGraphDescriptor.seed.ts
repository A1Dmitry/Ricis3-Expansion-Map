import { INITIAL_SOLUTION_CATALOG } from '../ricisSolutionCatalog';
import type { DependencyEdge, ProblemNode } from '../model/types';
import { buildCalculatorGraphProjection } from './calculatorGraphDescriptor.domain';

export interface CalculatorGraphStaticSeed {
  readonly nodes: readonly ProblemNode[];
  readonly edges: readonly DependencyEdge[];
  readonly nodeIdsByZone: Readonly<{
    readonly math: readonly string[];
    readonly physics: readonly string[];
    readonly informatics: readonly string[];
  }>;
}

const projectionCandidate = buildCalculatorGraphProjection({ catalog: INITIAL_SOLUTION_CATALOG });

if (projectionCandidate.kind !== 'PROJECTED') {
  throw new Error(`CALCULATOR_GRAPH_SEED_REJECTED:${projectionCandidate.reason}`);
}

const projection = projectionCandidate;

function freeze<T>(value: T): T {
  return Object.freeze(value);
}

function nodeIdsForZone(zoneId: 'math' | 'physics' | 'informatics'): readonly string[] {
  return freeze(projection.nodes.filter((node) => node.zoneIds.includes(zoneId)).map((node) => node.id));
}

export const CALCULATOR_GRAPH_STATIC_SEED: CalculatorGraphStaticSeed = freeze({
  nodes: projection.nodes,
  edges: projection.edges,
  nodeIdsByZone: freeze({
    math: nodeIdsForZone('math'),
    physics: nodeIdsForZone('physics'),
    informatics: nodeIdsForZone('informatics'),
  }),
});
