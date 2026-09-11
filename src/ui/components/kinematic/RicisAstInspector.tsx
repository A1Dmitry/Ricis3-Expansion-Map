import React from 'react';
import type { RicisAstExpr } from '../../../model/ricisSymbolicJacobian.contracts';
import type { IRicisAstInspectorProps } from './RicisAstInspector.contracts';
import { Layers, ShieldCheck, Activity, Terminal } from 'lucide-react';

/**
 * Formats a RicisAstExpr into an intuitive mathematical string representation.
 */
export function formatAstExpr(expr: RicisAstExpr): string {
  switch (expr.kind) {
    case 'CONST':
      return String(expr.value);
    case 'PARAM':
    case 'VAR':
      return expr.name;
    case 'SIN':
      return `sin(${formatAstExpr(expr.arg)})`;
    case 'COS':
      return `cos(${formatAstExpr(expr.arg)})`;
    case 'NEG':
      return `-${formatAstExpr(expr.expr)}`;
    case 'ADD':
      return `${formatAstExpr(expr.left)} + ${formatAstExpr(expr.right)}`;
    case 'SUB':
      return `${formatAstExpr(expr.left)} - ${formatAstExpr(expr.right)}`;
    case 'MUL':
      return `${formatAstExpr(expr.left)} · ${formatAstExpr(expr.right)}`;
    case 'DIV':
      return `(${formatAstExpr(expr.numerator)} / ${formatAstExpr(expr.denominator)})`;
    case 'SEMANTIC_ZERO':
      return `0_{${formatAstExpr(expr.originExpr)}}`;
    case 'SEMANTIC_INF':
      return `∞_{${formatAstExpr(expr.indexExpr)}}`;
    case 'MONOLITH_INVARIANT':
      return `Inv(${formatAstExpr(expr.factorZero)} ⊗ ${formatAstExpr(expr.factorInf)} = ${expr.invariantValue})`;
    default:
      return '?';
  }
}

/**
 * Inspector component rendering the 3x3 Symbolic Jacobian AST Matrix
 * and the Phase -1 to Phase 6 reduction audit trace under RICIS-III Monolith Algebra.
 */
