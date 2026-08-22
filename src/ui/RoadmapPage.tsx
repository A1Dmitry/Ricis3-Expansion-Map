import { ArrowLeft, BookOpen, ChevronRight, Compass, ListTree, SearchCheck, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ProblemNode } from '../model/types';
import { getRootConnectedScientificTasks, getRootPathLabel, resolveRootSelection } from '../model/rootTaskFilter';
import { UrlShareService } from '../services/UrlShareService';
import { useMapStore } from '../store/mapStore';

type RoadmapRouteId = 'EXPLORE' | 'VERIFY' | 'CHALLENGE' | 'ROOT_GOAL';

interface RoadmapPageProps {
  contextNodeId?: string | null;
  initialRootNodeId?: string | null;
  onBackToMap: () => void;
}

function isRootCandidate(node: ProblemNode): boolean {
  return node.type === 'core_singularity' || node.id === 'core-agi-target' || node.id === 'math-singularity';
}

function navigateToMap(nodeId?: string, mode?: string): void {
  window.location.assign(UrlShareService.generateShareUrl({ nodeId, mode, roadmap: false, rootNodeId: null }));
}

export function RoadmapPage({ contextNodeId, initialRootNodeId, onBackToMap }: RoadmapPageProps) {
  const map = useMapStore();
  const contextNode = map.nodes.find(node => node.id === contextNodeId) ?? null;
  const [activeRoute, setActiveRoute] = useState<RoadmapRouteId | null>(initialRootNodeId ? 'ROOT_GOAL' : null);
  const [rootNodeId, setRootNodeId] = useState<string | null>(initialRootNodeId ?? null);

  const rootCandidates = useMemo(() => {
    const candidates = map.nodes.filter(isRootCandidate);
    if (contextNode && !candidates.some(node => node.id === contextNode.id)) {
      candidates.push(contextNode);
    }
    return candidates.sort((left, right) => left.title.localeCompare(right.title, 'ru'));
  }, [map.nodes, contextNode]);
  const rootSelection = useMemo(() => resolveRootSelection(rootNodeId, map.nodes), [rootNodeId, map.nodes]);
  const selectedRoot = rootSelection.root;
  const missingRootNodeId = rootSelection.missingRootNodeId;
  const connectedTasks = useMemo(
    () => rootNodeId ? getRootConnectedScientificTasks(rootNodeId, map.nodes, map.edges) : { root: null, tasks: [] },
    [rootNodeId, map.nodes, map.edges],
  );
  const exampleTask = map.nodes.find(node => node.type === 'scientific_task') ?? null;
  const exampleNode = contextNode ?? rootCandidates[0] ?? map.nodes[0] ?? null;

  const openRootRoute = () => {
    setActiveRoute('ROOT_GOAL');
  };

  const useContextAsRoot = () => {
    if (!contextNode) return;
    setRootNodeId(contextNode.id);
    setActiveRoute('ROOT_GOAL');
  };

  const cards: Array<{
    id: RoadmapRouteId;
    title: string;
    question: string;
    result: string;
    example: string;
    action: string;
    icon: typeof Compass;
    onClick: () => void;
    tone: string;
  }> = [
    {
      id: 'EXPLORE',
      title: 'Исследовать карту',
      question: 'Как это утверждение связано с другими идеями?',
      result: 'Откроется карта с карточкой выбранного узла и его зависимостями.',
      example: exampleNode ? `Пример: проследить связи ${exampleNode.id}.` : 'Пример появится после загрузки карты.',
      action: 'Открыть карту',
      icon: Compass,
      tone: 'border-cyan-800/70 bg-cyan-950/20 hover:border-cyan-400/80',
      onClick: () => navigateToMap(exampleNode?.id, 'explore'),
    },
    {
      id: 'VERIFY',
      title: 'Проверить утверждение',
      question: 'Какие evidence и проверки поддерживают этот узел?',
      result: 'Откроется карточка узла с видимым статусом и секцией формальной верификации.',
      example: exampleNode ? `Пример: проверить статус ${exampleNode.id}.` : 'Пример появится после загрузки карты.',
      action: 'Открыть проверку',
      icon: ShieldCheck,
      tone: 'border-emerald-800/70 bg-emerald-950/20 hover:border-emerald-400/80',
      onClick: () => navigateToMap(exampleNode?.id, 'verify'),
    },
    {
      id: 'CHALLENGE',
      title: 'Оспорить утверждение',
      question: 'Где возможен контрпример, возражение или недостающая формализация?',
      result: 'Откроется контур исследовательских задач, связанных с выбранной целью.',
      example: exampleTask ? `Пример: изучить задачу ${exampleTask.id}.` : 'Открытых научных задач пока нет.',
      action: 'Показать связанные задачи',
      icon: SearchCheck,
      tone: 'border-amber-800/70 bg-amber-950/20 hover:border-amber-400/80',
      onClick: openRootRoute,
    },
    {
      id: 'ROOT_GOAL',
      title: 'Работать от корневой цели',
      question: 'Какие задачи структурно ведут к выбранной цели?',
      result: 'Будут показаны только научные задачи с путём «задача → … → корень».',
      example: 'Пример: задачи → … → core-agi-target.',
      action: 'Выбрать корневую цель',
      icon: ListTree,
      tone: 'border-violet-800/70 bg-violet-950/20 hover:border-violet-400/80',
      onClick: openRootRoute,
    },
  ];

  return (
    <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_top,_#10233a_0%,_#050505_45%)] px-4 py-4 text-slate-100 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 flex flex-col gap-4 border-b border-cyan-900/50 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">RICIS Expansion Map · Roadmap</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Выберите удобный способ работы</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              RICIS связывает математическую структуру, evidence и открытые исследовательские задачи. Начните с маршрута, который соответствует вашему вопросу, а не с обязательной последовательности шагов.
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToMap}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-cyan-800/80 bg-cyan-950/40 px-4 text-sm font-bold text-cyan-100 transition-colors hover:border-cyan-400 hover:bg-cyan-900/50"
          >
            <ArrowLeft size={16} /> Вернуться к карте
          </button>
        </header>

        {contextNode && (
          <section className="mb-6 rounded-xl border border-cyan-800/70 bg-cyan-950/25 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Вы открыли Roadmap из узла</p>
            <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-white">{contextNode.title}</p>
                <p className="font-mono text-xs text-slate-400">{contextNode.id}</p>
              </div>
              <button
                type="button"
                onClick={useContextAsRoot}
                className="min-h-10 rounded-lg border border-violet-700/80 bg-violet-950/45 px-3 text-xs font-bold text-violet-100 hover:border-violet-300"
              >
                Использовать как корневую цель
              </button>
            </div>
          </section>
        )}

        <section aria-label="Маршруты исследования" className="grid gap-4 md:grid-cols-2">
          {cards.map(card => {
            const Icon = card.icon;
            const selected = activeRoute === card.id;
            return (
              <article key={card.id} className={`rounded-xl border p-5 shadow-lg transition-colors ${card.tone} ${selected ? 'ring-1 ring-white/30' : ''}`}>
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-cyan-200"><Icon size={20} /></span>
                  <div>
                    <h2 className="text-lg font-bold text-white">{card.title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-300">{card.question}</p>
                  </div>
                </div>
                <p className="mt-4 rounded-lg border border-white/10 bg-black/25 p-3 text-xs leading-relaxed text-slate-300">{card.result}</p>
                <p className="mt-3 text-xs text-slate-400">{card.example}</p>
                <button
                  type="button"
                  onClick={card.onClick}
                  className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/15 bg-black/35 px-3 text-xs font-bold text-white transition-colors hover:border-cyan-300 hover:bg-cyan-950/60"
                >
                  {card.action} <ChevronRight size={14} />
                </button>
              </article>
            );
          })}
        </section>

        {activeRoute === 'ROOT_GOAL' && (
          <section className="mt-6 rounded-xl border border-violet-800/70 bg-[#0b0715]/90 p-5 shadow-xl">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-400">Режим «Связанные с корнем»</p>
                <h2 className="mt-1 text-xl font-bold text-white">Показывать только задачи до корневой цели</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
                  В выдачу попадают только научные задачи, для которых существует структурный путь к выбранному корню. Промежуточные узлы показаны в пути, но не превращаются в ложные карточки задач.
                </p>
              </div>
              {selectedRoot && <span className="w-fit rounded-full border border-violet-600/70 bg-violet-950/70 px-3 py-1 text-xs font-mono text-violet-100">Корень: {selectedRoot.id}</span>}
            </div>

            <label className="mt-5 block max-w-xl">
              <span className="mb-1.5 block text-xs font-bold text-slate-200">Корневая цель</span>
              <select
                value={selectedRoot?.id ?? ''}
                onChange={event => setRootNodeId(event.target.value || null)}
                className="min-h-11 w-full rounded-lg border border-violet-800 bg-black/45 px-3 text-sm text-slate-100 outline-none focus:border-violet-300"
              >
                <option value="">Выберите корневую цель…</option>
                {rootCandidates.map(root => <option key={root.id} value={root.id}>{root.title} ({root.id})</option>)}
              </select>
            </label>

            {missingRootNodeId && (
              <div role="alert" className="mt-5 rounded-lg border border-amber-700/80 bg-amber-950/25 p-4">
                <p className="font-semibold text-amber-100">Корневой узел не найден</p>
                <p className="mt-1 break-words text-sm text-amber-50/80">
                  Ссылка запрашивает узел <span className="font-mono text-amber-100">{missingRootNodeId}</span>, которого нет в текущем каталоге. Фильтр не применён и данные карты не изменялись.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setRootNodeId(null)}
                    className="min-h-9 rounded border border-amber-500/70 bg-black/25 px-3 text-xs font-bold text-amber-50 hover:border-amber-200"
                  >
                    Выбрать существующий корень
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateToMap()}
                    className="min-h-9 rounded border border-slate-500/70 bg-black/25 px-3 text-xs font-bold text-slate-100 hover:border-slate-200"
                  >
                    Открыть полную карту
                  </button>
                </div>
              </div>
            )}

            {!selectedRoot && !missingRootNodeId && (
              <p className="mt-5 rounded-lg border border-slate-700 bg-black/35 p-4 text-sm text-slate-300">
                Выберите одну корневую цель. Фильтр не включается автоматически и не объединяет разные корни.
              </p>
            )}

            {selectedRoot && connectedTasks.tasks.length === 0 && (
              <div className="mt-5 rounded-lg border border-slate-700 bg-black/35 p-4">
                <p className="font-semibold text-slate-100">Пока нет задач, структурно связанных с этой корневой целью.</p>
                <p className="mt-1 text-sm text-slate-400">Выберите другой корень или вернитесь к полной карте для исследования зависимостей.</p>
              </div>
            )}

            {selectedRoot && connectedTasks.tasks.length > 0 && (
              <div className="mt-5">
                <p className="mb-3 text-sm text-slate-300">Найдено: <span className="font-bold text-white">{connectedTasks.tasks.length}</span> научных задач, связанных с <span className="font-mono text-violet-200">{selectedRoot.id}</span>.</p>
                <div className="space-y-2">
                  {connectedTasks.tasks.map(({ task, path }) => (
                    <article key={task.id} className="rounded-lg border border-violet-900/70 bg-black/35 p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-100">{task.title}</h3>
                          <p className="mt-1 text-xs text-slate-400">{task.description || 'Описание задачи пока не добавлено.'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigateToMap(task.id, 'challenge')}
                          className="min-h-9 shrink-0 rounded border border-violet-700/80 bg-violet-950/45 px-3 text-xs font-bold text-violet-100 hover:border-violet-300"
                        >
                          Открыть задачу
                        </button>
                      </div>
                      <p className="mt-3 break-words rounded bg-black/45 px-2.5 py-2 font-mono text-[11px] text-violet-200" title={path.map(node => node.id).join(' → ')}>
                        {getRootPathLabel(path)}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <section className="mt-7 border-t border-neutral-800 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Быстрые ссылки</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={onBackToMap} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900/70 px-3 text-xs font-bold text-slate-200 hover:border-cyan-600"><Compass size={14} /> Карта</button>
            <button type="button" onClick={openRootRoute} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900/70 px-3 text-xs font-bold text-slate-200 hover:border-violet-600"><ListTree size={14} /> Связанные задачи</button>
            <a href="https://github.com/A1Dmitry/Ricis3-Expansion-Map#readme" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900/70 px-3 text-xs font-bold text-slate-200 hover:border-cyan-600"><BookOpen size={14} /> Методология</a>
          </div>
        </section>
      </div>
    </main>
  );
}
