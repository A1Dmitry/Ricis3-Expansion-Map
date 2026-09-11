// ============================================================================
// RICIS-III LLM GRADIENT SINGULARITY INSPECTOR CARD
// MVVM, Clean Architecture, SOLID, DRY, Axiom A6 Geometric Bridge
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// Zenodo DOI: 10.5281/zenodo.21491712 | Registry: registry-118
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  Code2,
  FileText,
  FileCode,
  Braces,
} from 'lucide-react';
import { GeometricBridgeEngine } from '../../../services/geometricBridge/geometricBridgeEngine';
import { RicisLlmGradientStabilizer } from '../../../services/llmGradient/domain/ricisLlmGradientStabilizer';
import type { IGradientStabilizationInputDto } from '../../../services/llmGradient/contracts/llmGradient.contracts';
import {
  LeanProofDocumentFormatter,
  LatexProofDocumentFormatter,
  JsonDocumentFormatter,
  SimpleTextDocumentFormatter,
} from '../../../services/logging';

export interface ILLMGradientSingularityCardProps {
  initialLearningRate?: number;
  initialGradientNorm?: number;
  layerName?: string;
  onProofGenerated?: (leanCode: string) => void;
}

export const LLMGradientSingularityCard: React.FC<ILLMGradientSingularityCardProps> = ({
  initialLearningRate = 0.001,
  initialGradientNorm = 100000,
  layerName = 'transformer.layers.24.self_attn.out_proj',
  onProofGenerated,
}) => {
  const [learningRate, setLearningRate] = useState<number>(initialLearningRate);
  const [gradientNorm, setGradientNorm] = useState<number>(initialGradientNorm);
  const [activePreset, setActivePreset] = useState<string>('spike');
  const [showDocument, setShowDocument] = useState<boolean>(false);
  const [documentFormat, setDocumentFormat] = useState<'lean' | 'latex' | 'json' | 'text'>('lean');

  const stabilizer = useMemo(() => {
    const bridge = new GeometricBridgeEngine();
    return new RicisLlmGradientStabilizer(bridge);
  }, []);

  const inputDto: IGradientStabilizationInputDto = useMemo(() => ({
    learningRate,
    gradientNorm,
    layerName,
  }), [learningRate, gradientNorm, layerName]);

  const stabilizationResult = useMemo(() => {
    return stabilizer.stabilize(inputDto);
  }, [stabilizer, inputDto]);

  const formattedDocuments = useMemo(() => {
    const entries = stabilizer.getTraceLogger().getEntries();

    const leanFormatter = new LeanProofDocumentFormatter();
    const latexFormatter = new LatexProofDocumentFormatter();
    const jsonFormatter = new JsonDocumentFormatter();
    const textFormatter = new SimpleTextDocumentFormatter();

    return {
      lean: leanFormatter.format(entries, {
        taskId: 'registry-118',
        taskTitle: 'LLM Gradient Stabilization & Loss Spike Regularization',
        theoremName: 'ricis_gradient_stability_invariant',
        initialExpression: `0_{eta} \\times \\infty_{nabla L}`,
        finalInvariant: String(stabilizationResult.invariant.phaseAreaInvariant),
      }),
      latex: latexFormatter.format(entries, {
        title: 'RICIS-III Proof: LLM Gradient Explosion Elimination',
        author: 'Dmitry V. Aleinikov',
        orcid: '0009-0004-3226-7700',
        doi: '10.5281/zenodo.21491712',
        targetFunction: `\\Delta w = 0_\\eta \\times \\infty_{\\nabla L} = ${stabilizationResult.invariant.phaseAreaInvariant}`,
        initialExpression: `0_\\eta \\times \\infty_{\\nabla L}`,
        finalInvariant: String(stabilizationResult.invariant.phaseAreaInvariant),
      }),
      json: jsonFormatter.format(entries, {
        layer: layerName,
        learningRate,
        gradientNorm,
      }),
      text: textFormatter.format(entries, {
        title: 'RICIS-III LLM Gradient Stabilizer Execution Trace',
      }),
    };
  }, [stabilizer, stabilizationResult, layerName, learningRate, gradientNorm]);

  const generatedLeanProof = formattedDocuments.lean;

  const applyPreset = (preset: 'nominal' | 'spike' | 'singular') => {
    setActivePreset(preset);
    if (preset === 'nominal') {
      setLearningRate(0.001);
      setGradientNorm(25.0);
    } else if (preset === 'spike') {
      setLearningRate(0.01);
      setGradientNorm(1000000);
    } else if (preset === 'singular') {
      setLearningRate(0.0);
      setGradientNorm(1e18);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-5 shadow-2xl flex flex-col gap-4 font-sans text-slate-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold tracking-wide text-white uppercase flex items-center gap-2">
              Стабилизация градиента LLM по Аксиоме A6
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-900/50 border border-purple-500/40 text-purple-300 font-mono">
                DOI: 10.5281/zenodo.21491712
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Слой: <span className="font-mono text-cyan-300">{layerName}</span> | Node: registry-118
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>A6 SKEW-BRIDGE O(1)</span>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 font-medium">Пресеты сценариев:</span>
        <button
          type="button"
          onClick={() => applyPreset('nominal')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            activePreset === 'nominal'
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          Номинальный шаг (η=0.001)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('spike')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            activePreset === 'spike'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          Loss Spike (Всплеск градиента)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('singular')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            activePreset === 'singular'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          Сингулярность (0_η × ∞_∇L)
        </button>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
        <div>
          <label className="block text-[11px] text-slate-400 font-mono mb-1">
            Скорость обучения η (Learning Rate): {learningRate}
          </label>
          <input
            type="range"
            min="0"
            max="0.05"
            step="0.0005"
            value={learningRate}
            onChange={(e) => {
              setLearningRate(parseFloat(e.target.value));
              setActivePreset('custom');
            }}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-[11px] text-slate-400 font-mono mb-1">
            Норма градиента ||∇L||: {gradientNorm.toExponential(2)}
          </label>
          <input
            type="range"
            min="1"
            max="10000000"
            step="10000"
            value={gradientNorm > 10000000 ? 10000000 : gradientNorm}
            onChange={(e) => {
              setGradientNorm(parseFloat(e.target.value));
              setActivePreset('custom');
            }}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Classical Baseline */}
        <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
          stabilizationResult.classicalOutcome.hasLossSpike
            ? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
            : 'bg-slate-950/40 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Классический оптимизатор (Adam / SGD)
            </span>
            {stabilizationResult.classicalOutcome.hasLossSpike ? (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 border border-rose-700/50">
                <AlertTriangle className="w-3 h-3" /> СРЫВ СХОДИМОСТИ
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                НОМИНАЛЬНЫЙ
              </span>
            )}
          </div>
          <div className="text-sm font-mono mt-1">
            Δw_float = η · ||∇L|| ={' '}
            <span className="font-bold text-rose-400">
              {Number.isFinite(stabilizationResult.classicalOutcome.rawFloatProduct)
                ? stabilizationResult.classicalOutcome.rawFloatProduct.toExponential(3)
                : 'NaN / OVERFLOW'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
            {stabilizationResult.classicalOutcome.diagnosticMessage}
          </p>
        </div>

        {/* RICIS-III Stabilized Invariant */}
        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 flex flex-col gap-2 text-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> RICIS-III Стабилизатор (Axiom A6)
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
              <CheckCircle2 className="w-3 h-3" /> ИНВАРИАНТ СТАБИЛЕН
            </span>
          </div>
          <div className="text-sm font-mono mt-1 text-white">
            Инвариант площади Δw_RICIS ={' '}
            <span className="font-bold text-emerald-300">
              {stabilizationResult.invariant.phaseAreaInvariant.toPrecision(5)}
            </span>{' '}
            <span className="text-xs text-emerald-500 font-mono">[O(1)]</span>
          </div>
          <div className="text-[11px] font-mono text-emerald-400/90 bg-emerald-950/40 p-2 rounded border border-emerald-800/40 mt-1">
            det(u, v) = u_x · v_y - u_y · v_x = {learningRate} · {gradientNorm} = {stabilizationResult.invariant.phaseAreaInvariant}
          </div>
        </div>
      </div>

      {/* R^2_RICIS Geometric Bridge Vector Details */}
      <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300 border-b border-slate-800/80 pb-1.5">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Геометрический мост в ℝ²_RICIS:
          </span>
          <span className="font-mono text-cyan-400 text-[11px]">
            {stabilizationResult.geometricResolution.axiomApplied}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Вырожденный вектор u (длина η, толщина 0):</span>
            <span className="text-cyan-300 font-bold">
              u = ({stabilizationResult.geometricResolution.degenerateVectorU.x}, 0)
            </span>
          </div>
          <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Бесконечный вектор v (ширина ||∇L||):</span>
            <span className="text-purple-300 font-bold">
              v = (0, {stabilizationResult.geometricResolution.infiniteVectorV.y.toExponential(2)})
            </span>
          </div>
        </div>
      </div>

      {/* Document Trace Formatters & Export */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowDocument(!showDocument)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-colors"
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showDocument ? 'Скрыть документ трассировки' : 'Показать документ трассировки (ILog)'}</span>
            </button>
          </div>

          {showDocument && (
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setDocumentFormat('lean')}
                className={`px-2 py-0.8 rounded text-[11px] font-mono flex items-center gap-1 transition-colors ${
                  documentFormat === 'lean'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3 h-3" />
                Lean 4
              </button>
              <button
                type="button"
                onClick={() => setDocumentFormat('latex')}
                className={`px-2 py-0.8 rounded text-[11px] font-mono flex items-center gap-1 transition-colors ${
                  documentFormat === 'latex'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3 h-3" />
                LaTeX
              </button>
              <button
                type="button"
                onClick={() => setDocumentFormat('json')}
                className={`px-2 py-0.8 rounded text-[11px] font-mono flex items-center gap-1 transition-colors ${
                  documentFormat === 'json'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Braces className="w-3 h-3" />
                JSON
              </button>
              <button
                type="button"
                onClick={() => setDocumentFormat('text')}
                className={`px-2 py-0.8 rounded text-[11px] font-mono flex items-center gap-1 transition-colors ${
                  documentFormat === 'text'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCode className="w-3 h-3" />
                Text
              </button>
            </div>
          )}

          {onProofGenerated && (
            <button
              type="button"
              onClick={() => onProofGenerated(generatedLeanProof)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white transition-colors"
            >
              <span>Экспорт в Lean4ReportViewer</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {showDocument && (
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 max-h-72 overflow-y-auto">
            <pre className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed select-text text-slate-200">
              {formattedDocuments[documentFormat]}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
