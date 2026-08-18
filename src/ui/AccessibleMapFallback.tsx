import type { ProblemNode, ScienceZone } from '../model/types';

interface AccessibleMapFallbackProps {
  readonly nodes: readonly ProblemNode[];
  readonly zones: readonly ScienceZone[];
  readonly selectedNodeId: string | null;
  readonly onSelectNode: (nodeId: string) => void;
  readonly onEnable3d: () => void;
  readonly reason: 'unsupported' | 'render_failed' | 'user_selected';
}

const STATUS_LABEL: Readonly<Record<ProblemNode['state'], string>> = {
  unresolved: 'Требует исследования',
  partial: 'Частично подтверждено',
  resolved: 'Статус решения требует просмотра evidence',
};

function nodeZoneNames(node: ProblemNode, zones: readonly ScienceZone[]): string {
  const names = node.zoneIds
    .map(zoneId => zones.find(zone => zone.id === zoneId)?.name)
    .filter((name): name is string => Boolean(name));

  return names.join(' · ') || 'Не классифицировано';
}

function reasonText(reason: AccessibleMapFallbackProps['reason']): string {
  if (reason === 'render_failed') {
    return '3D-сцена не запустилась. Содержимое карты остаётся доступным в семантическом списке.';
  }

  if (reason === 'unsupported') {
    return 'Этот браузер или устройство не предоставило рабочий WebGL-контекст. Содержимое карты доступно в семантическом списке.';
  }

  return 'Включён режим доступного списка. Он содержит те же узлы и сохраняет выбор задачи.';
}

/**
 * Accessible, keyboard-operable alternative to the WebGL graph. It deliberately
 * exposes the research content as semantic HTML rather than reproducing 3D physics.
 */
export function AccessibleMapFallback({
  nodes,
  zones,
  selectedNodeId,
  onSelectNode,
  onEnable3d,
  reason,
}: AccessibleMapFallbackProps) {
  return (
    <section
      aria-label="Доступная карта задач RICIS-III"
      className="h-full overflow-y-auto bg-[radial-gradient(circle_at_top,_#101b2b_0%,_#050505_58%)] px-5 py-6 text-slate-100"
    >
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="rounded-xl border border-cyan-900/70 bg-[#07111f]/95 p-5 shadow-xl shadow-cyan-950/20">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300">Доступный режим карты</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">RICIS-III: список исследовательских узлов</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">{reasonText(reason)}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-cyan-800/80 bg-cyan-950/60 px-3 py-1 text-xs font-mono text-cyan-200">
              Узлов: {nodes.length}
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-mono text-slate-300">
              Научных зон: {zones.length}
            </span>
            <button
              type="button"
              onClick={onEnable3d}
              className="ml-auto rounded-md border border-cyan-600/70 bg-cyan-950 px-3 py-1.5 text-xs font-bold text-cyan-100 transition-colors hover:bg-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              Попробовать 3D-карту
            </button>
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {nodes.map(node => {
            const isSelected = node.id === selectedNodeId;
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
                <p className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">{nodeZoneNames(node, zones)}</p>
                <h3 className="mt-1 text-sm font-bold leading-snug text-slate-100">{node.title}</h3>
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-400">{node.description || 'Описание пока не добавлено.'}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="rounded-full border border-slate-700 bg-black/30 px-2 py-1 text-[10px] font-medium text-slate-300">
                    {STATUS_LABEL[node.state]}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{node.id}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
