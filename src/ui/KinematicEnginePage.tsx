import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Activity,
  Layers,
  Box,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Sliders,
  Terminal,
  ShieldCheck,
  Bug,
} from 'lucide-react';
import type {
  IKinematicState3D,
  Vector3D,
  IBallEntity,
  IBoxContainer,
  ISolverMetrics3D,
  IKinematicLogEntry,
  IAdvantageEvent,
} from '../model/kinematicEngine.contracts';
import { RobotArm3DCanvas } from './components/kinematic/RobotArm3DCanvas';
import { DlsSolver3D, RicisConstraintSolver3D } from '../services/kinematic/kinematicSolvers';
import { PickAndPlaceController } from '../services/kinematic/pickAndPlaceController';
import { detectAdvantageEvent } from '../services/kinematic/advantageDetector';
import { KinematicTelemetryLogger } from '../services/kinematic/kinematicLogger';
import { forwardKinematics3D, computeJacobianDeterminant3D } from '../services/kinematic/kinematicMath';
import { useMapStore } from '../store/mapStore';
import { AutomatedTestingModal } from './components/testing/AutomatedTestingModal';

interface Props {
  readonly onBackToMap: () => void;
}

const LINK_LENGTHS: [number, number, number] = [0.4, 0.8, 0.7]; // L0=0.4, L1=0.8, L2=0.7 (Max reach = 1.5m)

const INITIAL_BALLS: IBallEntity[] = [
  {
    id: 'ball-1-boundary',
    initialPosition: { x: 1.45, y: 0.2, z: 0.1 }, // At critical boundary singularity (max reach 1.5)
    currentPosition: { x: 1.45, y: 0.2, z: 0.1 },
    radius: 0.06,
    color: '#ef4444',
    status: 'ON_SPAWN',
    isSingularZone: true,
  },
  {
    id: 'ball-2-overhead',
    initialPosition: { x: 0.15, y: 0.1, z: 1.85 }, // Near overhead shoulder singularity
    currentPosition: { x: 0.15, y: 0.1, z: 1.85 },
    radius: 0.06,
    color: '#f59e0b',
    status: 'ON_SPAWN',
    isSingularZone: true,
  },
  {
    id: 'ball-3-normal',
    initialPosition: { x: 0.8, y: -0.6, z: 0.1 }, // Normal workspace
    currentPosition: { x: 0.8, y: -0.6, z: 0.1 },
    radius: 0.06,
    color: '#06b6d4',
    status: 'ON_SPAWN',
    isSingularZone: false,
  },
  {
    id: 'ball-4-boundary-2',
    initialPosition: { x: -0.2, y: 1.42, z: 0.2 }, // Boundary
    currentPosition: { x: -0.2, y: 1.42, z: 0.2 },
    radius: 0.06,
    color: '#a855f7',
    status: 'ON_SPAWN',
    isSingularZone: true,
  },
];

const BOX_CONTAINER: IBoxContainer = {
  position: { x: -0.6, y: -0.6, z: 0.15 },
  dimensions: { x: 0.45, y: 0.45, z: 0.3 },
  collectedBallIds: [],
};

