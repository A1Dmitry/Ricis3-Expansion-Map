// ============================================================================
// RICIS-III TCP & FRACTAL UNFOLDING UI CONTRACTS (MVVM / CLEAN ARCHITECTURE)
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import type {
  IRicisTypeSignature,
  IFractalUnfoldingNode,
  ITcpOperationResult,
} from '../../../model/typeConsistencyProtocol.contracts';

export interface ITcpFractalViewModel {
  readonly seedNodeId: string;
  readonly seedTitle: string;
  readonly typeSignature: IRicisTypeSignature;
  readonly fractalTree: IFractalUnfoldingNode;
  readonly sampleAdditionTest: ITcpOperationResult<string>;
}

export interface ITcpFractalInspectorProps {
  readonly nodeId: string;
  readonly nodeTitle: string;
  readonly formula?: string;
  readonly defaultKind?: IRicisTypeSignature['kind'];
}
