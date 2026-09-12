import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { ProblemNode } from '../model/types';
import { getNodeIdentityPresentation } from '../model/nodeIdentityPresentation';
import type { UIElement } from '../domain/ui/uiElement.types';
import { AddNodeModal } from './AddNodeModal';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useMapStore } from '../store/mapStore';
import * as THREE from 'three';
import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { APP_BUILD_LABEL, APP_VERSION } from '../version';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Layers,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  Bot,
  Database,
  Plus,
  X,
  Sparkles,
  RefreshCw,
  Crosshair,
  Cpu,
  Terminal,
  Settings,
  Menu,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Compass,
  Map as MapIcon,
  List,
  Gift,
  BookOpen,
} from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { RicisProofConsoleModal } from './RicisProofConsoleModal';
import { VoynichDecryptionPanel } from './VoynichDecryptionPanel';
import { MapPatchImportModal } from './MapPatchImportModal';
import {
  isNodeAvailable,
  findPathToRicis,
  getUnlockRequirements,
  getUnlockedTargets,
  countAvailable,
  isRicisCore,
} from '../model/access';
import { layoutZones, layoutNodes, zoneVisualRadius, nodeVisualRadius, type PhysicsParams, DEFAULT_PHYSICS_PARAMS } from '../model/physics';
import { physicsStorageService } from '../services/physicsStorage';
import { filterStorageService } from '../services/filterStorage';
import { ZoneBubble, ZoneLabel, NodeBubble, NodeLabel } from './Bubbles';
import { downloadTexPreprint, type TexBridgeMode, expandToRoot } from '../model/texPreprint';
import { AuditPanel } from './AuditPanel';
import { NodeCardDetails } from './NodeCardDetails';
import { CalculatorExplorer } from './CalculatorExplorer';
import { MonolithGuidedCaseTrail } from './MonolithGuidedCaseTrail';
import { graphColorManager, EdgeStateCode, NodeResolutionStatusCode } from '../model/colorMatrix';
import { buildCalculatorExplorerProjection, getCalculatorExplorerEntryForNodeId } from '../calculatorExplorer/calculatorExplorer.domain';
import { buildMonolithGuidedCaseTrail } from '../monolithGuidedCaseTrail/monolithGuidedCaseTrail.domain';
import { EditNodeModal } from './EditNodeModal';
import { TelegramBotPanel } from './TelegramBotPanel';
import { AgentLogModal } from './AgentLogModal';
import { LatexRenderer } from './LatexRenderer';
import { useAdaptiveUI } from '../hooks/useAdaptiveUI';
import { useMobileLayout } from '../hooks/useMobileLayout';
import { useMobileViewStack } from '../hooks/useMobileViewStack';
import { useImmersiveCanvas } from '../hooks/useImmersiveCanvas';
import { isDoubleTap } from '../hooks/mobileGestures';
import {
  alignDeltaToScreen,
  calculateOrientationDelta,
  isUsableOrientationSample,
  requestDeviceOrientationPermission,
  type OrientationBaseline,
} from '../services/deviceOrientation';
import { UniverseSkybox } from './UniverseSkybox';
import { configureGraphTouchControls } from './orbitTouchControls';
import { useTerminalStore } from '../store/useTerminalStore';
import { RicisTerminalModal } from './RicisTerminalModal';
import { UrlShareService } from '../services/UrlShareService';
import { AVAILABLE_GEMINI_MODELS } from '../model/modelPool.types';
import { useI18nStore } from '../store/useI18nStore';
import { LanguageToggle } from './LanguageToggle';
import { AccessibleMapFallback } from './AccessibleMapFallback';
import { checkRicisCoreRuntimeStatus, getRicisCoreRuntimeStatus } from '../services/ricisCore';
import type { RicisCoreStatus } from '../services/ricisCore';
import { getCommunityRewardsClientStatus } from '../services/communityRewardsClient';
import type { CommunityRewardsClientStatus } from '../services/communityRewardsClient';
import { projectCommunityReadiness } from '../communityReadiness/communityReadiness.domain';
import { CommunityReadinessNotice, type CommunityInvitationCopyResult } from './CommunityReadinessNotice';
import { ReadableNodeFocusPolicy } from '../nodeEntry/nodeFocusPolicy';
import type { NodeFocusRequest, NodeFocusSource } from '../nodeEntry/contracts';
import {
  CanonicalNodeSearchMatcher,
  DeepLinkFocusResolver,
  NodeVisibilityProjector,
} from '../catalogVisibility/catalogVisibility.domain';
import type { DeepLinkFocusOutcome } from '../catalogVisibility/catalogVisibility.contracts';
import { STATIC_ADMIN_CORE_SNAPSHOT } from '../adminCoreConnection/staticAdminCoreConnection';

type PanelId = 'actions' | 'zones' | 'available' | 'agent' | 'persistence';

const UI_ELEMENTS: UIElement[] = [
  { id: 'actions', label: '', labelKey: 'panel.actions' },
  { id: 'zones', label: '', labelKey: 'panel.zones' },
  { id: 'available', label: '', labelKey: 'panel.available' },
  { id: 'agent', label: '', labelKey: 'panel.agent' },
  { id: 'persistence', label: '', labelKey: 'panel.persistence' },
];

const discoverablePanelIds = new Set<PanelId>(['persistence']);
import { isMissingTargetFunction, nodeHasSorry } from '../model/audit';
import { ActionButton } from './ActionButton';
import { presentMapNodeVisualStatus } from '../ricisSolutionCatalog';


let hoveredNodePos: THREE.Vector3 | null = null;

function getZoneColor(id: string) {
  if (zoneColors[id]) return zoneColors[id];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

const zoneColors: Record<string, string> = {
  math: '#3b82f6',
  informatics: '#06b6d4',
  medicine: '#10b981',
  pharmacology: '#8b5cf6',
  physics: '#f59e0b',
  economics: '#eab308',
  ethics: '#f43f5e',
  cognitive: '#a78bfa',
    chemistry: '#34d399',
  biology: '#22c55e',
  ecology: '#15803d',
  astrophysics: '#9333ea',
  materials: '#64748b',
  linguistics: '#d946ef',
  bioinformatics: '#2dd4bf',
};

interface FlightTarget {
  target: THREE.Vector3;
  cameraPos: THREE.Vector3;
  startTime: number;
  startLookAt: THREE.Vector3;
  startCamPos: THREE.Vector3;
  durationMs: number;
}

function CameraFlightRig({
  flightRef,
  controlsRef,
}: {
  flightRef: React.MutableRefObject<FlightTarget | null>;
  controlsRef: React.MutableRefObject<ThreeOrbitControls | null>;
}) {
  const { camera } = useThree();

  useFrame(() => {
    const flight = flightRef.current;
    if (!flight || !controlsRef.current) return;

    const now = performance.now();
    const elapsed = now - flight.startTime;
    const progress = Math.min(1, elapsed / flight.durationMs);

    // Smooth cubic bezier easing
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    if (progress >= 1) {
      controlsRef.current.target.copy(flight.target);
      camera.position.copy(flight.cameraPos);
      controlsRef.current.update();
      flightRef.current = null;
      return;
    }

    // Фаза 1 (0..0.45): Плавное наведение фокуса (look-at target)
    const pLook = ease(Math.min(1, progress / 0.45));
    controlsRef.current.target.lerpVectors(flight.startLookAt, flight.target, pLook);

    // Фаза 2 (0.2..1.0): Плавный полет камеры к целевой позиции
    if (progress > 0.2) {
      const pFly = ease(Math.min(1, (progress - 0.2) / 0.8));
      camera.position.lerpVectors(flight.startCamPos, flight.cameraPos, pFly);
    }

    controlsRef.current.update();
  });

  return null;
}

function OrbitControls({
  controlsRef: externalRef,
  flightRef,
  onReady,
}: {
  controlsRef?: React.MutableRefObject<any>;
  flightRef?: React.MutableRefObject<FlightTarget | null>;
  onReady?: () => void;
}) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<ThreeOrbitControls | null>(null);
  useEffect(() => {
    const controls = new ThreeOrbitControls(camera, gl.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.6;
    controls.panSpeed = 0.8;
    controls.zoomSpeed = 1.0;
    controls.minDistance = 4;
    controls.maxDistance = 5000;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableRotate = true;
    configureGraphTouchControls(controls);
    controls.screenSpacePanning = true;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;
    if (externalRef) {
      externalRef.current = controls;
    }
    onReady?.();

    const cancelFlightForManualInteraction = () => {
      if (flightRef) flightRef.current = null;
    };
    controls.addEventListener('start', cancelFlightForManualInteraction);

    const handleWheel = (e: WheelEvent) => {
      cancelFlightForManualInteraction();
      const factor = Math.min(1.0, Math.abs(e.deltaY) * 0.002);
      
      if (e.deltaY < 0 && hoveredNodePos) {
        const panVec = hoveredNodePos.clone().sub(controls.target).multiplyScalar(factor);
        controls.target.add(panVec);
        camera.position.add(panVec);
      } else if (e.deltaY > 0) {
        const center = new THREE.Vector3(0, 0, 0);
        const panVec = center.clone().sub(controls.target).multiplyScalar(factor);
        controls.target.add(panVec);
        camera.position.add(panVec);
      }
    };
    gl.domElement.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      gl.domElement.removeEventListener('wheel', handleWheel);
      controls.removeEventListener('start', cancelFlightForManualInteraction);
      controls.dispose();
      controlsRef.current = null;
      if (externalRef) {
        externalRef.current = null;
      }
    };
  }, [camera, gl, externalRef, onReady]);
  useFrame(() => {
    controlsRef.current?.update();
  });
  return null;
}

const formatCurrency = (val?: number) => {
  if (val === undefined) return '';
  if (val >= 1e9) return '$' + (val / 1e9).toFixed(1) + 'B';
  if (val >= 1e6) return '$' + (val / 1e6).toFixed(1) + 'M';
  return '$' + val.toLocaleString();
};






function isDerivativeNodeRef(n: { type?: string; isDerivativeClaim?: boolean }) {
  return n.type === 'derivative_claim' || n.type === 'derivative' || n.isDerivativeClaim === true;
}

function nodeMatchesQuery(n: ProblemNode, q: string, hiddenZones: Set<string>, showOnlyDerivatives: boolean): boolean {
  return new CanonicalNodeSearchMatcher().matches({
    node: n,
    normalizedQuery: q,
    isZoneVisible: !n.zoneIds.every(zid => hiddenZones.has(zid)),
    showOnlyDerivatives,
    isDerivativeNode: isDerivativeNodeRef(n),
  });
}

type MapPresentationMode = 'three_dimensional' | 'accessible_list';
type MapFallbackReason = 'unsupported' | 'render_failed' | 'user_selected';

function supportsWebGL(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return false;
    const isLost = typeof gl.isContextLost === 'function' ? gl.isContextLost() : false;
    if (isLost) return false;
    const shader = gl.createShader(gl.VERTEX_SHADER);
    if (!shader) return false;
    gl.deleteShader(shader);
    return true;
  } catch {
    return false;
  }
}

class MapCanvasErrorBoundary extends React.Component<
  React.PropsWithChildren<{ readonly onRenderFailure: () => void }>,
  { readonly hasError: boolean }
> {
  public state = { hasError: false };

  public static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.warn('MapCanvasErrorBoundary caught 3D render failure:', error, errorInfo);
    this.props.onRenderFailure();
  }

  public componentDidUpdate(prevProps: React.PropsWithChildren<{ readonly onRenderFailure: () => void }>): void {
    if (this.state.hasError && prevProps !== this.props) {
      this.setState({ hasError: false });
    }
  }

  public render(): React.ReactNode {
    return this.state.hasError ? null : this.props.children;
  }
}

function projectNodeForLocale(node: ProblemNode, locale: string): ProblemNode {
  if (locale === 'ru') return node;
  const entry = getCalculatorExplorerEntryForNodeId({ nodeId: node.id });
  if (!entry) return node;

  return {
    ...node,
    title: entry.monolith.title.en,
    description: `${entry.monolith.category.en}. Source-bound calculator monolith projection.`,
  };
}

