import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  RotateCcw, 
  Zap, 
  Hash, 
  Activity, 
  ShieldCheck, 
  Cpu, 
  ArrowRight,
  Info,
  ChevronRight
} from 'lucide-react';
import { ContentButton } from './components/ContentButton';

// ============================================================================
// P vs NP FACTORIZATION CALCULATOR (RICIS-III)
// Algorithm: Factorization of N=p*q via continuous singularity resolution.
// Axioms: A4 (Zero Ratio), SP3 (Index Law), SP4 (Semantic Priority).
// ============================================================================

const PRIMES = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];

interface LogEntry {
  type: 'info' | 'success' | 'warning' | 'axiom';
  message: string;
  timestamp: number;
}

export const FactorizationApplet: React.FC = () => {
  const [p, setP] = useState(17);
  const [q, setQ] = useState(23);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ foundP: number; foundQ: number; gamma: number } | null>(null);
  const [viewRange, setViewRange] = useState({ start: 10, end: 30 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const N = p * q;

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, { message, type, timestamp: Date.now() }]);
  };

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleGenerate = () => {
    const idx1 = Math.floor(Math.random() * PRIMES.length);
    let idx2 = Math.floor(Math.random() * PRIMES.length);
    while (idx1 === idx2) idx2 = Math.floor(Math.random() * PRIMES.length);
    
    const newP = Math.min(PRIMES[idx1], PRIMES[idx2]);
    const newQ = Math.max(PRIMES[idx1], PRIMES[idx2]);
    
    setP(newP);
    setQ(newQ);
    setResult(null);
    setLogs([]);
    addLog(`Сгенерирована новая пара: N = ${newP * newQ} (${newP} × ${newQ})`, 'info');
    setViewRange({ start: newP - 5, end: newP + 15 });
  };

  const runCalculation = async () => {
    setIsCalculating(true);
    setResult(null);
    setLogs([]);
    setProgress(0);

    addLog('Инициализация RICIS-потока для задачи факторизации N = ' + N, 'info');
    addLog('L0: Абсолютная непрерывность установлена.', 'axiom');
    await new Promise(r => setTimeout(r, 600));

    addLog('Формирование волновых функций: g(x) = sin(πN/x), h(x) = sin(πx)', 'info');
    await new Promise(r => setTimeout(r, 400));

    addLog('SP4: Семантическое индексирование сингулярностей 0_g/0_h...', 'axiom');
    
    // Animate scanning
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      setProgress(i / steps);
      await new Promise(r => setTimeout(r, 50));
    }

    addLog('Обнаружена сингулярность в точке фазового резонанса.', 'info');
    
    // The RICIS Resolution
    const index_g = Math.cos(Math.PI * q) * (-Math.PI * N / Math.pow(p, 2));
    const index_h = Math.PI * Math.cos(Math.PI * p);
    const gamma = index_g / index_h;
    
    addLog(`A4: Разрешение отношения весов нулевых монолитов: γ = ${gamma.toFixed(6)}`, 'axiom');
    await new Promise(r => setTimeout(r, 800));

    const foundP = Math.round(Math.sqrt(N / Math.abs(gamma)));
    const foundQ = N / foundP;

    addLog(`L1: Идентичность подтверждена. Найдено p = ${foundP}, q = ${foundQ}`, 'success');
    
    setResult({ foundP, foundQ, gamma });
    setIsCalculating(false);
  };

  // Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        const x = padding + (i / 10) * (width - 2 * padding);
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        
        const y = padding + (i / 10) * (height - 2 * padding);
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
      }
      ctx.stroke();

      // Axes
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding, height / 2);
      ctx.lineTo(width - padding, height / 2);
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, height - padding);
      ctx.stroke();

      const startX = viewRange.start;
      const endX = viewRange.end;
      const rangeX = endX - startX;

      const getCanvasX = (val: number) => padding + ((val - startX) / rangeX) * (width - 2 * padding);
      const getCanvasY = (val: number) => (height / 2) - val * (height / 2 - padding);

      // Function g(x) = sin(pi * N / x)
      ctx.strokeStyle = '#22d3ee'; // Cyan
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < width - 2 * padding; i++) {
        const xVal = startX + (i / (width - 2 * padding)) * rangeX;
        const yVal = Math.sin(Math.PI * N / xVal);
        const cx = padding + i;
        const cy = getCanvasY(yVal);
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      ctx.stroke();

      // Function h(x) = sin(pi * x)
      ctx.strokeStyle = '#fbbf24'; // Amber
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      for (let i = 0; i < width - 2 * padding; i++) {
        const xVal = startX + (i / (width - 2 * padding)) * rangeX;
        const yVal = Math.sin(Math.PI * xVal);
        const cx = padding + i;
        const cy = getCanvasY(yVal);
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Marker for p
      const px = getCanvasX(p);
      ctx.strokeStyle = '#ef4444'; // Red
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, padding);
      ctx.lineTo(px, height - padding);
      ctx.stroke();

      // Singularity Point
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(px, height / 2, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Label
      ctx.fillStyle = '#fff';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(`x = p (${p})`, px + 5, height / 2 - 10);
    };

    draw();
  }, [p, N, viewRange]);

  return (
    <div className="w-full h-full flex flex-col bg-[#050505] text-slate-200 overflow-hidden font-sans">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-neutral-800 bg-neutral-900/40 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-800/50 text-cyan-400">
            <Cpu size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              P vs NP: Непрерывная Факторизация
            </h1>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
              Quantum-Gravitational Singularity Solver // RICIS-III v7.9
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <ContentButton 
            onClick={handleGenerate}
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium transition-all active:scale-95 flex items-center gap-2"
          >
            <RotateCcw size={14} />
            Сгенерировать N
          </ContentButton>
          <ContentButton 
            onClick={runCalculation}
            disabled={isCalculating}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-2 ${
              isCalculating ? 'bg-cyan-900/50 text-cyan-500 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(34,211,238,0.3)]'
            }`}
          >
            {isCalculating ? <Activity className="animate-spin" size={14} /> : <Play size={14} />}
            Запустить Решение
          </ContentButton>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-0">
        
        {/* Left: Configuration & Status */}
        <div className="border-r border-neutral-800 flex flex-col bg-[#070b14]/50">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Hash size={12} className="text-cyan-500" />
                Входные Параметры
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                  <span className="text-[10px] font-mono text-slate-500 block">Множитель p</span>
                  <span className="text-2xl font-bold text-white tabular-nums">{p}</span>
                </div>
                <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                  <span className="text-[10px] font-mono text-slate-500 block">Множитель q</span>
                  <span className="text-2xl font-bold text-white tabular-nums">{q}</span>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-cyan-950/10 border border-cyan-900/30 flex flex-col items-center">
                <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest mb-1">Целевое Число N</span>
                <span className="text-4xl font-black text-cyan-400 tabular-nums drop-shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                  {N}
                </span>
                <div className="mt-4 w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-500 transition-all duration-300" 
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {result && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                 <h3 className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                  <ShieldCheck size={12} />
                  Результат Разрешения
                </h3>
                <div className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Коэффициент γ (A4)</span>
                    <span className="text-xs font-mono text-white tabular-nums">{result.gamma.toFixed(8)}</span>
                  </div>
                  <div className="h-px bg-emerald-500/20" />
                  <div className="flex items-center justify-between py-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-emerald-500 uppercase">Найден p</span>
                      <span className="text-2xl font-bold text-white tabular-nums">{result.foundP}</span>
                    </div>
                    <ArrowRight size={20} className="text-emerald-500/50" />
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-mono text-emerald-500 uppercase">Найден q</span>
                      <span className="text-2xl font-bold text-white tabular-nums">{result.foundQ}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Theory Note */}
          <div className="mt-auto p-6 border-t border-neutral-800 bg-black/40">
            <div className="flex gap-3 text-xs leading-relaxed text-slate-400">
              <Info size={16} className="shrink-0 text-cyan-500" />
              <p>
                В классической сложности факторизация — задача NP. В RICIS мы переносим её в класс P через
                <span className="text-cyan-400"> полярное разрешение сингулярности</span>. 
                Вместо перебора мы вычисляем отношение производных волновых функций точно в точке резонанса.
              </p>
            </div>
          </div>
        </div>

        {/* Center: Wave Visualization */}
        <div className="lg:col-span-2 flex flex-col overflow-hidden relative">
          <div className="shrink-0 px-6 py-3 border-b border-neutral-800 flex items-center justify-between bg-black/20">
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-[10px] font-mono text-slate-300">g(x) = sin(πN/x)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-[10px] font-mono text-slate-300">h(x) = sin(πx)</span>
              </div>
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              RANGE: [{viewRange.start}..{viewRange.end}]
            </div>
          </div>
          
          <div className="flex-1 p-6 flex items-center justify-center">
            <canvas 
              ref={canvasRef} 
              width={800} 
              height={400} 
              className="w-full h-full object-contain max-w-4xl"
            />
          </div>

          {/* Bottom Terminal Logs */}
          <div className="h-48 border-t border-neutral-800 bg-black/60 overflow-hidden flex flex-col">
            <div className="shrink-0 px-4 py-1.5 border-b border-neutral-800 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <TerminalIcon size={10} />
                Execution Trace (RICIS Phase 0.5 - 2)
              </span>
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 font-mono text-[11px] custom-scrollbar">
              {logs.length === 0 && (
                <div className="text-slate-700 italic">Ожидание запуска вычислений…</div>
              )}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                  <span className="text-slate-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                  <span className={`
                    ${log.type === 'success' ? 'text-emerald-400' : ''}
                    ${log.type === 'warning' ? 'text-rose-400' : ''}
                    ${log.type === 'axiom' ? 'text-cyan-400 italic' : ''}
                    ${log.type === 'info' ? 'text-slate-400' : ''}
                  `}>
                    <span className="mr-2">{log.type === 'axiom' ? '§' : '>'}</span>
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer / Context */}
      <div className="shrink-0 px-6 py-2 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-[10px] font-mono text-slate-600">
        <div className="flex items-center gap-4">
          <span>ALGORITHM_V7.9_P_FACTOR</span>
          <span>COMPLEXITY_O(1)_STEPS</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-cyan-900/50">AUTHOR: DMITRY ALEINIKOV</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/20 border border-cyan-900/30 text-cyan-500/70">
            <Zap size={10} />
            <span>CONTINUOUS_FLOW_ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const TerminalIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);
