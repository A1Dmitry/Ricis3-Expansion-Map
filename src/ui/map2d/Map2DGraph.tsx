// ============================================================================
// INTERACTIVE 2D MAP (SVG) — равномерная раскладка + подсветка связей
// При выборе узла подсвечиваются его связи: предпосылки (cyan, «зависит от»)
// и зависимые узлы (violet, «влияет на»); посторонний граф приглушается.
// Панорамирование — перетаскиванием, масштаб — колесом и кнопками.
// ============================================================================

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';
import type { ProblemNode, ScienceZone, Proof } from '../../model/types';
import { GraphColorStateManager, NODE_PROJECTIONS } from '../../model/colorMatrix';
import {
  buildMap2DEdges,
  collectMap2DNeighborhood,
  computeMap2DLayout,
} from './twoDLayout';

interface Map2DGraphProps {
  readonly nodes: readonly ProblemNode[];
  readonly zones: readonly ScienceZone[];
  readonly selectedNodeId: string | null;
  readonly onSelectNode: (nodeId: string) => void;
  readonly proofs?: Record<string, Proof>;
}

interface ViewTransform {
  k: number;
  x: number;
  y: number;
}

const MIN_SCALE = 0.35;
const MAX_SCALE = 3.5;

export function Map2DGraph({ nodes, zones, selectedNodeId, onSelectNode, proofs }: Map2DGraphProps) {
  const manager = useMemo(() => new GraphColorStateManager(), []);
  const [view, setView] = useState<ViewTransform>({ k: 1, x: 0, y: 0 });
  const [scrollHint, setScrollHint] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const panSession = useRef<{ pointerId: number; startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const hintTimer = useRef<number | null>(null);

  const edges = useMemo(() => buildMap2DEdges(nodes), [nodes]);
  const layout = useMemo(() => computeMap2DLayout(nodes, zones), [nodes, zones]);
  const { positions, width, height, zoneCentroids } = layout;

  const neighborhood = useMemo(
    () => (selectedNodeId ? collectMap2DNeighborhood(selectedNodeId, edges) : null),
    [selectedNodeId, edges],
  );

  const zoneNameOf = useCallback(
    (zoneId: string) => zones.find(z => z.id === zoneId)?.name ?? zoneId,
    [zones],
  );

  const nodeTitle = useCallback(
    (nodeId: string) => nodes.find(n => n.id === nodeId)?.title ?? nodeId,
    [nodes],
  );

  const zoomBy = useCallback((factor: number) => {
    setView(prev => {
      const k = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.k * factor));
      // Масштабирование вокруг центра видимой области
      const cx = 0;
      const cy = 0;
      const applied = k / prev.k;
      return { k, x: cx - (cx - prev.x) * applied, y: cy - (cy - prev.y) * applied };
    });
  }, []);

  const resetView = useCallback(() => setView({ k: 1, x: 0, y: 0 }), []);

  // Навигация не «цепляет» скроллер: масштаб — только Ctrl/⌘ + колесо
  // (стандарт для встраиваемых карт), обычное колесо прокручивает страницу.
  const handleWheel = useCallback((event: React.WheelEvent<SVGSVGElement>) => {
    if (!event.ctrlKey && !event.metaKey) {
      if (hintTimer.current !== null) window.clearTimeout(hintTimer.current);
      setScrollHint(true);
      hintTimer.current = window.setTimeout(() => setScrollHint(false), 1200);
      return; // не preventDefault — вертикальная прокрутка уходит странице
    }
    event.preventDefault();
    zoomBy(event.deltaY < 0 ? 1.12 : 1 / 1.12);
  }, [zoomBy]);

  const handlePointerDown = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;
    panSession.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: view.x,
      baseY: view.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [view.x, view.y]);

  const handlePointerMove = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    const session = panSession.current;
    if (!session || session.pointerId !== event.pointerId) return;
    const svg = svgRef.current;
    if (!svg) return;
    // Пересчёт экранных пикселей в единицы viewBox с учётом масштаба
    const rect = svg.getBoundingClientRect();
    const unitsPerPixelX = width / Math.max(1, rect.width);
    const unitsPerPixelY = height / Math.max(1, rect.height);
    const unitsPerPixel = (unitsPerPixelX + unitsPerPixelY) / 2;
    setView(prev => ({
      ...prev,
      x: session.baseX + (event.clientX - session.startX) * unitsPerPixel,
      y: session.baseY + (event.clientY - session.startY) * unitsPerPixel,
    }));
  }, [width, height]);

  const endPan = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    if (panSession.current?.pointerId === event.pointerId) {
      panSession.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const isDimmedNode = useCallback(
    (nodeId: string): boolean => {
      if (!selectedNodeId || !neighborhood) return false;
      return (
        nodeId !== selectedNodeId &&
        !neighborhood.upstream.has(nodeId) &&
        !neighborhood.downstream.has(nodeId)
      );
    },
    [selectedNodeId, neighborhood],
  );

  return (
    <div
      className="relative rounded-xl border border-cyan-900/50 bg-[#050b14] overflow-hidden shadow-2xl"
      data-testid="map-2d-graph"
    >
      {/* Control Bar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-lg border border-cyan-900/80 bg-black/80 p-1.5 backdrop-blur-md">
        <span className="hidden sm:inline-flex items-center gap-1 px-1.5 text-[10px] text-slate-500">
          <Move size={11} /> drag · Ctrl+колесо
        </span>
        <button
          type="button"
          onClick={() => zoomBy(1.25)}
          className="min-h-7 min-w-7 rounded text-cyan-300 hover:bg-cyan-950 flex items-center justify-center"
          title="Увеличить"
          aria-label="Увеличить"
        >
          <ZoomIn size={14} />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1 / 1.25)}
          className="min-h-7 min-w-7 rounded text-cyan-300 hover:bg-cyan-950 flex items-center justify-center"
          title="Уменьшить"
          aria-label="Уменьшить"
        >
          <ZoomOut size={14} />
        </button>
        <button
          type="button"
          onClick={resetView}
          className="min-h-7 min-w-7 rounded text-cyan-300 hover:bg-cyan-950 flex items-center justify-center"
          title="Сбросить вид"
          aria-label="Сбросить вид"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Legend: semantics of connection highlighting */}
      <div className="absolute bottom-3 left-3 z-10 rounded-lg border border-slate-800 bg-black/75 px-3 py-2 backdrop-blur-md text-[10px] leading-relaxed">
        <div className="flex items-center gap-2">
          <span className="inline-block h-[2px] w-6 bg-cyan-400" />
          <span className="text-cyan-200">предпосылка («узел зависит от»)</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="inline-block h-[2px] w-6 bg-violet-400" />
          <span className="text-violet-200">зависимый («на узел опираются»)</span>
        </div>
        <div className="mt-1 text-slate-500">выберите узел — его связи подсветятся</div>
      </div>

      {/* Подсказка при попытке зума обычным колесом (скролл не перехватываем) */}
      {scrollHint && (
        <div
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
          data-testid="m2d-scroll-hint"
        >
          <span className="rounded-lg border border-cyan-800/70 bg-black/85 px-4 py-2 text-xs font-bold text-cyan-200 shadow-xl">
            Ctrl / ⌘ + колесо — масштаб · обычное колесо — прокрутка страницы
          </span>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[560px] select-none touch-pan-y cursor-grab active:cursor-grabbing bg-[radial-gradient(ellipse_at_center,_#0b1628_0%,_#03070d_100%)]"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        role="application"
        aria-label="Интерактивная 2D карта сингулярностей"
      >
        <defs>
          <marker id="m2d-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L7,3.5 L0,7 z" fill="#3b4a63" />
          </marker>
          <marker id="m2d-arrow-upstream" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L7,3.5 L0,7 z" fill="#22d3ee" />
          </marker>
          <marker id="m2d-arrow-downstream" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L7,3.5 L0,7 z" fill="#a78bfa" />
          </marker>
          <filter id="m2d-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g transform={`translate(${view.x}, ${view.y}) scale(${view.k})`}>
          {/* Подписи кластеров зон (в центроидах фактических групп) */}
          {zones.map(zone => {
            const c = zoneCentroids[zone.id];
            if (!c) return null;
            return (
              <text
                key={`zone-${zone.id}`}
                x={c.x}
                y={c.y}
                textAnchor="middle"
                className="pointer-events-none select-none"
                fill="#22354f"
                fontSize={34}
                fontWeight={800}
                style={{ textTransform: 'uppercase', letterSpacing: '0.35em' }}
                opacity={0.5}
              >
                {zoneNameOf(zone.id)}
              </text>
            );
          })}

          {/* Рёбра зависимостей */}
          {edges.map(edge => {
            const from = positions[edge.source];
            const to = positions[edge.target];
            if (!from || !to) return null;

            const isUpstream = selectedNodeId !== null && edge.source === selectedNodeId;
            const isDownstream = selectedNodeId !== null && edge.target === selectedNodeId;
            const isActive = isUpstream || isDownstream;
            const muted = selectedNodeId !== null && !isActive;

            // Обрезка линии у границ маркеров (чтобы стрелка не заходила в узел)
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
            const trimEnd = 14 / dist;
            const x2 = to.x - dx * trimEnd;
            const y2 = to.y - dy * trimEnd;

            return (
              <line
                key={`m2d-edge-${edge.source}-${edge.target}`}
                data-testid={`m2d-edge-${edge.source}-${edge.target}`}
                x1={from.x}
                y1={from.y}
                x2={x2}
                y2={y2}
                stroke={isUpstream ? '#22d3ee' : isDownstream ? '#a78bfa' : '#334155'}
                strokeWidth={isActive ? 2.6 : 1}
                strokeDasharray={isActive ? 'none' : '5 4'}
                opacity={muted ? 0.06 : isActive ? 0.95 : 0.35}
                markerEnd={isUpstream ? 'url(#m2d-arrow-upstream)' : isDownstream ? 'url(#m2d-arrow-downstream)' : 'url(#m2d-arrow)'}
              />
            );
          })}

          {/* Узлы */}
          {nodes.map(node => {
            const pos = positions[node.id];
            if (!pos) return null;
            const isSelected = node.id === selectedNodeId;
            const isNeighbor =
              neighborhood !== null &&
              (neighborhood.upstream.has(node.id) || neighborhood.downstream.has(node.id));
            const dimmed = isDimmedNode(node.id);
            const statusCode = manager.resolveNodeStatusCode(node, proofs?.[node.id]);
            const projection = NODE_PROJECTIONS[statusCode];

            return (
              <g
                key={node.id}
                data-testid={`m2d-node-${node.id}`}
                transform={`translate(${pos.x}, ${pos.y})`}
                onPointerDown={event => event.stopPropagation()}
                onClick={() => onSelectNode(node.id)}
                className="cursor-pointer"
                opacity={dimmed ? 0.28 : 1}
                role="button"
                aria-label={`Узел: ${node.title}`}
                aria-pressed={isSelected}
              >
                <title>{`${node.title}\n${projection.label}`}</title>

                {isSelected && (
                  <circle r="22" fill="none" stroke="#22d3ee" strokeWidth="2" className="animate-ping" opacity="0.55" />
                )}
                {isNeighbor && !isSelected && (
                  <circle r="15" fill="none" stroke={neighborhood?.upstream.has(node.id) ? '#22d3ee' : '#a78bfa'} strokeWidth="1.6" opacity="0.8" />
                )}

                <circle
                  r={isSelected ? 13 : 9}
                  fill="#03070d"
                  stroke={isSelected ? '#22d3ee' : projection.hexColor}
                  strokeWidth={isSelected ? 3 : 1.6}
                  filter="url(#m2d-glow)"
                />
                <circle r={isSelected ? 6.5 : 4.5} fill={projection.hexColor} />

                <text
                  y={isSelected ? 27 : 24}
                  textAnchor="middle"
                  fill={isSelected ? '#7dd3fc' : isNeighbor ? '#e2e8f0' : '#94a3b8'}
                  fontSize={isSelected ? 12 : 10}
                  fontWeight={isSelected || isNeighbor ? 700 : 400}
                  className="pointer-events-none select-none"
                  style={{ paintOrder: 'stroke', stroke: '#03070d', strokeWidth: 3 }}
                >
                  {node.title.length > 26 ? `${node.title.slice(0, 24)}…` : node.title}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Selected node connection summary */}
      {selectedNodeId && neighborhood && (
        <div
          className="absolute top-3 left-3 z-10 max-w-[320px] rounded-lg border border-cyan-900/70 bg-black/80 px-3 py-2 backdrop-blur-md"
          data-testid="m2d-selection-summary"
        >
          <p className="text-[11px] font-bold text-cyan-200 truncate" title={nodeTitle(selectedNodeId)}>
            {nodeTitle(selectedNodeId)}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            предпосылок: <span className="text-cyan-300 font-mono">{neighborhood.upstream.size}</span>
            {' · '}зависимых: <span className="text-violet-300 font-mono">{neighborhood.downstream.size}</span>
          </p>
        </div>
      )}
    </div>
  );
}