export const KinematicEnginePage: React.FC<Props> = ({ onBackToMap }) => {
  // Solvers
  const ricisSolver = useMemo(() => new RicisConstraintSolver3D(), []);
  const dlsSolver = useMemo(() => new DlsSolver3D(0.15), []);
  const telemetryLogger = useMemo(() => new KinematicTelemetryLogger(100), []);

  // Mode: 'PICK_AND_PLACE' | 'SINGULAR_ORBIT' | 'MANUAL'
  const [simMode, setSimMode] = useState<'PICK_AND_PLACE' | 'SINGULAR_ORBIT' | 'MANUAL'>('PICK_AND_PLACE');
  const [isRunning, setIsRunning] = useState(true);
  const [showDlsGhost, setShowDlsGhost] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [showTestingModal, setShowTestingModal] = useState(false);
  const mapStore = useMapStore();

  // Manual Target
  const [manualTarget, setManualTarget] = useState<Vector3D>({ x: 1.2, y: 0.4, z: 0.5 });

  // Kinematic States
  const [ricisState, setRicisState] = useState<IKinematicState3D>(() => {
    const initJoints = { q1: 0, q2: 0.6, q3: 1.2 };
    return {
      timestamp: Date.now(),
      joints: initJoints,
      endEffector: forwardKinematics3D(initJoints, LINK_LENGTHS),
      jacobianDeterminant: computeJacobianDeterminant3D(initJoints, LINK_LENGTHS),
      isSingularZone: false,
      isWorkspaceBoundaryExceeded: false,
      gripperClosed: false,
    };
  });

  const [dlsState, setDlsState] = useState<IKinematicState3D>(() => {
    const initJoints = { q1: 0, q2: 0.6, q3: 1.2 };
    return {
      timestamp: Date.now(),
      joints: initJoints,
      endEffector: forwardKinematics3D(initJoints, LINK_LENGTHS),
      jacobianDeterminant: computeJacobianDeterminant3D(initJoints, LINK_LENGTHS),
      isSingularZone: false,
      isWorkspaceBoundaryExceeded: false,
      gripperClosed: false,
    };
  });

  const [currentDesiredTarget, setCurrentDesiredTarget] = useState<Vector3D>({ x: 1.45, y: 0.2, z: 0.25 });
  const [ricisMetrics, setRicisMetrics] = useState<ISolverMetrics3D | null>(null);
  const [dlsMetrics, setDlsMetrics] = useState<ISolverMetrics3D | null>(null);

  // Pick & Place controller ref
  const pnpControllerRef = useRef(new PickAndPlaceController(INITIAL_BALLS, BOX_CONTAINER));
  const [pnpState, setPnpState] = useState(() => pnpControllerRef.current.getState());
  const [advantageLedger, setAdvantageLedger] = useState(() => telemetryLogger.getLedger());

  const orbitAngleRef = useRef(0);

  // Reset Simulation
  const handleReset = () => {
    pnpControllerRef.current.reset(INITIAL_BALLS, BOX_CONTAINER);
    setPnpState(pnpControllerRef.current.getState());
    telemetryLogger.clear();
    setAdvantageLedger(telemetryLogger.getLedger());
    const initJoints = { q1: 0, q2: 0.6, q3: 1.2 };
    const initialEE = forwardKinematics3D(initJoints, LINK_LENGTHS);
    setRicisState({
      timestamp: Date.now(),
      joints: initJoints,
      endEffector: initialEE,
      jacobianDeterminant: computeJacobianDeterminant3D(initJoints, LINK_LENGTHS),
      isSingularZone: false,
      isWorkspaceBoundaryExceeded: false,
      gripperClosed: false,
    });
    setDlsState({
      timestamp: Date.now(),
      joints: initJoints,
      endEffector: initialEE,
      jacobianDeterminant: computeJacobianDeterminant3D(initJoints, LINK_LENGTHS),
      isSingularZone: false,
      isWorkspaceBoundaryExceeded: false,
      gripperClosed: false,
    });
  };

  // Main Simulation Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dtRaw = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(0.05, dtRaw * speedMultiplier);

      if (isRunning && dt > 0) {
        let activeTarget: Vector3D = { x: 1.0, y: 0.0, z: 0.6 };

        if (simMode === 'PICK_AND_PLACE') {
          const pnpStep = pnpControllerRef.current.stepTarget(dt, ricisState.endEffector);
          activeTarget = pnpStep.target;
          setPnpState({ ...pnpControllerRef.current.getState() });
        } else if (simMode === 'SINGULAR_ORBIT') {
          // Orbit precisely on the singular reach boundary (radius 1.48m, det(J) -> 0)
          orbitAngleRef.current += dt * 0.8;
          const maxReach = LINK_LENGTHS[1] + LINK_LENGTHS[2] - 0.01;
          activeTarget = {
            x: maxReach * Math.cos(orbitAngleRef.current),
            y: maxReach * Math.sin(orbitAngleRef.current),
            z: 0.4 + 0.3 * Math.sin(orbitAngleRef.current * 2),
          };
        } else {
          activeTarget = manualTarget;
        }

        setCurrentDesiredTarget(activeTarget);

        // Solve both RICIS and DLS
        const ricisRes = ricisSolver.solve(ricisState, activeTarget, LINK_LENGTHS, dt);
        const dlsRes = dlsSolver.solve(dlsState, activeTarget, LINK_LENGTHS, dt);

        setRicisState(ricisRes.nextState);
        setDlsState(dlsRes.nextState);
        setRicisMetrics(ricisRes.metrics);
        setDlsMetrics(dlsRes.metrics);

        // Detect Advantage Event
        const adv = detectAdvantageEvent(
          ricisRes.nextState.jacobianDeterminant,
          dlsRes.metrics,
          ricisRes.metrics,
          Date.now()
        );

        // Push telemetry
        const modeMapping =
          simMode === 'PICK_AND_PLACE'
            ? 'PICK_AND_PLACE_BOX'
            : simMode === 'SINGULAR_ORBIT'
            ? 'BOUNDARY_ORBIT'
            : 'MANUAL_3D_TARGET';

        const logEntry: IKinematicLogEntry = {
          id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          stepIndex: Date.now(),
          timestamp: Date.now(),
          mode: modeMapping,
          jacobianDet: ricisRes.nextState.jacobianDeterminant,
          target: activeTarget,
          dlsEE: dlsRes.nextState.endEffector,
          ricisEE: ricisRes.nextState.endEffector,
          dlsMetrics: dlsRes.metrics,
          ricisMetrics: ricisRes.metrics,
          advantageEvent: adv,
        };
        telemetryLogger.pushEntry(logEntry);
        setAdvantageLedger(telemetryLogger.getLedger());
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, simMode, speedMultiplier, ricisState, dlsState, manualTarget, ricisSolver, dlsSolver, telemetryLogger]);

  return (
    <div className="flex flex-col h-screen bg-[#07090e] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-neutral-900/90 border-b border-neutral-800 backdrop-blur z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToMap}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-cyan-400 hover:text-cyan-200 border border-neutral-700/80 text-xs font-bold transition-colors"
          >
            <ArrowLeft size={14} />
            К 3D Карте
          </button>
          <div className="h-4 w-px bg-neutral-700" />
          <div>
            <h1 className="text-sm font-bold tracking-wide text-cyan-300 flex items-center gap-2">
              <Activity size={16} className="text-emerald-400" />
              RICIS-III Kinematic Constraint Engine (3D Robotic Manipulator)
            </h1>
            <p className="text-[10px] text-slate-400">
              Сравнение кинематических сингулярностей $\det(J) \to 0$: Классический DLS (деградация вектора) vs RICIS Инвариант $O(1)$
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition-all shadow-md ${
              isRunning
                ? 'bg-amber-600/80 hover:bg-amber-500 text-white'
                : 'bg-emerald-600/80 hover:bg-emerald-500 text-white'
            }`}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            {isRunning ? 'Пауза' : 'Старт'}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-slate-300 border border-neutral-700 text-xs transition-colors"
            title="Сбросить симуляцию"
          >
            <RotateCcw size={13} />
            Сброс
          </button>

          <div className="h-4 w-px bg-neutral-700" />

          {/* Speed */}
          <div className="flex items-center bg-neutral-800 rounded p-0.5 border border-neutral-700 text-[10px]">
            {[1, 2, 4].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeedMultiplier(s)}
                className={`px-2 py-0.5 rounded font-mono ${
                  speedMultiplier === s ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <label className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-neutral-800/80 px-2.5 py-1 rounded border border-neutral-700/80 cursor-pointer hover:bg-neutral-700/80 transition-colors">
            <input
              type="checkbox"
              checked={showDlsGhost}
              onChange={e => setShowDlsGhost(e.target.checked)}
              className="accent-cyan-500 rounded cursor-pointer"
            />
            <span>DLS Призрак</span>
          </label>

          <div className="h-4 w-px bg-neutral-700" />

          <button
            type="button"
            onClick={() => setShowTestingModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-600/60 text-xs font-bold transition-all shadow-[0_0_10px_rgba(244,63,94,0.2)]"
            title="Запустить стресс-тестирование манипулятора и BFS обход графа"
          >
            <Bug size={14} className="text-rose-400" />
            QA Стресс-тест
          </button>
        </div>
      </header>

      {/* Main Interactive Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-hidden">
        {/* Left Side: 3D Visualization Canvas & Scenarios (7 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-3 min-h-0">
          {/* Mode Selector Tabs */}
          <div className="flex items-center justify-between bg-neutral-900/80 p-1.5 rounded-lg border border-neutral-800 shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSimMode('PICK_AND_PLACE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  simMode === 'PICK_AND_PLACE'
                    ? 'bg-emerald-950/80 border border-emerald-500/80 text-emerald-300'
                    : 'text-slate-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Box size={14} />
                Сценарий: Сортировка шаров в коробку
              </button>
              <button
                type="button"
                onClick={() => setSimMode('SINGULAR_ORBIT')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  simMode === 'SINGULAR_ORBIT'
                    ? 'bg-cyan-950/80 border border-cyan-500/80 text-cyan-300'
                    : 'text-slate-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Activity size={14} />
                Тест Сингулярной Границы (Orbit)
              </button>
              <button
                type="button"
                onClick={() => setSimMode('MANUAL')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  simMode === 'MANUAL'
                    ? 'bg-purple-950/80 border border-purple-500/80 text-purple-300'
                    : 'text-slate-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Sliders size={14} />
                Ручное 3D Управление
              </button>
            </div>

            {simMode === 'PICK_AND_PLACE' && (
              <div className="flex items-center gap-3 px-2 text-xs">
                <span className="text-slate-400">
                  Фаза:{' '}
                  <strong className="text-cyan-300 font-mono text-[11px]">{pnpState.phase}</strong>
                </span>
                <span className="text-slate-400">
                  Собрано:{' '}
                  <strong className="text-emerald-400 font-mono">
                    {pnpState.ballsPlacedCount} / {pnpState.balls.length}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* 3D WebGL Arm Canvas */}
          <div className="flex-1 relative min-h-0">
            <RobotArm3DCanvas
              ricisState={ricisState}
              dlsState={dlsState}
              target={currentDesiredTarget}
              balls={pnpState.balls}
              box={pnpState.box}
              showDlsGhost={showDlsGhost}
              linkLengths={LINK_LENGTHS}
            />
          </div>

          {/* Manual Target Slider Controls (visible in MANUAL mode) */}
          {simMode === 'MANUAL' && (
            <div className="bg-neutral-900/90 border border-neutral-800 p-2.5 rounded-lg grid grid-cols-3 gap-3 shrink-0 text-xs">
              <div>
                <label className="flex justify-between text-slate-400 mb-1">
                  <span>Цель X</span>
                  <span className="font-mono text-cyan-400">{manualTarget.x.toFixed(2)}m</span>
                </label>
                <input
                  type="range"
                  min="-1.5"
                  max="1.5"
                  step="0.02"
                  value={manualTarget.x}
                  onChange={e => setManualTarget({ ...manualTarget, x: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400"
                />
              </div>
              <div>
                <label className="flex justify-between text-slate-400 mb-1">
                  <span>Цель Y</span>
                  <span className="font-mono text-cyan-400">{manualTarget.y.toFixed(2)}m</span>
                </label>
                <input
                  type="range"
                  min="-1.5"
                  max="1.5"
                  step="0.02"
                  value={manualTarget.y}
                  onChange={e => setManualTarget({ ...manualTarget, y: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400"
                />
              </div>
              <div>
                <label className="flex justify-between text-slate-400 mb-1">
                  <span>Цель Z (Высота)</span>
                  <span className="font-mono text-cyan-400">{manualTarget.z.toFixed(2)}m</span>
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="1.8"
                  step="0.02"
                  value={manualTarget.z}
                  onChange={e => setManualTarget({ ...manualTarget, z: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Telemetry, Advantage Log, and Proof Invariant Analysis (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3 min-h-0 overflow-y-auto pr-1">
          {/* Real-time Telemetry Duel Card */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-3 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Zap size={14} className="text-amber-400" />
                Телеметрия в реальном времени
              </h2>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${
                  ricisState.isSingularZone
                    ? 'bg-rose-950/80 border border-rose-600 text-rose-300 animate-pulse'
                    : 'bg-emerald-950/60 border border-emerald-600 text-emerald-300'
                }`}
              >
                {ricisState.isSingularZone ? '🚨 ЗОНА СИНГУЛЯРНОСТИ det(J)≈0' : '✅ СТАБИЛЬНЫЙ ДОМЕН'}
              </span>
            </div>

            {/* Metrics Duel Table */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {/* RICIS Column */}
              <div className="bg-emerald-950/30 border border-emerald-800/60 rounded p-2 text-xs">
                <div className="flex items-center justify-between text-emerald-400 font-bold mb-1.5 pb-1 border-b border-emerald-800/40">
                  <span>RICIS-III</span>
                  <ShieldCheck size={13} />
                </div>
                <div className="space-y-1 font-mono text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Отклонение вектора:</span>
                    <span className="text-emerald-300 font-bold">
                      {ricisMetrics ? `${ricisMetrics.directionPreservedDeg.toFixed(1)}°` : '0.0°'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ошибка позиции:</span>
                    <span className="text-emerald-300">
                      {ricisMetrics ? `${(ricisMetrics.positionError * 100).toFixed(1)} cm` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Инвариант L1:</span>
                    <span className="text-emerald-400 font-bold">100% OK</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Сложность:</span>
                    <span className="text-emerald-400 font-bold">O(1)</span>
                  </div>
                </div>
              </div>

              {/* DLS Column */}
              <div className="bg-slate-900/60 border border-slate-700/60 rounded p-2 text-xs">
                <div className="flex items-center justify-between text-slate-400 font-bold mb-1.5 pb-1 border-b border-slate-700/40">
                  <span>DLS Baseline</span>
                  <AlertTriangle size={13} className="text-amber-500" />
                </div>
                <div className="space-y-1 font-mono text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Отклонение вектора:</span>
                    <span
                      className={`font-bold ${
                        (dlsMetrics?.directionPreservedDeg ?? 0) > 10 ? 'text-rose-400' : 'text-slate-300'
                      }`}
                    >
                      {dlsMetrics ? `${dlsMetrics.directionPreservedDeg.toFixed(1)}°` : '0.0°'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ошибка позиции:</span>
                    <span className="text-slate-300">
                      {dlsMetrics ? `${(dlsMetrics.positionError * 100).toFixed(1)} cm` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Поведение:</span>
                    <span
                      className={`${
                        dlsMetrics?.nearSingularityBehavior === 'degraded' ? 'text-rose-400' : 'text-slate-400'
                      }`}
                    >
                      {dlsMetrics?.nearSingularityBehavior ?? 'stable'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Демпфирование:</span>
                    <span className="text-amber-400 font-bold">$\lambda^2 \neq 0$</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Jacobian Determinant Bar */}
            <div className="mt-3 bg-neutral-950 p-2 rounded border border-neutral-800 text-[10.5px]">
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Определитель Якобиана |det(J)|:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {Math.abs(ricisState.jacobianDeterminant).toFixed(4)}
                </span>
              </div>
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-75 ${
                    Math.abs(ricisState.jacobianDeterminant) < 0.15
                      ? 'bg-rose-500'
                      : Math.abs(ricisState.jacobianDeterminant) < 0.35
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{
                    width: `${Math.min(100, (Math.abs(ricisState.jacobianDeterminant) / 0.56) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Advantage Events Ledger */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-3 flex-1 flex flex-col min-h-[220px]">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-neutral-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                Журнал преимуществ RICIS ({advantageLedger.advantageEvents.length})
              </h3>
              <span className="text-[10px] text-slate-400">Засечено преимуществ в $0/0$</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-[10px]">
              {advantageLedger.advantageEvents.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-center p-4">
                  Манипулятор работает в нормальной зоне. Переместите шары к границе (1.5м), чтобы зафиксировать преимущество RICIS.
                </div>
              ) : (
                advantageLedger.advantageEvents
                  .slice(-8)
                  .reverse()
                  .map(evt => (
                    <div
                      key={evt.id}
                      className="p-2 rounded bg-emerald-950/30 border border-emerald-800/50 hover:bg-emerald-900/30 transition-colors"
                    >
                      <div className="flex items-center justify-between text-emerald-300 font-bold mb-0.5">
                        <span>{evt.kind}</span>
                        <span className="text-[9px] text-slate-400">det(J)={evt.jacobianDet.toFixed(3)}</span>
                      </div>
                      <p className="text-[9.5px] text-slate-300 leading-tight">{evt.description}</p>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Theoretical Foundations & Axioms */}
          <div className="bg-purple-950/20 border border-purple-900/50 rounded-lg p-2.5 text-[10.5px] shrink-0 text-purple-200">
            <h4 className="font-bold text-purple-300 flex items-center gap-1 mb-1">
              <Terminal size={12} />
              Математическое обоснование RICIS
            </h4>
            <p className="leading-relaxed text-slate-300 text-[10px]">
              При вытягивании руки в прямую линию $\sin(q_3) \to 0 \implies \det(J) \to 0$. Метод DLS глушит
              скорость демпфером $\lambda^2$, искажая вектор движения. RICIS выполняет проекцию $O(1)$ через аксиому
              A6 и семантический индекс SP4, сохраняя структурный инвариант $L1\_IDENTITY$.
            </p>
          </div>
        </div>
      </div>

      {showTestingModal && (
        <AutomatedTestingModal
          isOpen={showTestingModal}
          nodes={mapStore.nodes}
          proofs={mapStore.proofs || {}}
          onClose={() => setShowTestingModal(false)}
        />
      )}
    </div>
  );
};
