import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { ProblemNode } from '../model/types';
import { AddNodeModal } from './AddNodeModal';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useMapStore } from '../store/mapStore';
import * as THREE from 'three';
import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { APP_BUILD_LABEL, APP_VERSION } from '../version';
import {
  ChevronDown,
  ChevronUp,
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
} from 'lucide-react';
import {
  isNodeAvailable,
  findPathToRicis,
  getUnlockRequirements,
  countAvailable,
  isRicisCore,
} from '../model/access';
import { layoutZones, layoutNodes, zoneVisualRadius, nodeVisualRadius, type PhysicsParams, DEFAULT_PHYSICS_PARAMS } from '../model/physics';
import { ZoneBubble, ZoneLabel, NodeBubble, NodeLabel } from './Bubbles';
import { downloadTexPreprint, type TexBridgeMode, expandToRoot } from '../model/texPreprint';
import { AuditPanel } from './AuditPanel';
import { NodeCardDetails } from './NodeCardDetails';
import { EditNodeModal } from './EditNodeModal';
import { PhysicsControlPanel } from './PhysicsControlPanel';
import { TelegramBotPanel } from './TelegramBotPanel';
import { LatexRenderer } from './LatexRenderer';
import { useAdaptiveUI } from '../hooks/useAdaptiveUI';

const UI_ELEMENTS = [
  { id: 'actions', label: 'Быстрые действия' },
  { id: 'search', label: 'Поиск по карте' },
  { id: 'zones', label: 'Сферы науки' },
  { id: 'available', label: 'Доступно к решению' },
  { id: 'physics', label: 'Параметры симуляции' },
  { id: 'agent', label: 'ИИ-Агент и Сервисы' },
  { id: 'persistence', label: 'Сохранение и Экспорт' },
];
import { isMissingTargetFunction, nodeHasSorry } from '../model/audit';
import { ActionButton } from './ActionButton';


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

function OrbitControls({ controlsRef: externalRef }: { controlsRef?: React.MutableRefObject<any> }) {
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
    controls.screenSpacePanning = true;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;
    if (externalRef) {
      externalRef.current = controls;
    }

    const handleWheel = (e: WheelEvent) => {
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
      controls.dispose();
      controlsRef.current = null;
      if (externalRef) {
        externalRef.current = null;
      }
    };
  }, [camera, gl, externalRef]);
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
  if (n.zoneIds.every(zid => hiddenZones.has(zid))) return false;
  if (showOnlyDerivatives && !isDerivativeNodeRef(n)) return false;
  if (!q) return true;
  return (
    (n.title?.toLowerCase().includes(q) || false) ||
    (n.description?.toLowerCase().includes(q) || false) ||
    (n.targetFunction?.toLowerCase().includes(q) || false)
  );
}

