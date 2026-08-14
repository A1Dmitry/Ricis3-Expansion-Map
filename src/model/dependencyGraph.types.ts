import { MapState, ProblemNode, DependencyEdge, AgentLogEntry } from './types';

export type SingularityType = 
  | 'normal'                 
  | 'orphan'                 
  | 'cyclic_loop'            
  | 'broken_link'            
  | 'redundant_duplicate';    

export interface CodebaseIssue {
  filePath: string;
  type: 'unused_file' | 'duplicate_logic' | 'broken_import' | 'deprecated_method';
  severity: 'low' | 'medium' | 'high';
  description: string;
  reclaimedBytes: number;
}

export interface TransformationLog<T> {
  timestamp: string;
  operation: 'cancellation' | 'fold' | 'purge_orphan' | 'resolve_cycle' | 'purge_code_garbage';
  targetId: string;
  semanticIndexSP4: string;
  reclaimedMass: {
    costUnresolved: number;
    costToSolve: number;
  };
  details: string;
}

export interface AuditReportMonolith {
  isValid: boolean;
  
  // --- Раздел 1. Анализ Графа знаний ---
  totalInspected: number;
  orphans: ProblemNode[];
  cyclicGroups: ProblemNode[][];
  brokenEdges: DependencyEdge[];
  desyncedNodeIds: string[];
  duplicates: Array<{ primary: ProblemNode; redundant: ProblemNode[] }>;
  potentialReclaimedMass: {
    costUnresolved: number;
    costToSolve: number;
  };

  // --- Раздел 2. Анализ кодовой базы исходного приложения ---
  codebaseIssues: CodebaseIssue[];
  totalCodeSizeInBytes: number;
  potentialReclaimedCodeBytes: number;
}

export interface GarbageCollectionResult {
  mutatedState: MapState;
  
  // Очистка графа
  removedNodeIds: string[];
  removedEdgeIds: string[];
  healedNodeIds: string[];
  
  // Очистка кодовой базы
  removedFiles: string[];
  mergedFiles: Array<{ source: string; target: string }>;
  
  transformations: TransformationLog<string>[];
  agentLogs: AgentLogEntry[];
}

export interface IDependencyGraphAuditor {
  audit(state: MapState): AuditReportMonolith;
  computeSP4Index(node: ProblemNode): string;
  cleanGarbage(state: MapState, report: AuditReportMonolith): GarbageCollectionResult;
}
