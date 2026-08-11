import React, { useState } from 'react';
import { PhysicsParams } from '../model/physics';
import { Settings2, X, RefreshCw } from 'lucide-react';
import { usePhysicsSliderController } from '../services/physicsSliderService';

interface PhysicsControlPanelProps {
  params: PhysicsParams;
  onChange: (params: PhysicsParams) => void;
}

export function PhysicsControlPanel({ params, onChange }: PhysicsControlPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Подключение Бизнес-слоя ползунков (Business Layer / Idle Engine)
  // Таймаут ожидания состояния IDLE после окончания драга = 1.0 сек (1000 мс)
  const {
    workingParams,
    status,
    startInteraction,
    endInteraction,
    updateValue,
    reset,
  } = usePhysicsSliderController(params, onChange, 1000);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-4 right-4 z-50 bg-slate-900/80 backdrop-blur text-slate-300 p-2 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition-colors flex items-center gap-2"
        title="Настройки физики симуляции"
      >
        <Settings2 size={20} />
        {status !== 'IDLE' && (
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        )}
      </button>
    );
  }

  const renderStatusBadge = () => {
    switch (status) {
      case 'DRAGGING':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/60 animate-pulse">
            🟡 DRAGGING (Local)
          </span>
        );
      case 'PENDING_IDLE':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 animate-pulse">
            ⏳ WAITING 1S (Idle)
          </span>
        );
      case 'IDLE':
      default:
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            🟢 IDLE (Synced)
          </span>
        );
    }
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
    <div className="mb-3">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span className="font-mono text-emerald-400">
          {(workingParams[prop] ?? 0).toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={workingParams[prop] ?? 0}
        onPointerDown={(e) => {
          e.stopPropagation();
          startInteraction();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          startInteraction();
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          startInteraction();
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          endInteraction();
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          endInteraction();
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          endInteraction();
        }}
        onChange={(e) => {
          e.stopPropagation();
          updateValue(prop, parseFloat(e.target.value));
        }}
        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
      />
    </div>
  );

  return (
    <div
      className="absolute top-4 right-4 z-50 w-80 bg-slate-900/90 backdrop-blur rounded-lg border border-slate-700/50 shadow-2xl p-4 text-sm text-slate-200"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-3 border-b border-slate-700/50 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-emerald-400 flex items-center gap-1.5">
            <Settings2 size={16} /> Физика
          </h3>
          {renderStatusBadge()}
        </div>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="text-slate-400 hover:text-white transition-colors"
            title="Сбросить к умолчаниям"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Макро-пузыри (Зоны)
          </h4>
          <Slider label="Отталкивание масс (G)" prop="zoneG" min={0} max={100} step={1} />
          <Slider label="Давление среды (G_ext)" prop="zoneGExt" min={0} max={100} step={1} />
          <Slider label="Зазор между зонами" prop="zoneSurfaceGap" min={0} max={100} step={5} />
        </div>

        <div className="pt-2 border-t border-slate-700/50">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Микро-узлы (Задачи)
          </h4>
          <Slider label="Отталкивание масс (G)" prop="nodeG" min={0} max={50} step={1} />
          <Slider label="Внешнее давление (G_ext)" prop="nodeGExt" min={0} max={20} step={0.5} />
          <Slider label="Жесткость пружин (k)" prop="springK" min={0} max={5} step={0.1} />
          <Slider label="Целевая длина пружин" prop="springRestGapMult" min={1} max={10} step={0.5} />
          <Slider label="Мин. зазор (узлы)" prop="minNodeSurfaceGap" min={1} max={20} step={1} />
        </div>
      </div>
    </div>
  );
}
