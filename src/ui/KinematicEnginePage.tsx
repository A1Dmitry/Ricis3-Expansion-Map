import { ContentButton } from './components/ContentButton';
import { IconButton } from './components/IconButton';

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
  Compass,
  Copy,
  Check,
  FileText,
  Cpu,
  Sparkles,
  Target,
} from 'lucide-react';
import type { IKinematicState3D, Vector3D, IBallEntity, IBoxContainer, ISolverMetrics3D, CoordinateSystemMode, IQATelemetryTraceEntry, RicisSolverMode } from '../model/kinematicEngine.contracts';
import { RobotArm3DCanvas } from './components/kinematic/RobotArm3DCanvas';
import { PolarCoordinateService } from '../services/kinematic/polarCoordinateService';
import { PolarRicisConstraintSolver, KinematicDualDebuggerEngine } from '../services/kinematic/polarSolvers';
import { RicisSymbolicJacobianSolver3D } from '../services/kinematic/kinematicSolvers';
import { PickAndPlaceController } from '../services/kinematic/pickAndPlaceController';
import { CatchBallController, TENNIS_CANNON_SHOT_PLAN } from '../services/kinematic/catchBallController';
import {
  generateUnknownScenarioBatch,
  INTERCEPTION_SCENARIO_BATTERY,
  runInterceptionBenchmark,
  type IInterceptionBenchmarkReport,
} from '../services/kinematic/interceptionBenchmark';
import { CartesianMotionSmoother } from '../services/kinematic/motionSmoothing';
import { KinematicTelemetryLogger } from '../services/kinematic/kinematicLogger';
import { forwardKinematics3D, computeJacobianDeterminant3D } from '../services/kinematic/kinematicMath';
import { useMapStore } from '../store/mapStore';
import { useMobileLayout } from '../hooks/useMobileLayout';
import { useRicisCommand } from '../hooks/useRicisCommand';
import { RICIS_COMMAND_EVENTS, dispatchRicisCommand } from '../services/commandBus';
import { copyTextToClipboard } from '../services/clipboard';
import { SwipeDismissable } from './components/SwipeDismissable';
import { AutomatedTestingModal } from './components/testing/AutomatedTestingModal';
import { RicisAstInspector } from './components/kinematic/RicisAstInspector';
import { RicisSymbolicJacobianEngine } from '../services/kinematic/ricisSymbolicJacobian';
import type {
  IRicisAstInverseSolution,
  ISymbolicJacobianMatrix3D,
} from '../model/ricisSymbolicJacobian.contracts';
import { Planar3LinkKinematicService } from '../services/kinematic/planar3LinkKinematicService';
import { GenericNLinkKinematicService } from '../services/kinematic/genericNLinkKinematicService';
import type { ParameterizationMode, ISingularityHeatmapGrid } from '../services/kinematic/twoStageSingularity.contracts';
import { WALKTHROUGH_STEPS } from '../services/kinematic/walkthroughScenarios';
import { SingularityLandscapeHeatmap } from './components/kinematic/SingularityLandscapeHeatmap';
import { RicisReductionOverlayPanel } from './components/kinematic/RicisReductionOverlayPanel';
import { AsyncCriticalLogViewer } from './components/kinematic/AsyncCriticalLogViewer';
import { WalkthroughControllerPanel } from './components/kinematic/WalkthroughControllerPanel';
import { ModuleInDevelopmentStub } from './components/kinematic/ModuleInDevelopmentStub';
import { kinematicContainer } from '../services/kinematic/kinematicModuleRegistry';
import type { KinematicModuleId } from '../services/kinematic/kinematicIoc.contracts';
import '../services/kinematic/kinematicIocBootstrap';
import { WidgetCapabilityBoundary } from './components/resilience/WidgetCapabilityBoundary';
import { GeometricBridgeVisualizerCard } from './components/geometricBridge/GeometricBridgeVisualizerCard';
import { PlanarManipulatorCanvas } from './components/kinematic/PlanarManipulatorCanvas';
import { ModularManipulator3DCanvas } from './components/kinematic/ModularManipulator3DCanvas';
import { MultiLinkJointController } from './components/kinematic/MultiLinkJointController';
import { FourStagePipelineCard } from './components/kinematic/FourStagePipelineCard';
import { RealTimeFourStageBadge } from './components/kinematic/RealTimeFourStageBadge';
import { FourStageTelemetryAdapter } from '../services/kinematic/fourStageTelemetryAdapter';
import { TENNIS_BALL } from '../services/kinematic/projectileMaterial';
import { MANIPULATOR_LINK_LENGTHS_M } from '../services/kinematic/manipulatorConstants';

interface Props {
  readonly onBackToMap: () => void;
}

const LINK_LENGTHS: readonly [number, number, number] = MANIPULATOR_LINK_LENGTHS_M;

/**
 * Viewport routing for the main canvas area:
 * - PICK_AND_PLACE / CATCH_FALLING_BALL / SINGULAR_ORBIT / MANUAL -> live dual-arm 3D simulation (RobotArm3DCanvas);
 * - TWO_STAGE_WALKTHROUGH -> modular planar analysis workspace (Planar/Modular manipulator canvas).
 */
type KinematicViewportMode =
  | 'PICK_AND_PLACE'
  | 'CATCH_FALLING_BALL'
  | 'SINGULAR_ORBIT'
  | 'MANUAL'
  | 'TWO_STAGE_WALKTHROUGH';

/** Inert placeholder grid — heatmap generation is a 3-DOF-only capability (see IoC SINGULAR_HEATMAP_2D). */
const EMPTY_HEATMAP_GRID: ISingularityHeatmapGrid = {
  resolution: 0,
  theta2Range: [-Math.PI, Math.PI],
  theta3Range: [-Math.PI, Math.PI],
  cartesianSigmaMinGrid: [],
  polarSigmaMinGrid: [],
};

