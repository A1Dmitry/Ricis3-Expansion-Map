// ============================================================================
// EXPLORER-STYLE TREE VIEW («как в проводнике»)
// Зоны — папки, узлы — элементы; каждый узел раскрывается в два поддерева:
// «Зависит от» (предпосылки) и «От него зависят» (зависимые). Защита от
// циклов: узел, встреченный на пути предков, помечается ↻ и не раскрывается.
// ============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  ChevronsDownUp,
  ChevronsUpDown,
  RefreshCcw,
  ArrowUpFromDot,
  ArrowDownToDot,
} from 'lucide-react';
import type { ProblemNode, ScienceZone, Proof } from '../../model/types';
import { GraphColorStateManager, NODE_PROJECTIONS } from '../../model/colorMatrix';

interface MapTreeViewProps {
  readonly nodes: readonly ProblemNode[];
  readonly zones: readonly ScienceZone[];
  readonly selectedNodeId: string | null;
  readonly onSelectNode: (nodeId: string) => void;
  readonly proofs?: Record<string, Proof>;
}

const MAX_DEPTH = 6;
const UNZONED_ID = '__unzoned__';

interface TreeNodeRowProps {
  readonly node: ProblemNode;
  readonly depth: number;
  /** Цепочка предков (для защиты от циклов). */
  readonly ancestors: readonly string[];
  readonly expandedPaths: ReadonlySet<string>;
  readonly onToggle: (path: string) => void;
  readonly path: string;
  readonly nodesById: ReadonlyMap<string, ProblemNode>;
  readonly selectedNodeId: string | null;
  readonly onSelectNode: (nodeId: string) => void;
  readonly manager: GraphColorStateManager;
  readonly proofs?: Record<string, Proof>;
  readonly selectedRowRef: React.RefObject<HTMLButtonElement | null>;
}

