import React, { memo, useState } from 'react';
import { useSliderController } from '../hooks/useSliderController';
import { PhysicsParams, DEFAULT_PHYSICS_PARAMS } from '../model/physics';
import { SlidersHorizontal, RefreshCw, Save, Check } from 'lucide-react';
import { physicsStorageService } from '../services/physicsStorage';
import { useI18nStore } from '../store/useI18nStore';

interface PhysicsControlPanelProps {
  params: PhysicsParams;
  onChange: (params: PhysicsParams) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export interface PhysicsControlFieldsProps {
  readonly params: PhysicsParams;
  readonly onChange: (params: PhysicsParams) => void;
  readonly className?: string;
}

interface CustomRangeSliderProps {
  label: string;
  prop: keyof PhysicsParams;
  min: number;
  max: number;
  step: number;
  value: number;
  unit?: string;
  onChangeValue: (prop: keyof PhysicsParams, val: number) => void;
  onStart: () => void;
  onEnd: () => void;
}

/**
 * Изолированный компонент ползунка:
 * - Перемещение кружка бегунка происходит мгновенно и без задержек.
 * - Остановка распространения pointer/touch событий предотвращает вращение 3D-сцены.
 */
const CustomRangeSlider = memo(function CustomRangeSlider({
  label,
  prop,
  min,
  max,
  step,
  value,
  unit = '',
  onChangeValue,
  onStart,
  onEnd,
}: CustomRangeSliderProps) {
  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!Number.isNaN(val)) {
      onChangeValue(prop, val);
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChangeValue(prop, Number.isNaN(val) ? 0 : val);
  };

  return (
    <div
      className="space-y-1.5 p-2 rounded-md bg-neutral-950/60 border border-neutral-800/80 hover:border-neutral-700 transition-colors"
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between text-xs text-slate-200">
        <label htmlFor={`slider-${prop}`} className="font-medium text-slate-200 select-none cursor-pointer">
          {label}
        </label>
        <div className="flex items-center gap-1">
          <input
            id={`num-${prop}`}
            type="number"
            min={min}
            max={max}
            step={step}
            value={value ?? 0}
            onChange={handleNumberChange}
            onFocus={onStart}
            onBlur={onEnd}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold text-emerald-400 bg-neutral-900 border border-neutral-700 rounded text-right focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50"
          />
          {unit && <span className="text-[10px] text-slate-500 font-mono">{unit}</span>}
        </div>
      </div>

      <div className="relative flex items-center py-1">
        <input
          id={`slider-${prop}`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value ?? 0}
          onChange={handleRangeChange}
          onPointerDown={(e) => {
            e.stopPropagation();
            onStart();
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            onEnd();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            onStart();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            onEnd();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            onStart();
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
            onEnd();
          }}
          className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 hover:accent-emerald-300 active:accent-emerald-200 transition-all focus:outline-none"
        />
      </div>
    </div>
  );
});

/**
 * Единственный контент physics-настроек. Используется в старом аккордеоне
 * для обратной совместимости и в SettingsModal без дублирования inputs,
 * persistence или Save/Reset-обработчиков.
 */
