import { useMemo, useState } from 'react';
import type { ProblemNode, ScienceZone, Proof } from '../model/types';
import { GraphColorStateManager, NODE_PROJECTIONS } from '../model/colorMatrix';
import { ZoomIn, ZoomOut, RotateCcw, LayoutGrid, Network } from 'lucide-react';

interface AccessibleMapFallbackProps {
  readonly nodes: readonly ProblemNode[];
  readonly zones: readonly ScienceZone[];
  readonly selectedNodeId: string | null;
  readonly onSelectNode: (nodeId: string) => void;
  readonly onEnable3d: () => void;
  readonly reason: 'unsupported' | 'render_failed' | 'user_selected';
  readonly proofs?: Record<string, Proof>;
}

function nodeZoneNames(node: ProblemNode, zones: readonly ScienceZone[]): string {
  const names = node.zoneIds
    .map(zoneId => zones.find(zone => zone.id === zoneId)?.name)
    .filter((name): name is string => Boolean(name));

  return names.join(' · ') || 'Не классифицировано';
}

function reasonText(reason: AccessibleMapFallbackProps['reason']): string {
  if (reason === 'render_failed') {
    return '3D-сцена WebGL не задействована. Ниже представлена интерактивная 2D-карта сингулярностей (SVG) и семантический список.';
  }

  if (reason === 'unsupported') {
    return 'Контекст WebGL недоступен в этом окружении. Ниже представлена интерактивная 2D-карта сингулярностей (SVG) и семантический список.';
  }

  return 'Включён режим 2D/Доступной карты. Он отображает интерактивный 2D-граф узлов и сохраняет выбор задачи.';
}

interface Node2DPosition {
  x: number;
  y: number;
}