function TreeNodeRow({
  node,
  depth,
  ancestors,
  expandedPaths,
  onToggle,
  path,
  nodesById,
  selectedNodeId,
  onSelectNode,
  manager,
  proofs,
  selectedRowRef,
}: TreeNodeRowProps) {
  const isSelected = node.id === selectedNodeId;
  const isCycle = ancestors.includes(node.id);
  const isExpanded = expandedPaths.has(path);

  const prerequisites = (node.dependencyIds ?? [])
    .map(id => nodesById.get(id))
    .filter((n): n is ProblemNode => Boolean(n));
  const dependents = (node.dependentIds ?? [])
    .map(id => nodesById.get(id))
    .filter((n): n is ProblemNode => Boolean(n));

  const hasChildren = !isCycle && depth < MAX_DEPTH && (prerequisites.length > 0 || dependents.length > 0);
  const statusCode = manager.resolveNodeStatusCode(node, proofs?.[node.id]);
  const projection = NODE_PROJECTIONS[statusCode];

  return (
    <div role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined} aria-selected={isSelected}>
      <div
        className={`flex items-stretch rounded-md border transition-colors ${
          isSelected
            ? 'border-cyan-500/80 bg-cyan-950/60 shadow-sm shadow-cyan-950/40'
            : 'border-transparent hover:border-slate-800 hover:bg-slate-900/50'
        }`}
        style={{ marginLeft: depth > 0 ? 8 : 0 }}
      >
        <button
          type="button"
          onClick={() => hasChildren && onToggle(path)}
          disabled={!hasChildren}
          aria-label={
            isCycle
              ? 'Циклическая ссылка — уже показана выше'
              : hasChildren
                ? isExpanded
                  ? 'Свернуть зависимости'
                  : 'Развернуть зависимости'
                : 'Нет связей'
          }
          className={`flex w-6 shrink-0 items-center justify-center ${
            hasChildren ? 'text-cyan-400 hover:text-cyan-200' : 'text-transparent'
          }`}
        >
          {isCycle ? (
            <RefreshCcw size={11} className="text-amber-500/80" />
          ) : hasChildren ? (
            isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />
          ) : null}
        </button>

        <button
          type="button"
          ref={isSelected ? selectedRowRef : undefined}
          data-testid={`tree-node-${node.id}`}
          onClick={() => onSelectNode(node.id)}
          className="flex min-w-0 flex-1 items-center gap-2 px-1.5 py-1.5 text-left"
          title={`${node.title} — ${projection.label}`}
        >
          <span
            aria-hidden
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: projection.hexColor, boxShadow: `0 0 6px ${projection.glowColor}` }}
          />
          <span className={`min-w-0 flex-1 truncate text-xs ${isSelected ? 'font-bold text-cyan-100' : 'text-slate-200'}`}>
            {node.title}
          </span>
          {isCycle && (
            <span className="shrink-0 rounded border border-amber-800/70 bg-amber-950/40 px-1 py-0.5 text-[9px] text-amber-400">
              ↻ выше
            </span>
          )}
          <span className="shrink-0 font-mono text-[9px] text-slate-600">{node.id}</span>
        </button>
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-4 border-l border-slate-800/80 pl-2 pt-0.5" role="group">
          {prerequisites.length > 0 && (
            <div className="py-0.5">
              <p className="flex items-center gap-1 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-500">
                <ArrowDownToDot size={10} />
                Зависит от ({prerequisites.length})
              </p>
              {prerequisites.map(child => (
                <TreeNodeRow
                  key={`${path}/${child.id}`}
                  node={child}
                  depth={depth + 1}
                  ancestors={[...ancestors, node.id]}
                  expandedPaths={expandedPaths}
                  onToggle={onToggle}
                  path={`${path}/${child.id}`}
                  nodesById={nodesById}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={onSelectNode}
                  manager={manager}
                  proofs={proofs}
                  selectedRowRef={selectedRowRef}
                />
              ))}
            </div>
          )}
          {dependents.length > 0 && (
            <div className="py-0.5">
              <p className="flex items-center gap-1 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-400">
                <ArrowUpFromDot size={10} />
                От него зависят ({dependents.length})
              </p>
              {dependents.map(child => (
                <TreeNodeRow
                  key={`${path}/${child.id}`}
                  node={child}
                  depth={depth + 1}
                  ancestors={[...ancestors, node.id]}
                  expandedPaths={expandedPaths}
                  onToggle={onToggle}
                  path={`${path}/${child.id}`}
                  nodesById={nodesById}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={onSelectNode}
                  manager={manager}
                  proofs={proofs}
                  selectedRowRef={selectedRowRef}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MapTreeView({ nodes, zones, selectedNodeId, onSelectNode, proofs }: MapTreeViewProps) {
  const manager = useMemo(() => new GraphColorStateManager(), []);
  const nodesById = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set());
  const selectedRowRef = useRef<HTMLButtonElement | null>(null);

  // Группировка узлов по первичной зоне (порядок — как в каталоге зон)
  const nodesByPrimaryZone = useMemo(() => {
    const buckets = new Map<string, ProblemNode[]>();
    for (const zone of zones) buckets.set(zone.id, []);
    buckets.set(UNZONED_ID, []);
    for (const node of nodes) {
      const primary = node.zoneIds?.[0];
      const key = primary && buckets.has(primary) ? primary : UNZONED_ID;
      buckets.get(key)!.push(node);
    }
    return buckets;
  }, [nodes, zones]);

  const togglePath = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const toggleZone = useCallback((zoneId: string) => togglePath(`zone:${zoneId}`), [togglePath]);

  // Проводник автоматически раскрывает папку зоны выбранного узла и скроллит к нему
  useEffect(() => {
    if (!selectedNodeId) return;
    const selected = nodesById.get(selectedNodeId);
    if (!selected) return;
    const primary = selected.zoneIds?.[0];
    const zoneKey = primary && nodesByPrimaryZone.has(primary) ? primary : UNZONED_ID;
    setExpandedPaths(prev => {
      if (prev.has(`zone:${zoneKey}`)) return prev;
      const next = new Set(prev);
      next.add(`zone:${zoneKey}`);
      return next;
    });
  }, [selectedNodeId, nodesById, nodesByPrimaryZone]);

  useEffect(() => {
    selectedRowRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }, [selectedNodeId]);

  const expandOfCollapseAll = useCallback((expand: boolean) => {
    setExpandedPaths(() => {
      if (!expand) return new Set<string>();
      const next = new Set<string>();
      for (const zone of zones) next.add(`zone:${zone.id}`);
      if ((nodesByPrimaryZone.get(UNZONED_ID)?.length ?? 0) > 0) next.add(`zone:${UNZONED_ID}`);
      return next;
    });
  }, [zones, nodesByPrimaryZone]);

  const renderZoneRow = (zoneId: string, title: string, zoneNodes: ProblemNode[]) => {
    if (zoneNodes.length === 0) return null;
    const zonePath = `zone:${zoneId}`;
    const isOpen = expandedPaths.has(zonePath);
    const containsSelected = selectedNodeId !== null && zoneNodes.some(n => n.id === selectedNodeId);

    return (
      <div key={zoneId} className="select-none">
        <button
          type="button"
          role="treeitem"
          aria-expanded={isOpen}
          data-testid={`tree-zone-${zoneId}`}
          onClick={() => toggleZone(zoneId)}
          className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors ${
            containsSelected
              ? 'border-cyan-800/80 bg-cyan-950/40'
              : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700'
          }`}
        >
          {isOpen ? <ChevronDown size={14} className="shrink-0 text-cyan-400" /> : <ChevronRight size={14} className="shrink-0 text-slate-500" />}
          {isOpen ? (
            <FolderOpen size={15} className="shrink-0 text-cyan-300" />
          ) : (
            <Folder size={15} className="shrink-0 text-slate-400" />
          )}
          <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-100">{title}</span>
          <span className="shrink-0 rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[9px] text-slate-400">
            {zoneNodes.length}
          </span>
        </button>

        {isOpen && (
          <div className="ml-3 mt-0.5 border-l border-slate-800 pl-2 pb-1" role="group">
            {zoneNodes.map(node => (
              <TreeNodeRow
                key={`${zonePath}/${node.id}`}
                node={node}
                depth={1}
                ancestors={[]}
                expandedPaths={expandedPaths}
                onToggle={togglePath}
                path={`${zonePath}/${node.id}`}
                nodesById={nodesById}
                selectedNodeId={selectedNodeId}
                onSelectNode={onSelectNode}
                manager={manager}
                proofs={proofs}
                selectedRowRef={selectedRowRef}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="rounded-xl border border-cyan-900/50 bg-[#060c16]/95 p-3 shadow-2xl"
      data-testid="map-tree-view"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          Проводник графа ({nodes.length} узлов)
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => expandOfCollapseAll(true)}
            className="inline-flex items-center gap-1 rounded border border-slate-800 bg-slate-900/70 px-2 py-1 text-[10px] text-slate-300 hover:text-cyan-200"
            title="Развернуть все зоны"
          >
            <ChevronsUpDown size={11} /> Развернуть зоны
          </button>
          <button
            type="button"
            onClick={() => expandOfCollapseAll(false)}
            className="inline-flex items-center gap-1 rounded border border-slate-800 bg-slate-900/70 px-2 py-1 text-[10px] text-slate-300 hover:text-cyan-200"
            title="Свернуть все"
          >
            <ChevronsDownUp size={11} /> Свернуть
          </button>
        </div>
      </div>

      <div role="tree" aria-label="Дерево зон и задач RICIS-III" className="max-h-[520px] space-y-1 overflow-y-auto pr-1">
        {zones.map(zone =>
          renderZoneRow(zone.id, zone.name, nodesByPrimaryZone.get(zone.id) ?? []),
        )}
        {renderZoneRow(UNZONED_ID, 'Без зоны', nodesByPrimaryZone.get(UNZONED_ID) ?? [])}
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
        Стрелка раскрывает связи узла: <span className="text-cyan-400">«Зависит от»</span> — предпосылки,{' '}
        <span className="text-violet-400">«От него зависят»</span> — последствия. Клик по строке выбирает задачу.
      </p>
    </div>
  );
}
