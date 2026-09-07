// ============================================================================
// MODULE IN DEVELOPMENT STUB COMPONENT (Resilient Fallback Widget)
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import React from 'react';
import { Construction, Sparkles, Layers, Cpu, CheckCircle2, ArrowRight } from 'lucide-react';
import type { IKinematicModuleMetadata } from '../../../services/kinematic/kinematicIoc.contracts';

interface Props {
  readonly metadata?: IKinematicModuleMetadata;
  readonly reason?: 'IN_DEVELOPMENT' | 'NOT_FOUND' | 'CAPABILITY_UNSUPPORTED';
  readonly onFallbackToDefault?: () => void;
}

export const ModuleInDevelopmentStub: React.FC<Props> = ({
  metadata,
  reason = 'IN_DEVELOPMENT',
  onFallbackToDefault,
}) => {
  return (
    <div className="relative w-full h-full min-h-[380px] rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-slate-800 p-6 flex flex-col justify-between overflow-hidden shadow-2xl">
      {/* Background Decorative Pattern */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Badge */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Construction className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-100">
              {metadata ? metadata.name : 'Модуль в процессе разработки'}
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              DOF: {metadata?.dof ?? 'N'} • Статус:{' '}
              <span className="text-amber-400 font-bold">
                {reason === 'IN_DEVELOPMENT' ? 'IN DEVELOPMENT' : reason}
              </span>
            </p>
          </div>
        </div>

        {metadata?.plannedVersion && (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-purple-950/60 text-purple-300 border border-purple-800/60 shadow-inner flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Релиз: {metadata.plannedVersion}
          </span>
        )}
      </div>

      {/* Main Content Info */}
      <div className="my-4 space-y-3 z-10">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
          {metadata?.description ||
            'Данный кинематический модуль находится в стадии активной реализации в соответствии с шаблонами DRY/SOLID/IoC. Он станет доступен в следующих версиях приложения.'}
        </div>

        {/* Required Interfaces & Capabilities Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mb-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Целевые интерфейсы (Contracts):</span>
            </div>
            <ul className="space-y-1 text-[11px] font-mono text-cyan-300">
              {metadata?.requiredInterfaces && metadata.requiredInterfaces.length > 0 ? (
                metadata.requiredInterfaces.map((iface) => (
                  <li key={iface} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                    {iface}
                  </li>
                ))
              ) : (
                <li className="text-slate-500 italic">Базовый интерфейс IGenericKinematicManipulatorService</li>
              )}
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mb-2">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Поддерживаемые возможности (Capabilities):</span>
            </div>
            <ul className="space-y-1 text-[11px] font-mono text-purple-300">
              {metadata?.supportedCapabilities && metadata.supportedCapabilities.length > 0 ? (
                metadata.supportedCapabilities.map((cap) => (
                  <li key={cap} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-purple-400" />
                    {cap}
                  </li>
                ))
              ) : (
                <li className="text-slate-500 italic">Стандартная кинематика RICIS-III</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Footer / Fallback Action */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 z-10">
        <span className="text-[11px] text-slate-500 font-mono">
          IoC Isolation Guard: Приложение работает стабильно без сбоев.
        </span>
        {onFallbackToDefault && (
          <button
            onClick={onFallbackToDefault}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-md"
          >
            <span>Вернуться к 3-звенному модулю</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
