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

function reasonText(reason: AccessibleMapFallbackProps['reason']): string {
  if (reason === 'render_failed') {
    return '3D-сцена WebGL не задействована. Ниже представлены интерактивная 2D-карта сингулярностей и дерево-проводник.';
  }

  if (reason === 'unsupported') {
    return 'Контекст WebGL недоступен в этом окружении. Ниже представлены интерактивная 2D-карта сингулярностей и дерево-проводник.';
  }

  return 'Включён режим 2D/Доступной карты: равномерная раскладка узлов с подсветкой связей и дерево зависимостей. Выбор задачи сохраняется.';
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
  const [activeTab, setActiveTab] = useState<'2d_graph' | 'tree'>('2d_graph');

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
              <h2 className="mt-0.5 text-xl font-bold tracking-tight text-white">RICIS-III: 2D-карта и дерево сингулярностей</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('2d_graph')}
                aria-pressed={activeTab === '2d_graph'}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                  activeTab === '2d_graph'
                    ? 'border-cyan-500 bg-cyan-950/80 text-cyan-200 shadow-md shadow-cyan-950/50'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Network size={14} />
                2D Карта
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tree')}
                aria-pressed={activeTab === 'tree'}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                  activeTab === 'tree'
                    ? 'border-cyan-500 bg-cyan-950/80 text-cyan-200 shadow-md shadow-cyan-950/50'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <FolderTree size={14} />
                Дерево (проводник)
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