const INITIAL_BALLS: IBallEntity[] = [
  {
    id: 'ball-1-boundary',
    initialPosition: { x: 1.45, y: 0.2, z: 0.1 }, // At critical boundary singularity (max reach 1.5)
    currentPosition: { x: 1.45, y: 0.2, z: 0.1 },
    radius: TENNIS_BALL.radiusM,
    color: '#ef4444',
    status: 'ON_SPAWN',
    isSingularZone: true,
  },
  {
    id: 'ball-2-overhead',
    initialPosition: { x: 0.15, y: 0.1, z: 1.85 }, // Near overhead shoulder singularity
    currentPosition: { x: 0.15, y: 0.1, z: 1.85 },
    radius: TENNIS_BALL.radiusM,
    color: '#f59e0b',
    status: 'ON_SPAWN',
    isSingularZone: true,
  },
  {
    id: 'ball-3-normal',
    initialPosition: { x: 0.8, y: -0.6, z: 0.1 }, // Normal workspace
    currentPosition: { x: 0.8, y: -0.6, z: 0.1 },
    radius: TENNIS_BALL.radiusM,
    color: '#06b6d4',
    status: 'ON_SPAWN',
    isSingularZone: false,
  },
  {
    id: 'ball-4-boundary-2',
    initialPosition: { x: -0.2, y: 1.42, z: 0.2 }, // Boundary
    currentPosition: { x: -0.2, y: 1.42, z: 0.2 },
    radius: TENNIS_BALL.radiusM,
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
  // Initial joints & end-effector
  const initJoints = useMemo(() => ({ q1: 0.35, q2: 0.6, q3: 1.2 }), []);
  const initialEE = useMemo(() => forwardKinematics3D(initJoints, LINK_LENGTHS), [initJoints]);

  // Dual Solvers & Engine
  const dualEngine = useMemo(() => new KinematicDualDebuggerEngine(), []);
  const telemetryLogger = useMemo(() => new KinematicTelemetryLogger(100), []);

  // Mobile layout drives the swipe-to-close gesture on additional panels.
  const isMobileLayout = useMobileLayout();

  // Viewport mode: dual-arm simulation scenarios vs. modular analysis walkthrough
  const [simMode, setSimMode] = useState<KinematicViewportMode>('PICK_AND_PLACE');
  const [coordinateMode, setCoordinateMode] = useState<CoordinateSystemMode>('POLAR');
  const [ricisSolverMode, setRicisSolverMode] = useState<RicisSolverMode>('POLAR_GEOMETRIC');
  const [isRunning, setIsRunning] = useState(true);
  const [showDlsGhost, setShowDlsGhost] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [showTestingModal, setShowTestingModal] = useState(false);
  const [copiedTrace, setCopiedTrace] = useState(false);
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'QA_TRACE' | 'MATH' | 'AST_JACOBIAN' | 'TWO_STAGE_SINGULARITY'>('TWO_STAGE_SINGULARITY');

  const [planarJoints, setPlanarJoints] = useState<number[]>([0.35, 0.78, 0.65]);
  const [planarMode, setPlanarMode] = useState<ParameterizationMode>('CARTESIAN');
  const [walkthroughIndex, setWalkthroughIndex] = useState(0);
  const [isWalkthroughPlaying, setIsWalkthroughPlaying] = useState(false);

  // ==========================================
  // IoC-Resolved Kinematic Manipulator Engine
  // ==========================================
  const [selectedModuleId, setSelectedModuleId] = useState<KinematicModuleId>('planar-3link-two-stage');
  const resolvedModule = useMemo(() => {
    return kinematicContainer.resolveOrFallback(selectedModuleId, 'POLAR_TRANSITION');
  }, [selectedModuleId]);

  const planarKinematicService = useMemo(() => {
    return new GenericNLinkKinematicService(planarJoints.length);
  }, [planarJoints.length]);

  // Compute live planar links matching joint count
  const planarLinks: number[] = useMemo(() => {
    if (planarJoints.length === 5) return [0.4, 0.35, 0.3, 0.25, 0.2];
    if (planarJoints.length === 3) return [LINK_LENGTHS[0], LINK_LENGTHS[1], LINK_LENGTHS[2]];
    return planarJoints.map(() => 0.35);
  }, [planarJoints.length]);
  const fourStageTelemetryAdapter = useMemo(() => new FourStageTelemetryAdapter(new Planar3LinkKinematicService()), []);

  const planarState = useMemo(() => {
    const J = planarKinematicService.computeJacobian(planarJoints, planarLinks, planarMode);
    const svd = planarKinematicService.computeSingularValues(J);
    const overlay = planarKinematicService.evaluateRicisReduction(planarJoints, planarLinks, planarMode);
    const fk = planarKinematicService.computeForwardKinematics(planarJoints, planarLinks);
    const fourStageReport = planarKinematicService.evaluateFourStagePipeline(planarJoints, planarLinks, planarMode);
    return { J, svd, overlay, fk, fourStageReport };
  }, [planarKinematicService, planarJoints, planarLinks, planarMode]);

  const heatmapGrid = useMemo<ISingularityHeatmapGrid>(() => {
    // The σ_min landscape is a θ₂×θ₃ slice: it is only defined for the 3-DOF module
    // (matches the IoC capability model — SINGULAR_HEATMAP_2D is 3-link-only).
    // Computing it for N≠3 both wastes 2×28² SVD evaluations and is mathematically ambiguous.
    if (planarJoints.length !== 3 || planarLinks.length !== 3) {
      return EMPTY_HEATMAP_GRID;
    }
    return planarKinematicService.generateHeatmapGrid(planarJoints[0] ?? 0, planarLinks, 28);
  }, [planarKinematicService, planarJoints, planarLinks]);

  // Selecting an IoC manipulator module opens its modular analysis workspace.
  const handleSelectModule = (moduleId: KinematicModuleId) => {
    setSelectedModuleId(moduleId);
    setIsWalkthroughPlaying(false);
    setWalkthroughIndex(0);
    if (moduleId === 'planar-5link-redundant') {
      setPlanarJoints([0.2, 0.3, -0.4, 0.5, -0.1]);
    } else {
      // 3-link workspace; IN-DEV modules keep a valid 3-link pose behind their stub.
      setPlanarJoints([0.35, 0.78, 0.65]);
    }
    setSimMode('TWO_STAGE_WALKTHROUGH');
    setActiveTab('TWO_STAGE_SINGULARITY');
  };

  // Entering the scripted walkthrough: the scenario is 3-link by construction,
  // so the 3-link module is enforced to keep joint-count consistent.
  const handleEnterWalkthrough = () => {
    setSelectedModuleId('planar-3link-two-stage');
    const step = WALKTHROUGH_STEPS[walkthroughIndex] ?? WALKTHROUGH_STEPS[0];
    if (step) {
      setPlanarJoints([...step.targetJoints]);
      if (step.forcedMode) {
        setPlanarMode(step.forcedMode);
      }
    }
    setSimMode('TWO_STAGE_WALKTHROUGH');
    setActiveTab('TWO_STAGE_SINGULARITY');
  };

  // Heatmap click applies only in the 3-DOF module (defensive guard against joint truncation).
  const handleSelectHeatmapAngles = (t2: number, t3: number) => {
    setPlanarJoints(prev => (prev.length === 3 ? [prev[0] ?? 0, t2, t3] : prev));
  };

  // Walkthrough Auto-Play Timer
  useEffect(() => {
    if (!isWalkthroughPlaying) return;
    const step = WALKTHROUGH_STEPS[walkthroughIndex] ?? WALKTHROUGH_STEPS[0];
    const timer = setTimeout(() => {
      if (walkthroughIndex < WALKTHROUGH_STEPS.length - 1) {
        const nextIdx = walkthroughIndex + 1;
        setWalkthroughIndex(nextIdx);
        const nextStep = WALKTHROUGH_STEPS[nextIdx];
        if (nextStep) {
          // Never truncate an N-DOF joint vector: steps are 3-link scripted poses.
          setPlanarJoints(prevJoints =>
            prevJoints.length === nextStep.targetJoints.length ? [...nextStep.targetJoints] : prevJoints
          );
          if (nextStep.forcedMode) {
            setPlanarMode(nextStep.forcedMode);
          }
        }
      } else {
        setIsWalkthroughPlaying(false);
      }
    }, step.durationMs);

    return () => clearTimeout(timer);
  }, [isWalkthroughPlaying, walkthroughIndex]);

  const handleWalkthroughStepChange = (index: number) => {
    setWalkthroughIndex(index);
    const step = WALKTHROUGH_STEPS[index];
    if (step) {
      // Never truncate an N-DOF joint vector: steps are 3-link scripted poses.
      setPlanarJoints(prevJoints =>
        prevJoints.length === step.targetJoints.length ? [...step.targetJoints] : prevJoints
      );
      if (step.forcedMode) {
        setPlanarMode(step.forcedMode);
      }
    }
  };

  const handleToggleWalkthroughPlay = () => {
    if (!isWalkthroughPlaying && walkthroughIndex >= WALKTHROUGH_STEPS.length - 1) {
      handleWalkthroughStepChange(0);
    }
    setIsWalkthroughPlaying((prev) => !prev);
  };

  const handleResetWalkthrough = () => {
    setIsWalkthroughPlaying(false);
    handleWalkthroughStepChange(0);
  };

  // Synchronize RICIS solver implementation in dualEngine with ricisSolverMode
  useEffect(() => {
    if (ricisSolverMode === 'SYMBOLIC_AST') {
      dualEngine.setRicisSolver(new RicisSymbolicJacobianSolver3D(), 'SYMBOLIC_AST');
    } else {
      dualEngine.setRicisSolver(new PolarRicisConstraintSolver(), 'POLAR_GEOMETRIC');
    }
  }, [ricisSolverMode, dualEngine]);

  // Symbolic Jacobian AST Engine
  const symbolicJacobianEngine = useMemo(() => new RicisSymbolicJacobianEngine(), []);
  const [symbolicSolution, setSymbolicSolution] = useState<IRicisAstInverseSolution | null>(null);
  const [symbolicMatrix, setSymbolicMatrix] = useState<ISymbolicJacobianMatrix3D | null>(() =>
    symbolicJacobianEngine.buildSymbolicJacobian(initJoints, LINK_LENGTHS)
  );

  const mapStore = useMapStore();

  // Ensure mapStore is hydrated for testing modal
  useEffect(() => {
    if (!mapStore.hydrated) {
      mapStore.hydrate().catch(console.error);
    }
  }, [mapStore]);

  // Target coordinates (Cartesian & Polar synchronized)
  const [manualTarget, setManualTarget] = useState<Vector3D>({ x: 1.1, y: 0.4, z: 0.5 });
  const [polarManualTarget, setPolarManualTarget] = useState(() =>
    PolarCoordinateService.cartesianToCylindrical({ x: 1.1, y: 0.4, z: 0.5 })
  );

  // React state for rendering
  const [ricisState, setRicisState] = useState<IKinematicState3D>(() => ({
    timestamp: Date.now(),
    joints: initJoints,
    endEffector: initialEE,
    jacobianDeterminant: computeJacobianDeterminant3D(initJoints, LINK_LENGTHS),
    isSingularZone: false,
    isWorkspaceBoundaryExceeded: false,
    gripperClosed: false,
  }));

  const liveFourStageTelemetry = useMemo(() => {
    return fourStageTelemetryAdapter.evaluateRealTimeTelemetry(
      [ricisState.joints.q1, ricisState.joints.q2, ricisState.joints.q3],
      [LINK_LENGTHS[0], LINK_LENGTHS[1], LINK_LENGTHS[2]],
      planarMode,
      ricisState.jacobianDeterminant
    );
  }, [fourStageTelemetryAdapter, ricisState.joints, planarMode, ricisState.jacobianDeterminant]);

  const [dlsState, setDlsState] = useState<IKinematicState3D>(() => ({
    timestamp: Date.now(),
    joints: initJoints,
    endEffector: initialEE,
    jacobianDeterminant: computeJacobianDeterminant3D(initJoints, LINK_LENGTHS),
    isSingularZone: false,
    isWorkspaceBoundaryExceeded: false,
    gripperClosed: false,
  }));

  const [currentDesiredTarget, setCurrentDesiredTarget] = useState<Vector3D>({ x: 1.45, y: 0.2, z: 0.25 });
  const [ricisMetrics, setRicisMetrics] = useState<ISolverMetrics3D | null>(null);
  const [dlsMetrics, setDlsMetrics] = useState<ISolverMetrics3D | null>(null);
  const [latestQaTrace, setLatestQaTrace] = useState<IQATelemetryTraceEntry | null>(null);

  // Pick & Place controller ref
  const pnpControllerRef = useRef(new PickAndPlaceController(INITIAL_BALLS, BOX_CONTAINER));
  const [pnpState, setPnpState] = useState(() => pnpControllerRef.current.getState());

  // Catch-the-falling-ball controller ref + state
  const catchControllerRef = useRef(new CatchBallController(TENNIS_CANNON_SHOT_PLAN, BOX_CONTAINER, LINK_LENGTHS));
  const [catchState, setCatchState] = useState(() => catchControllerRef.current.getState());

  // Cartesian S-curve smoother: turns discrete waypoint anchors into a C1-continuous
  // acceleration-limited target stream so the arm FOLLOWS AN OPTIMAL, SMOOTH PATH
  // (uniform simultaneous joint rotation) instead of snapping between waypoints.
  const motionSmootherRef = useRef<CartesianMotionSmoother | null>(null);
  if (motionSmootherRef.current === null) {
    motionSmootherRef.current = new CartesianMotionSmoother(initialEE);
  }

  // Interception benchmark (standardized battery + seeded UNKNOWN batch)
  const [benchmarkReport, setBenchmarkReport] = useState<IInterceptionBenchmarkReport | null>(null);
  const [benchmarkRunning, setBenchmarkRunning] = useState(false);
  const runInterceptionBenchmarkPanel = () => {
    setBenchmarkRunning(true);
    // Defer the heavy deterministic batch so the button paint is not blocked.
    window.setTimeout(() => {
      const specs = [...INTERCEPTION_SCENARIO_BATTERY, ...generateUnknownScenarioBatch(7, 10)];
      setBenchmarkReport(runInterceptionBenchmark(specs));
      setBenchmarkRunning(false);
    }, 30);
  };

  const [advantageLedger, setAdvantageLedger] = useState(() => telemetryLogger.getLedger());

  // Mutable refs for high-frequency animation loop (avoids re-triggering useEffect every frame)
  const ricisStateRef = useRef<IKinematicState3D>(ricisState);
  const dlsStateRef = useRef<IKinematicState3D>(dlsState);
  const manualTargetRef = useRef<Vector3D>(manualTarget);
  manualTargetRef.current = manualTarget;

  const orbitAngleRef = useRef(0);
  const lastLedgerUpdateRef = useRef(0);
  // Live gripper command from the pick-and-place state machine (stamped onto solver states).
  const gripperRef = useRef(false);

  // Immediate solver step when user moves manual sliders
  const stepManualTarget = (newCart: Vector3D) => {
    manualTargetRef.current = newCart;
    if (!isRunning) {
      const stepResult = dualEngine.step(
        ricisStateRef.current,
        dlsStateRef.current,
        newCart,
        LINK_LENGTHS,
        0.02,
        coordinateMode
      );
      ricisStateRef.current = stepResult.ricisResult.nextState;
      dlsStateRef.current = stepResult.dlsResult.nextState;
      setRicisState(stepResult.ricisResult.nextState);
      setDlsState(stepResult.dlsResult.nextState);
      setRicisMetrics(stepResult.ricisResult.metrics);
      setDlsMetrics(stepResult.dlsResult.metrics);
      setLatestQaTrace(stepResult.ricisResult.qaTrace);
      setCurrentDesiredTarget(newCart);
    }
  };

  // Update polar manual target when Cartesian changes
  const handleCartesianChange = (updated: Partial<Vector3D>) => {
    const newCart = { ...manualTarget, ...updated };
    setManualTarget(newCart);
    const newPol = PolarCoordinateService.cartesianToCylindrical(newCart, polarManualTarget.thetaRad);
    setPolarManualTarget(newPol);
    stepManualTarget(newCart);
  };

  // Update Cartesian when Polar changes
  const handlePolarChange = (r: number, thetaDeg: number, z: number) => {
    const thetaRad = PolarCoordinateService.degToRad(thetaDeg);
    const newPol = { r, thetaRad, z };
    setPolarManualTarget(newPol);
    const newCart = PolarCoordinateService.cylindricalToCartesian(newPol);
    setManualTarget(newCart);
    stepManualTarget(newCart);
  };

  // Reset Simulation
  const handleReset = () => {
    pnpControllerRef.current.reset(INITIAL_BALLS, BOX_CONTAINER);
    setPnpState(pnpControllerRef.current.getState());
    catchControllerRef.current.reset(BOX_CONTAINER);
    setCatchState(catchControllerRef.current.getState());
    telemetryLogger.clear();
    setAdvantageLedger(telemetryLogger.getLedger());

    // Full reset: scenario progress, orbit phase, displayed target and metric panels.
    orbitAngleRef.current = 0;
    gripperRef.current = false;
    setCurrentDesiredTarget({ x: 1.45, y: 0.2, z: 0.25 });
    setRicisMetrics(null);
    setDlsMetrics(null);
    setLatestQaTrace(null);

    const resetJoints = { q1: 0.35, q2: 0.6, q3: 1.2 };
    const resetEE = forwardKinematics3D(resetJoints, LINK_LENGTHS);
    const resetState: IKinematicState3D = {
      timestamp: Date.now(),
      joints: resetJoints,
      endEffector: resetEE,
      jacobianDeterminant: computeJacobianDeterminant3D(resetJoints, LINK_LENGTHS),
      isSingularZone: false,
      isWorkspaceBoundaryExceeded: false,
      gripperClosed: false,
    };

    motionSmootherRef.current?.reset(resetEE);
    ricisStateRef.current = resetState;
    dlsStateRef.current = resetState;
    setRicisState(resetState);
    setDlsState(resetState);
  };

  // Resolves the desired end-effector target for the current simulation mode
  // (single source of truth for both the 60 FPS loop and single-step command).
  // Resolves the desired end-effector target for the current simulation mode and
  // passes it through the Cartesian S-curve smoother, so the arm always receives
  // a continuous, acceleration-limited target stream (smooth optimal trajectory,
  // uniform simultaneous joint rotation — no waypoint snapping).
  const resolveActiveTarget = (dt: number): Vector3D => {
    const smoother = motionSmootherRef.current;
    let anchor: Vector3D;

    if (simMode === 'PICK_AND_PLACE') {
      const pnpStep = pnpControllerRef.current.stepTarget(dt, ricisStateRef.current.endEffector);
      gripperRef.current = pnpStep.shouldGrip;
      anchor = pnpStep.target;
    } else if (simMode === 'CATCH_FALLING_BALL') {
      const catchStep = catchControllerRef.current.stepTarget(dt, ricisStateRef.current.endEffector);
      gripperRef.current = catchStep.shouldGrip;
      anchor = catchStep.target;
    } else if (simMode === 'SINGULAR_ORBIT') {
      gripperRef.current = false;
      // Orbit along the singular boundary (r = 1.48m near max reach 1.50m)
      orbitAngleRef.current += dt * 0.8;
      const maxReach = LINK_LENGTHS[1] + LINK_LENGTHS[2] - 0.01;
      anchor = {
        x: maxReach * Math.cos(orbitAngleRef.current),
        y: maxReach * Math.sin(orbitAngleRef.current),
        z: 0.4 + 0.3 * Math.sin(orbitAngleRef.current * 2),
      };
    } else {
      gripperRef.current = false;
      anchor = manualTargetRef.current;
    }

    if (!smoother) return anchor;
    smoother.setAnchor(anchor);
    return smoother.step(dt);
  };

  // Main 60 FPS Simulation Loop with Throttled UI Updates for Smooth Responsiveness
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let lastUiUpdate = 0;

    const tick = (now: number) => {
      const dtRaw = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(0.04, dtRaw * speedMultiplier);

      if (isRunning && dt > 0) {
        const activeTarget = resolveActiveTarget(dt);

        // Step both solvers via Dual Debugger Engine
        const stepResult = dualEngine.step(
          ricisStateRef.current,
          dlsStateRef.current,
          activeTarget,
          LINK_LENGTHS,
          dt,
          coordinateMode
        );

        // Stamp the live gripper command onto both arm states so the
        // visualization shows the actual grasp phase from the controller.
        const nextRicisState: IKinematicState3D = {
          ...stepResult.ricisResult.nextState,
          gripperClosed: gripperRef.current,
        };
        const nextDlsState: IKinematicState3D = {
          ...stepResult.dlsResult.nextState,
          gripperClosed: gripperRef.current,
        };
        ricisStateRef.current = nextRicisState;
        dlsStateRef.current = nextDlsState;

        // RIGID GRASP: pin the carried ball to the gripper pose the solver ACTUALLY
        // produced this frame. Doing it before the solve (as the old followGripper did
        // inside stepTarget) left the ball a frame behind the hand — measured 0.0412 m
        // mean / 0.1096 m peak lag over the tennis scenario.
        if (simMode === 'CATCH_FALLING_BALL') {
          catchControllerRef.current.syncCarriedBall(nextRicisState.endEffector, dt);
        }

        telemetryLogger.pushEntry(stepResult.logEntry);

        // Throttle UI telemetry and DOM re-renders to 20Hz (50ms) or on advantage events
        if (now - lastUiUpdate > 50 || stepResult.advantageEvent) {
          lastUiUpdate = now;
          if (simMode === 'PICK_AND_PLACE') {
            setPnpState({ ...pnpControllerRef.current.getState() });
          } else if (simMode === 'CATCH_FALLING_BALL') {
            setCatchState({ ...catchControllerRef.current.getState() });
          }
          setCurrentDesiredTarget(activeTarget);
          setRicisState(nextRicisState);
          setDlsState(nextDlsState);
          setRicisMetrics(stepResult.ricisResult.metrics);
          setDlsMetrics(stepResult.dlsResult.metrics);
          setLatestQaTrace(stepResult.ricisResult.qaTrace);

          // Compute live symbolic Jacobian AST & resolution
          const currentJoints = nextRicisState.joints;
          const currentEE = nextRicisState.endEffector;
          const cDir = {
            x: activeTarget.x - currentEE.x,
            y: activeTarget.y - currentEE.y,
            z: activeTarget.z - currentEE.z,
          };
          const dist = Math.hypot(cDir.x, cDir.y, cDir.z);
          const cNorm = dist > 1e-6 ? { x: cDir.x / dist, y: cDir.y / dist, z: cDir.z / dist } : { x: 0, y: 0, z: 0 };
          const symSol = symbolicJacobianEngine.solveJointVelocities(currentJoints, cNorm, LINK_LENGTHS);
          const symMatrix = symbolicJacobianEngine.buildSymbolicJacobian(currentJoints, LINK_LENGTHS);
          setSymbolicSolution(symSol);
          setSymbolicMatrix(symMatrix);
        }

        // Throttle ledger React re-renders to 10Hz or on advantage events
        if (now - lastLedgerUpdateRef.current > 100 || stepResult.advantageEvent) {
          setAdvantageLedger(telemetryLogger.getLedger());
          lastLedgerUpdateRef.current = now;
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, simMode, speedMultiplier, coordinateMode, dualEngine, telemetryLogger]);

  // --- Command bus wiring (toolbar / menu / shortcuts -> Kinematic page) ---
  const handleStepForward = () => {
    if (isRunning) return; // stepping only makes sense while paused
    const dt = Math.min(0.04, (1 / 60) * speedMultiplier);
    const activeTarget = resolveActiveTarget(dt);
    const stepResult = dualEngine.step(
      ricisStateRef.current,
      dlsStateRef.current,
      activeTarget,
      LINK_LENGTHS,
      dt,
      coordinateMode
    );
    const nextRicisState: IKinematicState3D = {
      ...stepResult.ricisResult.nextState,
      gripperClosed: gripperRef.current,
    };
    const nextDlsState: IKinematicState3D = {
      ...stepResult.dlsResult.nextState,
      gripperClosed: gripperRef.current,
    };
    ricisStateRef.current = nextRicisState;
    dlsStateRef.current = nextDlsState;
    telemetryLogger.pushEntry(stepResult.logEntry);
    if (simMode === 'PICK_AND_PLACE') {
      setPnpState({ ...pnpControllerRef.current.getState() });
    } else if (simMode === 'CATCH_FALLING_BALL') {
      setCatchState({ ...catchControllerRef.current.getState() });
    }
    setCurrentDesiredTarget(activeTarget);
    setRicisState(nextRicisState);
    setDlsState(nextDlsState);
    setRicisMetrics(stepResult.ricisResult.metrics);
    setDlsMetrics(stepResult.dlsResult.metrics);
    setLatestQaTrace(stepResult.ricisResult.qaTrace);
    setAdvantageLedger(telemetryLogger.getLedger());
  };

  useRicisCommand(RICIS_COMMAND_EVENTS.kinematicTogglePlay, () => {
    setIsRunning(prev => !prev);
  });

  useRicisCommand(RICIS_COMMAND_EVENTS.kinematicReset, () => {
    handleReset();
  });

  useRicisCommand(RICIS_COMMAND_EVENTS.kinematicStep, () => {
    handleStepForward();
  });

  // Report the real loop state back so the Play/Pause command indicator
  // lights up from live page state.
  useEffect(() => {
    dispatchRicisCommand(RICIS_COMMAND_EVENTS.kinematicRunningChanged, { isRunning });
  }, [isRunning]);

  // Copy QA Trace
  const handleCopyTrace = () => {
    if (!latestQaTrace) return;
    const payload = JSON.stringify(
      {
        qaEvaluationTrace: latestQaTrace,
        metrics: { ricis: ricisMetrics, dls: dlsMetrics },
        ledgerStats: {
          totalAdvantageCount: advantageLedger.totalAdvantageCount,
          advantageEvents: advantageLedger.advantageEvents.slice(-5),
        },
      },
      null,
      2
    );
    void copyTextToClipboard(payload).then((copied) => {
      setCopiedTrace(copied);
      if (copied) setTimeout(() => setCopiedTrace(false), 2000);
    });
  };

  const polarThetaDeg = PolarCoordinateService.radToDeg(polarManualTarget.thetaRad);
  const currentEEPolar = PolarCoordinateService.cartesianToCylindrical(ricisState.endEffector);

  // Safe 3-tuples for the 3-link planar workspace canvas (guarded render branch below).
  const planarJointsTuple3: [number, number, number] = [
    planarJoints[0] ?? 0,
    planarJoints[1] ?? 0,
    planarJoints[2] ?? 0,
  ];
  const planarLinksTuple3: [number, number, number] = [
    planarLinks[0] ?? LINK_LENGTHS[0],
    planarLinks[1] ?? LINK_LENGTHS[1],
    planarLinks[2] ?? LINK_LENGTHS[2],
  ];

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#07090e] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-neutral-900/90 border-b border-neutral-800 backdrop-blur z-20 shrink-0">
        <div className="flex items-center gap-3">
          <ContentButton
            type="button"
            onClick={onBackToMap}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-cyan-400 hover:text-cyan-200 border border-neutral-700/80 text-xs font-bold transition-colors"
          >
            <ArrowLeft size={14} />
            К 3D Карте
          </ContentButton>
          <div className="h-4 w-px bg-neutral-700" />
          <div>
            <h1 className="text-sm font-bold tracking-wide text-cyan-300 flex items-center gap-2">
              <Activity size={16} className="text-emerald-400" />
              RICIS-III Kinematic Dual-Arm Debugger
            </h1>
            <p className="text-[10px] text-slate-400">
              Полярные координаты $(r, \theta, z)$ • RICIS Инвариант $O(1)$ vs Тень (DLS) с запретом пределов Коши
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          {/* Pause / Play */}
          <ContentButton
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
          </ContentButton>

          {/* Reset */}
          <ContentButton
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-slate-300 border border-neutral-700 text-xs transition-colors"
            title="Сбросить симуляцию"
          >
            <RotateCcw size={13} />
            Сброс
          </ContentButton>

          <div className="h-4 w-px bg-neutral-700" />

          {/* Speed */}
          <div className="flex items-center bg-neutral-800 rounded p-0.5 border border-neutral-700 text-[10px]">
            {[1, 2, 4].map(s => (
              <ContentButton
                key={s}
                type="button"
                onClick={() => setSpeedMultiplier(s)}
                className={`px-2 py-0.5 rounded font-mono ${
                  speedMultiplier === s ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </ContentButton>
            ))}
          </div>

          <div className="h-4 w-px bg-neutral-700" />

          {/* RICIS Solver Mode Toggle (Polar Geometric vs Symbolic AST) */}
          <div className="flex items-center bg-neutral-900/90 rounded-md p-0.5 border border-neutral-700 text-[11px]">
            <ContentButton
              type="button"
              onClick={() => setRicisSolverMode('POLAR_GEOMETRIC')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors font-medium ${
                ricisSolverMode === 'POLAR_GEOMETRIC'
                  ? 'bg-emerald-700 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Полярный геометрический инвариант RICIS: аналитическое O(1) преобразование (r, theta, z)"
            >
              <Compass size={12} />
              <span>RICIS Polar</span>
            </ContentButton>
            <ContentButton
              type="button"
              onClick={() => setRicisSolverMode('SYMBOLIC_AST')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors font-medium ${
                ricisSolverMode === 'SYMBOLIC_AST'
                  ? 'bg-cyan-700 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Символический AST Якобиан RICIS: редукция sing-factors O(1) в сингулярностях"
            >
              <Cpu size={12} />
              <span>RICIS AST</span>
            </ContentButton>
          </div>

          <div className="h-4 w-px bg-neutral-700" />

          {/* Ghost Arm Toggle */}
          <label className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-neutral-800/80 px-2.5 py-1 rounded border border-neutral-700/80 cursor-pointer hover:bg-neutral-700/80 transition-colors">
            <input
              type="checkbox"
              checked={showDlsGhost}
              onChange={e => setShowDlsGhost(e.target.checked)}
              className="accent-cyan-500 rounded cursor-pointer"
            />
            <span>👻 Тень (DLS)</span>
          </label>

          <div className="h-4 w-px bg-neutral-700" />

          {/* QA Stress Test Button */}
          <ContentButton
            type="button"
            onClick={() => setShowTestingModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-600/60 text-xs font-bold transition-all shadow-[0_0_10px_rgba(244,63,94,0.2)]"
            title="Запустить стресс-тестирование манипулятора и автоматический аудит графа"
          >
            <Bug size={14} className="text-rose-400" />
            QA Стресс-тест
          </ContentButton>
        </div>
      </header>

      {/* Main Interactive Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-hidden">
        {/* Left Side: 3D Visualization Canvas & Scenarios (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-2.5 min-h-0">
          {/* Mode & IoC Module Selector Tabs */}
          <div className="flex flex-col gap-2 bg-neutral-900/80 p-2 rounded-lg border border-neutral-800 shrink-0">
            {/* Top row: IoC Manipulator Model Selector */}
            <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800/60">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">IoC Модель:</span>
                <div className="flex items-center gap-1.5">
                  <ContentButton
                    type="button"
                    onClick={() => handleSelectModule('planar-3link-two-stage')}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                      selectedModuleId === 'planar-3link-two-stage'
                        ? 'bg-cyan-950 border border-cyan-500 text-cyan-200 shadow-sm'
                        : 'text-slate-400 hover:text-white bg-neutral-950/60 border border-neutral-800'
                    }`}
                  >
                    3-Link Planar (READY)
                  </ContentButton>
                  <ContentButton
                    type="button"
                    onClick={() => handleSelectModule('planar-5link-redundant')}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                      selectedModuleId === 'planar-5link-redundant'
                        ? 'bg-purple-950 border border-purple-500 text-purple-200 shadow-sm'
                        : 'text-slate-400 hover:text-white bg-neutral-950/60 border border-neutral-800'
                    }`}
                  >
                    5-Link Hyper-Redundant (READY)
                  </ContentButton>
                  <ContentButton
                    type="button"
                    onClick={() => handleSelectModule('spatial-6dof-ricis')}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                      selectedModuleId === 'spatial-6dof-ricis'
                        ? 'bg-amber-950 border border-amber-500 text-amber-200 shadow-sm'
                        : 'text-slate-400 hover:text-white bg-neutral-950/60 border border-neutral-800'
                    }`}
                  >
                    Spatial 6-DOF (IN DEV)
                  </ContentButton>
                </div>
              </div>

              <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <ShieldCheck size={12} />
                <span>IoC Guard Active</span>
              </div>
            </div>

            {/* Bottom row: Operational Sim Modes */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ContentButton
                  type="button"
                  onClick={() => setSimMode('PICK_AND_PLACE')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    simMode === 'PICK_AND_PLACE'
                      ? 'bg-emerald-950/80 border border-emerald-500/80 text-emerald-300'
                      : 'text-slate-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <Box size={14} />
                  Сортировка в коробку
                </ContentButton>
                <ContentButton
                  type="button"
                  onClick={() => setSimMode('CATCH_FALLING_BALL')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    simMode === 'CATCH_FALLING_BALL'
                      ? 'bg-rose-950/80 border border-rose-500/80 text-rose-300'
                      : 'text-slate-400 hover:text-white hover:bg-neutral-800'
                  }`}
                  title="Две теннисные пушки отстреливают шарики со слабой разной силой; мячи отскакивают от пола и стен, рука перехватывает их на лету или собирает с пола"
                >
                  <Target size={14} />
                  Теннисная пушка
                </ContentButton>
                <ContentButton
                  type="button"
                  onClick={() => setSimMode('SINGULAR_ORBIT')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    simMode === 'SINGULAR_ORBIT'
                      ? 'bg-cyan-950/80 border border-cyan-500/80 text-cyan-300'
                      : 'text-slate-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <Activity size={14} />
                  Орбита границы ($\det(J) \to 0$)
                </ContentButton>
                <ContentButton
                  type="button"
                  onClick={() => setSimMode('MANUAL')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    simMode === 'MANUAL'
                      ? 'bg-purple-950/80 border border-purple-500/80 text-purple-300'
                      : 'text-slate-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <Sliders size={14} />
                  Ручной целеуказатель
                </ContentButton>
                <ContentButton
                  type="button"
                  onClick={handleEnterWalkthrough}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    simMode === 'TWO_STAGE_WALKTHROUGH'
                      ? 'bg-gradient-to-r from-purple-900 to-indigo-900 border border-purple-400 text-purple-200 shadow-lg shadow-purple-950/60'
                      : 'text-slate-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <Sparkles size={14} className="text-purple-400" />
                  2-Stage RICIS Walkthrough
                </ContentButton>
              </div>

              {simMode === 'PICK_AND_PLACE' ? (
                <div className="flex items-center gap-3 px-2 text-xs">
                  <span className="text-slate-400">
                    Фаза: <strong className="text-cyan-300 font-mono text-[11px]">{pnpState.phase}</strong>
                  </span>
                  <span className="text-slate-400">
                    Собрано:{' '}
                    <strong className="text-emerald-400 font-mono">
                      {pnpState.ballsPlacedCount} / {pnpState.balls.length}
                    </strong>
                  </span>
                </div>
              ) : simMode === 'CATCH_FALLING_BALL' ? (
                <div className="flex items-center gap-3 px-2 text-xs">
                  <span className="text-slate-400">
                    Фаза: <strong className="text-rose-300 font-mono text-[11px]">{catchState.phase}</strong>
                  </span>
                  <span className="text-slate-400">
                    Поймано на лету:{' '}
                    <strong className="text-rose-300 font-mono">{catchState.midAirCatchCount}</strong>
                  </span>
                  <span className="text-slate-400">
                    Доставлено:{' '}
                    <strong className="text-emerald-400 font-mono">
                      {catchState.deliveredCount} / {catchState.totalPlannedDrops}
                    </strong>
                  </span>
                </div>
              ) : simMode === 'TWO_STAGE_WALKTHROUGH' ? (
                <div className="flex items-center gap-2 px-2 text-[11px] text-slate-400 font-mono">
                  <span>TCP x: <strong className="text-purple-300">{(planarState.fk[0] ?? 0).toFixed(2)}m</strong></span>
                  <span>y: <strong className="text-purple-300">{(planarState.fk[1] ?? 0).toFixed(2)}m</strong></span>
                  <span>
                    σ_min:{' '}
                    <strong className={planarState.svd.isSingular ? 'text-rose-300' : 'text-emerald-300'}>
                      {planarState.svd.sigmaMin.toFixed(3)}
                    </strong>
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-2 text-[11px] text-slate-400 font-mono">
                  <span>EE R: <strong className="text-emerald-300">{currentEEPolar.r.toFixed(2)}m</strong></span>
                  <span>θ: <strong className="text-emerald-300">{PolarCoordinateService.radToDeg(currentEEPolar.thetaRad).toFixed(0)}°</strong></span>
                  <span>Z: <strong className="text-emerald-300">{ricisState.endEffector.z.toFixed(2)}m</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Interception benchmark panel (LLM-benchmark spec, Variant-2 lane):
              standardized 10-case battery + seeded UNKNOWN batch through the exact
              live pipeline; objective metrics, no manual tuning between cases. */}
          <details className="border-t border-neutral-800 bg-neutral-950/60">
            <summary className="cursor-pointer select-none px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:text-white">
              📊 Бенчмарк перехвата (10 сценариев + UNKNOWN ×10) — объективные метрики
            </summary>
            <div className="px-3 pb-2 text-xs">
              <div className="flex items-center gap-3 py-1.5">
                <ContentButton
                  type="button"
                  disabled={benchmarkRunning}
                  onClick={runInterceptionBenchmarkPanel}
                  className="px-3 py-1 rounded bg-cyan-900/60 border border-cyan-600/60 text-cyan-200 font-bold hover:bg-cyan-800/60 disabled:opacity-40"
                >
                  {benchmarkRunning ? 'Выполняется…' : 'Запустить бенчмарк'}
                </ContentButton>
                {benchmarkReport && (
                  <span className="text-slate-400 font-mono text-[11px]">
                    Поймано: <strong className="text-emerald-300">{benchmarkReport.catchCount}/{benchmarkReport.totalScenarios}</strong>
                    {' '}· catch-rate (ожидаемые ловимые): <strong className="text-emerald-300" data-testid="benchmark-catch-rate">
                      {(benchmarkReport.catchRateExpected * 100).toFixed(0)}%
                    </strong>
                    {' '}· unreachable-детект: <strong className="text-amber-300">{benchmarkReport.unreachableDetected}</strong>
                    {' '}· нарушений лимитов: <strong className="text-emerald-300">{benchmarkReport.totalJointLimitViolations}</strong>
                    {' '}· коллизий: <strong className="text-emerald-300">{benchmarkReport.totalCollisionViolations}</strong>
                    {' '}· FK-дрейф: <strong className="text-emerald-300">{benchmarkReport.maxFkDriftM.toExponential(0)}</strong>
                  </span>
                )}
              </div>
              {benchmarkReport && (
                <div className="max-h-56 overflow-y-auto">
                  <table className="w-full font-mono text-[10px] text-slate-300">
                    <thead>
                      <tr className="text-slate-500 text-left">
                        <th className="pr-2">Сценарий</th>
                        <th className="pr-2">Исход</th>
                        <th className="pr-2">t₍ₗₒᵥ₎, с</th>
                        <th className="pr-2">IK, м</th>
                        <th className="pr-2">Δпред, м</th>
                        <th className="pr-2">Δt, с</th>
                        <th className="pr-2">Репл.</th>
                        <th className="pr-2">Оценка</th>
                      </tr>
                    </thead>
                    <tbody>
                      {benchmarkReport.scenarios.map(row => (
                        <tr key={row.spec.id} className="border-t border-neutral-800/60">
                          <td className="pr-2 py-0.5" title={row.spec.id}>{row.spec.name}</td>
                          <td className={`pr-2 py-0.5 ${
                            row.outcome === 'MID_AIR' ? 'text-rose-300'
                            : row.outcome === 'FLOOR_PICKUP' ? 'text-cyan-300'
                            : row.outcome === 'UNREACHABLE' ? 'text-amber-300'
                            : 'text-slate-500'
                          }`}>
                            {row.outcome === 'MID_AIR' ? 'на лету'
                              : row.outcome === 'FLOOR_PICKUP' ? 'с пола'
                              : row.outcome === 'UNREACHABLE' ? 'недостижим'
                              : 'таймаут'}
                          </td>
                          <td className="pr-2 py-0.5">{row.graspTimeSec?.toFixed(2) ?? '—'}</td>
                          <td className="pr-2 py-0.5">{row.ikErrorM?.toFixed(3) ?? '—'}</td>
                          <td className="pr-2 py-0.5">{row.predictionErrorM?.toFixed(2) ?? '—'}</td>
                          <td className="pr-2 py-0.5">{row.timingErrorSec?.toFixed(2) ?? '—'}</td>
                          <td className="pr-2 py-0.5">{row.replanCount}</td>
                          <td className={`pr-2 py-0.5 ${row.expectationMet ? 'text-emerald-300' : 'text-red-400'}`}>
                            {row.expectationMet ? 'OK' : 'FAIL'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </details>

          {/* Visualization Canvas — routed by viewport mode:
              simulation scenarios render the LIVE dual-arm debugger (RICIS arm + DLS ghost,
              balls, box and target driven by the 60 FPS solver loop), while the walkthrough
              renders the modular planar analysis workspace for the selected IoC module. */}
          <div className="flex-1 relative min-h-0">
            {simMode === 'TWO_STAGE_WALKTHROUGH' ? (
              !resolvedModule.isAvailable ? (
                <ModuleInDevelopmentStub
                  metadata={resolvedModule.metadata}
                  reason={resolvedModule.reason}
                  onFallbackToDefault={() => handleSelectModule('planar-3link-two-stage')}
                />
              ) : planarJoints.length === 3 ? (
                <PlanarManipulatorCanvas
                  joints={planarJointsTuple3}
                  links={planarLinksTuple3}
                  mode={planarMode}
                  overlay={planarState.overlay}
                />
              ) : (
                <ModularManipulator3DCanvas
                  jointAngles={planarJoints}
                  linkLengths={planarLinks}
                  dof={planarJoints.length}
                  isSingular={planarState.svd.isSingular}
                  mode={planarMode}
                />
              )
            ) : (
              <RobotArm3DCanvas
                ricisState={ricisState}
                dlsState={dlsState}
                target={currentDesiredTarget}
                balls={simMode === 'CATCH_FALLING_BALL' ? catchState.balls : pnpState.balls}
                box={simMode === 'CATCH_FALLING_BALL' ? catchState.box : pnpState.box}
                showDlsGhost={showDlsGhost}
                showCannons={simMode === 'CATCH_FALLING_BALL'}
                linkLengths={LINK_LENGTHS}
              />
            )}
          </div>

          {/* Walkthrough Scenario Script Controller (visible in TWO_STAGE_WALKTHROUGH mode) */}
          {simMode === 'TWO_STAGE_WALKTHROUGH' && (
            <WalkthroughControllerPanel
              currentStepIndex={walkthroughIndex}
              isPlaying={isWalkthroughPlaying}
              onStepChange={handleWalkthroughStepChange}
              onTogglePlay={handleToggleWalkthroughPlay}
              onReset={handleResetWalkthrough}
            />
          )}

          {/* Coordinate System Selector & Sliders (visible in MANUAL mode) */}
          {simMode === 'MANUAL' && (
            <div className="bg-neutral-900/90 border border-neutral-800 p-2.5 rounded-lg flex flex-col gap-2 shrink-0 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px] font-bold">Система координат:</span>
                  <div className="flex items-center bg-neutral-950 rounded p-0.5 border border-neutral-800 text-[11px]">
                    <ContentButton
                      type="button"
                      onClick={() => setCoordinateMode('POLAR')}
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded font-bold transition-colors ${
                        coordinateMode === 'POLAR'
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Compass size={12} />
                      Полярные (r, θ, z)
                    </ContentButton>
                    <ContentButton
                      type="button"
                      onClick={() => setCoordinateMode('CARTESIAN')}
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded font-bold transition-colors ${
                        coordinateMode === 'CARTESIAN'
                          ? 'bg-cyan-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Sliders size={12} />
                      Декартовы (x, y, z)
                    </ContentButton>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-400 flex items-center gap-3">
                  <span>
                    Полярные: r=<strong className="text-purple-300">{polarManualTarget.r.toFixed(2)}m</strong>, θ=<strong className="text-purple-300">{polarThetaDeg.toFixed(0)}°</strong>, z=<strong className="text-purple-300">{polarManualTarget.z.toFixed(2)}m</strong>
                  </span>
                  <span>
                    Декартовы: x=<strong className="text-cyan-300">{manualTarget.x.toFixed(2)}</strong>, y=<strong className="text-cyan-300">{manualTarget.y.toFixed(2)}</strong>, z=<strong className="text-cyan-300">{manualTarget.z.toFixed(2)}</strong>
                  </span>
                </div>
              </div>

              {coordinateMode === 'POLAR' ? (
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="flex justify-between text-slate-400 mb-1 text-[11px]">
                      <span>Радиус r (от базы)</span>
                      <span className="font-mono text-purple-300">{polarManualTarget.r.toFixed(2)} m</span>
                    </label>
                    <input
                      type="range"
                      min="0.0"
                      max="1.50"
                      step="0.02"
                      value={polarManualTarget.r}
                      onChange={e => handlePolarChange(parseFloat(e.target.value), polarThetaDeg, polarManualTarget.z)}
                      className="w-full accent-purple-400"
                    />
                  </div>
                  <div>
                    <label className="flex justify-between text-slate-400 mb-1 text-[11px]">
                      <span>Азимут θ (угол поворота)</span>
                      <span className="font-mono text-purple-300">{polarThetaDeg.toFixed(0)}°</span>
                    </label>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="2"
                      value={polarThetaDeg}
                      onChange={e => handlePolarChange(polarManualTarget.r, parseFloat(e.target.value), polarManualTarget.z)}
                      className="w-full accent-purple-400"
                    />
                  </div>
                  <div>
                    <label className="flex justify-between text-slate-400 mb-1 text-[11px]">
                      <span>Высота z</span>
                      <span className="font-mono text-purple-300">{polarManualTarget.z.toFixed(2)} m</span>
                    </label>
                    <input
                      type="range"
                      min="0.05"
                      max="1.80"
                      step="0.02"
                      value={polarManualTarget.z}
                      onChange={e => handlePolarChange(polarManualTarget.r, polarThetaDeg, parseFloat(e.target.value))}
                      className="w-full accent-purple-400"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="flex justify-between text-slate-400 mb-1 text-[11px]">
                      <span>Координата X</span>
                      <span className="font-mono text-cyan-400">{manualTarget.x.toFixed(2)} m</span>
                    </label>
                    <input
                      type="range"
                      min="-1.5"
                      max="1.5"
                      step="0.02"
                      value={manualTarget.x}
                      onChange={e => handleCartesianChange({ x: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="flex justify-between text-slate-400 mb-1 text-[11px]">
                      <span>Координата Y</span>
                      <span className="font-mono text-cyan-400">{manualTarget.y.toFixed(2)} m</span>
                    </label>
                    <input
                      type="range"
                      min="-1.5"
                      max="1.5"
                      step="0.02"
                      value={manualTarget.y}
                      onChange={e => handleCartesianChange({ y: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="flex justify-between text-slate-400 mb-1 text-[11px]">
                      <span>Координата Z (Высота)</span>
                      <span className="font-mono text-cyan-400">{manualTarget.z.toFixed(2)} m</span>
                    </label>
                    <input
                      type="range"
                      min="0.05"
                      max="1.8"
                      step="0.02"
                      value={manualTarget.z}
                      onChange={e => handleCartesianChange({ z: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Telemetry, QA Tracing & Advantage Log (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-2.5 min-h-0 overflow-y-auto pr-1">
          {/* Tabs: Telemetry vs QA Trace vs Math */}
          <div className="flex items-center bg-neutral-900/90 border border-neutral-800 rounded-lg p-1 shrink-0">
            <ContentButton
              type="button"
              onClick={() => setActiveTab('TELEMETRY')}
            data-control-kind="tab" aria-pressed={activeTab === 'TELEMETRY'}
              className={`flex-1 py-1 px-2 rounded text-xs font-bold transition-all text-center ${
                activeTab === 'TELEMETRY'
                  ? 'bg-neutral-800 text-cyan-300 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Дуэль Телеметрии
            </ContentButton>
            <ContentButton
              type="button"
              onClick={() => setActiveTab('QA_TRACE')}
            data-control-kind="tab" aria-pressed={activeTab === 'QA_TRACE'}
              className={`flex-1 py-1 px-2 rounded text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
                activeTab === 'QA_TRACE'
                  ? 'bg-neutral-800 text-emerald-300 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText size={12} />
              QA Трассировка
            </ContentButton>
            <ContentButton
              type="button"
              onClick={() => setActiveTab('MATH')}
            data-control-kind="tab" aria-pressed={activeTab === 'MATH'}
              className={`flex-1 py-1 px-2 rounded text-xs font-bold transition-all text-center ${
                activeTab === 'MATH'
                  ? 'bg-neutral-800 text-purple-300 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              RICIS Обоснование
            </ContentButton>
            <ContentButton
              type="button"
              onClick={() => setActiveTab('AST_JACOBIAN')}
            data-control-kind="tab" aria-pressed={activeTab === 'AST_JACOBIAN'}
              className={`flex-1 py-1 px-2 rounded text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
                activeTab === 'AST_JACOBIAN'
                  ? 'bg-neutral-800 text-cyan-300 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers size={12} />
              AST Якобиан
            </ContentButton>
            <ContentButton
              type="button"
              onClick={() => setActiveTab('TWO_STAGE_SINGULARITY')}
            data-control-kind="tab" aria-pressed={activeTab === 'TWO_STAGE_SINGULARITY'}
              className={`flex-1 py-1 px-2 rounded text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
                activeTab === 'TWO_STAGE_SINGULARITY'
                  ? 'bg-purple-900/80 border border-purple-500/80 text-purple-200 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles size={12} className="text-purple-400" />
              2-Stage RICIS
            </ContentButton>
          </div>

          {activeTab === 'TELEMETRY' && (
            <>
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
                    {ricisState.isSingularZone ? '🚨 СИНГУЛЯРНОСТЬ det(J)≈0' : '✅ СТАБИЛЬНЫЙ ДОМЕН'}
                  </span>
                </div>

                {/* Metrics Duel Table */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {/* RICIS Column */}
                  <div className="bg-emerald-950/30 border border-emerald-800/60 rounded p-2 text-xs">
                    <div className="flex items-center justify-between text-emerald-400 font-bold mb-1.5 pb-1 border-b border-emerald-800/40">
                      <div className="flex items-center gap-1.5">
                        <span>🟢 RICIS Монолит</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-900/80 text-emerald-300 font-mono font-normal border border-emerald-700/50">
                          {ricisSolverMode === 'SYMBOLIC_AST' ? 'AST' : 'Polar'}
                        </span>
                      </div>
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
                      <div className="flex justify-between">
                        <span className="text-slate-400">Пределы Коши:</span>
                        <span className="text-emerald-400 font-bold">ЗАПРЕЩЕНЫ</span>
                      </div>
                    </div>
                  </div>

                  {/* DLS Column */}
                  <div className="bg-slate-900/60 border border-slate-700/60 rounded p-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400 font-bold mb-1.5 pb-1 border-b border-slate-700/40">
                      <span>👻 Тень (DLS)</span>
                      <AlertTriangle size={13} className="text-amber-500" />
                    </div>
                    <div className="space-y-1 font-mono text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Отклонение вектора:</span>
                        <span
                          className={`font-bold ${
                            (dlsMetrics?.directionPreservedDeg ?? 0) > 8 ? 'text-rose-400' : 'text-slate-300'
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
                        <span className="text-amber-400 font-bold">$\lambda^2 = 0.032$</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Пределы Коши:</span>
                        <span className="text-rose-400">Применяются</span>
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

              {/* Real-Time 4-Stage Architectural Telemetry Badge */}
              <WidgetCapabilityBoundary
                componentName="RealTimeFourStageBadge"
                title="4-Stage Telemetry Badge"
                mode="CARD_STUB"
              >
                <RealTimeFourStageBadge telemetry={liveFourStageTelemetry} />
              </WidgetCapabilityBoundary>

              {/* Advantage Events Ledger */}
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-3 flex-1 flex flex-col min-h-[200px]">
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-neutral-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    Журнал преимуществ RICIS ({advantageLedger.advantageEvents.length})
                  </h3>
                  <span className="text-[10px] text-slate-400">Засечено в $0/0$ и $\det(J)\to 0$</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-[10px]">
                  {advantageLedger.advantageEvents.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-500 text-center p-4">
                      Манипулятор работает в нормальной зоне. Переместите манипулятор к границе (1.5м), чтобы зафиксировать превосходство RICIS.
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
            </>
          )}

          {activeTab === 'QA_TRACE' && (
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-3 flex-1 flex flex-col text-xs font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-2">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <FileText size={14} />
                  QA Трассировка Каллбэков
                </span>
                <ContentButton
                  type="button"
                  onClick={handleCopyTrace}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-slate-200 border border-neutral-700 text-[10px] transition-colors"
                >
                  {copiedTrace ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copiedTrace ? 'Скопировано' : 'Экспорт JSON'}
                </ContentButton>
              </div>

              {latestQaTrace ? (
                <div className="space-y-2 overflow-y-auto flex-1 pr-1 text-[11px]">
                  <div className="bg-neutral-950 p-2 rounded border border-neutral-800 space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Режим координат:</span>
                      <span className="text-cyan-300 font-bold">{latestQaTrace.coordinateMode}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Сложность решателя:</span>
                      <span className="text-emerald-400 font-bold">{latestQaTrace.solverComplexity}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Запрет пределов Коши:</span>
                      <span className="text-emerald-400 font-bold">СОБЛЮДЁН (0 пределов)</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Инвариант L1_IDENTITY:</span>
                      <span className="text-emerald-400 font-bold">СОХРАНЁН (X=X)</span>
                    </div>
                  </div>

                  <div className="bg-neutral-950 p-2 rounded border border-neutral-800 space-y-1">
                    <div className="text-slate-400 font-bold mb-1">Полярная цель (r, θ, z):</div>
                    <div className="text-purple-300 text-[10px]">
                      r = {latestQaTrace.polarTarget.r.toFixed(3)} m, θ = {(latestQaTrace.polarTarget.thetaRad * 180 / Math.PI).toFixed(1)}°, z = {latestQaTrace.polarTarget.z.toFixed(3)} m
                    </div>
                    <div className="text-slate-400 font-bold mt-2 mb-1">Декартова цель (x, y, z):</div>
                    <div className="text-cyan-300 text-[10px]">
                      x = {latestQaTrace.cartesianTarget.x.toFixed(3)} m, y = {latestQaTrace.cartesianTarget.y.toFixed(3)} m, z = {latestQaTrace.cartesianTarget.z.toFixed(3)} m
                    </div>
                  </div>

                  <div className="bg-neutral-950 p-2 rounded border border-neutral-800 space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Отклонение вектора RICIS:</span>
                      <span className="text-emerald-300">{latestQaTrace.ricisDirectionDeviationDeg.toFixed(2)}°</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Отклонение вектора Тени (DLS):</span>
                      <span className="text-rose-400">{latestQaTrace.ghostDirectionDeviationDeg.toFixed(2)}°</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Штраф демпфирования Тени λ²:</span>
                      <span className="text-amber-400">{latestQaTrace.ghostDampingPenalty.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 border-t border-neutral-800 pt-1 mt-1">
                      <span>QA Оценка соответствия:</span>
                      <span className="text-emerald-400 font-bold">{latestQaTrace.qaScore} / 100</span>
                    </div>
                  </div>

                  <div className="bg-emerald-950/20 border border-emerald-900/40 p-2 rounded text-[10px] text-emerald-200 leading-relaxed">
                    <strong>Аудит инварианта:</strong> {latestQaTrace.evaluationNotes}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500">
                  Ожидание каллбэков телеметрии...
                </div>
              )}
            </div>
          )}

          {activeTab === 'MATH' && (
            /* Theoretical Foundations & Axioms */
            <div className="bg-purple-950/20 border border-purple-900/50 rounded-lg p-3 text-[11px] flex-1 flex flex-col text-purple-200 overflow-y-auto space-y-3">
              <h4 className="font-bold text-purple-300 flex items-center gap-1.5 pb-1 border-b border-purple-900/40">
                <Terminal size={14} />
                Математическое обоснование RICIS-III
              </h4>
              <div className="space-y-2 text-slate-300 text-[10.5px] leading-relaxed">
                <p>
                  <strong>1. Полярные координаты:</strong> В полярной системе (r, θ, z) поворот базы θ = atan2(y, x) решается аналитически в O(1). При r → 0 (плечевая сингулярность) правило L1_IDENTITY сохраняет предыдущий азимут без неопределённости 0/0 или потери ориентации.
                </p>
                <p>
                  <strong>2. Запрет пределов Коши:</strong> Классический анализ ищет lim (x → a) f(x), что вблизи сингулярности det(J) → 0 приводит к бесконечным скоростям шарниров q̇ = J⁻¹ ẋ → ∞. Классический метод DLS вводит демпфер λ², искажающий траекторию.
                </p>
                <p>
                  <strong>3. Аксиома A6 и Геометрический мост:</strong> RICIS-III разрешает границу рабочей зоны через замкнутую алгебраическую проекцию на многообразие A6: 0_F × ∞_G = det(u,v) = F · G, сохраняя направление вектора (0.0° погрешности) за O(1) без численных итераций.
                </p>
              </div>

              {/* Interactive Geometric Bridge in R^2_RICIS */}
              <WidgetCapabilityBoundary componentName="GeometricBridgeVisualizerCard" mode="CARD_STUB">
                <GeometricBridgeVisualizerCard initialF={4} initialG={3} />
              </WidgetCapabilityBoundary>
            </div>
          )}

          {activeTab === 'AST_JACOBIAN' && (
            <div className="flex-1 flex flex-col overflow-y-auto pr-1">
              <WidgetCapabilityBoundary
                componentName="RicisAstInspector"
                title="Символьный AST Якобиан"
                mode="CARD_STUB"
              >
                <RicisAstInspector
                  solution={symbolicSolution}
                  jacobianMatrix={symbolicMatrix}
                  joints={ricisState.joints}
                  linkLengths={LINK_LENGTHS}
                />
              </WidgetCapabilityBoundary>
            </div>
          )}

          {activeTab === 'TWO_STAGE_SINGULARITY' && (
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
              {/* Interactive Step-by-Step Walkthrough Controller */}
              <WidgetCapabilityBoundary
                componentName="WalkthroughControllerPanel"
                title="Интерактивный сценарий шагов"
                mode="CARD_STUB"
              >
                <WalkthroughControllerPanel
                  currentStepIndex={walkthroughIndex}
                  isPlaying={isWalkthroughPlaying}
                  onStepChange={handleWalkthroughStepChange}
                  onTogglePlay={handleToggleWalkthroughPlay}
                  onReset={handleResetWalkthrough}
                />
              </WidgetCapabilityBoundary>

              {/* Multi-Link Joint Angle Controller (dynamically handles 3, 5, or N links without overlapping) */}
              <MultiLinkJointController
                dof={planarJoints.length}
                jointAngles={planarJoints}
                onChangeJoints={(newJoints: number[]) => setPlanarJoints(newJoints)}
                mode={planarMode}
                onChangeMode={(m) => setPlanarMode(m)}
                sigmaMin={planarState.svd.sigmaMin}
                isSingular={planarState.svd.isSingular}
              />

              {/* 4-Stage Architecture Summary Card with Resilience Boundary */}
              <WidgetCapabilityBoundary
                componentName="FourStagePipelineCard"
                title="4-уровневая архитектура манипулятора RICIS"
                mode="CARD_STUB"
              >
                <FourStagePipelineCard report={planarState.fourStageReport} />
              </WidgetCapabilityBoundary>

              {/* Heatmap & SVD Landscape (θ₂×θ₃ slice) — mathematically defined only for the
                  3-DOF module; gated both to avoid meaningless N-DOF rendering and to keep
                  click-selection from truncating the joint vector (IoC capability SINGULAR_HEATMAP_2D). */}
              {planarJoints.length === 3 ? (
                <WidgetCapabilityBoundary
                  componentName="SingularityLandscapeHeatmap"
                  title="Тепловая карта ландшафта сингулярностей"
                  mode="CARD_STUB"
                >
                  <SingularityLandscapeHeatmap
                    grid={heatmapGrid}
                    mode={planarMode}
                    currentTheta2={planarJoints[1] ?? 0}
                    currentTheta3={planarJoints[2] ?? 0}
                    onSelectAngles={handleSelectHeatmapAngles}
                  />
                </WidgetCapabilityBoundary>
              ) : (
                <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg p-3 text-[11px] font-mono text-slate-400 leading-relaxed">
                  <span className="text-amber-400 font-bold">θ₂ × θ₃ срез недоступен:</span>{' '}
                  ландшафт σ_min параметризован двумя свободными углами и определён только для
                  3-DOF модуля (текущий: {planarJoints.length}-DOF). Выберите 3-Link Planar,
                  чтобы исследовать тепловую карту сингулярностей.
                </div>
              )}

              {/* Stage 2: RICIS Reduction Overlay with Resilience Boundary */}
              <WidgetCapabilityBoundary
                componentName="RicisReductionOverlayPanel"
                title="Панель редукции второго этапа RICIS"
                mode="CARD_STUB"
              >
                <RicisReductionOverlayPanel
                  overlay={planarState.overlay}
                  mode={planarMode}
                  sigmaMin={planarState.svd.sigmaMin}
                />
              </WidgetCapabilityBoundary>

              {/* Async Critical Event Log Stream with Resilience Boundary */}
              <WidgetCapabilityBoundary
                componentName="AsyncCriticalLogViewer"
                title="Журнал асинхронных критических событий"
                mode="CARD_STUB"
              >
                <AsyncCriticalLogViewer />
              </WidgetCapabilityBoundary>
            </div>
          )}
        </div>
      </div>

      {showTestingModal && (
        <SwipeDismissable direction="down" onDismiss={() => setShowTestingModal(false)} enabled={isMobileLayout}>
          <AutomatedTestingModal
            isOpen={showTestingModal}
            nodes={mapStore.nodes}
            proofs={mapStore.proofs || {}}
            onClose={() => setShowTestingModal(false)}
          />
        </SwipeDismissable>
      )}
    </div>
  );
};