export const Map3D: React.FC = () => {
  const [physicsParams, setPhysicsParams] = React.useState<PhysicsParams>(DEFAULT_PHYSICS_PARAMS);
  const map = useMapStore();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hiddenZones, setHiddenZones] = useState<Set<string>>(new Set());
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isNodeExpanded, setIsNodeExpanded] = useState(false);
  const [showProof, setShowProof] = useState(false);
  const [showAddNode, setShowAddNode] = useState(false);
  const [showTelegramBot, setShowTelegramBot] = useState(false);
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
  const [showOnlyDerivatives, setShowOnlyDerivatives] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
    maxVisible: 5,
    decayInterval: 10,
    decayFactor: 0.9,
    hysteresisDelta: 0.03
  });

  const [showOverflow, setShowOverflow] = useState(false);


  const controlsRef = useRef<any>(null);

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
  const visibleNodeIds = useMemo(() => {
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

  useEffect(() => {
    setShowProof(false);
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
      const fromSorry = fromN ? nodeHasSorry(fromN, map.proofs?.[fromN.id]) : false;
      const toSorry = toN ? nodeHasSorry(toN, map.proofs?.[toN.id]) : false;
      const fromResolved = nodeStateById[edge.fromId] === 'resolved' && fromN && !isMissingTargetFunction(fromN) && !fromSorry;
      const toResolved = nodeStateById[edge.toId] === 'resolved' && toN && !isMissingTargetFunction(toN) && !toSorry;
      const fromPartial = nodeStateById[edge.fromId] === 'partial' || (fromN && isMissingTargetFunction(fromN)) || fromSorry;
      const toPartial = nodeStateById[edge.toId] === 'partial' || (toN && isMissingTargetFunction(toN)) || toSorry;
      let color = '#ef4444';
      let opacity = 0.3;
      if (onPath) {
        color = '#22d3ee';
        opacity = 1;
      } else if (fromResolved && toResolved) {
        color = '#22c55e';
        opacity = 0.95;
      } else if (fromResolved || toResolved || fromPartial || toPartial) {
        color = '#eab308';
        opacity = 0.55;
      }
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
  }, [map.edges, map.nodes, nodePositions, pathEdgeKeys, nodeStateById, visibleNodeIds]);

  return (
    <div className="w-full h-screen bg-[#050505] text-[#e0e0e0] font-sans overflow-hidden flex flex-col">
      <header className="h-16 border-b border-cyan-900/40 bg-[#080808] flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-3.5 h-3.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_12px_#22d3ee]" />
          <h1 className="text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-300 flex items-center gap-2">
            <span>RICIS-III</span>
            <span className="text-slate-400 font-normal text-xs">// 3D Singularity Map</span>
          </h1>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full border border-cyan-700/80 bg-cyan-950/70 text-cyan-200 font-bold">
            {APP_BUILD_LABEL}
          </span>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex gap-4 text-xs font-mono">
            <div className="flex flex-col"><span className="text-slate-400 text-[10px]">УЗЛЫ</span><span className="text-slate-100 font-bold">{map.nodes.length}</span></div>
            <div className="flex flex-col"><span className="text-slate-400 text-[10px]">ДОСТУПНО</span><span className="text-emerald-400 font-bold">{availability.available}</span></div>
            <div className="flex flex-col"><span className="text-slate-400 text-[10px]">ЗАБЛОКИРОВАНО</span><span className="text-slate-300 font-bold">{availability.locked}</span></div>
            <div className="flex flex-col"><span className="text-slate-400 text-[10px]">РЕШЕНО</span><span className="text-green-400 font-bold">{availability.resolved}</span></div>
          </div>
          <button
            type="button"
            onClick={() => document.getElementById('accordion-physics')?.click()}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs px-3.5 py-1.5 rounded-md shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all cursor-pointer flex items-center gap-1.5"
          >
            ⚡ Параметры физики
          </button>
        </div>
      </header>

      <main className="flex-1 flex relative overflow-hidden">
        <aside className="w-84 border-r border-cyan-900/40 bg-[#070707] p-3 flex flex-col gap-3 shrink-0 z-10 overflow-y-auto h-full">
          {/* UI Profiles (Adaptive Logic) */}
          <div className="flex flex-col gap-1.5 mb-2 pb-3 border-b border-neutral-800/60">
            <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Профиль интерфейса:</span>
            <div className="flex items-center gap-2">
              <select
                value={currentRole.id}
                onChange={e => switchRole(e.target.value)}
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-xs text-cyan-100 font-bold focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <button
                type="button"
                onClick={() => {
                  const name = prompt('Введите название новой роли:');
                  if (name) {
                    const clone = confirm('Скопировать текущие веса как базу?');
                    createRole(name, clone ? currentRole.id : undefined);
                  }
                }}
                className="w-7 h-7 shrink-0 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 rounded text-slate-300 font-bold transition-colors"
                title="Создать профиль"
              >
                +
              </button>
            </div>
          </div>

          {/* Render active panels */}
          <div className="accordion-container flex flex-col gap-0 border-0 bg-transparent overflow-visible w-full">
          {[...visibleElements.map((el: any) => ({ ...el, isHidden: false })), ...hiddenElements.map((el: any) => ({ ...el, isHidden: true }))].map(({ id, isHidden }: any) => {
            if (isHidden && !showOverflow) return null;
            
            // PHYSICS PANEL IS UNIQUE
            if (id === 'physics') {
              return (
                <div key="physics" className={`accordion-item border border-neutral-800/80 rounded-lg overflow-hidden bg-neutral-900/40 mb-2 ${isHidden ? 'opacity-80 border-dashed' : ''}`}>
                  <PhysicsControlPanel
                    params={physicsParams}
                    onChange={setPhysicsParams}
                  />
                </div>
              );
            }

            // SEARCH PANEL IS NOW A SINGLE ROW WITH PLACEHOLDER "Поиск по карте"
            if (id === 'search') {
              return (
                <div key="search" className={`relative border border-cyan-900/40 rounded-lg overflow-visible bg-[#050810]/90 backdrop-blur-md px-3.5 py-2.5 mb-2 flex items-center gap-2.5 z-20 ${isHidden ? 'opacity-90 border-dashed border-neutral-700' : ''}`}>
                  <Search size={16} className="text-cyan-400 shrink-0" />
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Поиск по карте..."
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
              );
            }

            // OTHER PANELS
            return (
              <div key={id} className={`accordion-item border border-neutral-800/80 rounded-lg overflow-hidden bg-neutral-900/40 mb-2 relative ${isHidden ? 'opacity-90 border-dashed border-neutral-700' : ''}`}>
                <input type="checkbox" id={`accordion-${id}`} className="accordion-trigger" />
                <label htmlFor={`accordion-${id}`} className="accordion-header bg-neutral-950/80 hover:bg-neutral-900/90 transition-colors cursor-pointer w-full flex flex-col items-start px-3.5 py-2.5 h-auto rounded-none border-0 m-0" onClick={() => trackClick(id)}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                       {id === 'actions' && <Plus size={16} className="text-emerald-400" />}
                       {id === 'zones' && <Layers size={16} className="text-cyan-400" />}
                       {id === 'available' && <CheckCircle2 size={16} className="text-emerald-400" />}
                       {id === 'agent' && <Bot size={16} className="text-violet-400" />}
                       {id === 'persistence' && <Database size={16} className="text-cyan-400" />}
                       
                       <span className="text-xs font-bold text-slate-100 uppercase tracking-wider accordion-title p-0">
                         {UI_ELEMENTS.find(e => e.id === id)?.label}
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
                          <span className="truncate">🎯 {selectedNode.title}</span>
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
                </label>

                <div className={`accordion-content`}>
                  <div className={`accordion-inner p-3 border-t border-neutral-800/60 bg-neutral-950/40 relative overflow-y-auto ${id === 'zones' || id === 'available' || id === 'agent' ? 'max-h-64' : 'max-h-56'}`}>
                    
                    {id === 'actions' && (
                      <ActionButton onClick={() => setShowAddNode(true)} variant="emerald" className="w-full uppercase font-bold tracking-wider cursor-pointer py-2 text-xs">
                        + Добавить новую задачу
                      </ActionButton>
                    )}

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
                            onClick={() => setSelectedNodeId(node.id)}
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
                            onChange={(e) => setSelectedModel(e.target.value as string)}
                            className="w-full bg-[#050810] border border-cyan-900/40 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                          >
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast)</option>
                            <option value="gemini-2.5-pro">Gemini 2.5 Pro (Smart)</option>
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
                      <div className="space-y-2.5">
                        <ActionButton
                          onClick={() => { void map.saveNow(); }}
                          variant="cyan"
                          className="w-full cursor-pointer py-2 text-xs"
                        >
                          💾 Сохранить в IndexedDB
                        </ActionButton>
                        <ActionButton
                          onClick={() => map.downloadJson()}
                          variant="neutral"
                          className="w-full cursor-pointer py-2 text-xs"
                        >
                          📥 Скачать .json
                        </ActionButton>
                        <ActionButton
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

        <div className="flex-1 relative bg-[radial-gradient(circle_at_center,_#0a0f1a_0%,_#050505_100%)]">
          <Canvas camera={{ position: [0, 0, 32], fov: 55, far: 10000, near: 0.1 }} gl={{ antialias: true, alpha: true }}>
            <OrbitControls controlsRef={controlsRef} />
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

              const isDeriv =
                node.type === 'derivative_claim' || node.isDerivativeClaim === true;

              const hasSorry = nodeHasSorry(node, map.proofs?.[node.id]);

              let color = '#ef4444';
              if (isDeriv) color = '#a855f7';
              else if (node.state === 'resolved' && !isMissingTargetFunction(node) && !hasSorry) color = '#22c55e';
              else if (node.state === 'partial' || isMissingTargetFunction(node) || hasSorry) color = '#eab308';
              else if (locked) color = '#6b7280';
              if (onPath && !isDeriv) color = locked ? '#94a3b8' : '#22d3ee';

              const baseR = nodeVisualRadius(node, map.nodes);
              const radius = isSelected ? baseR * 1.28 : onPath ? baseR * 1.12 : isDeriv ? baseR * 1.15 : baseR;
              const emissive = isSelected
                ? '#22d3ee'
                : isDeriv
                  ? '#7e22ce'
                  : onPath
                    ? '#0891b2'
                    : isCore
                      ? '#155e75'
                      : color;
              const emissiveIntensity = isSelected
                ? 0.65
                : isDeriv
                  ? 0.55
                  : onPath
                    ? 0.45
                    : isCore
                      ? 0.35
                      : locked
                        ? 0.08
                        : 0.22;

              return (
                <group key={node.id} 
                  onPointerOver={e => {
                    e.stopPropagation();
                    hoveredNodePos = new THREE.Vector3(pos[0], pos[1], pos[2]);
                  }}
                  onPointerOut={e => {
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
                      setSelectedNodeId(node.id);
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

          {selectedNode && (
            <div className={`absolute top-6 right-6 ${isNodeExpanded ? 'w-[640px]' : 'w-[26rem]'} bg-black/80 backdrop-blur-md border border-cyan-500/30 rounded-lg p-5 shadow-2xl pointer-events-auto max-h-[90%] overflow-y-auto transition-all duration-300`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="text-sm font-bold text-white leading-tight mb-1">{selectedNode.title}</h2>
                  <span className="text-[9px] font-mono text-cyan-400 block mb-1">ID: {selectedNode.id}</span>
                  {selectedNode.economic?.marketGain > 0 && (
                    <span className="text-[10px] font-bold text-green-400 bg-green-950/30 border border-green-900/50 px-1.5 py-0.5 rounded inline-block">
                      Оценка: {formatCurrency(selectedNode.economic.marketGain)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 relative">
                  <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-neutral-500 hover:text-cyan-400 transition-colors" title="Menu">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </button>
                  <button onClick={() => setIsNodeExpanded(!isNodeExpanded)} className="text-neutral-500 hover:text-cyan-400 transition-colors" title="Expand/Collapse">
                    {isNodeExpanded ? '▶' : '◀'}
                  </button>
                  <button onClick={() => setSelectedNodeId(null)} className="text-neutral-500 hover:text-white transition-colors">✕</button>
                  
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
                          className="w-full mt-1"
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
              {(() => {
                const parents = map.nodes.filter(n => selectedNode.dependencyIds.includes(n.id));
                return (
                  <div className="text-[9px] font-mono text-cyan-500/80 mb-3 flex flex-wrap items-center gap-1">
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
                        <span className="text-gray-600">/</span>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-500">RICIS Core</span>
                        <span className="text-gray-600">/</span>
                      </>
                    )}
                    <span className="text-cyan-400 font-bold">{selectedNode.title}</span>
                  </div>
                );
              })()}
              <div className="mb-3 flex gap-2 flex-wrap">
                {(() => {
                  const hasSorry = nodeHasSorry(selectedNode, map.proofs?.[selectedNode.id]);
                  const isOk = selectedNode.state === 'resolved' && !isMissingTargetFunction(selectedNode) && !hasSorry;
                  const isPartial = selectedNode.state === 'partial' || isMissingTargetFunction(selectedNode) || hasSorry;
                  return (
                    <span className={'px-2 py-0.5 rounded text-[9px] font-bold uppercase ' + (isOk ? 'bg-green-900/50 text-green-400 border border-green-700/60' : isPartial ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700/60' : 'bg-red-900/50 text-red-400 border border-red-700/60')}>
                      {isOk ? 'RESOLVED' : isPartial ? (hasSorry ? 'PARTIAL (SORRY)' : 'PARTIAL') : 'UNRESOLVED'}
                    </span>
                  );
                })()}
                {!isNodeAvailable(selectedNode, map) && selectedNode.state !== 'resolved' && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-gray-800 text-gray-400 border border-gray-700">LOCKED</span>
                )}
                {isRicisCore(selectedNode) && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-cyan-900/50 text-cyan-300 border border-cyan-700/40">RICIS CORE</span>
                )}
              </div>
              <NodeCardDetails node={selectedNode} isExpanded={isNodeExpanded} onEdit={() => setEditingNode(selectedNode)} />

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
              {unlockReqs.length > 0 && (
                <div className="mb-3 bg-gray-900/60 border border-gray-700/50 rounded p-2">
                  <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Чтобы открыть — решите:</p>
                  <ul className="space-y-1 max-h-28 overflow-y-auto">
                    {unlockReqs.map(n => (
                      <li key={n.id} className="text-[10px] text-gray-300 flex items-start gap-1">
                        <span className="text-gray-600 mt-0.5">●</span>
                        <button type="button" className="text-left hover:text-cyan-300 leading-tight" onClick={() => setSelectedNodeId(n.id)}>{n.title}</button>
                      </li>
                    ))}
                  </ul>
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

              {(map.getLatexProof(selectedNode.id) || selectedNode.state === 'resolved' || selectedNode.state === 'partial') && (
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
          )}
        </div>
      </main>

      {showAddNode && (
        <AddNodeModal onClose={() => setShowAddNode(false)} parentId={selectedNodeId || undefined} />
      )}
      {showTelegramBot && (
        <TelegramBotPanel onClose={() => setShowTelegramBot(false)} />
      )}
      {editingNode && (
        <EditNodeModal
          node={editingNode}
          onClose={() => setEditingNode(null)}
          onSolveAfterSave={() => handleSolve(editingNode.id)}
        />
      )}
      <footer className="h-10 border-t border-cyan-900/40 bg-[#080808] flex items-center justify-between px-4 shrink-0 z-10 w-full overflow-visible">
        {/* Left Side: System Status & Version Badge */}
        <div className="flex items-center gap-3 text-sm text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            <span className="hidden sm:inline">Система активна</span>
          </span>
          <span className="text-gray-700/60 font-sans select-none">|</span>
          <span className="text-[10px] text-cyan-400 bg-cyan-950/40 border border-cyan-900/40 px-2 py-0.5 rounded font-bold tracking-wide select-none" title={`RICIS-III Engine ${APP_VERSION}`}>
            {APP_BUILD_LABEL}
          </span>
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
    </div>
  );
};
