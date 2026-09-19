import { ContentButton } from './components/ContentButton';
// ============================================================================
// ACCESSIBLE / 2D MAP MODE (2D Graph + Explorer Tree)
// Замена прежней «2D-заглушки»: полноценная интерактивная плоская карта
// (детерминированная force-раскладка, pan/zoom, подсветка связей выбранного
// узла) и проводниковый tree view (зоны → узлы → зависимости с цикл-гардом).
// ============================================================================

import { useState } from 'react';
import type { ProblemNode, ScienceZone, Proof } from '../model/types';
import { FolderTree, Network } from 'lucide-react';
import { Map2DGraph } from './map2d/Map2DGraph';
import { MapTreeView } from './map2d/MapTreeView';

interface AccessibleMapFallbackProps {
  readonly nodes: readonly ProblemNode[];
  readonly zones: readonly ScienceZone[];
  readonly selectedNodeId: string | null;
  readonly onSelectNode: (nodeId: string) => void;
  readonly onEnable3d: () => void;
  readonly reason: 'unsupported' | 'render_failed' | 'user_selected';
  readonly proofs?: Record<string, Proof>;
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
  void zones; void reason; // минималистичный режим: заголовок-сводка без служебного шума
  const [activeTab, setActiveTab] = useState<'2d_graph' | 'tree'>('2d_graph');
  const provenCount = nodes.filter(n => proofs?.[n.id] != null || n.state === 'resolved').length;

  return (
    <section
      aria-label="Доступная карта задач RICIS-III"
      className="h-full overflow-y-auto bg-[radial-gradient(circle_at_top,_#101b2b_0%,_#050505_58%)] px-4 py-3 text-slate-100"
    >
      <div className="mx-auto max-w-6xl space-y-3">
        <header className="flex flex-wrap items-center gap-2 rounded-lg border border-cyan-900/60 bg-[#07111f]/90 px-2 py-1.5">
          <ContentButton
            type="button"
            onClick={() => setActiveTab('2d_graph')}
            data-control-kind="tab"
            aria-pressed={activeTab === '2d_graph'}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-bold transition-all ${
              activeTab === '2d_graph'
                ? 'border-cyan-500 bg-cyan-950/80 text-cyan-200'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network size={13} />
            2D Карта
          </ContentButton>
          <ContentButton
            type="button"
            onClick={() => setActiveTab('tree')}
            data-control-kind="tab"
            aria-pressed={activeTab === 'tree'}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-bold transition-all ${
              activeTab === 'tree'
                ? 'border-cyan-500 bg-cyan-950/80 text-cyan-200'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderTree size={13} />
            Дерево
          </ContentButton>
          <ContentButton
            type="button"
            onClick={onEnable3d}
            className="rounded-md border border-cyan-600/70 bg-cyan-950 px-2.5 py-1 text-[11px] font-bold text-cyan-100 transition-colors hover:bg-cyan-900"
          >
            3D-карту
          </ContentButton>
          <span className="ml-auto text-[11px] font-mono text-slate-400" data-testid="m2d-stats">
            Всего: <span className="text-slate-200">{nodes.length}</span>
            {' · '}Доказано: <span className="text-emerald-300">{provenCount}</span>
          </span>
        </header>

        {activeTab === '2d_graph' ? (
          <Map2DGraph
            nodes={nodes}
            zones={zones}
            selectedNodeId={selectedNodeId}
            onSelectNode={onSelectNode}
            proofs={proofs}
          />
        ) : (
          <MapTreeView
            nodes={nodes}
            zones={zones}
            selectedNodeId={selectedNodeId}
            onSelectNode={onSelectNode}
            proofs={proofs}
          />
        )}
      </div>
    </section>
  );
}