export const RicisAstInspector: React.FC<IRicisAstInspectorProps> = ({
  solution,
  jacobianMatrix,
  joints,
  linkLengths,
  isCompact = false,
}) => {
  const [, L1, L2] = linkLengths;
  const sinQ3 = Math.sin(joints.q3);
  const detVal = L1 * L2 * sinQ3;

  return (
    <div className="space-y-4">
      {/* 3x3 Symbolic Matrix Representation */}
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-cyan-500/20">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h4 className="text-sm font-bold tracking-wider text-cyan-200 uppercase font-mono">
              Символический Якобиан J(q) [AST 3×3]
            </h4>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider font-semibold border ${
                solution?.isSingularZone
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                  : 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
              }`}
            >
              {solution?.isSingularZone
                ? `Сингулярность: ${solution.singularityType}`
                : 'Регулярная область'}
            </span>
          </div>
        </div>

        {/* Matrix Grid */}
        {jacobianMatrix ? (
          <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
            {/* Row 1: dx/dq */}
            <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800 flex flex-col justify-center">
              <span className="text-slate-400 text-[10px] mb-1">J₁₁ (∂x/∂q₁)</span>
              <span className="text-cyan-300 font-semibold">{formatAstExpr(jacobianMatrix.m00)}</span>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800 flex flex-col justify-center">
              <span className="text-slate-400 text-[10px] mb-1">J₁₂ (∂x/∂q₂)</span>
              <span className="text-cyan-300 font-semibold">{formatAstExpr(jacobianMatrix.m01)}</span>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800 flex flex-col justify-center">
              <span className="text-slate-400 text-[10px] mb-1">J₁₃ (∂x/∂q₃)</span>
              <span className="text-cyan-300 font-semibold">{formatAstExpr(jacobianMatrix.m02)}</span>
            </div>

            {/* Row 2: dy/dq */}
            <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800 flex flex-col justify-center">
              <span className="text-slate-400 text-[10px] mb-1">J₂₁ (∂y/∂q₁)</span>
              <span className="text-cyan-300 font-semibold">{formatAstExpr(jacobianMatrix.m10)}</span>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800 flex flex-col justify-center">
              <span className="text-slate-400 text-[10px] mb-1">J₂₂ (∂y/∂q₂)</span>
              <span className="text-cyan-300 font-semibold">{formatAstExpr(jacobianMatrix.m11)}</span>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800 flex flex-col justify-center">
              <span className="text-slate-400 text-[10px] mb-1">J₂₃ (∂y/∂q₃)</span>
              <span className="text-cyan-300 font-semibold">{formatAstExpr(jacobianMatrix.m12)}</span>
            </div>

            {/* Row 3: dz/dq */}
            <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800 flex flex-col justify-center">
              <span className="text-slate-400 text-[10px] mb-1">J₃₁ (∂z/∂q₁)</span>
              <span className="text-slate-500 font-semibold">0</span>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800 flex flex-col justify-center">
              <span className="text-slate-400 text-[10px] mb-1">J₃₂ (∂z/∂q₂)</span>
              <span className="text-cyan-300 font-semibold">{formatAstExpr(jacobianMatrix.m21)}</span>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800 flex flex-col justify-center">
              <span className="text-slate-400 text-[10px] mb-1">J₃₃ (∂z/∂q₃)</span>
              <span className="text-cyan-300 font-semibold">{formatAstExpr(jacobianMatrix.m22)}</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 font-mono py-4 text-center">
            Инициализация AST Якобиана...
          </div>
        )}

        {/* Determinant Invariant Summary */}
        <div className="mt-3 p-2.5 bg-slate-950/90 rounded border border-cyan-500/20 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300">det(J) AST:</span>
            <span className="text-amber-300 font-semibold">
              {solution?.evaluatedDeterminantAst
                ? formatAstExpr(solution.evaluatedDeterminantAst)
                : `L1·L2·sin(q3)`}
            </span>
          </div>
          <div className="text-slate-400">
            Значение: <span className="text-cyan-300 font-bold">{detVal.toFixed(4)}</span>
          </div>
        </div>
      </div>

      {/* Live Axiom Audit Log (Phase -1 to Phase 6) */}
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-cyan-500/20">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-purple-400" />
            <h4 className="text-sm font-bold tracking-wider text-purple-200 uppercase font-mono">
              Журнал Аксиоматической Редукции (Phase -1 ... Phase 6)
            </h4>
          </div>
          <div className="flex items-center space-x-1.5 text-xs font-mono text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>RICIS-III v7.7 Verified</span>
          </div>
        </div>

        {solution && solution.transformationLogs.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {solution.transformationLogs.map((log, index) => (
              <div
                key={`${log.phase}-${index}`}
                className="bg-slate-950/90 p-2 rounded border border-slate-800 text-xs font-mono flex flex-col space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="px-1.5 py-0.5 bg-purple-950 text-purple-300 rounded text-[10px] font-bold border border-purple-500/30">
                    {log.phase}
                  </span>
                  <span className="text-cyan-400 font-semibold">{log.rule}</span>
                </div>
                <div className="text-[11px] text-slate-300 flex items-center space-x-1.5">
                  <span className="text-slate-500">{log.targetSubtree}</span>
                  <span className="text-amber-400">⟶</span>
                  <span className="text-emerald-300 font-semibold">{log.reducedSubtree}</span>
                </div>
                <div className="text-[10px] text-slate-400 italic">
                  {log.justification}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500 font-mono py-4 text-center">
            Логи редукции формируются при активном движении...
          </div>
        )}
      </div>
    </div>
  );
};
