import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AddNodeModal } from './AddNodeModal';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useMapStore } from '../store/mapStore';
import * as THREE from 'three';
import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { APP_BUILD_LABEL, APP_VERSION } from '../version';
import {
  isNodeAvailable,
  findPathToRicis,
  getUnlockRequirements,
  countAvailable,
  isRicisCore,
} from '../model/access';
import { layoutZones, layoutNodes, zoneVisualRadius, nodeVisualRadius } from '../model/physics';
import { ZoneBubble, ZoneLabel, NodeBubble, NodeLabel } from './Bubbles';
import { downloadTexPreprint, type TexBridgeMode, expandToRoot } from '../model/texPreprint';
import { AuditPanel } from './AuditPanel';
import { NodeCardDetails } from './NodeCardDetails';
import { isMissingTargetFunction } from '../model/audit';
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

function OrbitControls() {
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
    };
  }, [camera, gl]);
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




export const Map3D: React.FC = () => {
  const map = useMapStore();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hiddenZones, setHiddenZones] = useState<Set<string>>(new Set());
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isNodeExpanded, setIsNodeExpanded] = useState(false);
  const [showProof, setShowProof] = useState(false);
  const [showAddNode, setShowAddNode] = useState(false);
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

  const isDerivativeNode = (n: { type?: string; isDerivativeClaim?: boolean }) =>
    n.type === 'derivative_claim' || n.isDerivativeClaim === true;

  const saveToHistory = useCallback((queryToSave: string) => {
    const trimmed = queryToSave.trim();
    if (!trimmed) return;

    const q = trimmed.toLowerCase();
    const matchesCount = map.nodes.filter(n => {
      if (n.zoneIds.every(zid => hiddenZones.has(zid))) return false;
      if (showOnlyDerivatives && !isDerivativeNode(n)) return false;
      return (
        n.title?.toLowerCase().includes(q) ||
        n.description?.toLowerCase().includes(q) ||
        n.targetFunction?.toLowerCase().includes(q)
      );
    }).length;

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
    return map.nodes.filter(n => {
      if (n.zoneIds.every(zid => hiddenZones.has(zid))) return false;
      if (showOnlyDerivatives && !isDerivativeNode(n)) return false;
      return (
        n.title?.toLowerCase().includes(q) ||
        n.description?.toLowerCase().includes(q) ||
        n.targetFunction?.toLowerCase().includes(q)
      );
    }).length;
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
      if (n.zoneIds.every(zid => hiddenZones.has(zid))) continue;
      if (showOnlyDerivatives && !isDerivativeNode(n)) continue;
      if (q) {
        const titleMatch = n.title?.toLowerCase().includes(q);
        const descMatch = n.description?.toLowerCase().includes(q);
        const tfMatch = n.targetFunction?.toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !tfMatch) continue;
      }
      ids.add(n.id);
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
      const hasVisibleNode = map.nodes.some(
        n => visibleNodeIds.has(n.id) && (zone.nodeIds.includes(n.id) || n.zoneIds.includes(zone.id))
      );
      if (hasVisibleNode) {
        activeZoneIds.add(zone.id);
      }
    }
    return activeZoneIds;
  }, [map.zones, map.nodes, visibleNodeIds, hiddenZones]);

  const zonePositions = useMemo(
    () => layoutZones(map.zones, map.nodes),
    [map.zones, map.nodes]
  );

  const nodePositions = useMemo(
    () => layoutNodes(map, zonePositions),
    [map.nodes, map.edges, zonePositions]
  );

  const zoneRadii = useMemo(() => {
    const r: Record<string, number> = {};
    map.zones.forEach(z => {
      const members = map.nodes.filter(
        n => visibleNodeIds.has(n.id) && (z.nodeIds.includes(n.id) || n.zoneIds.includes(z.id))
      );
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
            maxDist = Math.max(maxDist, dist + 15);
          }
        });
        r[z.id] = Math.max(zoneVisualRadius(z, members), maxDist);
      } else {
        r[z.id] = zoneVisualRadius(z, map.nodes);
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
      const fromResolved = nodeStateById[edge.fromId] === 'resolved' && fromN && !isMissingTargetFunction(fromN);
      const toResolved = nodeStateById[edge.toId] === 'resolved' && toN && !isMissingTargetFunction(toN);
      const fromPartial = nodeStateById[edge.fromId] === 'partial' || (fromN && isMissingTargetFunction(fromN));
      const toPartial = nodeStateById[edge.toId] === 'partial' || (toN && isMissingTargetFunction(toN));
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
      <header className="h-16 border-b border-cyan-900/30 bg-[#080808] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_cyan]" />
          <h1 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
            RICIS-III // Singularity Map Core
          </h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-800/60 bg-cyan-950/50 text-cyan-300">
            {APP_BUILD_LABEL}
          </span>
        </div>
        <div className="flex gap-6 text-[10px] font-mono">
          <div className="flex flex-col"><span className="text-gray-500">NODES</span><span className="text-cyan-200">{map.nodes.length}</span></div>
          <div className="flex flex-col"><span className="text-gray-500">AVAILABLE</span><span className="text-emerald-400">{availability.available}</span></div>
          <div className="flex flex-col"><span className="text-gray-500">LOCKED</span><span className="text-gray-400">{availability.locked}</span></div>
          <div className="flex flex-col"><span className="text-gray-500">RESOLVED</span><span className="text-green-400">{availability.resolved}</span></div>
        </div>
      </header>

      <main className="flex-1 flex relative overflow-hidden">
        <aside className="w-64 border-r border-cyan-900/20 bg-[#070707] p-4 flex flex-col gap-5 shrink-0 z-10 overflow-y-auto">
          <section>
            <ActionButton
              onClick={() => setShowAddNode(true)}
              variant="emerald"
              className="w-full mb-2 uppercase font-bold tracking-wider"
            >
              + Добавить задачу
            </ActionButton>
          </section>

          
          <section className="mb-4 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase">Поиск</h3>
                {searchQuery.trim() && (
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                    searchMatchCount > 0 
                      ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60' 
                      : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                  }`}>
                    {searchMatchCount}
                  </span>
                )}
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[9px] text-cyan-400 hover:text-cyan-300 font-mono cursor-pointer"
                >
                  Сбросить
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск узлов..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => {
                  saveToHistory(searchQuery);
                  setTimeout(() => setIsSearchFocused(false), 200);
                }}
                onKeyDown={e => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (!filteredHistory.length) return;
                    setSelectedHistoryIndex(prev => (prev < filteredHistory.length - 1 ? prev + 1 : 0));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (!filteredHistory.length) return;
                    setSelectedHistoryIndex(prev => (prev > 0 ? prev - 1 : filteredHistory.length - 1));
                  } else if (e.key === 'Enter') {
                    if (selectedHistoryIndex >= 0 && selectedHistoryIndex < filteredHistory.length) {
                      e.preventDefault();
                      const item = filteredHistory[selectedHistoryIndex];
                      setSearchQuery(item);
                      saveToHistory(item);
                      setIsSearchFocused(false);
                    } else {
                      saveToHistory(searchQuery);
                      setIsSearchFocused(false);
                    }
                  } else if (e.key === 'Escape') {
                    setIsSearchFocused(false);
                  }
                }}
                className="w-full bg-neutral-900/60 border border-neutral-700/80 rounded px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 pr-6 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-200 text-xs p-0.5 cursor-pointer"
                  title="Очистить"
                >
                  ✕
                </button>
              )}

              {/* Выпадающая подсказка с историей */}
              {isSearchFocused && filteredHistory.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-neutral-900 border border-cyan-800/70 rounded-md shadow-2xl z-50 overflow-hidden max-h-52 overflow-y-auto">
                  <div className="flex items-center justify-between px-2.5 py-1 bg-neutral-950/90 border-b border-neutral-800 text-[9px] text-gray-500 uppercase font-mono">
                    <span>История поиска ({filteredHistory.length})</span>
                    <button
                      type="button"
                      onMouseDown={clearHistory}
                      className="text-cyan-500 hover:text-cyan-400 hover:underline cursor-pointer"
                    >
                      Очистить
                    </button>
                  </div>
                  {filteredHistory.map((item, idx) => {
                    const isKeyboardSelected = idx === selectedHistoryIndex;
                    return (
                      <div
                        key={idx}
                        onMouseDown={() => {
                          setSearchQuery(item);
                          saveToHistory(item);
                          setIsSearchFocused(false);
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 text-xs cursor-pointer transition-colors border-b border-neutral-800/40 last:border-none group ${
                          isKeyboardSelected
                            ? 'bg-cyan-900/60 text-cyan-100 font-medium'
                            : 'text-gray-300 hover:bg-cyan-950/70 hover:text-cyan-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`text-[10px] ${isKeyboardSelected ? 'text-cyan-300' : 'text-cyan-500/70'}`}>🔍</span>
                          <span className="truncate">{item}</span>
                        </div>
                        <button
                          type="button"
                          onMouseDown={e => removeFromHistory(e, item)}
                          className="text-gray-600 hover:text-rose-400 text-[10px] p-0.5 ml-2 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Удалить из истории"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Пустое состояние поиска */}
            {searchQuery.trim() !== '' && searchMatchCount === 0 && (
              <div className="mt-2 p-2 bg-amber-950/30 border border-amber-800/40 rounded text-[10px] text-amber-300/90 flex items-center justify-between">
                <span>Ничего не найдено</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="underline text-amber-200 hover:text-white cursor-pointer ml-1"
                >
                  Сбросить
                </button>
              </div>
            )}
          </section>

          <section>
            <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-3">Science Zones</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {map.zones.map(zone => {
                const isHidden = hiddenZones.has(zone.id);
                const visibleCount = map.nodes.filter(
                  n => visibleNodeIds.has(n.id) && (zone.nodeIds.includes(n.id) || n.zoneIds.includes(zone.id))
                ).length;
                const isFilteredOut = !isHidden && visibleCount === 0;

                return (
                  <div key={zone.id} className={`flex items-center justify-between p-2 border rounded transition-opacity ${
                    isFilteredOut ? 'bg-neutral-950/20 border-neutral-900/40 opacity-40' : 'bg-neutral-900/40 border-neutral-800/50'
                  }`}>
                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                      <input 
                        type="checkbox" 
                        checked={!isHidden} 
                        onChange={() => {
                          setHiddenZones(prev => {
                            const next = new Set(prev);
                            if (next.has(zone.id)) next.delete(zone.id);
                            else next.add(zone.id);
                            return next;
                          });
                        }}
                        className="accent-cyan-500 rounded border-cyan-800"
                      />
                      <span className={`text-[11px] truncate ${
                        isHidden ? 'text-gray-600 line-through' : isFilteredOut ? 'text-gray-500' : 'text-gray-300'
                      }`}>
                        {zone.name}
                      </span>
                      {visibleCount > 0 && (
                        <span className="text-[9px] font-mono text-cyan-400/80">({visibleCount})</span>
                      )}
                      {isFilteredOut && (
                        <span className="text-[9px] text-gray-600 font-mono">(скрыта)</span>
                      )}
                    </label>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isHidden || isFilteredOut ? 'opacity-30' : 'opacity-100'}`} style={{ backgroundColor: getZoneColor(zone.id) }} />
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-3">Доступно к решению ({availableNodes.length})</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {availableNodes.length === 0 && (<p className="text-[10px] text-gray-600">Нет открытых узлов.</p>)}
              {availableNodes.map(n => (
                <button key={n.id} type="button" onClick={() => setSelectedNodeId(n.id)}
                  className={'w-full text-left px-2 py-1.5 text-[11px] rounded border transition-colors ' + (selectedNodeId === n.id ? 'border-cyan-500/60 bg-cyan-950/50 text-cyan-200' : 'border-neutral-800 bg-neutral-900/40 text-gray-300 hover:border-cyan-800/50 hover:text-cyan-300')}>
                  <span className="block truncate font-medium">{n.title}</span>
                  <span className="block text-[9px] text-gray-500 font-mono truncate">{n.id}</span>
                </button>
              ))}
            </div>
            {selectedNode && (isNodeAvailable(selectedNode, map) || selectedNode.state === 'resolved') && (
              <div className="mt-2 w-full">
                {isSolving && solveLogs.length > 0 && (
                  <div className="mt-2 mb-2 bg-black/80 border border-cyan-900 p-2 rounded max-h-32 overflow-y-auto">
                    {solveLogs.map((log, i) => (
                      <p key={i} className="text-[9px] text-cyan-300 font-mono mb-1">&gt; {log}</p>
                    ))}
                  </div>
                )}
                <ActionButton
                  onClick={() => handleSolve(selectedNode.id)}
                  isLoading={isSolving}
                  variant="cyan"
                  className="w-full uppercase font-bold tracking-wider cursor-pointer"
                >
                  {isSolving
                    ? 'Агент вычисляет (RICIS-III)...'
                    : selectedNode.state === 'resolved'
                    ? 'Перерассчитать доказательство (RICIS-III)'
                    : 'Синтезировать решение (RICIS-III)'}
                </ActionButton>
              </div>
            )}
          </section>

          <section>
            <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-3">Persistence</h3>
            <div className="space-y-2">
              <ActionButton
                onClick={() => { void map.saveNow(); }}
                variant="cyan"
                className="w-full"
              >
                💾 Сохранить в IndexedDB
              </ActionButton>
              <ActionButton
                onClick={() => map.downloadJson()}
                variant="neutral"
                className="w-full"
              >
                📥 Скачать .json
              </ActionButton>
              <ActionButton
                onClick={() => { if (window.confirm('Сбросить карту?')) void map.resetMap(); }}
                variant="red"
                className="w-full"
              >
                ⚠️ Сброс карты
              </ActionButton>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                ИИ-агент: <span className="text-violet-400 font-mono font-medium lowercase ml-1">{selectedModel}</span>
              </h3>
            </div>
            <div className="mb-2">
              <label className="text-[9px] text-gray-500 block mb-1">Выбранный ИИ-агент / модель:</label>
              <select
                value={selectedModel}
                onChange={e => {
                  const val = e.target.value;
                  setSelectedModel(val);
                  localStorage.setItem('ricis_selected_ai_model', val);
                }}
                className="w-full text-[10px] bg-neutral-900 border border-violet-800/60 rounded px-2 py-1.5 text-violet-200 focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                <option value="gemini-3.6-flash">gemini-3.6-flash (Fast Engine)</option>
                <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (RICIS-III Core)</option>
                <option value="gemini-flash-latest">gemini-flash-latest (Auto Flash)</option>
              </select>
            </div>
            <ActionButton
              onClick={handleAgentDiscovery}
              isLoading={isAgentSearching}
              variant="violet"
              className="w-full mb-1"
            >
              Поиск новых проблем
            </ActionButton>
            <AuditPanel />
            <label className={`mt-2 flex items-center justify-between cursor-pointer px-2.5 py-2 rounded border transition-all ${
              showOnlyDerivatives 
                ? 'border-violet-500/80 bg-violet-950/60 shadow-[0_0_12px_rgba(168,85,247,0.2)] text-violet-100 font-medium' 
                : 'border-violet-900/40 bg-violet-950/20 hover:bg-violet-950/40 text-violet-200'
            }`}>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showOnlyDerivatives}
                  onChange={e => setShowOnlyDerivatives(e.target.checked)}
                  className="accent-violet-500 rounded cursor-pointer"
                />
                <span className="text-[11px]">
                  Только фиолетовые
                </span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                showOnlyDerivatives ? 'bg-violet-800/80 text-violet-100' : 'bg-violet-900/40 text-violet-300'
              }`}>
                {derivativeCount}
              </span>
            </label>
            {showOnlyDerivatives && (
              <p className="text-[9px] text-violet-400/80 mt-1 px-1 leading-snug">
                Карта: только derivative_claim (+ якоря). JSON → только фиолетовые.
              </p>
            )}
            <p className="text-[9px] text-gray-600 mt-1">Каталог остаток: {map.catalogRemaining()}.</p>
            {agentMsg && <p className="text-[10px] text-violet-300 mt-1">{agentMsg}</p>}
          </section>

          <p className="text-[9px] text-gray-600 mt-auto leading-snug">Зоны растут с числом узлов. Размер узла — значимость. Подписи — реальные названия.</p>
        </aside>

        <div className="flex-1 relative bg-[radial-gradient(circle_at_center,_#0a0f1a_0%,_#050505_100%)]">
          {/* HUD Подсказка по навигации 3D */}
          <div className="absolute bottom-4 left-4 z-10 pointer-events-none flex items-center gap-3 bg-black/75 backdrop-blur border border-neutral-800/80 rounded-lg px-3 py-1.5 text-[10px] text-gray-400 font-mono shadow-xl">
            <span className="flex items-center gap-1"><span className="text-cyan-400">🖱️ ЛКМ</span> Вращение</span>
            <span className="text-neutral-700">|</span>
            <span className="flex items-center gap-1"><span className="text-cyan-400">ПКМ</span> Панорама</span>
            <span className="text-neutral-700">|</span>
            <span className="flex items-center gap-1"><span className="text-cyan-400">Колесо</span> Масштаб</span>
          </div>

          <Canvas camera={{ position: [0, 0, 32], fov: 55, far: 10000, near: 0.1 }} gl={{ antialias: true, alpha: true }}>
            <OrbitControls />
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

              let color = '#ef4444';
              if (isDeriv) color = '#a855f7';
              else if (node.state === 'resolved' && !isMissingTargetFunction(node)) color = '#22c55e';
              else if (node.state === 'partial' || isMissingTargetFunction(node)) color = '#eab308';
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
                <span className={'px-2 py-0.5 rounded text-[9px] font-bold uppercase ' + (selectedNode.state === 'resolved' ? 'bg-green-900/50 text-green-400' : selectedNode.state === 'partial' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-red-900/50 text-red-400')}>{selectedNode.state}</span>
                {!isNodeAvailable(selectedNode, map) && selectedNode.state !== 'resolved' && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-gray-800 text-gray-400 border border-gray-700">LOCKED</span>
                )}
                {isRicisCore(selectedNode) && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-cyan-900/50 text-cyan-300 border border-cyan-700/40">RICIS CORE</span>
                )}
              </div>
              <NodeCardDetails node={selectedNode} isExpanded={isNodeExpanded} />

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

              {selectedNode.state === 'resolved' && map.getLatexProof(selectedNode.id) && (
                <div className="mt-4 border-t border-gray-800 pt-3">
                  <button onClick={() => setShowProof(!showProof)} className="w-full flex justify-between text-cyan-400 text-xs font-bold uppercase">
                    <span>View Formal Proof</span><span>{showProof ? '▲' : '▼'}</span>
                  </button>
                  {showProof && (
                    <div className={`mt-2 bg-[#020202] p-3 rounded border border-cyan-900/50 text-gray-300 font-mono text-[9px] whitespace-pre-wrap overflow-y-auto ${isNodeExpanded ? 'max-h-[60vh]' : 'max-h-40'}`}>{map.getLatexProof(selectedNode.id)}</div>
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
      <footer className="h-8 border-t border-cyan-900/30 bg-[#080808] flex items-center px-4 shrink-0">
        <div className="flex gap-6 text-[9px] font-mono text-cyan-900/70 uppercase">
          <span className="text-cyan-400/90">// {APP_BUILD_LABEL}</span>
          <span>// ZONES GROW BY NODE COUNT · NODE SIZE = SIGNIFICANCE</span>
          <span>// EDGE GREEN = BOTH ENDS RESOLVED</span>
          <span className="text-cyan-500/80">// LABELS = REAL PROBLEM TITLES</span>
        </div>
      </footer>
    </div>
  );
};