export const Map3D: React.FC = () => {
  const { locale, t } = useI18nStore();
  const toggleTerminal = useTerminalStore(s => s.toggleTerminal);
  const setTerminalInput = useTerminalStore(s => s.setInput);
  const [physicsParams, setPhysicsParams] = React.useState<PhysicsParams>(() => {
    return physicsStorageService.load() || DEFAULT_PHYSICS_PARAMS;
  });
  const map = useMapStore();
  const isMobileLayout = useMobileLayout();
  const { view: mobileView, open: openMobileView, back: backMobileView } = useMobileViewStack(isMobileLayout);
  const { isImmersive, toggle: toggleImmersiveCanvas, exit: exitImmersiveCanvas } = useImmersiveCanvas();
  const sceneContainerRef = useRef<HTMLDivElement | null>(null);
  const lastSceneTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const sensorBaselineRef = useRef<OrientationBaseline | null>(null);
  const [sensorModeEnabled, setSensorModeEnabled] = useState(false);
  const [sensorNotice, setSensorNotice] = useState<string | null>(null);
  const mobilePresentationInitializedRef = useRef(false);
  const [cameraControlsReady, setCameraControlsReady] = useState(false);
  const nodeFocusPolicy = React.useMemo(() => new ReadableNodeFocusPolicy(), []);
  const markCameraControlsReady = React.useCallback(() => setCameraControlsReady(true), []);

  // Load initial saved filters & Deep Link URL params
  const initialSavedFilters = React.useMemo(() => filterStorageService.load(), []);
  const initialUrlParams = React.useMemo(() => UrlShareService.parseInitialParams(), []);
  const initialUrlFocusPendingRef = useRef<string | null>(initialUrlParams.initialNodeId);
  const initialUrlFocusResolvedRef = useRef(false);
  const [deepLinkRequestedNodeId, setDeepLinkRequestedNodeId] = useState<string | null>(initialUrlParams.initialNodeId);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(() => {
    return initialUrlParams.initialNodeId || initialSavedFilters?.selectedNodeId || null;
  });
  const [mapPresentationMode, setMapPresentationMode] = useState<MapPresentationMode>(() => {
    return supportsWebGL() ? 'three_dimensional' : 'accessible_list';
  });
  const [mapFallbackReason, setMapFallbackReason] = useState<MapFallbackReason>(() => {
    return supportsWebGL() ? 'user_selected' : 'unsupported';
  });
  const [navigationStack, setNavigationStack] = useState<string[]>([]);
  const [hiddenZones, setHiddenZones] = useState<Set<string>>(() => {
    return new Set(initialSavedFilters?.hiddenZones || []);
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // The redesigned mobile shell is scene-first. The semantic list remains an
  // explicit, accessible alternative in the map quick control and on WebGL failure.
  useEffect(() => {
    if (!isMobileLayout || mobilePresentationInitializedRef.current) return;
    mobilePresentationInitializedRef.current = true;
  }, [isMobileLayout]);

  // Инициализация Sandbox из URL параметров при старте
  useEffect(() => {
    if (initialUrlParams.initialSandboxExpr) {
      setTerminalInput(initialUrlParams.initialSandboxExpr);
      toggleTerminal(true);
    }
  }, []);

  const [isNodeExpanded, setIsNodeExpanded] = useState(false);
  const [taskPanelMode, setTaskPanelMode] = useState<'open' | 'rail'>('open');
  const [leftPanelMode, setLeftPanelMode] = useState<'open' | 'rail'>('open');
  const [showProof, setShowProof] = useState(() => initialUrlParams.initialMode === 'verify' || initialUrlParams.initialMode === 'proof');
  const [showSettings, setShowSettings] = useState(false);
  const [showAddNode, setShowAddNode] = useState(false);
  const [isCalculatorExplorerOpen, setIsCalculatorExplorerOpen] = useState(false);
  const [isMonolithGuidedCaseTrailOpen, setIsMonolithGuidedCaseTrailOpen] = useState(false);
  const calculatorExplorer = React.useMemo(
    () => buildCalculatorExplorerProjection({
      baseUrl: (typeof window !== 'undefined' ? `${window.location.origin}/calculator-sandbox/` : '') || import.meta.env.VITE_RICIS_CALCULATOR_BASE_URL || 'https://remix-ricis-iii-501343051156.europe-west2.run.app/',
    }),
    [],
  );
  const monolithGuidedCaseTrail = React.useMemo(
    () => buildMonolithGuidedCaseTrail({ explorer: calculatorExplorer }),
    [calculatorExplorer],
  );

  useEffect(() => {
    if (!isMobileLayout) return;
    if (mobileView === 'settings' && !showSettings) setShowSettings(true);
    if (mobileView !== 'settings' && showSettings) setShowSettings(false);
  }, [isMobileLayout, mobileView, showSettings]);

  const openMobileSettings = () => {
    openMobileView('settings');
  };

  const closeSettings = () => {
    if (isMobileLayout && mobileView === 'settings') {
      backMobileView();
      return;
    }
    setShowSettings(false);
  };
  const [showTelegramBot, setShowTelegramBot] = useState(false);
  const [showAgentLogs, setShowAgentLogs] = useState(false);
  const [showProofConsole, setShowProofConsole] = useState(false);
  const [showVoynichModal, setShowVoynichModal] = useState(false);
  const [showPatchImportModal, setShowPatchImportModal] = useState(false);
  const [editingNode, setEditingNode] = useState<ProblemNode | null>(null);
  const [isSolving, setIsSolving] = useState(false);
  const [isAgentSearching, setIsAgentSearching] = useState(false);
  const [solveLogs, setSolveLogs] = useState<string[]>([]);
  const [pathNodeIds, setPathNodeIds] = useState<string[]>([]);
  const [agentMsg, setAgentMsg] = useState<string | null>(null);
  const [texMode, setTexMode] = useState<TexBridgeMode>('ricis_pure');
  const [texMsg, setTexMsg] = useState<string | null>(null);
  const [jsonMsg, setJsonMsg] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('ricis_selected_ai_model') || 'gemini-3.6-flash';
  });
  /** Filter: show only purple derivative_claim nodes (and edges between them / to anchors). */
  const [showOnlyDerivatives, setShowOnlyDerivatives] = useState<boolean>(() => {
    return initialSavedFilters?.showOnlyDerivatives ?? false;
  });
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    return initialSavedFilters?.searchQuery ?? '';
  });
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ricis_search_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number>(-1);

  const {
    currentRole,
    roles,
    visibleElements,
    hiddenElements,
    trackClick,
    switchRole,
    createRole
  } = useAdaptiveUI({
    elements: UI_ELEMENTS,
    maxVisible: 3,
    decayInterval: 10,
    decayFactor: 0.9,
    hysteresisDelta: 0.03
  });

  const [openPanelIds, setOpenPanelIds] = useState<Set<PanelId>>(() => new Set());
  const initializedAdaptiveRoleRef = useRef<string | null>(null);
  const [coreRuntimeStatus, setCoreRuntimeStatus] = useState<RicisCoreStatus>(() => getRicisCoreRuntimeStatus());
  const [isCheckingCoreRuntime, setIsCheckingCoreRuntime] = useState(false);
  const [isLoadingCommunityReadiness, setIsLoadingCommunityReadiness] = useState(false);
  const [isCommunityReadinessOpen, setIsCommunityReadinessOpen] = useState(false);
  const [communityReadinessStatus, setCommunityReadinessStatus] = useState<CommunityRewardsClientStatus | null>(null);
  const [isCopyingCommunityInvitation, setIsCopyingCommunityInvitation] = useState(false);
  const [communityInvitationCopyResult, setCommunityInvitationCopyResult] = useState<CommunityInvitationCopyResult>('idle');

  const handleOpenCommunityReadiness = useCallback(async () => {
    if (isLoadingCommunityReadiness) return;
    setIsLoadingCommunityReadiness(true);
    setCommunityInvitationCopyResult('idle');
    try {
      const status = await getCommunityRewardsClientStatus();
      setCommunityReadinessStatus(status);
      setIsCommunityReadinessOpen(true);
    } finally {
      setIsLoadingCommunityReadiness(false);
    }
  }, [isLoadingCommunityReadiness]);

  const handleCopyCommunityInvitation = useCallback(async () => {
    if (isCopyingCommunityInvitation) return;
    setIsCopyingCommunityInvitation(true);
    try {
      const copied = await UrlShareService.copyShareUrlToClipboard({});
      setCommunityInvitationCopyResult(copied ? 'copied' : 'failed');
    } finally {
      setIsCopyingCommunityInvitation(false);
    }
  }, [isCopyingCommunityInvitation]);

  const handleCloseCommunityReadiness = useCallback(() => {
    setIsCommunityReadinessOpen(false);
    setCommunityInvitationCopyResult('idle');
  }, []);

  const communityReadinessProjection = useMemo(
    () => communityReadinessStatus === null ? null : projectCommunityReadiness(communityReadinessStatus),
    [communityReadinessStatus],
  );

  useEffect(() => {
    if (initializedAdaptiveRoleRef.current === currentRole.id) return;

    const nextOpenPanelIds = new Set<PanelId>();
    visibleElements.forEach((element) => {
      if (element.id === 'actions' || element.id === 'zones' || element.id === 'available') {
        nextOpenPanelIds.add(element.id as PanelId);
      }
    });
    setOpenPanelIds(nextOpenPanelIds);
    initializedAdaptiveRoleRef.current = currentRole.id;
  }, [currentRole.id, visibleElements]);

  const toggleAccordion = useCallback((panelId: PanelId) => {
    const isOpening = !openPanelIds.has(panelId);
    if (isOpening) trackClick(panelId);

    setOpenPanelIds((previous) => {
      const next = new Set(previous);
      if (next.has(panelId)) next.delete(panelId);
      else next.add(panelId);
      return next;
    });
  }, [openPanelIds, trackClick]);

  const checkCoreRuntime = useCallback(async () => {
    setIsCheckingCoreRuntime(true);
    setCoreRuntimeStatus('loading');
    try {
      setCoreRuntimeStatus(await checkRicisCoreRuntimeStatus());
    } catch {
      setCoreRuntimeStatus('error');
    } finally {
      setIsCheckingCoreRuntime(false);
    }
  }, []);

  const coreStatusPresentation = (() => {
    switch (coreRuntimeStatus) {
      case 'loading':
        return { label: t('core.status.checking'), className: 'text-amber-300 border-amber-800/70 bg-amber-950/50', dotClassName: 'bg-amber-400 animate-pulse' };
      case 'ready_api':
        return { label: t('core.status.readyApi'), className: 'text-emerald-300 border-emerald-800/70 bg-emerald-950/50', dotClassName: 'bg-emerald-400' };
      case 'ready_wasm':
        return { label: t('core.status.readyWasm'), className: 'text-emerald-300 border-emerald-800/70 bg-emerald-950/50', dotClassName: 'bg-emerald-400' };
      case 'error':
      case 'fallback_ts':
        return { label: t('core.status.unavailable'), className: 'text-rose-300 border-rose-800/70 bg-rose-950/50', dotClassName: 'bg-rose-400' };
      default:
        return { label: t('core.status.unchecked'), className: 'text-slate-300 border-neutral-700 bg-neutral-900/80', dotClassName: 'bg-slate-500' };
    }
  })();

  const [showOverflow, setShowOverflow] = useState(false);
  const [userDisabledPanelIds, setUserDisabledPanelIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('ricis_disabled_panel_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const togglePanelVisibility = (panelId: string) => {
    setUserDisabledPanelIds((prev) => {
      const next = new Set(prev);
      if (next.has(panelId)) {
        next.delete(panelId);
      } else {
        next.add(panelId);
      }
      try {
        localStorage.setItem('ricis_disabled_panel_ids', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error('Failed to save disabled panels', e);
      }
      return next;
    });
  };

  const projectedVisibleElements = useMemo(() => {
    const visiblePanelIds = new Set(visibleElements.map(element => element.id));
    const promotedElements = UI_ELEMENTS.filter(element => (
      discoverablePanelIds.has(element.id as PanelId) &&
      !visiblePanelIds.has(element.id) &&
      !userDisabledPanelIds.has(element.id)
    ));
    return [...visibleElements, ...promotedElements];
  }, [userDisabledPanelIds, visibleElements]);

  // Auto-persist filter state changes
  useEffect(() => {
    filterStorageService.save({
      hiddenZones: Array.from(hiddenZones),
      searchQuery,
      showOnlyDerivatives,
      selectedNodeId,
    });
  }, [hiddenZones, searchQuery, showOnlyDerivatives, selectedNodeId]);


  const controlsRef = useRef<any>(null);
  const flightRef = useRef<FlightTarget | null>(null);
  const sensorCameraBaselineRef = useRef<{ theta: number; phi: number; radius: number } | null>(null);

  useEffect(() => {
    if (!isMobileLayout || !sensorModeEnabled) return undefined;

    const onDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (!isUsableOrientationSample(event)) return;
      const controls = controlsRef.current;
      if (!controls) return;

      if (!sensorBaselineRef.current || !sensorCameraBaselineRef.current) {
        sensorBaselineRef.current = { beta: event.beta as number, gamma: event.gamma as number };
        const offset = controls.object.position.clone().sub(controls.target);
        const spherical = new THREE.Spherical().setFromVector3(offset);
        sensorCameraBaselineRef.current = {
          theta: spherical.theta,
          phi: spherical.phi,
          radius: spherical.radius,
        };
        setSensorNotice('Ориентация откалибрована по текущему виду.');
        return;
      }

      const rawDelta = calculateOrientationDelta(event, sensorBaselineRef.current);
      if (!rawDelta) return;
      const delta = alignDeltaToScreen(rawDelta);

      const baseline = sensorCameraBaselineRef.current;
      const offset = controls.object.position.clone().sub(controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      const targetTheta = baseline.theta - THREE.MathUtils.degToRad(THREE.MathUtils.clamp(delta.yaw, -70, 70) * 0.72);
      const targetPhi = THREE.MathUtils.clamp(
        baseline.phi + THREE.MathUtils.degToRad(THREE.MathUtils.clamp(delta.pitch, -55, 55) * 0.55),
        controls.minPolarAngle + 0.04,
        controls.maxPolarAngle - 0.04,
      );

      spherical.theta = THREE.MathUtils.lerp(spherical.theta, targetTheta, 0.14);
      spherical.phi = THREE.MathUtils.lerp(spherical.phi, targetPhi, 0.14);
      spherical.radius = baseline.radius;
      controls.object.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
      controls.update();
    };

    window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });
    return () => window.removeEventListener('deviceorientation', onDeviceOrientation);
  }, [isMobileLayout, sensorModeEnabled]);

  const toggleSensorMode = useCallback(async () => {
    if (sensorModeEnabled) {
      setSensorModeEnabled(false);
      sensorBaselineRef.current = null;
      sensorCameraBaselineRef.current = null;
      setSensorNotice('Управление наклоном отключено.');
      return;
    }

    const permission = await requestDeviceOrientationPermission();
    if (permission === 'granted') {
      sensorBaselineRef.current = null;
      sensorCameraBaselineRef.current = null;
      setSensorModeEnabled(true);
      setSensorNotice('Поверните устройство: первая корректная позиция станет точкой калибровки.');
      return;
    }

    const messages: Record<string, string> = {
      denied: 'Доступ к датчикам отклонён. Разрешите «Движение и ориентацию» в настройках браузера.',
      unsupported: 'В этом браузере недоступны датчики ориентации.',
      error: 'Не удалось запросить доступ к датчикам. Попробуйте ещё раз из меню.',
    };
    setSensorNotice(messages[permission] ?? 'Датчики недоступны.');
  }, [sensorModeEnabled]);

  const handleScenePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobileLayout || event.pointerType !== 'touch' || mapPresentationMode !== 'three_dimensional') return;

    const tap = { time: performance.now(), x: event.clientX, y: event.clientY };
    if (isDoubleTap(lastSceneTapRef.current, tap)) {
      lastSceneTapRef.current = null;
      event.preventDefault();
      void toggleImmersiveCanvas(sceneContainerRef.current);
      return;
    }

    lastSceneTapRef.current = tap;
  };

  const handleZoomIn = () => {
    if (controlsRef.current) {
      controlsRef.current.dollyIn(1.25);
      controlsRef.current.update();
    }
  };

  const handleZoomOut = () => {
    if (controlsRef.current) {
      controlsRef.current.dollyOut(1.25);
      controlsRef.current.update();
    }
  };

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const isDerivativeNode = (n: { type?: string; isDerivativeClaim?: boolean }) =>
    n.type === 'derivative_claim' || n.isDerivativeClaim === true;

  const saveToHistory = useCallback((queryToSave: string) => {
    const trimmed = queryToSave.trim();
    if (!trimmed) return;

    const q = trimmed.toLowerCase();
    const matchesCount = map.nodes.filter(n => nodeMatchesQuery(n, q, hiddenZones, showOnlyDerivatives)).length;

    // Попадают только те запросы, которые дали не нулевой результат
    if (matchesCount > 0) {
      setSearchHistory(prev => {
        const filtered = prev.filter(item => item.toLowerCase() !== q);
        const next = [trimmed, ...filtered].slice(0, 15);
        try {
          localStorage.setItem('ricis_search_history', JSON.stringify(next));
        } catch (e) {
          console.error('Failed to save search history', e);
        }
        return next;
      });
    }
  }, [map.nodes, hiddenZones, showOnlyDerivatives]);

  // Автоматическое сохранение успешного запроса при остановке ввода
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    const timer = setTimeout(() => {
      saveToHistory(trimmed);
    }, 800);
    return () => clearTimeout(timer);
  }, [searchQuery, saveToHistory]);

  const removeFromHistory = (e: React.MouseEvent, itemToRemove: string) => {
    e.stopPropagation();
    setSearchHistory(prev => {
      const next = prev.filter(item => item !== itemToRemove);
      try {
        localStorage.setItem('ricis_search_history', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const clearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory([]);
    try {
      localStorage.removeItem('ricis_search_history');
    } catch {}
  };

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return searchHistory;
    const q = searchQuery.toLowerCase().trim();
    return searchHistory.filter(item => item.toLowerCase().includes(q));
  }, [searchHistory, searchQuery]);

  // Сброс индекса клавиш при изменении запроса
  useEffect(() => {
    setSelectedHistoryIndex(-1);
  }, [searchQuery, isSearchFocused]);

  const searchMatchCount = useMemo(() => {
    if (!searchQuery.trim()) return map.nodes.length;
    const q = searchQuery.toLowerCase().trim();
    return map.nodes.filter(n => nodeMatchesQuery(n, q, hiddenZones, showOnlyDerivatives)).length;
  }, [map.nodes, searchQuery, hiddenZones, showOnlyDerivatives]);

  const maxFractalDepth = useMemo(() => {
    return Math.max(0, ...map.nodes.map(n => n.fractalDepth || 0));
  }, [map.nodes]);


  const selectedNode = map.nodes.find(n => n.id === selectedNodeId) || null;
  const selectedNodePresentation = selectedNode ? projectNodeForLocale(selectedNode, locale) : null;
  const availability = useMemo(() => countAvailable(map), [map.nodes, map.edges, hiddenZones]);
  const pathSet = useMemo(() => new Set(pathNodeIds), [pathNodeIds]);
  const pathEdgeKeys = useMemo(() => {
    const keys = new Set<string>();
    for (let i = 0; i < pathNodeIds.length - 1; i++) {
      keys.add(pathNodeIds[i] + '|' + pathNodeIds[i + 1]);
      keys.add(pathNodeIds[i + 1] + '|' + pathNodeIds[i]);
    }
    return keys;
  }, [pathNodeIds]);

  const derivativeCount = useMemo(
    () => map.nodes.filter(isDerivativeNode).length,
    [map.nodes]
  );

  /** Node ids visible under current filter (zones still apply). */
  const filteredNodeIds = useMemo(() => {
    const ids = new Set<string>();
    const q = searchQuery.toLowerCase().trim();
    for (const n of map.nodes) {
      if (nodeMatchesQuery(n, q, hiddenZones, showOnlyDerivatives)) {
        ids.add(n.id);
      }
    }
    // When filtering derivatives, also keep direct anchor parents so edges make sense
    if (showOnlyDerivatives) {
      for (const n of map.nodes) {
        if (!isDerivativeNode(n)) continue;
        for (const dep of n.dependencyIds || []) ids.add(dep);
      }
    }
    return ids;
  }, [map.nodes, hiddenZones, showOnlyDerivatives, searchQuery]);

  const deepLinkFocusOutcome = useMemo<DeepLinkFocusOutcome>(() => {
    if (!map.hydrated) return { kind: 'no_deep_link_request' };
    return new DeepLinkFocusResolver().resolve({
      requestedNodeId: deepLinkRequestedNodeId,
      hydratedNodes: map.nodes,
      activeVisibleNodeIds: filteredNodeIds,
      nodeIdAliases: map.nodeIdAliases,
    });
  }, [map.hydrated, map.nodes, deepLinkRequestedNodeId, filteredNodeIds]);

  const visibilityProjection = useMemo(() => {
    return new NodeVisibilityProjector().project({
      filteredNodeIds,
      focus: deepLinkFocusOutcome,
    });
  }, [filteredNodeIds, deepLinkFocusOutcome]);

  const visibleNodeIds = visibilityProjection.visibleNodeIds;

  useEffect(() => {
    if (!map.hydrated || initialUrlFocusResolvedRef.current) return;
    initialUrlFocusResolvedRef.current = true;
    if (deepLinkFocusOutcome.kind === 'focused_catalog_node') {
      setSelectedNodeId(deepLinkFocusOutcome.nodeId);
      if (initialUrlParams.initialMode === 'verify' || initialUrlParams.initialMode === 'proof') {
        setShowProof(true);
      }
      return;
    }
    if (deepLinkFocusOutcome.kind === 'unknown_deep_link_target') {
      setSelectedNodeId(null);
    }
  }, [map.hydrated, deepLinkFocusOutcome, initialUrlParams.initialMode]);

  // Preserve an unknown shared-link target and mode parameter in the address bar.
  useEffect(() => {
    if (!map.hydrated) return;
    if (deepLinkFocusOutcome.kind === 'unknown_deep_link_target' && selectedNodeId === null) return;
    UrlShareService.updateBrowserUrl({
      nodeId: selectedNodeId,
      mode: showProof ? 'verify' : (initialUrlParams.initialMode === 'verify' || initialUrlParams.initialMode === 'proof' ? initialUrlParams.initialMode : null),
    });
  }, [selectedNodeId, showProof, map.hydrated, deepLinkFocusOutcome, initialUrlParams.initialMode]);

  useEffect(() => {
    if (selectedNodeId) setTaskPanelMode('open');
  }, [selectedNodeId]);

  const handleSolve = async (id: string) => {
    const node = map.nodes.find(n => n.id === id);
    if (!node) return;
    if (!isNodeAvailable(node, map) && node.state !== 'resolved') return;

    setIsSolving(true);
    setSolveLogs(['Инициализация агента RICIS-III...']);
    
    setTimeout(() => setSolveLogs(l => [...l, 'Сборка контекста и аксиом из стека связей...']), 500);
    setTimeout(() => setSolveLogs(l => [...l, 'Отправка запроса на /api/generateProof...']), 1500);
    setTimeout(() => setSolveLogs(l => [...l, 'Синтез доказательства и применение SP1-SP4...']), 3000);

    await map.solveNode(id);
    setSolveLogs(l => [...l, 'Доказательство успешно синтезировано / перерассчитано!']);
    setTimeout(() => {
      setIsSolving(false);
      setSolveLogs([]);
      setPathNodeIds([]);
    }, 1500);
  };

  const handleFindPathToRicis = () => {
    if (!selectedNodeId) return;
    setPathNodeIds(findPathToRicis(selectedNodeId, map));
  };

  const handleGenerateTex = () => {
    if (!selectedNodeId) {
      setTexMsg('Select a node on the map.');
      setTimeout(() => setTexMsg(null), 3000);
      return;
    }
    try {
      const r = downloadTexPreprint(map, selectedNodeId, { mode: texMode });
      setTexMsg('TEX: ' + r.filename + ' (' + r.nodeCount + ' nodes to root, mode ' + texMode + ')');
      setTimeout(() => setTexMsg(null), 8000);
    } catch (e) {
      setTexMsg('TEX generation error');
      setTimeout(() => setTexMsg(null), 4000);
    }
  };

  const handleGenerateJSON = () => {
    try {
      // If purple filter is on — export ONLY derivative_claim nodes (filtered set).
      // Otherwise — classic expandToRoot from selected node.
      let nodes;
      let payloadMeta: Record<string, unknown>;

      if (showOnlyDerivatives) {
        nodes = map.nodes.filter(isDerivativeNode);
        if (nodes.length === 0) {
          setJsonMsg('Нет фиолетовых узлов для экспорта');
          setTimeout(() => setJsonMsg(null), 3000);
          return;
        }
        payloadMeta = {
          _instruction:
            'Экспорт только производных / priority-audit узлов (derivative_claim, фиолетовые). Фильтр «только фиолетовые» активен. Координаты графа исключены.',
          filter: 'derivative_claim_only',
          node_count: nodes.length,
        };
      } else {
        if (!selectedNodeId) {
          setJsonMsg('Выберите узел или включите фильтр фиолетовых');
          setTimeout(() => setJsonMsg(null), 3000);
          return;
        }
        nodes = expandToRoot(map, selectedNodeId);
        payloadMeta = {
          _instruction:
            'Это контекстный промпт, описывающий логическую цепь решения проблемы до корневых узлов в системе RICIS-III. Выведены полные доказательства и шаги решения, координаты графа исключены.',
          target_problem_id: selectedNodeId,
          target_problem_title: map.nodes.find(n => n.id === selectedNodeId)?.title,
        };
      }

      const payload = {
        ...payloadMeta,
        resolution_chain: nodes.map(n => {
          const proof = map.proofs[n.id];
          return {
            id: n.id,
            title: n.title,
            type: n.type,
            zone: map.zones.find(z => n.zoneIds.includes(z.id))?.name || n.zoneIds[0],
            description: n.description,
            target_function: n.targetFunction,
            singularity_hint: n.singularityHint,
            state: n.state,
            isDerivativeClaim: isDerivativeNode(n),
            firstMentionDate: n.firstMentionDate,
            derivativeScore: n.derivativeScore,
            matchedSignatures: n.matchedSignatures,
            sourceUrl: n.sourceUrl,
            dependencyIds: n.dependencyIds,
            economic_valuation: n.economic?.marketGain,
            proof: proof
              ? {
                  final_result: proof.finalResult,
                  steps: proof.steps.map(
                    s => `[Phase ${s.phase}] ${s.name} | ${s.action} => ${s.expression}`
                  ),
                  latex_math: proof.latex,
                }
              : null,
          };
        }),
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const suffix = showOnlyDerivatives ? 'derivatives-only' : selectedNodeId || 'export';
      a.download = `ricis-ai-prompt-${suffix}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setJsonMsg(
        showOnlyDerivatives
          ? `JSON: ${nodes.length} фиолетовых узлов`
          : 'Промпт скачан'
      );
      setTimeout(() => setJsonMsg(null), 4000);
    } catch (e) {
      setJsonMsg('Ошибка генерации JSON');
      setTimeout(() => setJsonMsg(null), 3000);
    }
  };

  const handleAgentDiscovery = async () => {
    setIsAgentSearching(true);
    try {
      const res = await map.runAgentDiscovery(selectedNodeId || undefined);
      if (res.error) {
        setAgentMsg('Ошибка агента: ' + res.error);
      } else {
        setAgentMsg(
          res.added > 0
            ? 'Агент добавил ' + res.added + ' новых проблем в граф.'
            : 'Агент не нашёл новых кандидатов.'
        );
      }
    } catch (e: any) {
      setAgentMsg('Ошибка поиска: ' + (e?.message || String(e)));
    } finally {
      setIsAgentSearching(false);
    }
    setTimeout(() => setAgentMsg(null), 5000);
  };

  const unlockReqs = useMemo(() => {
    if (!selectedNode || selectedNode.state === 'resolved') return [];
    if (isNodeAvailable(selectedNode, map)) return [];
    return getUnlockRequirements(selectedNode, map);
  }, [selectedNode, map.nodes]);

  const availableNodes = useMemo(
    () =>
      map.nodes.filter(
        n => n.state !== 'resolved' && isNodeAvailable(n, map) && !n.zoneIds.every(zid => hiddenZones.has(zid))
      ),
    [map.nodes, map.edges]
  );

  const visibleZoneIds = useMemo(() => {
    const activeZoneIds = new Set<string>();
    for (const zone of map.zones) {
      if (hiddenZones.has(zone.id)) continue;
      const hasVisibleNode = map.nodes.some(n => {
        if (!visibleNodeIds.has(n.id)) return false;
        const primaryId = (n.zoneIds && n.zoneIds[0]) ? n.zoneIds[0] : 'math';
        return primaryId === zone.id;
      });
      if (hasVisibleNode) {
        activeZoneIds.add(zone.id);
      }
    }
    return activeZoneIds;
  }, [map.zones, map.nodes, visibleNodeIds, hiddenZones]);

  const zonePositions = useMemo(
    () => layoutZones(map.zones, map.nodes, physicsParams),
    [map.zones, map.nodes, physicsParams]
  );

  const nodePositions = useMemo(
    () => layoutNodes(map, zonePositions, physicsParams),
    [map.nodes, map.edges, zonePositions, physicsParams]
  );

  const zoneRadii = useMemo(() => {
    const r: Record<string, number> = {};
    map.zones.forEach(z => {
      const members = map.nodes.filter(n => {
        if (!visibleNodeIds.has(n.id)) return false;
        const primaryId = (n.zoneIds && n.zoneIds[0]) ? n.zoneIds[0] : 'math';
        return primaryId === z.id;
      });
      const zPos = zonePositions[z.id];
      if (zPos && members.length > 0) {
        let maxDist = 0;
        members.forEach(m => {
          const mPos = nodePositions[m.id];
          if (mPos) {
            const dx = mPos[0] - zPos[0];
            const dy = mPos[1] - zPos[1];
            const dz = mPos[2] - zPos[2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const mRad = nodeVisualRadius(m, map.nodes);
            maxDist = Math.max(maxDist, dist + mRad);
          }
        });
        r[z.id] = maxDist * 1.1;
      } else {
        r[z.id] = zoneVisualRadius(z, map.nodes) * 1.1;
      }
    });
    return r;
  }, [map.zones, map.nodes, zonePositions, nodePositions, visibleNodeIds]);

  const nodeStateById = useMemo(() => {
    const m: Record<string, string> = {};
    map.nodes.forEach(n => {
      m[n.id] = n.state;
    });
    return m;
  }, [map.nodes]);

  const triggerFlight = (targetNodeId: string, source: NodeFocusSource) => {
    const nPos = nodePositions[targetNodeId];
    const targetNode = map.nodes.find((node) => node.id === targetNodeId);
    if (!nPos || !targetNode || !controlsRef.current) return;

    const currentCamPos = controlsRef.current.object.position.clone();
    const currentLookAt = controlsRef.current.target.clone();
    const focusRequest: NodeFocusRequest = {
      nodeId: targetNodeId as NodeFocusRequest['nodeId'],
      source,
      nodePosition: { x: nPos[0], y: nPos[1], z: nPos[2] },
      nodeVisualRadius: nodeVisualRadius(targetNode, map.nodes),
      currentCameraPosition: { x: currentCamPos.x, y: currentCamPos.y, z: currentCamPos.z },
      currentOrbitTarget: { x: currentLookAt.x, y: currentLookAt.y, z: currentLookAt.z },
      viewportKind: isMobileLayout ? 'mobile' : 'desktop',
    };
    const outcome = nodeFocusPolicy.plan(focusRequest);
    if (outcome.kind !== 'focus_planned') return;

    const { plan } = outcome;
    flightRef.current = {
      target: new THREE.Vector3(plan.orbitCenter.x, plan.orbitCenter.y, plan.orbitCenter.z),
      cameraPos: new THREE.Vector3(plan.cameraPosition.x, plan.cameraPosition.y, plan.cameraPosition.z),
      startTime: performance.now(),
      startLookAt: currentLookAt,
      startCamPos: currentCamPos,
      durationMs: plan.durationMs,
    };
  };

  const handleNavigateToNode = (targetId: string, source: NodeFocusSource = 'graph_click') => {
    if (source !== 'url_restore') setDeepLinkRequestedNodeId(null);
    if (isMobileLayout) {
      setSelectedNodeId(targetId);
      triggerFlight(targetId, source);
      openMobileView('details');
      return;
    }

    if (selectedNodeId && selectedNodeId !== targetId) {
      setNavigationStack(prev => [...prev, selectedNodeId]);
    }
    setSelectedNodeId(targetId);
    if (taskPanelMode === 'rail') {
      setTaskPanelMode('open');
    }
    triggerFlight(targetId, source);
  };

  const handleNavigateBack = () => {
    if (isMobileLayout) {
      backMobileView();
      return;
    }

    if (navigationStack.length > 0) {
      const prevId = navigationStack[navigationStack.length - 1];
      setNavigationStack(prev => prev.slice(0, -1));
      setSelectedNodeId(prevId);
      triggerFlight(prevId, 'navigation_back');
    }
  };

  React.useEffect(() => {
    const pendingNodeId = initialUrlFocusPendingRef.current;
    if (!map.hydrated || !pendingNodeId || !cameraControlsReady) return;
    if (deepLinkFocusOutcome.kind !== 'focused_catalog_node' || selectedNodeId !== pendingNodeId) {
      initialUrlFocusPendingRef.current = null;
      return;
    }
    triggerFlight(pendingNodeId, 'url_restore');
    initialUrlFocusPendingRef.current = null;
  }, [cameraControlsReady, deepLinkFocusOutcome, map.hydrated, selectedNodeId, nodePositions]);

  const edgesLines = useMemo(() => {
    return map.edges.filter(e => {
      const fromNode = map.nodes.find(n => n.id === e.fromId);
      const toNode = map.nodes.find(n => n.id === e.toId);
      if (!fromNode || !toNode) return false;
      if (!visibleNodeIds.has(e.fromId) || !visibleNodeIds.has(e.toId)) return false;
      return true;
    }).map(edge => {
      const fromPos = nodePositions[edge.fromId];
      const toPos = nodePositions[edge.toId];
      if (!fromPos || !toPos) return null;
      const onPath =
        pathEdgeKeys.has(edge.fromId + '|' + edge.toId) ||
        pathEdgeKeys.has(edge.toId + '|' + edge.fromId);
      const fromN = map.nodes.find(n => n.id === edge.fromId);
      const toN = map.nodes.find(n => n.id === edge.toId);

      const fromStatus = fromN
        ? graphColorManager.resolveNodeStatusCode(fromN, map.proofs?.[fromN.id])
        : NodeResolutionStatusCode.UNRESOLVED_SINGULARITY;
      const toStatus = toN
        ? graphColorManager.resolveNodeStatusCode(toN, map.proofs?.[toN.id])
        : NodeResolutionStatusCode.UNRESOLVED_SINGULARITY;

      const edgeStateCode = graphColorManager.resolveEdgeStateCode(fromStatus, toStatus, onPath);
      const edgeProjection = graphColorManager.getEdgeProjection(edgeStateCode);

      let color = edgeProjection.hexColor;
      let opacity = edgeProjection.opacity;
      
      // Apply global physics parameter modifier to edge opacity
      opacity *= (physicsParams.edgeOpacity ?? 0.5);

      const points = [new THREE.Vector3(...fromPos), new THREE.Vector3(...toPos)];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      return (
        <primitive
          key={edge.id}
          object={new THREE.Line(
            geometry,
            new THREE.LineBasicMaterial({ color, opacity, transparent: true })
          )}
        />
      );
    });
  }, [map.edges, map.nodes, map.proofs, nodePositions, pathEdgeKeys, visibleNodeIds, physicsParams.edgeOpacity]);

  const renderMapScene = () => (
    <>
      {mapPresentationMode === 'three_dimensional' ? (
        <MapCanvasErrorBoundary
          key="three-dimensional-map"
          onRenderFailure={() => {
            setMapFallbackReason('render_failed');
            setMapPresentationMode('accessible_list');
          }}
        >
          <Canvas className="touch-none block h-full w-full"
            camera={{ position: [0, 0, 32], fov: 55, far: 10000, near: 0.1 }}
            gl={{ antialias: true, alpha: true }}
            onCreated={({ gl }) => {
              gl.domElement.addEventListener('webglcontextlost', (event) => {
                event.preventDefault();
                console.warn('WebGL context lost, switching to accessible list.');
                setMapFallbackReason('render_failed');
                setMapPresentationMode('accessible_list');
              });
            }}
          >
            <UniverseSkybox radius={3200} />
            <OrbitControls controlsRef={controlsRef} flightRef={flightRef} onReady={markCameraControlsReady} />
            <CameraFlightRig flightRef={flightRef} controlsRef={controlsRef} />
            <ambientLight intensity={0.22} />
            <hemisphereLight args={['#1e3a5f', '#050508', 0.55]} />
            <pointLight position={[18, 22, 14]} intensity={1.35} color="#e8f4ff" distance={80} />
            <pointLight position={[-16, -8, 12]} intensity={0.85} color="#67e8f9" distance={70} />
            <pointLight position={[8, -14, -18]} intensity={0.55} color="#a78bfa" distance={60} />
            <pointLight position={[0, 28, 0]} intensity={0.45} color="#ffffff" distance={90} />
            <spotLight position={[12, 30, 8]} angle={0.45} penumbra={0.6} intensity={0.7} color="#cffafe" />

            {map.zones.filter(z => visibleZoneIds.has(z.id)).map(zone => {
              const pos = zonePositions[zone.id] || [0, 0, 0];
              const color = getZoneColor(zone.id);
              const radius = zoneRadii[zone.id] || 5;
              return (
                <group key={zone.id}>
                  <ZoneBubble position={pos} color={color} radius={radius} />
                  <ZoneLabel position={pos} text={zone.name} radius={radius} color={color} />
                </group>
              );
            })}

            {edgesLines}

            {map.nodes.filter(n => visibleNodeIds.has(n.id)).map(node => {
              const pos = nodePositions[node.id] || [0, 0, 0];
              const isSelected = selectedNode?.id === node.id;
              const isCore = isRicisCore(node);
              const available = isNodeAvailable(node, map);
              const onPath = pathSet.has(node.id);
              const locked = !available && node.state !== 'resolved';
              const isDeriv = node.type === 'derivative_claim' || node.isDerivativeClaim === true;
              const hasSorry = nodeHasSorry(node, map.proofs?.[node.id]);

              const visualStatus = presentMapNodeVisualStatus({
                nodeId: node.id,
                nodeState: node.state,
                proof: map.proofs?.[node.id],
                hasSorry: hasSorry || isMissingTargetFunction(node),
                isDerivative: isDeriv,
                isOnPath: onPath,
                isLocked: locked,
              });
              const color = visualStatus.sphereColor;

              const baseR = nodeVisualRadius(node, map.nodes);
              const radius = isSelected ? baseR * 1.28 : onPath ? baseR * 1.12 : isDeriv ? baseR * 1.15 : baseR;
              const emissive = isSelected ? '#22d3ee' : isDeriv ? '#7e22ce' : onPath ? '#0891b2' : isCore ? '#155e75' : color;
              const emissiveIntensity = isSelected ? 0.65 : isDeriv ? 0.55 : onPath ? 0.45 : isCore ? 0.35 : locked ? 0.08 : 0.22;

              return (
                <group
                  key={node.id}
                  onPointerOver={e => {
                    e.stopPropagation();
                    hoveredNodePos = new THREE.Vector3(pos[0], pos[1], pos[2]);
                  }}
                  onPointerOut={() => {
                    hoveredNodePos = null;
                  }}
                >
                  <NodeBubble
                    position={pos}
                    color={color}
                    radius={radius}
                    emissive={emissive}
                    emissiveIntensity={emissiveIntensity}
                    opacity={locked ? 0.5 : 0.92}
                    locked={locked}
                    onClick={e => {
                      e.stopPropagation();
                      handleNavigateToNode(node.id);
                    }}
                  />
                  <NodeLabel
                    position={pos}
                    text={node.title}
                    subtitle={map.zones.find(z => z.id === node.zoneIds[0])?.name || node.zoneIds[0]}
                    valueText={formatCurrency(node.economic?.marketGain)}
                    offsetY={radius + 0.35}
                  />
                </group>
              );
            })}
          </Canvas>
        </MapCanvasErrorBoundary>
      ) : (
        <AccessibleMapFallback
          nodes={map.nodes.filter(node => visibilityProjection.visibleNodeIds.has(node.id))}
          zones={map.zones}
          selectedNodeId={selectedNodeId}
          reason={mapFallbackReason}
          onSelectNode={handleNavigateToNode}
          onEnable3d={() => {
            setMapFallbackReason('user_selected');
            setMapPresentationMode('three_dimensional');
          }}
        />
      )}
    </>
  );

  const renderMobileShell = () => {
    const selectedNodeTitle = selectedNodePresentation?.title ?? t('map.nodeCard');
    const mobileFocusNode = selectedNodePresentation ?? map.nodes.find(node => isNodeAvailable(node, map)) ?? map.nodes[0];
    const shouldRenderMap = mobileView === 'map' || mobileView === 'settings' || isImmersive;

    return (
      <div className="flex min-h-0 flex-1 flex-col" data-testid="mobile-map-shell">
        {!isImmersive && (
          <header className="min-h-14 shrink-0 border-b border-cyan-900/40 bg-[#080808] px-3 py-2 flex items-center justify-between gap-2" data-testid="mobile-map-header">
            <div className="flex min-w-0 items-center gap-2">
              {mobileView !== 'map' ? (
                <button
                  type="button"
                  onClick={handleNavigateBack}
                  className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-md border border-cyan-900/60 bg-cyan-950/30 text-cyan-300"
                  aria-label="Назад"
                >
                  <ArrowLeft size={18} />
                </button>
              ) : (
                <div className="w-2.5 h-2.5 shrink-0 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_12px_#22d3ee]" />
              )}
              <div className="min-w-0">
                <h1 className="truncate text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-300">RICIS-III</h1>
                <p className="text-[9px] font-mono text-slate-500">
                  {mobileView === 'details' ? selectedNodeTitle : mobileView === 'menu' ? 'Навигация и действия' : mobileView === 'settings' ? 'Настройки' : '3D Singularity Map'}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className={`hidden xs:inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-mono ${coreStatusPresentation.className}`} title={coreStatusPresentation.label}>
                <span className={`h-1.5 w-1.5 rounded-full ${coreStatusPresentation.dotClassName}`} />
                CORE
              </span>
              <LanguageToggle />
              <button
                type="button"
                onClick={() => (mobileView === 'menu' ? handleNavigateBack() : openMobileView('menu'))}
                className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-md border border-cyan-800/70 bg-cyan-950/60 text-cyan-100"
                aria-label={mobileView === 'menu' ? 'Вернуться к карте' : 'Открыть меню'}
              >
                {mobileView === 'menu' ? <MapIcon size={17} /> : <Menu size={18} />}
              </button>
            </div>
          </header>
        )}

        {shouldRenderMap && (
          <section className={`mobile-map-layout min-h-0 flex-1 ${isImmersive ? 'mobile-map-layout--immersive' : ''}`} data-testid="mobile-map-layout">
            <div
              ref={sceneContainerRef}
              onPointerUp={handleScenePointerUp}
              className="mobile-map-layout__viewport relative min-h-0 overflow-hidden bg-[radial-gradient(circle_at_center,_#0a0f1a_0%,_#050505_100%)]"
              data-testid="mobile-map-viewport"
            >
              {renderMapScene()}
              <div className="mobile-map-layout__quickbar pointer-events-none absolute inset-x-3 bottom-3 z-20 flex items-center justify-between gap-2">
                <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-cyan-900/60 bg-black/70 p-1.5 shadow-xl backdrop-blur-sm">
                  <button type="button" onClick={handleZoomOut} className="min-h-10 min-w-10 rounded-lg text-cyan-200 hover:bg-cyan-950/70" aria-label="Уменьшить масштаб">−</button>
                  <button type="button" onClick={handleResetCamera} className="min-h-10 min-w-10 rounded-lg text-cyan-200 hover:bg-cyan-950/70" aria-label="Сбросить вид"><Crosshair size={16} /></button>
                  <button type="button" onClick={handleZoomIn} className="min-h-10 min-w-10 rounded-lg text-cyan-200 hover:bg-cyan-950/70" aria-label="Увеличить масштаб">+</button>
                </div>
                <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-cyan-900/60 bg-black/70 p-1.5 shadow-xl backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={() => void toggleSensorMode()}
                    className={`min-h-10 min-w-10 rounded-lg inline-flex items-center justify-center ${sensorModeEnabled ? 'bg-emerald-900/70 text-emerald-200' : 'text-cyan-200 hover:bg-cyan-950/70'}`}
                    aria-pressed={sensorModeEnabled}
                    aria-label={sensorModeEnabled ? 'Отключить управление наклоном' : 'Включить управление наклоном'}
                  >
                    <Compass size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleImmersiveCanvas(sceneContainerRef.current)}
                    className="min-h-10 min-w-10 rounded-lg inline-flex items-center justify-center text-cyan-200 hover:bg-cyan-950/70"
                    aria-label={isImmersive ? 'Выйти из полноэкранного режима' : 'Развернуть 3D на полный экран'}
                  >
                    {isImmersive ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                </div>
              </div>
              {isImmersive && (
                <button
                  type="button"
                  onClick={() => void exitImmersiveCanvas()}
                  className="absolute left-3 top-3 z-30 min-h-11 rounded-lg border border-cyan-700/70 bg-black/70 px-3 text-xs font-bold text-cyan-200 backdrop-blur-sm"
                >
                  Выйти
                </button>
              )}
              {!isImmersive && mapPresentationMode === 'three_dimensional' && (
                <p className="pointer-events-none absolute left-3 top-3 z-20 rounded-md border border-cyan-950/80 bg-black/55 px-2 py-1 text-[9px] font-mono text-cyan-200/80">
                  Двойное касание — полный экран
                </p>
              )}
            </div>

            {!isImmersive && (
              <div className="min-h-0 overflow-y-auto border-t border-cyan-900/40 bg-[#070707] p-3 touch-pan-y">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Карта</p>
                    <p className="text-[10px] text-slate-500">{map.nodes.length} узлов · {availability.available} доступны</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (mapPresentationMode === 'three_dimensional') {
                        setMapFallbackReason('user_selected');
                        setMapPresentationMode('accessible_list');
                      } else {
                        setMapPresentationMode('three_dimensional');
                      }
                    }}
                    className="min-h-10 rounded-lg border border-cyan-800/70 bg-cyan-950/50 px-3 text-[10px] font-bold text-cyan-100 inline-flex items-center gap-1.5"
                    aria-pressed={mapPresentationMode === 'accessible_list'}
                  >
                    {mapPresentationMode === 'three_dimensional' ? <List size={14} /> : <MapIcon size={14} />}
                    {mapPresentationMode === 'three_dimensional' ? 'Список' : '3D'}
                  </button>
                </div>
                {sensorNotice && (
                  <p className={`mb-3 rounded-lg border px-3 py-2 text-[10px] leading-relaxed ${sensorModeEnabled ? 'border-emerald-900/60 bg-emerald-950/30 text-emerald-200' : 'border-cyan-900/60 bg-cyan-950/30 text-cyan-200'}`}>
                    {sensorNotice}
                  </p>
                )}
                {mobileFocusNode && (
                  <button
                    type="button"
                    onClick={() => handleNavigateToNode(mobileFocusNode.id)}
                    className="mobile-map-focus-card mb-2 min-h-13 w-full rounded-lg border border-cyan-800/80 bg-cyan-950/35 px-3 text-left text-cyan-100 flex items-center gap-3"
                    data-testid="mobile-map-focus-node"
                  >
                    <Layers size={16} className="shrink-0 text-cyan-300" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[9px] font-mono uppercase tracking-wider text-cyan-400">{selectedNodePresentation ? t('map.selectedProblem') : t('research.openAvailable')}</span>
                      <span className="block truncate text-xs font-bold">{mobileFocusNode.title}</span>
                    </span>
                    <ChevronRight size={17} className="shrink-0 text-cyan-300" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openMobileView('menu')}
                  className="min-h-12 w-full rounded-lg border border-cyan-800/80 bg-cyan-950/50 px-4 text-left text-xs font-bold text-cyan-100 flex items-center justify-between"
                >
                  <span>Меню: поиск, карточки и настройки</span><Menu size={17} />
                </button>
              </div>
            )}
          </section>
        )}

        {mobileView === 'menu' && !isImmersive && (
          <main className="min-h-0 flex-1 overflow-y-auto bg-[#070707] p-3 touch-pan-y" data-testid="mobile-menu-screen">
            <div className="space-y-3">
              <label className="flex items-center gap-2 rounded-lg border border-cyan-900/50 bg-[#050810] px-3 py-2.5">
                <Search size={16} className="shrink-0 text-cyan-400" />
                <input
                  type="search"
                  placeholder={t('search.placeholder')}
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                />
                {searchQuery && <span className="text-[10px] font-mono text-cyan-300">{searchMatchCount}</span>}
              </label>

              <button
                type="button"
                onClick={() => {
                  UrlShareService.updateBrowserUrl({ roadmap: true, rootNodeId: null });
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="min-h-12 w-full rounded-lg border border-violet-800/80 bg-violet-950/35 px-3 text-left text-xs font-bold text-violet-100 inline-flex items-center justify-between"
              >
                <span className="inline-flex items-center gap-2"><List size={16} /> Roadmap: выбрать маршрут исследования</span><ChevronRight size={17} />
              </button>

              {selectedNode && (
                <button
                  type="button"
                  onClick={() => openMobileView('details')}
                  className="mobile-menu-selected-task min-h-14 w-full rounded-lg border border-cyan-800/80 bg-cyan-950/35 px-3 text-left text-cyan-100 inline-flex items-center gap-3"
                >
                  <Layers size={17} className="shrink-0 text-cyan-300" />
                  <span className="min-w-0 flex-1"><span className="block text-[9px] font-mono uppercase tracking-wider text-cyan-400">{t('map.selectedProblem')}</span><span className="block truncate text-xs font-bold">{selectedNodePresentation?.title ?? selectedNode.title}</span></span>
                  <ChevronRight size={17} className="shrink-0 text-cyan-300" />
                </button>
              )}

              <details className="mobile-menu-secondary rounded-lg border border-neutral-800 bg-neutral-950/40">
                <summary className="min-h-12 cursor-pointer list-none px-3 text-xs font-bold text-slate-300 inline-flex w-full items-center justify-between gap-3"><span className="inline-flex items-center gap-2"><SlidersHorizontal size={16} className="text-cyan-400" /> Инструменты и настройки</span><ChevronDown size={16} className="text-slate-500" /></summary>
                <div className="mobile-menu-secondary-grid border-t border-neutral-800 p-2">
                  <button type="button" onClick={openMobileSettings} className="min-h-12 rounded-lg border border-neutral-700 bg-neutral-900/70 px-3 text-left text-xs font-bold text-slate-100 inline-flex items-center gap-2"><Settings size={16} className="text-cyan-400" /> Настройки интерфейса и физики</button>
                  <button type="button" onClick={() => void toggleSensorMode()} className="min-h-12 rounded-lg border border-neutral-700 bg-neutral-900/70 px-3 text-left text-xs font-bold text-slate-100 inline-flex items-center gap-2"><Compass size={16} className={sensorModeEnabled ? 'text-emerald-400' : 'text-cyan-400'} /> {sensorModeEnabled ? 'Отключить управление наклоном' : 'Включить управление наклоном'}</button>
                  <button type="button" onClick={() => setShowAddNode(true)} className="min-h-12 rounded-lg border border-emerald-800/70 bg-emerald-950/40 px-3 text-left text-xs font-bold text-emerald-100 inline-flex items-center gap-2"><Plus size={16} /> {t('filter.addNewTask')}</button>
                  <button type="button" onClick={checkCoreRuntime} disabled={isCheckingCoreRuntime} className="min-h-12 rounded-lg border border-violet-800/70 bg-violet-950/30 px-3 text-left text-xs font-bold text-violet-100 inline-flex items-center gap-2 disabled:opacity-50"><Cpu size={16} /> {isCheckingCoreRuntime ? t('core.status.checking') : 'Проверить RICIS Core'}</button>
                </div>
              </details>

              <section className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-3">
                <div className="mb-2 flex items-center justify-between"><h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Найденные узлы</h2><span className="text-[10px] font-mono text-slate-500">{searchMatchCount}</span></div>
                <div className="mobile-menu-results">
                  {map.nodes.filter(node => visibleNodeIds.has(node.id)).slice(0, 24).map(node => (
                    <button key={node.id} type="button" onClick={() => handleNavigateToNode(node.id)} className="w-full rounded-md px-2 py-2 text-left text-xs text-slate-300 hover:bg-cyan-950/40 hover:text-cyan-100">
                      <span className="block truncate font-semibold">{node.title}</span>
                      <span className="block truncate text-[10px] font-mono text-cyan-500">Key: {getNodeIdentityPresentation(node).base64Key}</span>
                      <span className="block truncate text-[10px] font-mono text-slate-500">Path: {getNodeIdentityPresentation(node).canonicalPath}</span>
                      <span className="block truncate text-[10px] text-slate-500">{map.zones.find(zone => zone.id === node.zoneIds[0])?.name ?? node.zoneIds[0]}</span>
                    </button>
                  ))}
                  {searchMatchCount === 0 && <p className="px-2 py-2 text-[10px] text-slate-500">Узлы по этому запросу не найдены.</p>}
                  {searchMatchCount > 24 && <p className="px-2 pt-2 text-[10px] text-slate-500">Уточните запрос, чтобы сузить список.</p>}
                </div>
              </section>
            </div>
          </main>
        )}

        {mobileView === 'details' && selectedNode && !isImmersive && (
          <main className="min-h-0 flex-1 overflow-y-auto bg-[#070707] p-3 touch-pan-y" data-testid="mobile-details-screen">
            <article className="rounded-xl border border-cyan-900/60 bg-black/70 p-3 shadow-xl">
              <div className="mb-3 border-b border-cyan-900/30 pb-3">
                <p className="text-[9px] font-mono text-cyan-500">Key: {getNodeIdentityPresentation(selectedNode).base64Key}</p><p className="text-[9px] font-mono text-slate-500 truncate">Path: {getNodeIdentityPresentation(selectedNode).canonicalPath}</p><h2 className="mt-1 text-sm font-bold leading-tight text-white">{selectedNodePresentation?.title ?? selectedNode.title}</h2>
              </div>
              <NodeCardDetails node={selectedNodePresentation ?? selectedNode} map={map} isExpanded={true} onEdit={() => setEditingNode(selectedNode)} onNavigateToNode={handleNavigateToNode} />
              <ActionButton
                onClick={() => handleSolve(selectedNode.id)}
                isLoading={isSolving}
                isDisabled={!isNodeAvailable(selectedNode, map) && selectedNode.state !== 'resolved'}
                variant="cyan"
                className="mt-4 w-full py-3 text-[11px] font-bold uppercase tracking-wider"
              >
                {selectedNode.state === 'resolved' ? 'Перерассчитать RICIS-решение' : 'Запустить RICIS-решение'}
              </ActionButton>
            </article>
          </main>
        )}
      </div>
    );
  };

  return (
    <div className={`w-full bg-[#050505] text-[#e0e0e0] font-sans overflow-hidden flex flex-col ${isImmersive ? 'fixed inset-0 z-[100] h-[100dvh]' : 'h-screen'}`}>
      {visibilityProjection.deepLinkDiagnostic && (
        <p role="alert" data-testid="unknown-deep-link-target" className="shrink-0 border-b border-amber-900/70 bg-amber-950/40 px-3 py-2 text-xs text-amber-100">
          Requested map node ID <code className="font-mono text-amber-200">{visibilityProjection.deepLinkDiagnostic.requestedNodeId}</code> is not available in this map.
        </p>
      )}
      {isMobileLayout ? renderMobileShell() : (
        <>
      <header className="min-h-16 border-b border-cyan-900/40 bg-[#080808] flex items-center justify-between gap-2 px-3 py-2 sm:px-6 shrink-0 z-20">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <div className="w-3.5 h-3.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_12px_#22d3ee]" />
          <h1 className="text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-300 flex items-center gap-2">
            <span>RICIS-III</span>
            <span className="hidden text-slate-400 font-normal text-xs sm:inline">// 3D Singularity Map</span>
          </h1>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full border border-cyan-700/80 bg-cyan-950/70 text-cyan-200 font-bold">
            {APP_BUILD_LABEL}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-5">
          <div className="hidden gap-4 text-xs font-mono sm:flex">
            <div className="flex flex-col"><span className="text-slate-400 text-[10px]">{t('header.nodes')}</span><span className="text-slate-100 font-bold">{map.nodes.length}</span></div>
            <div className="flex flex-col"><span className="text-slate-400 text-[10px]">{t('header.available')}</span><span className="text-emerald-400 font-bold">{availability.available}</span></div>
            <div className="flex flex-col"><span className="text-slate-400 text-[10px]">{t('header.locked')}</span><span className="text-slate-300 font-bold">{availability.locked}</span></div>
            <div className="flex flex-col"><span className="text-slate-400 text-[10px]">{t('header.resolved')}</span><span className="text-green-400 font-bold">{availability.resolved}</span></div>
          </div>
          <LanguageToggle />
          <button
            type="button"
            onClick={() => {
              UrlShareService.updateBrowserUrl({ roadmap: true, rootNodeId: null });
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="min-h-10 bg-violet-950/50 hover:bg-violet-900/60 border border-violet-700/60 text-violet-100 font-bold text-xs px-2 sm:px-3.5 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
            aria-label={t('map.roadmap.aria')}
            title={t('map.roadmap.title')}
          >
            <List size={14} /> <span className="hidden sm:inline">Roadmap</span>
          </button>
          <button
            type="button"
            onClick={() => setShowVoynichModal(true)}
            className="min-h-10 bg-yellow-950/60 hover:bg-yellow-900/70 border border-yellow-600/60 text-yellow-300 font-bold text-xs px-2 sm:px-3.5 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider shadow-[0_0_12px_rgba(234,179,8,0.2)]"
            aria-label={t('map.voynich.label')}
            title={t('map.voynich.title')}
          >
            <BookOpen size={14} className="text-yellow-400" /> <span className="hidden sm:inline">{t('map.voynich.label')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (mapPresentationMode === 'three_dimensional') {
                setMapFallbackReason('user_selected');
                setMapPresentationMode('accessible_list');
              } else {
                setMapPresentationMode('three_dimensional');
              }
            }}
            className="min-h-10 min-w-10 bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-800/70 text-cyan-100 font-bold text-xs px-2 sm:px-3.5 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
            aria-pressed={mapPresentationMode === 'accessible_list'}
            aria-label={t('map.presentation.toggle')}
            title={t('map.presentation.toggle')}
          >
            <Layers size={14} /> <span className="hidden sm:inline">{mapPresentationMode === 'three_dimensional' ? t('map.presentation.list') : t('map.presentation.threeDimensional')}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="min-h-10 min-w-10 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-slate-200 font-bold text-xs px-2 sm:px-3.5 py-1.5 rounded-md shadow-[0_0_12px_rgba(255,255,255,0.05)] transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
            aria-label={t('header.settings')}
          >
            <Settings size={14} className="text-cyan-400" /> <span className="hidden sm:inline">{t('header.settings')}</span>
          </button>
          <button
            type="button"
            onClick={() => toggleTerminal(true)}
            className="min-h-10 min-w-10 bg-purple-900/50 hover:bg-purple-800/60 border border-purple-700/50 text-purple-300 font-bold text-xs px-2 sm:px-3.5 py-1.5 rounded-md shadow-[0_0_12px_rgba(168,85,247,0.2)] transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
            aria-label={t('header.sandbox')}
          >
            <Terminal size={14} /> <span className="hidden sm:inline">{t('header.sandbox')}</span>
          </button>
        </div>
      </header>

      <main className={`flex-1 min-h-0 flex flex-col md:grid relative overflow-y-auto md:overflow-hidden ${leftPanelMode === 'open' ? 'md:grid-cols-[21rem_minmax(0,1fr)]' : 'md:grid-cols-[0_minmax(0,1fr)]'}`}>
        <aside data-testid="desktop-navigation-panel" data-panel-mode={leftPanelMode} className={`order-3 h-[58dvh] w-full border-t border-cyan-900/40 bg-[#070707] p-3 flex flex-col gap-3 shrink-0 z-10 overflow-y-auto touch-pan-y md:order-1 md:row-start-1 md:col-start-1 md:h-full md:w-auto md:border-t-0 md:border-r ${leftPanelMode === 'rail' ? 'md:hidden' : ''}`}>
          <button
            type="button"
            onClick={() => setLeftPanelMode('rail')}
            className="absolute right-2 top-2 z-30 hidden md:inline-flex min-h-7 min-w-7 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-cyan-950/50 hover:text-cyan-300"
            aria-label="Свернуть левую панель"
            title="Свернуть левую панель"
          >
            <ChevronLeft size={14} />
          </button>
          {/* SEARCH BAR (Top of Sidebar) */}
          <div className="relative border border-cyan-900/40 rounded-lg overflow-visible bg-[#050810]/90 backdrop-blur-md px-3.5 py-2.5 mb-1 flex items-center gap-2.5 z-20">
            <Search size={16} className="text-cyan-400 shrink-0" />
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => { saveToHistory(searchQuery); setTimeout(() => setIsSearchFocused(false), 200); }}
                onKeyDown={e => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); if (!filteredHistory.length) return; setSelectedHistoryIndex(prev => (prev < filteredHistory.length - 1 ? prev + 1 : 0)); }
                  else if (e.key === 'ArrowUp') { e.preventDefault(); if (!filteredHistory.length) return; setSelectedHistoryIndex(prev => (prev > 0 ? prev - 1 : filteredHistory.length - 1)); }
                  else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (selectedHistoryIndex >= 0 && selectedHistoryIndex < filteredHistory.length) {
                      setSearchQuery(filteredHistory[selectedHistoryIndex]);
                      setIsSearchFocused(false);
                      return;
                    }
                    saveToHistory(searchQuery);
                  }
                }}
                className="w-full bg-transparent border-0 p-0 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-0"
              />
              
              {isSearchFocused && filteredHistory.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-[#050810] border border-cyan-900/80 rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.85)] z-50 py-1 max-h-48 overflow-y-auto">
                  {filteredHistory.map((query, index) => (
                    <button
                      key={query}
                      type="button"
                      className={`w-full text-left px-3 py-1.5 text-xs font-mono cursor-pointer flex items-center justify-between ${index === selectedHistoryIndex ? 'bg-cyan-950 text-cyan-300' : 'text-slate-400 hover:bg-neutral-900 hover:text-slate-200'}`}
                      onMouseDown={(e) => { e.preventDefault(); setSearchQuery(query); setIsSearchFocused(false); saveToHistory(query); }}
                    >
                      <span>{query}</span>
                      <span className="opacity-50 text-[10px]">История</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {searchQuery.trim() && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-slate-500 hover:text-white text-xs px-1 cursor-pointer transition-colors"
                title="Очистить"
              >
                ✕
              </button>
            )}
            {searchQuery.trim() && (
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border leading-none ${searchMatchCount > 0 ? 'bg-cyan-950/80 text-cyan-200 border-cyan-700/80 font-bold' : 'bg-rose-950/80 text-rose-200 border-rose-700/80 font-bold'}`}>
                {searchMatchCount}
              </span>
            )}
          </div>

          {/* Render active panels */}
          <div className="accordion-container flex flex-col gap-0 border-0 bg-transparent overflow-visible w-full">
          {[...projectedVisibleElements.map((el: any) => ({ ...el, isHidden: false })), ...hiddenElements.filter((el: any) => !projectedVisibleElements.some(visibleElement => visibleElement.id === el.id)).map((el: any) => ({ ...el, isHidden: true }))].map(({ id, isHidden }: any) => {
            if (userDisabledPanelIds.has(id)) return null;
            if (isHidden && !showOverflow) return null;
            
            // Every sidebar panel uses the existing adaptive ranking; physics lives in SettingsModal.
            return (
              <div key={id} data-testid={id === 'persistence' ? 'persistence-export-panel' : undefined} className={`accordion-item border border-neutral-800/80 rounded-lg overflow-hidden bg-neutral-900/40 mb-2 relative ${isHidden ? 'opacity-90 border-dashed border-neutral-700' : ''}`}>
                <input type="checkbox" id={`accordion-${id}`} className="accordion-trigger" checked={openPanelIds.has(id as PanelId)} readOnly />
                <button
                  type="button"
                  aria-expanded={openPanelIds.has(id as PanelId)}
                  aria-controls={`accordion-content-${id}`}
                  className="accordion-header bg-neutral-950/80 hover:bg-neutral-900/90 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80 w-full flex flex-col items-start px-3.5 py-2.5 h-auto rounded-none border-0 m-0 text-left"
                  onClick={() => toggleAccordion(id as PanelId)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                       {id === 'actions' && <Plus size={16} className="text-emerald-400" />}
                       {id === 'zones' && <Layers size={16} className="text-cyan-400" />}
                       {id === 'available' && <CheckCircle2 size={16} className="text-emerald-400" />}
                       {id === 'agent' && <Bot size={16} className="text-violet-400" />}
                       {id === 'persistence' && <Database size={16} className="text-cyan-400" />}
                       {id === 'audit' && <RefreshCw size={16} className="text-amber-400" />}
                       
                       <span className="text-xs font-bold text-slate-100 uppercase tracking-wider accordion-title p-0">
                         {id === 'actions' && t('filter.quickActions')}
                         {id === 'zones' && t('filter.scientificFields')}
                         {id === 'available' && t('filter.availableToSolve')}
                         {id === 'physics' && (t('sandbox.title') === 'RICIS-III ПЕСОЧНИЦА СИНГУЛЯРНОСТЕЙ' ? 'Параметры симуляции' : 'Simulation Parameters')}
                         {id === 'agent' && t('filter.aiAgent')}
                         {id === 'persistence' && t('filter.saveAndExport')}
                         {id === 'audit' && (t('sandbox.title') === 'RICIS-III ПЕСОЧНИЦА СИНГУЛЯРНОСТЕЙ' ? 'Аудит и Верификация' : 'Audit & Verification')}
                       </span>

                       {id === 'zones' && (
                         <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-neutral-900 text-cyan-300 border border-neutral-700">
                           {map.zones.length - hiddenZones.size} / {map.zones.length}
                         </span>
                       )}
                       {id === 'available' && (
                         <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-neutral-900 text-emerald-300 border border-neutral-700">
                           {availableNodes.length}
                         </span>
                       )}
                       {id === 'agent' && (
                         <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono bg-neutral-900 border border-neutral-700 text-emerald-400">
                           <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                           <span>ONLINE</span>
                         </span>
                       )}
                    </div>
                    <span className="accordion-icon" aria-hidden="true">▼</span>
                  </div>

                  <div className="accordion-summary mt-2 pt-1.5 border-t border-neutral-800/40 flex flex-wrap gap-1 text-xs font-mono truncate w-full">
                    {id === 'actions' && (
                      <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-slate-200 text-emerald-300">+ Добавить новую задачу</span>
                    )}
                    {id === 'zones' && (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {map.zones.filter(z => !hiddenZones.has(z.id)).length === 0 ? (
                          <span className="text-xs text-amber-400 font-medium italic">Все сферы скрыты</span>
                        ) : (
                          map.zones.filter(z => !hiddenZones.has(z.id)).map(z => (
                            <span key={z.id} className="inline-flex items-center gap-1.5 bg-neutral-900 border border-neutral-700/80 px-2 py-0.5 rounded-full text-xs text-slate-200">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getZoneColor(z.id) }} />
                              <span className="truncate max-w-[130px] font-medium">{z.name}</span>
                              <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); setHiddenZones(prev => new Set(prev).add(z.id)); }} className="text-slate-400 hover:text-rose-400 font-bold ml-0.5 cursor-pointer">✕</span>
                            </span>
                          ))
                        )}
                      </div>
                    )}
                    {id === 'available' && (
                      selectedNode ? (
                        <span className="bg-emerald-950/80 border border-emerald-700/80 px-2.5 py-0.5 rounded-full text-emerald-200 inline-flex items-center gap-1.5 max-w-full font-medium">
                          <span className="truncate">🎯 {selectedNodePresentation?.title ?? selectedNode.title}</span>
                          <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedNodeId(null); }} className="text-slate-400 hover:text-rose-400 font-bold cursor-pointer">✕</span>
                        </span>
                      ) : availableNodes.length > 0 ? (
                        <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-slate-300 truncate max-w-full">
                          Доступно: <strong className="text-emerald-400">{availableNodes.length}</strong> задач
                        </span>
                      ) : (
                        <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-slate-400">Нет открытых задач</span>
                      )
                    )}
                    {id === 'agent' && (
                      <>
                        <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-slate-200 text-violet-300">🤖 {selectedModel}</span>
                        <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-slate-300 text-violet-300">Telegram Bot</span>
                      </>
                    )}
                    {id === 'persistence' && (
                      <>
                        <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-slate-200 text-cyan-300">💾 IndexedDB</span>
                        <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-slate-200 text-cyan-300">📥 .json</span>
                      </>
                    )}
                  </div>
                </button>

                  <div id={`accordion-content-${id}`} className="accordion-content">
                  <div className={`accordion-inner p-3 border-t border-neutral-800/60 bg-neutral-950/40 relative overflow-y-auto ${id === 'zones' || id === 'available' || id === 'agent' ? 'max-h-64' : 'max-h-56'}`}>

                    {id === 'actions' && (
                      <div className="space-y-2">
                        <ActionButton
                          onClick={() => {
                            const firstAvailable = availableNodes[0];
                            if (firstAvailable) handleNavigateToNode(firstAvailable.id);
                          }}
                          isDisabled={availableNodes.length === 0}
                          variant="cyan"
                          className="w-full uppercase font-bold tracking-wider cursor-pointer py-2 text-xs"
                        >
                          {t('research.openAvailable')}
                        </ActionButton>
                        <ActionButton onClick={() => setShowAddNode(true)} variant="emerald" className="w-full uppercase font-bold tracking-wider cursor-pointer py-2 text-xs">
                          {t('filter.addNewTask')}
                        </ActionButton>
                        <button
                          type="button"
                          onClick={() => setShowProofConsole(true)}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg shadow-cyan-950/40"
                        >
                          <Cpu className="w-4 h-4 text-cyan-400" />
                          {t('research.proofConsole')}
                        </button>
                        {calculatorExplorer.kind === 'PROJECTED' && (
                          <>
                            <ActionButton
                              onClick={() => setIsCalculatorExplorerOpen((open) => !open)}
                              variant="emerald"
                              className="w-full uppercase font-bold tracking-wider cursor-pointer py-2 text-xs"
                            >
                              {t('calculatorExplorer.action')}
                            </ActionButton>
                            <CalculatorExplorer
                              isOpen={isCalculatorExplorerOpen}
                              entries={calculatorExplorer.entries}
                              locale={locale}
                              t={t}
                              onClose={() => setIsCalculatorExplorerOpen(false)}
                              onSelectNode={handleNavigateToNode}
                            />
                            {monolithGuidedCaseTrail.kind === 'PROJECTED' && (
                              <>
                                <ActionButton
                                  onClick={() => setIsMonolithGuidedCaseTrailOpen((open) => !open)}
                                  variant="cyan"
                                  className="w-full uppercase font-bold tracking-wider cursor-pointer py-2 text-xs"
                                >
                                  {t('guidedTrail.action')}
                                </ActionButton>
                                <MonolithGuidedCaseTrail
                                  isOpen={isMonolithGuidedCaseTrailOpen}
                                  trail={monolithGuidedCaseTrail}
                                  locale={locale}
                                  t={t}
                                  onClose={() => setIsMonolithGuidedCaseTrailOpen(false)}
                                  onSelectNode={handleNavigateToNode}
                                />
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    {id === 'audit' && <AuditPanel />}

                    {id === 'zones' && (
                      <div className="space-y-1">
                        {map.zones.map(z => (
                          <label key={z.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-neutral-800/40 rounded cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={!hiddenZones.has(z.id)}
                              onChange={(e) => {
                                setHiddenZones(prev => {
                                  const next = new Set(prev);
                                  if (e.target.checked) next.delete(z.id);
                                  else next.add(z.id);
                                  return next;
                                });
                              }}
                              className="w-3.5 h-3.5 rounded border-neutral-600 bg-neutral-900 checked:bg-cyan-500 cursor-pointer"
                            />
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getZoneColor(z.id) }} />
                            <span className="text-xs text-slate-300 group-hover:text-slate-100 font-medium truncate flex-1">{z.name}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {id === 'available' && (
                      <div className="space-y-1">
                        {availableNodes.map(node => (
                          <button
                            key={node.id}
                            type="button"
                            onClick={() => handleNavigateToNode(node.id)}
                            className={`w-full text-left px-2 py-2 rounded text-xs transition-colors cursor-pointer border ${selectedNodeId === node.id ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300' : 'bg-transparent border-transparent hover:bg-neutral-800/40 text-slate-300 hover:text-slate-100'}`}
                          >
                            <div className="font-bold truncate">{node.title}</div>
                            {node.economic?.marketGain && (
                              <div className="text-[10px] text-emerald-500/70 font-mono mt-0.5">
                                Ценность: {formatCurrency(node.economic.marketGain)}
                              </div>
                            )}
                          </button>
                        ))}
                        {availableNodes.length === 0 && (
                          <div className="text-xs text-slate-500 text-center py-4 italic">
                            Все узлы заблокированы или решены
                          </div>
                        )}
                      </div>
                    )}

                    {id === 'agent' && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Нейросеть (Gemini)</label>
                          <select
                            value={selectedModel}
                            onChange={(e) => {
                              const m = e.target.value;
                              setSelectedModel(m);
                              localStorage.setItem('ricis_selected_ai_model', m);
                            }}
                            className="w-full bg-[#050810] border border-cyan-900/40 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-sans"
                          >
                            {AVAILABLE_GEMINI_MODELS.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="pt-2 border-t border-neutral-800/40 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-300">Telegram Агент</span>
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/60">
                              АКТИВЕН
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowTelegramBot(true)}
                            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs py-1.5 rounded transition-colors"
                          >
                            Открыть Telegram-интерфейс
                          </button>
                        </div>
                      </div>
                    )}

                    {id === 'persistence' && (
                      <div data-testid="persistence-export-actions" className="grid gap-2 sm:grid-cols-2">
                        <ActionButton
                          data-testid="persistence-save"
                          onClick={() => { void map.saveNow(); }}
                          variant="cyan"
                          className="w-full cursor-pointer py-2 text-xs"
                        >
                          💾 Сохранить в IndexedDB
                        </ActionButton>
                        <ActionButton
                          data-testid="persistence-import-json"
                          onClick={() => setShowPatchImportModal(true)}
                          variant="cyan"
                          className="w-full cursor-pointer py-2 text-xs"
                        >
                          ⚡ Импорт решений (JSON)
                        </ActionButton>
                        <ActionButton
                          data-testid="persistence-download-json"
                          onClick={() => map.downloadJson()}
                          variant="neutral"
                          className="w-full cursor-pointer py-2 text-xs"
                        >
                          📥 Скачать .json
                        </ActionButton>
                        <ActionButton
                          data-testid="persistence-reset"
                          onClick={() => { if (window.confirm('Сбросить карту?')) void map.resetMap(); }}
                          variant="red"
                          className="w-full cursor-pointer py-2 text-xs"
                        >
                          ⚠️ Сброс карты
                        </ActionButton>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>

          {/* Always Visible: Dedicated RICIS Audit & Verification Panel */}
          <div className="border border-amber-900/30 rounded-lg bg-[#080a10]/95 backdrop-blur-md p-3.5 mt-1.5 shadow-[0_0_20px_rgba(245,158,11,0.06)]">
            <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5 border-b border-amber-900/20 pb-1">
              🛡️ ПАНЕЛЬ АУДИТА & RICIS-III
            </h3>
            <AuditPanel />
          </div>

          {hiddenElements.length > 0 && (
            <div className="pt-2 mt-auto">
              {!showOverflow ? (
                <button
                  onClick={() => setShowOverflow(true)}
                  className="w-full py-2.5 bg-neutral-950 border border-neutral-800 hover:border-cyan-900/70 hover:bg-neutral-900 rounded-lg text-slate-400 hover:text-cyan-400 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <ChevronDown size={14} /> Показать редко используемые ({hiddenElements.length})
                </button>
              ) : (
                <button
                  onClick={() => setShowOverflow(false)}
                  className="w-full py-2.5 bg-neutral-900 border border-cyan-800/50 rounded-lg text-cyan-300 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 mb-2"
                >
                  <ChevronUp size={14} /> Скрыть редко используемые
                </button>
              )}
            </div>
          )}
        </aside>

        <div className={`order-1 relative flex min-h-0 w-full min-w-0 flex-1 flex-col bg-[radial-gradient(circle_at_center,_#0a0f1a_0%,_#050505_100%)] md:grid md:col-start-2 md:row-start-1 md:h-full md:min-h-0 ${selectedNode && taskPanelMode === 'open' ? 'md:grid-cols-[minmax(0,1fr)_minmax(24rem,30rem)]' : selectedNode && taskPanelMode === 'rail' ? 'md:grid-cols-[minmax(0,1fr)_2.75rem]' : 'md:grid-cols-[minmax(0,1fr)_0]'}`}>
          <div className="relative h-[42dvh] min-h-[16rem] w-full min-w-0 shrink-0 md:col-start-1 md:row-start-1 md:h-full md:min-h-0">
          {leftPanelMode === 'rail' && (
            <button type="button" onClick={() => setLeftPanelMode('open')} className="hidden md:inline-flex absolute left-2 top-2 z-20 min-h-8 min-w-8 items-center justify-center rounded bg-neutral-950/90 text-neutral-400 shadow-lg transition-colors hover:bg-cyan-950/70 hover:text-cyan-200" aria-label="Развернуть левую панель" title="Развернуть левую панель">
              <ChevronRight size={15} />
            </button>
          )}
          {selectedNode && taskPanelMode === 'rail' && (
            <button type="button" onClick={() => setTaskPanelMode('open')} className="hidden md:inline-flex absolute right-2 top-2 z-30 min-h-10 min-w-9 items-center justify-center gap-1 rounded-md border border-cyan-700/70 bg-[#07121c]/95 px-1.5 text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.18)] transition-colors hover:bg-cyan-900/80 hover:text-white" aria-label="Развернуть правую панель задачи" title="Развернуть правую панель задачи">
              <ChevronLeft size={15} />
              <span className="[writing-mode:vertical-rl] text-[9px] font-bold uppercase tracking-[0.16em]">Задача</span>
            </button>
          )}
          {renderMapScene()}
          </div>

          {selectedNode && (
            <aside data-testid="desktop-task-panel" data-panel-mode={taskPanelMode} className={`relative order-2 min-h-0 w-full shrink-0 overflow-hidden border-t border-cyan-900/40 bg-[#070707] md:order-none md:col-start-2 md:row-start-1 md:h-full md:border-l md:border-t-0 ${taskPanelMode === 'rail' ? 'md:hidden' : 'md:w-auto'}`}>
              <div className="flex h-full min-h-0 flex-col">
              {taskPanelMode === 'rail' ? (
                <button
                  type="button"
                  className="flex h-full min-h-0 w-full flex-col items-center justify-center gap-3 text-neutral-500 transition-colors hover:bg-cyan-950/30 hover:text-cyan-300"
                  onClick={() => setTaskPanelMode('open')}
                  aria-label="Развернуть правую панель задачи"
                  title="Развернуть правую панель задачи"
                >
                  <ChevronLeft size={16} />
                  <span className="[writing-mode:vertical-rl] text-[9px] font-bold uppercase tracking-[0.18em]">Задача</span>
                </button>
              ) : (
              <>
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-800/60 bg-neutral-950/80 px-3.5 py-3">
                <div className="min-w-0 flex-1 text-left"
                >
                  <h2 className="truncate text-sm font-bold text-white leading-tight mb-1">{selectedNodePresentation?.title ?? selectedNode.title}</h2>
                  <span className="text-[9px] font-mono text-cyan-400 block mb-1">Key: {getNodeIdentityPresentation(selectedNode).base64Key}</span>
                  <span className="text-[9px] font-mono text-neutral-500 block mb-1 truncate">Path: {getNodeIdentityPresentation(selectedNode).canonicalPath}</span>
                  {selectedNode.economic?.marketGain > 0 && (
                    <span className="text-[10px] font-bold text-green-400 bg-green-950/30 px-1.5 py-0.5 rounded inline-block">
                      Оценка: {formatCurrency(selectedNode.economic.marketGain)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 relative">
                  <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-neutral-500 hover:text-cyan-400 transition-colors" title="Menu">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskPanelMode('rail')}
                    className="text-neutral-500 hover:text-cyan-400 transition-colors"
                    title="Свернуть правую панель в узкую полосу"
                    aria-label="Свернуть правую панель в узкую полосу"
                  >
                    <ChevronRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedNodeId(null)}
                    className="text-neutral-500 hover:text-white transition-colors"
                    title={t('node.card.close')}
                    aria-label={t('node.card.close')}
                  >
                    ✕
                  </button>
                  
                  {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-[#050810] border border-cyan-800/80 rounded-md shadow-[0_4px_20px_rgba(0,0,0,0.8)] z-30 p-3 flex flex-col gap-3">
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-bold uppercase text-cyan-500/80 tracking-wider">Действия</p>
                        <ActionButton
                          onClick={() => { handleFindPathToRicis(); setIsMenuOpen(false); }}
                          variant="cyan"
                          className="w-full text-left"
                        >
                          Вычислить путь к ядру
                        </ActionButton>
                      </div>
                      
                      <div className="space-y-1.5 border-t border-cyan-900/30 pt-2">
                        <p className="text-[9px] font-bold uppercase text-amber-500/80 tracking-wider">Генерация TEX</p>
                        <label className="flex items-start gap-2 text-[10px] text-gray-300 cursor-pointer px-1">
                          <input type="radio" name="texMode" checked={texMode === 'ricis_pure'} onChange={() => setTexMode('ricis_pure')} className="mt-0.5" />
                          <span><span className="text-cyan-400 font-semibold">RICIS-pure</span> — без пределов</span>
                        </label>
                        <label className="flex items-start gap-2 text-[10px] text-gray-300 cursor-pointer px-1">
                          <input type="radio" name="texMode" checked={texMode === 'classical_bridges'} onChange={() => setTexMode('classical_bridges')} className="mt-0.5" />
                          <span><span className="text-amber-400 font-semibold">Classical bridges</span></span>
                        </label>
                        <ActionButton
                          onClick={() => { handleGenerateTex(); setIsMenuOpen(false); }}
                          variant="amber"
                                                  >
                          Генерировать TEX
                        </ActionButton>
                      </div>
                      
                      <div className="space-y-1.5 border-t border-cyan-900/30 pt-2">
                        <p className="text-[9px] font-bold uppercase text-purple-500/80 tracking-wider">Экспорт для ИИ</p>
                        <ActionButton
                          onClick={() => { handleGenerateJSON(); setIsMenuOpen(false); }}
                          variant="violet"
                          className="w-full mt-1"
                        >
                          {showOnlyDerivatives ? 'JSON: только фиолетовые' : 'Генерировать JSON'}
                        </ActionButton>
                        {jsonMsg && <p className="text-[9px] text-purple-300/90 font-mono break-all mt-1">{jsonMsg}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-3 touch-pan-y">
              {(() => {
                const parents = map.nodes.filter(n => selectedNode.dependencyIds.includes(n.id));
                return (
                  <div>
                    <div className="text-[10px] font-mono text-cyan-500/80 mb-1.5 flex flex-wrap items-center gap-1">
                      <span className="text-gray-500">{map.zones.find(z => z.id === selectedNode.zoneIds[0])?.name || 'Zone'}</span>
                      <span className="text-gray-600">/</span>
                      {parents.length > 0 ? (
                        <>
                          <span className="flex gap-1 flex-wrap">
                            {parents.map((p, idx) => (
                              <span key={p.id}>
                                <button type="button" onClick={() => setSelectedNodeId(p.id)} className="hover:text-cyan-300 transition-colors underline decoration-cyan-900/50 underline-offset-2">{p.title}</button>
                                {idx < parents.length - 1 && <span className="text-gray-600">,</span>}
                              </span>
                            ))}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-500">RICIS Core</span>
                        </>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-slate-100 tracking-tight leading-tight mb-3">
                      {selectedNodePresentation?.title ?? selectedNode.title}
                    </h2>
                  </div>
                );
              })()}

            <div className="mb-4 flex gap-2 flex-wrap items-center">
              {(() => {
                const hasSorry = nodeHasSorry(selectedNode, map.proofs?.[selectedNode.id]);
                const isOk = selectedNode.state === 'resolved' && !isMissingTargetFunction(selectedNode) && !hasSorry;
                const isPartial = selectedNode.state === 'partial' || isMissingTargetFunction(selectedNode) || hasSorry;
                
                let badgeClass = 'bg-neutral-900 text-neutral-400 border border-neutral-700/60';
                if (isOk) badgeClass = 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/60';
                else if (isPartial) badgeClass = 'bg-amber-950/80 text-amber-400 border border-amber-900/60';
                
                return (
                  <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${badgeClass}`}>
                    {isOk ? 'RESOLVED' : isPartial ? (hasSorry ? 'PARTIAL (SORRY)' : 'PARTIAL') : 'UNRESOLVED'}
                  </span>
                );
              })()}
              {!isNodeAvailable(selectedNode, map) && selectedNode.state !== 'resolved' && (
                <span className="px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-neutral-900/80 text-neutral-500 border border-neutral-800">LOCKED</span>
              )}
              {isRicisCore(selectedNode) && (
                <span className="px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-cyan-950/60 text-cyan-400 border border-cyan-900/40">RICIS CORE</span>
              )}
            </div>
              <NodeCardDetails 
                node={selectedNodePresentation ?? selectedNode}
                map={map}
                isExpanded={isNodeExpanded} 
                onEdit={() => setEditingNode(selectedNode)}
                onNavigateToNode={handleNavigateToNode}
                onNavigateBack={navigationStack.length > 0 ? handleNavigateBack : undefined}
                previousNodeTitle={navigationStack.length > 0 ? map.nodes.find(n => n.id === navigationStack[navigationStack.length - 1])?.title : null}
              />

              {pathNodeIds.length > 0 && (
                <div className="mb-3 text-[10px] text-cyan-400/90 font-mono bg-cyan-950/20 border border-cyan-900/40 rounded p-2 max-h-24 overflow-y-auto leading-relaxed relative">
                  <button type="button" onClick={() => setPathNodeIds([])} className="absolute top-1 right-1 px-1 text-cyan-600 hover:text-cyan-300">✕</button>
                  <div className="pr-4">
                  {pathNodeIds.map((id, idx) => (
                    <span key={id}>
                      <button type="button" className="hover:text-cyan-200 transition-colors" onClick={() => setSelectedNodeId(id)}>
                        {map.nodes.find(n => n.id === id)?.title || id}
                      </button>
                      {idx < pathNodeIds.length - 1 && <span className="text-cyan-700 mx-1">→</span>}
                    </span>
                  ))}
                  </div>
                </div>
              )}
              {texMsg && <p className="mb-3 text-[9px] text-amber-300/90 font-mono break-all">{texMsg}</p>}
              
              <ActionButton
                onClick={() => handleSolve(selectedNode.id)}
                isLoading={isSolving}
                isDisabled={!isNodeAvailable(selectedNode, map) && selectedNode.state !== 'resolved'}
                disabledReason={
                  !isNodeAvailable(selectedNode, map) && selectedNode.state !== 'resolved'
                    ? 'Заблокировано зависимостями'
                    : undefined
                }
                variant="cyan"
                className="w-full mt-auto py-2.5 text-[11px] uppercase tracking-widest shadow-lg font-bold cursor-pointer"
              >
                {isSolving
                  ? 'Агент вычисляет (RICIS-III)...'
                  : selectedNode.state === 'resolved'
                  ? 'Перерассчитать доказательство (RICIS-III)'
                  : !isNodeAvailable(selectedNode, map)
                  ? 'Заблокировано зависимостями'
                  : 'Execute RICIS Solution'}
              </ActionButton>

              {(showProof || map.getLatexProof(selectedNode.id) || selectedNode.state === 'resolved' || selectedNode.state === 'partial') && (
                <div className="mt-4 border-t border-gray-800 pt-3">
                  <div className="flex items-center justify-between">
                    <button onClick={() => setShowProof(!showProof)} className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase hover:text-cyan-200 transition-colors cursor-pointer">
                      <span>Formal Proof (Lean 4)</span><span>{showProof ? '▲' : '▼'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingNode(selectedNode)}
                      className="text-[10px] font-bold text-amber-400 hover:text-amber-200 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
                      title="Заменить или отредактировать Lean 4 доказательство для обучения Агента"
                    >
                      <span>✏️</span> Edit Lean
                    </button>
                  </div>
                  {showProof && (
                    <div className={`mt-2 bg-[#020202] p-3 rounded border border-cyan-900/50 text-gray-300 overflow-y-auto ${isNodeExpanded ? 'max-h-[60vh]' : 'max-h-52'}`}>
                      <LatexRenderer content={map.getLatexProof(selectedNode.id) || '*(Доказательство еще не создано. Нажмите "Edit Lean" чтобы добавить)*'} />
                    </div>
                  )}
                </div>
              )}
              </div>
              <button
                type="button"
                onClick={() => setTaskPanelMode('rail')}
                className="absolute right-2 top-2 z-10 inline-flex min-h-7 min-w-7 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-cyan-950/50 hover:text-cyan-300"
                aria-label="Свернуть правую панель в узкую полосу"
                title="Свернуть правую панель в узкую полосу"
              >
                <ChevronRight size={14} />
              </button>
              </>
              )}
              </div>
            </aside>
          )}
        </div>
      </main>
        </>
      )}

      {showAddNode && (
        <AddNodeModal onClose={() => setShowAddNode(false)} parentId={selectedNodeId || undefined} />
      )}
      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={closeSettings}
          currentRoleId={currentRole.id}
          roles={roles}
          onSelectRole={switchRole}
          onCreateRole={createRole}
          uiElements={UI_ELEMENTS}
          hiddenElementIds={userDisabledPanelIds}
          onToggleElement={togglePanelVisibility}
          physicsParams={physicsParams}
          onPhysicsChange={setPhysicsParams}
          adminCoreSnapshot={STATIC_ADMIN_CORE_SNAPSHOT}
        />
      )}
      {showTelegramBot && (
        <TelegramBotPanel onClose={() => setShowTelegramBot(false)} />
      )}
      {isCommunityReadinessOpen && communityReadinessProjection !== null && (
        <CommunityReadinessNotice
          projection={communityReadinessProjection}
          isCopyingInvitation={isCopyingCommunityInvitation}
          copyResult={communityInvitationCopyResult}
          onCopyInvitation={() => { void handleCopyCommunityInvitation(); }}
          onClose={handleCloseCommunityReadiness}
        />
      )}
      {editingNode && (
        <EditNodeModal
          node={editingNode}
          onClose={() => setEditingNode(null)}
          onSolveAfterSave={() => handleSolve(editingNode.id)}
        />
      )}
      {showAgentLogs && (
        <AgentLogModal
          onClose={() => setShowAgentLogs(false)}
          onSelectNode={setSelectedNodeId}
        />
      )}
      {showProofConsole && (
        <RicisProofConsoleModal
          isOpen={showProofConsole}
          onClose={() => setShowProofConsole(false)}
          initialClaim={selectedNode?.title || '0_5 * inf_3'}
          initialProblemId={selectedNode?.id}
        />
      )}
      {!isMobileLayout && !isImmersive && (
      <footer data-testid="desktop-status-strip" className="h-10 border-t border-cyan-900/40 bg-[#080808] flex items-center justify-between px-4 shrink-0 z-10 w-full overflow-visible">
        {/* Left Side: System Indicator, Arrow Button & Latest Agent Log Line */}
        <div className="flex items-center gap-2.5 text-xs text-slate-400 font-mono overflow-hidden pr-2">
          <span className="flex items-center gap-1.5 shrink-0" title="Статус ИИ-Агента">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          </span>

          {/* Trigger button with arrow to open agent log window */}
          <button
            type="button"
            onClick={() => setShowAgentLogs(true)}
            className="flex items-center gap-1 px-2 py-0.5 bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-800/80 text-cyan-300 hover:text-white rounded text-[10px] font-mono font-bold transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.15)] shrink-0"
            title="Вызов окна логов ИИ-Агента"
          >
            <span className="text-cyan-400 font-bold">▲</span>
            <span>Лог ИИ</span>
          </button>

          <span className="text-neutral-700 font-sans select-none shrink-0">|</span>

          <button
            type="button"
            onClick={() => { void checkCoreRuntime(); }}
            disabled={isCheckingCoreRuntime}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono font-bold transition-all shrink-0 ${coreStatusPresentation.className} ${isCheckingCoreRuntime ? 'cursor-wait opacity-80' : 'cursor-pointer hover:brightness-125'}`}
            title={t('core.status.check')}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${coreStatusPresentation.dotClassName}`} />
            <span>{coreStatusPresentation.label}</span>
          </button>

          <button
            type="button"
            data-testid="community-rewards-status-button"
            onClick={() => { void handleOpenCommunityReadiness(); }}
            disabled={isLoadingCommunityReadiness}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded border border-violet-700/70 bg-violet-950/70 text-violet-200 hover:bg-violet-800/70 hover:text-white text-[10px] font-mono font-bold transition-all shrink-0 ${isLoadingCommunityReadiness ? 'cursor-wait opacity-80' : 'cursor-pointer'}`}
            title="Открыть честный статус готовности сообщества. Награды и внешний бот не активированы."
          >
            <Gift size={11} aria-hidden="true" />
            <span>{isLoadingCommunityReadiness ? 'Проверка…' : 'Сообщество · статус'}</span>
          </button>

          {/* Latest AI agent log message */}
          {map.agentLogs && map.agentLogs.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowAgentLogs(true)}
              className="text-xs text-slate-300 hover:text-cyan-200 font-mono truncate text-left cursor-pointer transition-colors flex items-center gap-1.5 min-w-0"
              title="Нажмите, чтобы открыть полный журнал логов"
            >
              <span className="text-slate-500 text-[10px]">[{map.agentLogs[0].timestamp}]</span>
              <span
                className={`text-[10px] font-bold uppercase px-1 py-0.2 rounded ${
                  map.agentLogs[0].level === 'ricis'
                    ? 'text-purple-400 bg-purple-950/60'
                    : map.agentLogs[0].level === 'success'
                    ? 'text-emerald-400 bg-emerald-950/60'
                    : map.agentLogs[0].level === 'warn'
                    ? 'text-amber-400 bg-amber-950/60'
                    : map.agentLogs[0].level === 'error'
                    ? 'text-rose-400 bg-rose-950/60'
                    : 'text-cyan-400 bg-cyan-950/60'
                }`}
              >
                {map.agentLogs[0].level}
              </span>
              <span className="text-slate-200 truncate">{map.agentLogs[0].message}</span>
            </button>
          ) : (
            <span className="text-slate-500 text-xs font-mono">Система активна</span>
          )}
        </div>

        {/* Right Side: Map Controls with Hover Tooltip */}
        <div className="relative group flex items-center gap-1 bg-neutral-900 border border-neutral-700/80 rounded px-1 py-1 shadow-lg">
          {/* Controls Tooltip */}
          <div className="absolute bottom-full right-0 mb-3 w-max px-3 py-2 bg-neutral-800 border border-neutral-700 text-slate-200 text-sm font-mono rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="flex flex-col gap-1.5">
              <span className="flex items-center gap-2"><span className="text-cyan-400 font-bold min-w-[3rem]">ЛКМ</span> Вращение</span>
              <span className="flex items-center gap-2"><span className="text-cyan-400 font-bold min-w-[3rem]">ПКМ</span> Панорама</span>
              <span className="flex items-center gap-2"><span className="text-cyan-400 font-bold min-w-[3rem]">Колесо</span> Масштаб</span>
            </div>
            {/* Tooltip Arrow */}
            <div className="absolute top-full right-6 -mt-px w-2 h-2 bg-neutral-800 border-b border-r border-neutral-700 transform rotate-45"></div>
          </div>

          <button onClick={handleZoomOut} className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white hover:bg-neutral-700 rounded transition-colors cursor-pointer" title="Уменьшить масштаб">-</button>
          <span className="px-2 text-xs font-mono text-slate-300 select-none min-w-[2.5rem] text-center">100%</span>
          <button onClick={handleZoomIn} className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white hover:bg-neutral-700 rounded transition-colors cursor-pointer" title="Увеличить масштаб">+</button>
          
          <div className="w-px h-4 bg-neutral-700 mx-1"></div>
          
          <button onClick={handleResetCamera} className="px-2 h-6 flex items-center justify-center text-cyan-400 hover:bg-neutral-700 rounded transition-colors text-xs font-bold gap-1 cursor-pointer" title="Сбросить камеру">
            <Crosshair size={12} /> Сброс
          </button>
        </div>
      </footer>
      )}
      <RicisTerminalModal />

      {showVoynichModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <VoynichDecryptionPanel
              onSelectFolioNode={(folioId) => {
                setSelectedNodeId(folioId);
                setShowVoynichModal(false);
              }}
              onClose={() => setShowVoynichModal(false)}
            />
          </div>
        </div>
      )}

      {showPatchImportModal && (
        <MapPatchImportModal onClose={() => setShowPatchImportModal(false)} />
      )}
    </div>
  );
};