export function PhysicsControlFields({
  params,
  onChange,
  className = '',
}: PhysicsControlFieldsProps) {
  const {
    workingParams,
    status,
    updateValue,
    startInteraction,
    endInteraction,
    reset,
  } = useSliderController<PhysicsParams>(params, onChange, 600);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSliderChange = (prop: keyof PhysicsParams, val: number) => {
    updateValue(prop, val);
  };

  const handleReset = () => {
    physicsStorageService.clear();
    reset(DEFAULT_PHYSICS_PARAMS);
  };

  const handleSave = () => {
    const ok = physicsStorageService.save(workingParams);
    if (ok) {
      setSaveSuccess(true);
      window.setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  return (
    <div
      className={`text-xs text-slate-200 space-y-3 ${className}`.trim()}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2">
        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
          Настройки точной физики
        </span>
        <div className="flex items-center gap-1.5">
          {status !== 'idle' && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono bg-amber-950/80 text-amber-300 border border-amber-700/60 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>ИЗМЕНЕНИЕ...</span>
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            className={`text-xs flex items-center gap-1 font-mono transition-all cursor-pointer px-2 py-0.5 rounded border ${
              saveSuccess
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'bg-neutral-900 border-neutral-800 text-slate-300 hover:text-emerald-300 hover:border-neutral-700'
            }`}
            title="Сохранить настройки физики для автозагрузки при старте"
          >
            {saveSuccess ? <Check size={12} className="text-emerald-400" /> : <Save size={12} />}
            <span>{saveSuccess ? 'Сохранено' : 'Save'}</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-rose-300 flex items-center gap-1 font-mono transition-colors cursor-pointer px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800"
            title="Сбросить физику к значениям по умолчанию"
          >
            <RefreshCw size={12} /> Сброс
          </button>
        </div>
      </div>

      <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-3 space-y-2.5 shadow-sm">
        <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-neutral-800/80 pb-1 flex items-center justify-between">
          <span>Макро-пузыри (Зоны)</span>
          <span className="text-[10px] text-emerald-400 font-mono font-normal">Зональная симуляция</span>
        </h5>
        <CustomRangeSlider label="Отталкивание масс (G)" prop="zoneG" min={0} max={100} step={1} value={workingParams.zoneG} onChangeValue={handleSliderChange} onStart={startInteraction} onEnd={endInteraction} />
        <CustomRangeSlider label="Давление среды (G_ext)" prop="zoneGExt" min={0} max={100} step={1} value={workingParams.zoneGExt} onChangeValue={handleSliderChange} onStart={startInteraction} onEnd={endInteraction} />
        <CustomRangeSlider label="Зазор между зонами" prop="zoneSurfaceGap" min={0} max={100} step={5} value={workingParams.zoneSurfaceGap} onChangeValue={handleSliderChange} onStart={startInteraction} onEnd={endInteraction} />
      </div>

      <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-3 space-y-2.5 shadow-sm">
        <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-neutral-800/80 pb-1 flex items-center justify-between">
          <span>Микро-узлы (Задачи)</span>
          <span className="text-[10px] text-cyan-400 font-mono font-normal">Узловая графика</span>
        </h5>
        <CustomRangeSlider label="Отталкивание масс (G)" prop="nodeG" min={0} max={50} step={1} value={workingParams.nodeG} onChangeValue={handleSliderChange} onStart={startInteraction} onEnd={endInteraction} />
        <CustomRangeSlider label="Внешнее давление (G_ext)" prop="nodeGExt" min={0} max={20} step={0.5} value={workingParams.nodeGExt} onChangeValue={handleSliderChange} onStart={startInteraction} onEnd={endInteraction} />
        <CustomRangeSlider label="Жесткость пружин (k)" prop="springK" min={0} max={5} step={0.1} value={workingParams.springK} onChangeValue={handleSliderChange} onStart={startInteraction} onEnd={endInteraction} />
        <CustomRangeSlider label="Целевая длина пружин" prop="springRestGapMult" min={1} max={10} step={0.5} value={workingParams.springRestGapMult} onChangeValue={handleSliderChange} onStart={startInteraction} onEnd={endInteraction} />
        <CustomRangeSlider label="Мин. зазор (узлы)" prop="minNodeSurfaceGap" min={1} max={20} step={1} value={workingParams.minNodeSurfaceGap} onChangeValue={handleSliderChange} onStart={startInteraction} onEnd={endInteraction} />
        <CustomRangeSlider label="Прозрачность связей" prop="edgeOpacity" min={0} max={1} step={0.05} value={workingParams.edgeOpacity} onChangeValue={handleSliderChange} onStart={startInteraction} onEnd={endInteraction} />
      </div>
    </div>
  );
}

/**
 * Legacy sidebar wrapper. Контент намеренно делегирован PhysicsControlFields,
 * чтобы экран настроек и accordion не расходились.
 */
export function PhysicsControlPanel({
  params,
  onChange,
  isOpen = false,
  onToggle,
}: PhysicsControlPanelProps) {
  const { t } = useI18nStore();

  return (
    <div
      className="w-full relative"
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        id="accordion-physics"
        className="accordion-trigger"
        defaultChecked={isOpen}
      />
      <label
        htmlFor="accordion-physics"
        className="accordion-header bg-neutral-950/80 hover:bg-neutral-900/90 transition-colors cursor-pointer w-full flex flex-col items-start px-3.5 py-2.5 h-auto rounded-none border-0 m-0"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-emerald-400" />
            <span className="text-xs font-bold text-slate-100 uppercase tracking-wider accordion-title p-0">
              {t('physics.title')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono bg-neutral-900 border border-neutral-700 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>ГОТОВО</span>
            </span>
            <span className="accordion-icon" aria-hidden="true">▼</span>
          </div>
        </div>

        <div className="accordion-summary mt-2 pt-1.5 border-t border-neutral-800/40 flex flex-wrap gap-1.5 text-xs font-mono text-emerald-300 w-full">
          <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-slate-300">G Зон: <strong className="text-emerald-400">{params.zoneG}</strong></span>
          <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-slate-300">G Узлов: <strong className="text-emerald-400">{params.nodeG}</strong></span>
          <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-slate-300">k: <strong className="text-emerald-400">{params.springK}</strong></span>
        </div>
      </label>

      <div className="accordion-content">
        <div className="accordion-inner p-3 border-t border-neutral-800/60 bg-neutral-950/40">
          <PhysicsControlFields params={params} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
