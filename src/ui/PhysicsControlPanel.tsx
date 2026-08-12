import React from 'react';
import { useSliderController } from '../hooks/useSliderController';
import { PhysicsParams, DEFAULT_PHYSICS_PARAMS } from '../model/physics';
import { SlidersHorizontal, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface PhysicsControlPanelProps {
  params: PhysicsParams;
  onChange: (params: PhysicsParams) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function PhysicsControlPanel({
  params,
  onChange,
  isOpen = false,
  onToggle,
}: PhysicsControlPanelProps) {
  const { workingParams, status, updateValue, startInteraction, endInteraction, reset } = useSliderController<PhysicsParams>(
    params,
    onChange,
    800
  );

  const handleSliderChange = (prop: keyof PhysicsParams, val: number) => {
    if (isNaN(val)) return;
    updateValue(prop, val);
  };

  const handleReset = () => {
    reset(DEFAULT_PHYSICS_PARAMS);
  };

  const Slider = ({
    label,
    prop,
    min,
    max,
    step,
  }: {
    label: string;
    prop: keyof PhysicsParams;
    min: number;
    max: number;
    step: number;
  }) => (
    <div className="mb-2">
      <div className="flex items-center justify-between text-xs text-slate-200 mb-1">
        <span className="font-medium text-slate-200">{label}</span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={workingParams[prop] ?? 0}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              handleSliderChange(prop, isNaN(val) ? 0 : val);
            }}
            onFocus={startInteraction}
            onBlur={endInteraction}
            className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold text-emerald-300 bg-neutral-900 border border-neutral-700/80 rounded text-right focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50"
          />
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={workingParams[prop] ?? 0}
        onPointerDown={startInteraction}
        onPointerUp={endInteraction}
        onInput={(e) => handleSliderChange(prop, parseFloat((e.target as HTMLInputElement).value))}
        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 hover:accent-emerald-300 transition-colors"
      />
    </div>
  );

  return (
    <div className="w-full relative">
      <input type="checkbox" id="accordion-physics" className="accordion-trigger" />
      <label htmlFor="accordion-physics" className="accordion-header bg-neutral-950/80 hover:bg-neutral-900/90 transition-colors cursor-pointer w-full flex flex-col items-start px-3.5 py-2.5 h-auto rounded-none border-0 m-0" onClick={onToggle}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-emerald-400" />
            <span className="text-xs font-bold text-slate-100 uppercase tracking-wider accordion-title p-0">
              ФИЗИКА ПУЗЫРЕЙ
            </span>
          </div>
          <div className="flex items-center gap-2">
            {status !== 'IDLE' ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono bg-amber-950/80 text-amber-300 border border-amber-700/60 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>ОБНОВЛЕНИЕ</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono bg-neutral-900 border border-neutral-700 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>АКТИВНО</span>
              </span>
            )}
            <span className="accordion-icon" aria-hidden="true">▼</span>
          </div>
        </div>

        <div className="accordion-summary mt-2 pt-1.5 border-t border-neutral-800/40 flex flex-wrap gap-1.5 text-xs font-mono text-emerald-300 w-full">
          <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-slate-300">G Зон: <strong className="text-emerald-400">{workingParams.zoneG}</strong></span>
          <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-slate-300">G Узлов: <strong className="text-emerald-400">{workingParams.nodeG}</strong></span>
          <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-slate-300">k: <strong className="text-emerald-400">{workingParams.springK}</strong></span>
        </div>
      </label>

      <div className="accordion-content">
        <div className="accordion-inner p-3 text-xs text-slate-200 border-t border-neutral-800/60 space-y-3 bg-neutral-950/40 max-h-72 overflow-y-auto pr-1.5">
          <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Настройки точной физики
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-emerald-300 flex items-center gap-1 font-mono transition-colors cursor-pointer px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800"
              title="Сбросить физику к значениям по умолчанию"
            >
              <RefreshCw size={12} /> Сброс
            </button>
          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-3 space-y-2 shadow-sm">
            <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-neutral-800/80 pb-1 flex items-center justify-between">
              <span>Макро-пузыри (Зоны)</span>
              <span className="text-[10px] text-emerald-400 font-mono font-normal">Зональная симуляция</span>
            </h5>
            <Slider label="Отталкивание масс (G)" prop="zoneG" min={0} max={100} step={1} />
            <Slider label="Давление среды (G_ext)" prop="zoneGExt" min={0} max={100} step={1} />
            <Slider label="Зазор между зонами" prop="zoneSurfaceGap" min={0} max={100} step={5} />
          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-3 space-y-2 shadow-sm">
            <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-neutral-800/80 pb-1 flex items-center justify-between">
              <span>Микро-узлы (Задачи)</span>
              <span className="text-[10px] text-cyan-400 font-mono font-normal">Узловая графика</span>
            </h5>
            <Slider label="Отталкивание масс (G)" prop="nodeG" min={0} max={50} step={1} />
            <Slider label="Внешнее давление (G_ext)" prop="nodeGExt" min={0} max={20} step={0.5} />
            <Slider label="Жесткость пружин (k)" prop="springK" min={0} max={5} step={0.1} />
            <Slider label="Целевая длина пружин" prop="springRestGapMult" min={1} max={10} step={0.5} />
            <Slider label="Мин. зазор (узлы)" prop="minNodeSurfaceGap" min={1} max={20} step={1} />
          </div>
        </div>
      </div>
    </div>
  );
}
