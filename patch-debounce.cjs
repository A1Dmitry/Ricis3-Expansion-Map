const fs = require('fs');
let code = fs.readFileSync('src/ui/PhysicsControlPanel.tsx', 'utf8');

const newCode = `import React, { useState, useEffect } from 'react';
import { PhysicsParams, DEFAULT_PHYSICS_PARAMS } from '../model/physics';
import { Settings2, X, RefreshCw } from 'lucide-react';

interface PhysicsControlPanelProps {
  params: PhysicsParams;
  onChange: (params: PhysicsParams) => void;
}

export function PhysicsControlPanel({ params, onChange }: PhysicsControlPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localParams, setLocalParams] = useState<PhysicsParams>(params);

  // Синхронизация при внешнем сбросе
  useEffect(() => {
    setLocalParams(params);
  }, [params]);

  // Троттлинг/Дебаунс 1 секунда перед отправкой наверх (пересчет физики)
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localParams);
    }, 1000);
    return () => clearTimeout(timer);
  }, [localParams, onChange]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-4 right-4 z-50 bg-slate-900/80 backdrop-blur text-slate-300 p-2 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition-colors"
        title="Настройки физики симуляции"
      >
        <Settings2 size={20} />
      </button>
    );
  }

  const handleChange = (key: keyof PhysicsParams, value: number) => {
    setLocalParams(prev => ({ ...prev, [key]: value }));
  };

  const reset = () => {
    const defaultP = { ...DEFAULT_PHYSICS_PARAMS };
    setLocalParams(defaultP);
    onChange(defaultP); // Сбрасываем сразу
  };

  const Slider = ({ label, prop, min, max, step }: { label: string, prop: keyof PhysicsParams, min: number, max: number, step: number }) => (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span className="font-mono text-emerald-400">{localParams[prop].toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={localParams[prop]}
        onChange={(e) => handleChange(prop, parseFloat(e.target.value))}
        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
      />
    </div>
  );

  return (
    <div className="absolute top-4 right-4 z-50 w-72 bg-slate-900/90 backdrop-blur rounded-lg border border-slate-700/50 shadow-2xl p-4 text-sm text-slate-200">
      <div className="flex justify-between items-center mb-4 border-b border-slate-700/50 pb-2">
        <h3 className="font-semibold text-emerald-400 flex items-center gap-2">
          <Settings2 size={16} /> Физика симуляции
        </h3>
        <div className="flex gap-2">
           <button onClick={reset} className="text-slate-400 hover:text-white" title="Сбросить">
             <RefreshCw size={16} />
           </button>
           <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
             <X size={16} />
           </button>
        </div>
      </div>

      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Макро-пузыри (Зоны)</h4>
          <Slider label="Отталкивание масс (G)" prop="zoneG" min={0} max={100} step={1} />
          <Slider label="Давление среды (G_ext)" prop="zoneGExt" min={0} max={100} step={1} />
          <Slider label="Зазор между зонами" prop="zoneSurfaceGap" min={0} max={100} step={5} />
        </div>

        <div className="pt-2 border-t border-slate-700/50">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Микро-узлы (Задачи)</h4>
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
`;

fs.writeFileSync('src/ui/PhysicsControlPanel.tsx', newCode);
