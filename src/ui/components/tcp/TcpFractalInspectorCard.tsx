// ============================================================================
// RICIS-III TCP & FRACTAL INSPECTOR CARD COMPONENT
// MVVM Pattern, Clean Architecture, SOLID, DRY
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import React, { useMemo } from 'react';
import { Network, Layers, GitFork, ShieldCheck, Box } from 'lucide-react';
import { TypeConsistencyProtocolEngine } from '../../../model/typeConsistencyProtocolEngine';
import type {
  IRicisTypeSignature,
  IFractalUnfoldingNode,
} from '../../../model/typeConsistencyProtocol.contracts';
import type { ITcpFractalInspectorProps } from './tcpFractalInspector.contracts';

export const TcpFractalInspectorCard: React.FC<ITcpFractalInspectorProps> = ({
  nodeId,
  nodeTitle,
  formula,
  defaultKind = 'POLYNOMIAL_SYMBOL',
}) => {
  const engine = useMemo(() => new TypeConsistencyProtocolEngine(), []);

  const typeSignature: IRicisTypeSignature = useMemo(() => {
    return {
      kind: defaultKind,
      dimensions: [defaultKind],
    };
  }, [defaultKind]);

  // Unfold Fractal Law R(Q) up to depth 2
  const fractalTree: IFractalUnfoldingNode = useMemo(() => {
    return engine.unfoldFractalLaw(nodeId, typeSignature, 2);
  }, [engine, nodeId, typeSignature]);

  // Sample TCP Addition Test with Polynomial Monad
  const tcpSampleTest = useMemo(() => {
    return engine.executeSingularAddition(
      { index: nodeId, type: typeSignature, isInfinity: true },
      { index: '2x', type: { kind: 'POLYNOMIAL_SYMBOL' }, isInfinity: true }
    );
  }, [engine, nodeId, typeSignature]);

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 shadow-lg flex flex-col gap-3 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Type Consistency Protocol & Fractal Law
          </h4>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
          <ShieldCheck className="w-3 h-3" />
          <span>L1C2 VERIFIED</span>
        </div>
      </div>

      {/* Ontological Type Display */}
      <div className="flex items-center justify-between text-xs bg-slate-950/60 p-2 rounded-lg border border-slate-800/70">
        <div className="flex items-center gap-2">
          <Box className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-400">Node:</span>
          <span className="font-semibold text-slate-100">{nodeTitle}</span>
        </div>
        <div className="font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/50">
          {typeSignature.kind}
        </div>
      </div>

      {formula && (
        <div className="text-[11px] font-mono text-slate-300 bg-slate-950/40 px-2.5 py-1.5 rounded border border-slate-800">
          <span className="text-slate-500 mr-2">Origin:</span>
          {formula}
        </div>
      )}

      {/* TCP Compatibility Sample Test */}
      <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Совместимость TCP:</span>
          <span
            className={`font-mono font-semibold px-2 py-0.5 rounded text-[10px] ${
              tcpSampleTest.relation === 'HOMOGENEOUS'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : tcpSampleTest.relation === 'COMPATIBLE'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}
          >
            {tcpSampleTest.relation}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono mt-1">
          <span className="text-slate-500">∞_{nodeId} + ∞_2x =</span>
          <span className="text-purple-300 font-semibold">{tcpSampleTest.resolvedInvariant}</span>
        </div>
        {tcpSampleTest.isMonolithFormed && (
          <div className="text-[10px] text-amber-300/90 font-mono">
            * Order 1 Composite Monolith сформирован (L1C2)
          </div>
        )}
      </div>

      {/* Fractal Law R(Q) Visualization */}
      <div className="flex flex-col gap-1.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
          <GitFork className="w-3.5 h-3.5 text-purple-400" />
          <span>Fractal Law R(Q) Unfolding (Depth 2):</span>
        </div>
        <div className="font-mono text-[11px] flex flex-col gap-1 text-slate-300 pl-2 border-l border-purple-500/30">
          <div className="flex items-center gap-2">
            <span className="text-purple-400 font-bold">R({fractalTree.identity}):</span>
            <span className="text-slate-400">
              {'{'} {fractalTree.zeroMonad}, {fractalTree.infiniteMonad} {'}'}
            </span>
          </div>
          {fractalTree.subUnfoldingZero && (
            <div className="text-[10px] text-slate-400 pl-3 border-l border-slate-700">
              └─ Sub-Zero: <span className="text-emerald-400">{fractalTree.subUnfoldingZero.zeroMonad}</span>,{' '}
              <span className="text-cyan-400">{fractalTree.subUnfoldingZero.infiniteMonad}</span>
            </div>
          )}
          {fractalTree.subUnfoldingInfinite && (
            <div className="text-[10px] text-slate-400 pl-3 border-l border-slate-700">
              └─ Sub-Inf: <span className="text-emerald-400">{fractalTree.subUnfoldingInfinite.zeroMonad}</span>,{' '}
              <span className="text-cyan-400">{fractalTree.subUnfoldingInfinite.infiniteMonad}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