export function AccessibleMapFallback({
  nodes,
  zones,
  selectedNodeId,
  onSelectNode,
  onEnable3d,
  reason,
  proofs,
}: AccessibleMapFallbackProps) {
  const manager = useMemo(() => new GraphColorStateManager(), []);
  const [activeTab, setActiveTab] = useState<'2d_graph' | 'list'>('2d_graph');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Compute deterministic 2D positions for nodes grouped by primary zone
  const nodePositions = useMemo<Record<string, Node2DPosition>>(() => {
    const posMap: Record<string, Node2DPosition> = {};
    const width = 960;
    const height = 580;
    const centerX = width / 2;
    const centerY = height / 2;

    const totalZones = Math.max(1, zones.length);
    const zoneCenters: Record<string, { x: number; y: number }> = {};

    zones.forEach((zone, idx) => {
      const angle = (idx / totalZones) * 2 * Math.PI - Math.PI / 2;
      const radius = Math.min(width, height) * 0.32;
      zoneCenters[zone.id] = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    });

    // Group nodes by primary zone
    const nodesByZone: Record<string, ProblemNode[]> = {};
    nodes.forEach(node => {
      const primaryZone = node.zoneIds[0] || 'unknown';
      if (!nodesByZone[primaryZone]) nodesByZone[primaryZone] = [];
      nodesByZone[primaryZone].push(node);
    });

    Object.entries(nodesByZone).forEach(([zoneId, zoneNodes]) => {
      const center = zoneCenters[zoneId] || { x: centerX, y: centerY };
      const count = zoneNodes.length;
      zoneNodes.forEach((node, idx) => {
        if (count === 1) {
          posMap[node.id] = { x: center.x, y: center.y };
        } else {
          const nodeAngle = (idx / count) * 2 * Math.PI;
          const nodeDist = Math.min(75, 25 + count * 6);
          posMap[node.id] = {
            x: center.x + Math.cos(nodeAngle) * nodeDist,
            y: center.y + Math.sin(nodeAngle) * nodeDist,
          };
        }
      });
    });

    // Fallback for nodes without assigned zone
    nodes.forEach((node, idx) => {
      if (!posMap[node.id]) {
        const angle = (idx / Math.max(1, nodes.length)) * 2 * Math.PI;
        posMap[node.id] = {
          x: centerX + Math.cos(angle) * 160,
          y: centerY + Math.sin(angle) * 160,
        };
      }
    });

    return posMap;
  }, [nodes, zones]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <section
      aria-label="Доступная карта задач RICIS-III"
      className="h-full overflow-y-auto bg-[radial-gradient(circle_at_top,_#101b2b_0%,_#050505_58%)] px-4 py-5 text-slate-100"
    >
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="rounded-xl border border-cyan-900/70 bg-[#07111f]/95 p-4 shadow-xl shadow-cyan-950/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300">Доступный режим карты</p>
              <h2 className="mt-0.5 text-xl font-bold tracking-tight text-white">RICIS-III: Интерактивная 2D-карта сингулярностей</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('2d_graph')}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                  activeTab === '2d_graph'
                    ? 'border-cyan-500 bg-cyan-950/80 text-cyan-200 shadow-md shadow-cyan-950/50'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Network size={14} />
                2D Визуальный граф
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                  activeTab === 'list'
                    ? 'border-cyan-500 bg-cyan-950/80 text-cyan-200 shadow-md shadow-cyan-950/50'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid size={14} />
                Семантический список
              </button>
              <button
                type="button"
                onClick={onEnable3d}
                className="rounded-lg border border-cyan-600/70 bg-cyan-950 px-3 py-1.5 text-xs font-bold text-cyan-100 transition-colors hover:bg-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              >
                3D-карту
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">{reasonText(reason)}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-cyan-800/80 bg-cyan-950/60 px-3 py-0.5 text-[11px] font-mono text-cyan-200">
              Узлов: {nodes.length}
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-0.5 text-[11px] font-mono text-slate-300">
              Научных зон: {zones.length}
            </span>
          </div>
        </header>

        {activeTab === '2d_graph' && (
          <div className="relative rounded-xl border border-cyan-900/50 bg-[#050b14] overflow-hidden shadow-2xl">
            {/* Control Bar */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-lg border border-cyan-900/80 bg-black/80 p-1.5 backdrop-blur-md">
              <button
                type="button"
                onClick={handleZoomIn}
                className="min-h-7 min-w-7 rounded text-cyan-300 hover:bg-cyan-950 flex items-center justify-center font-bold"
                title="Увеличить"
                aria-label="Увеличить"
              >
                <ZoomIn size={14} />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="min-h-7 min-w-7 rounded text-cyan-300 hover:bg-cyan-950 flex items-center justify-center font-bold"
                title="Уменьшить"
                aria-label="Уменьшить"
              >
                <ZoomOut size={14} />
              </button>
              <button
                type="button"
                onClick={handleResetView}
                className="min-h-7 min-w-7 rounded text-cyan-300 hover:bg-cyan-950 flex items-center justify-center"
                title="Сбросить"
                aria-label="Сбросить"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {/* SVG Visual Graph Canvas */}
            <svg
              viewBox="0 0 960 580"
              className="w-full h-[480px] select-none touch-none bg-[radial-gradient(ellipse_at_center,_#0b1628_0%,_#03070d_100%)]"
            >
              <defs>
                <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#03070d" stopOpacity="0" />
                </radialGradient>
                <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <rect width="960" height="580" fill="url(#bgGlow)" />

              <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`} style={{ transformOrigin: '480px 290px' }}>
                {/* Dependency Edges */}
                {nodes.flatMap(node => {
                  const sourcePos = nodePositions[node.id];
                  if (!sourcePos) return [];

                  return node.dependencyIds.map(depId => {
                    const targetPos = nodePositions[depId];
                    if (!targetPos) return null;

                    const isSelectedEdge = node.id === selectedNodeId || depId === selectedNodeId;

                    return (
                      <line
                        key={`edge-${node.id}-${depId}`}
                        x1={sourcePos.x}
                        y1={sourcePos.y}
                        x2={targetPos.x}
                        y2={targetPos.y}
                        stroke={isSelectedEdge ? '#22d3ee' : '#1e293b'}
                        strokeWidth={isSelectedEdge ? 2 : 1}
                        strokeDasharray={isSelectedEdge ? 'none' : '4 3'}
                        opacity={isSelectedEdge ? 0.9 : 0.4}
                      />
                    );
                  }).filter(Boolean);
                })}

                {/* Nodes */}
                {nodes.map(node => {
                  const pos = nodePositions[node.id] || { x: 480, y: 290 };
                  const isSelected = node.id === selectedNodeId;
                  const statusCode = manager.resolveNodeStatusCode(node, proofs?.[node.id]);
                  const projection = NODE_PROJECTIONS[statusCode];

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onClick={() => onSelectNode(node.id)}
                      className="cursor-pointer group"
                    >
                      {/* Selection Pulsing Ring */}
                      {isSelected && (
                        <circle
                          r="18"
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth="2"
                          className="animate-ping opacity-60"
                        />
                      )}

                      {/* Outer Ring */}
                      <circle
                        r={isSelected ? 14 : 10}
                        fill="#03070d"
                        stroke={projection.hexColor}
                        strokeWidth={isSelected ? 3 : 1.5}
                        filter="url(#nodeGlow)"
                      />

                      {/* Inner Dot */}
                      <circle
                        r={isSelected ? 7 : 5}
                        fill={projection.hexColor}
                      />

                      {/* Title Label */}
                      <text
                        y={isSelected ? 26 : 22}
                        textAnchor="middle"
                        fill={isSelected ? '#38bdf8' : '#cbd5e1'}
                        fontSize={isSelected ? 11 : 9}
                        fontWeight={isSelected ? 'bold' : 'normal'}
                        className="font-mono pointer-events-none drop-shadow"
                      >
                        {node.title.length > 22 ? `${node.title.slice(0, 20)}…` : node.title}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        )}

        {/* Semantic List View */}
        {(activeTab === 'list' || activeTab === '2d_graph') && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {nodes.map(node => {
              const isSelected = node.id === selectedNodeId;
              const statusCode = manager.resolveNodeStatusCode(node, proofs?.[node.id]);
              const projection = NODE_PROJECTIONS[statusCode];

              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => onSelectNode(node.id)}
                  aria-pressed={isSelected}
                  className={`rounded-xl border p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-300 ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/70 shadow-lg shadow-cyan-950/30'
                      : 'border-slate-800 bg-[#0a101b]/95 hover:border-cyan-800 hover:bg-[#0d1725]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">{nodeZoneNames(node, zones)}</p>
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: projection.hexColor, boxShadow: `0 0 6px ${projection.glowColor}` }}
                      title={projection.label}
                    />
                  </div>
                  <h3 className="mt-1 text-sm font-bold leading-snug text-slate-100">{node.title}</h3>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-400">{node.description || 'Описание пока не добавлено.'}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span
                      className="rounded-full border px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        borderColor: projection.hexColor + '60',
                        backgroundColor: projection.hexColor + '15',
                        color: projection.hexColor,
                      }}
                    >
                      {projection.label}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{node.id}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

