import React, { useState } from 'react';
import { VOYNICH_DECRYPTION_SPEC, routeTokenToStack } from '../model/voynichGenome';
import type {
  IVoynichDecodedFolioDTO,
  VoynichStackId,
  IVoynichStackConfigDTO,
  IVoynichMacroDTO,
} from '../model/voynichGenome.types';
import { ShieldCheck, Cpu, Zap, DollarSign, Database, Layers, CheckCircle2 } from 'lucide-react';

interface VoynichDecryptionPanelProps {
  onSelectFolioNode?: (folioId: string) => void;
  onClose?: () => void;
}

export const VoynichDecryptionPanel: React.FC<VoynichDecryptionPanelProps> = ({
  onSelectFolioNode,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'folios' | 'stacks' | 'macros' | 'economic' | 'simulator'>('hierarchy');
  const [selectedCircuitId, setSelectedCircuitId] = useState<string>('circuit-r1-core');
  const [expandedFolioId, setExpandedFolioId] = useState<string | null>('voynich-f5r');
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>('voynich-block-f5r-main');
  const [selectedFolio, setSelectedFolio] = useState<IVoynichDecodedFolioDTO>(VOYNICH_DECRYPTION_SPEC.decodedFolios[8]); // Default to f5r LENR
  const [testToken, setTestToken] = useState<string>('daiiiin');
  const [routedStack, setRoutedStack] = useState<VoynichStackId | undefined>(routeTokenToStack('daiiiin'));
  const [simCharge, setSimCharge] = useState<number>(4);
  const [simPressure, setSimPressure] = useState<number>(100);
  const [simActive, setSimActive] = useState<boolean>(false);

  const handleTestTokenChange = (token: string) => {
    setTestToken(token);
    setRoutedStack(routeTokenToStack(token));
  };

  return (
    <div className="bg-slate-900 border border-yellow-500/30 rounded-xl shadow-2xl p-5 text-slate-100 max-w-5xl mx-auto my-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 mb-5 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
              EVA Genome Monolith v1.0.0_RICIS_v7.8
            </span>
            <span className="text-xs text-slate-400 font-mono">DOI: {VOYNICH_DECRYPTION_SPEC.doi}</span>
          </div>
          <h2 className="text-2xl font-bold mt-1 text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-yellow-400" />
            Дешифровка Рукописи Войнича (Voynich Decryption Engine)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Автор: {VOYNICH_DECRYPTION_SPEC.author} • Метод: {VOYNICH_DECRYPTION_SPEC.methodology}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Закрыть
          </button>
        )}
      </div>

      {/* High-level metrics bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-800/60 border border-slate-700/50 p-3 rounded-lg flex items-center gap-3">
          <Database className="w-8 h-8 text-yellow-400 flex-shrink-0" />
          <div>
            <div className="text-xs text-slate-400">Дешифровано фолиантов</div>
            <div className="text-lg font-bold text-white">33 / 33</div>
            <div className="text-[10px] text-yellow-400">P&ID Чексуммы совпали</div>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 p-3 rounded-lg flex items-center gap-3">
          <Layers className="w-8 h-8 text-cyan-400 flex-shrink-0" />
          <div>
            <div className="text-xs text-slate-400">Forth Стеки</div>
            <div className="text-lg font-bold text-white">8 Каналов</div>
            <div className="text-[10px] text-cyan-400">Унарный заряд +1..+4</div>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 p-3 rounded-lg flex items-center gap-3">
          <Cpu className="w-8 h-8 text-emerald-400 flex-shrink-0" />
          <div>
            <div className="text-xs text-slate-400">Макрокоманды ядра</div>
            <div className="text-lg font-bold text-white">5 Макросов</div>
            <div className="text-[10px] text-emerald-400">M1 – M5 Инварианты</div>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 p-3 rounded-lg flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-amber-400 flex-shrink-0" />
          <div>
            <div className="text-xs text-slate-400">Рыночный потенциал</div>
            <div className="text-lg font-bold text-white">$50 Тлрн</div>
            <div className="text-[10px] text-amber-400">LENR Энергетика</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-5 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'hierarchy'
              ? 'border-yellow-400 text-yellow-400 bg-yellow-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          5-Уровневая Иерархия (Circuits → Code)
        </button>
        <button
          onClick={() => setActiveTab('folios')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'folios'
              ? 'border-yellow-400 text-yellow-400 bg-yellow-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          33 Фолианта (P&ID Schema)
        </button>
        <button
          onClick={() => setActiveTab('stacks')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'stacks'
              ? 'border-yellow-400 text-yellow-400 bg-yellow-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          8 Forth Стеков & Токены
        </button>
        <button
          onClick={() => setActiveTab('macros')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'macros'
              ? 'border-yellow-400 text-yellow-400 bg-yellow-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Макросы M1–M5
        </button>
        <button
          onClick={() => setActiveTab('economic')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'economic'
              ? 'border-yellow-400 text-yellow-400 bg-yellow-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Экономика ($50Т)
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'simulator'
              ? 'border-yellow-400 text-yellow-400 bg-yellow-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Симулятор LENR (f5r)
        </button>
      </div>

      {/* Tab 0: 5-Level Hierarchy Inspector */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            {VOYNICH_DECRYPTION_SPEC.hierarchyTree.circuits.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCircuitId(c.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedCircuitId === c.id
                    ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 font-bold shadow'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-[10px] uppercase font-mono text-slate-400">Контур L0</div>
                <div className="text-xs font-bold text-white truncate">{c.name.split(':')[0]}</div>
                <div className="text-[10px] font-mono text-yellow-400 mt-1 truncate">{c.ricisInvariant}</div>
              </button>
            ))}
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Иерархическое дерево контура: {selectedCircuitId}</span>
              <span className="text-xs font-normal text-slate-400">
                L0 Контур → L1 Folio → L2 Блок → L3 Деталь → L4 EVA Код
              </span>
            </h3>

            {VOYNICH_DECRYPTION_SPEC.hierarchyTree.folios
              .filter((f) => f.circuitId === selectedCircuitId)
              .map((f) => {
                const isFolioExpanded = expandedFolioId === f.id;
                return (
                  <div key={f.id} className="border border-slate-800 bg-slate-900/60 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => setExpandedFolioId(isFolioExpanded ? null : f.id)}
                        className="flex items-center gap-2 text-left hover:text-yellow-300 font-bold text-xs"
                      >
                        <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-mono">
                          L1 {f.folio}
                        </span>
                        <span className="text-white">{f.function}</span>
                      </button>
                      <a
                        href={f.evaSourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition-colors"
                      >
                        EVA Источник ↗
                      </a>
                    </div>

                    {isFolioExpanded && (
                      <div className="pl-4 border-l-2 border-yellow-500/30 space-y-3 mt-2">
                        {VOYNICH_DECRYPTION_SPEC.hierarchyTree.blocks
                          .filter((b) => b.folioId === f.id)
                          .map((b) => {
                            const isBlockExpanded = expandedBlockId === b.id;
                            return (
                              <div key={b.id} className="bg-slate-950/70 border border-slate-800 p-2.5 rounded space-y-2">
                                <div className="flex justify-between items-center">
                                  <button
                                    onClick={() => setExpandedBlockId(isBlockExpanded ? null : b.id)}
                                    className="text-left font-semibold text-slate-200 hover:text-yellow-300 text-xs"
                                  >
                                    <span className="text-cyan-400 font-mono mr-2">L2 {b.pandidCode}</span>
                                    {b.name}
                                  </button>
                                </div>

                                {isBlockExpanded && (
                                  <div className="pl-3 border-l-2 border-cyan-500/30 space-y-2 mt-2">
                                    {VOYNICH_DECRYPTION_SPEC.hierarchyTree.parts
                                      .filter((p) => p.blockId === b.id)
                                      .map((p) => (
                                        <div key={p.id} className="bg-slate-900 border border-slate-800 p-2.5 rounded space-y-1.5">
                                          <div className="flex justify-between items-start">
                                            <span className="font-bold text-amber-300">L3 Деталь: {p.name}</span>
                                            <span className="text-[10px] text-slate-400 font-mono">{p.material}</span>
                                          </div>
                                          <div className="text-slate-300 bg-black/40 p-2 rounded border border-slate-800 text-[11px]">
                                            <div><strong className="text-slate-400">P&ID Рисунок EVA:</strong> {p.visualChecksum}</div>
                                            <div><strong className="text-slate-400">RICIS-III Инвариант:</strong> <code className="text-yellow-300">{p.ricisInvariant}</code></div>
                                          </div>

                                          {/* Level 4: EVA Code Units */}
                                          <div className="pt-2 border-t border-slate-800 space-y-1">
                                            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                                              L4 EVA Forth Исполняемый Код:
                                            </div>
                                            {VOYNICH_DECRYPTION_SPEC.hierarchyTree.codeUnits
                                              .filter((c) => c.partId === p.id)
                                              .map((c) => (
                                                <div key={c.id} className="font-mono bg-emerald-950/30 border border-emerald-500/20 p-2 rounded text-[11px]">
                                                  <div className="text-emerald-300 font-bold">"{c.evaSentence}"</div>
                                                  <div className="text-slate-400 text-[10px] mt-1">
                                                    Стек: {c.forthStackOperations.join(' → ')} | Заряд: +{c.unaryCharge}
                                                  </div>
                                                </div>
                                              ))}
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Tab 1: 33 Folios */}
      {activeTab === 'folios' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* List of folios */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 max-h-96 overflow-y-auto space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Дешифрованные страницы (33)
            </h3>
            {VOYNICH_DECRYPTION_SPEC.decodedFolios.map((f: IVoynichDecodedFolioDTO) => (
              <button
                key={f.folio}
                onClick={() => setSelectedFolio(f)}
                className={`w-full text-left p-2 rounded border text-xs transition-all flex justify-between items-center ${
                  selectedFolio.folio === f.folio
                    ? 'bg-yellow-500/20 border-yellow-500/60 text-yellow-300 font-semibold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <span className="font-mono text-xs font-bold mr-2 text-yellow-400">{f.folio}</span>
                  <span>{f.function.split('&')[0]}</span>
                </div>
                {f.chargeDepth && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {f.chargeDepth}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Folio detail view */}
          <div className="md:col-span-2 bg-slate-950/70 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-widest">
                    Фолиант {selectedFolio.folio} • {selectedFolio.subsystem}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{selectedFolio.function}</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {selectedFolio.status}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded">
                  <div className="text-slate-400 text-[11px] mb-1 font-semibold">P&ID Визуальный чексумм (Рисунок EVA):</div>
                  <div className="text-slate-200">{selectedFolio.visual_checksum}</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded">
                  <div className="text-slate-400 text-[11px] mb-1 font-semibold">RICIS-III Инвариант сохраняемости:</div>
                  <div className="font-mono text-yellow-300 bg-black/40 p-2 rounded border border-yellow-500/20 text-[11px]">
                    {selectedFolio.ricis_invariant}
                  </div>
                </div>

                {selectedFolio.chargeDepth && (
                  <div className="bg-slate-900 border border-amber-500/30 p-2.5 rounded flex justify-between items-center">
                    <div>
                      <div className="text-amber-400 font-semibold text-[11px]">Унарное накопление заряда:</div>
                      <div className="text-slate-300">Резонансный барьер {selectedFolio.chargeDepth}</div>
                    </div>
                    <span className="text-base font-bold text-amber-400 font-mono">{selectedFolio.chargeDepth}</span>
                  </div>
                )}
              </div>
            </div>

            {onSelectFolioNode && (
              <button
                onClick={() => onSelectFolioNode(`voynich-${selectedFolio.folio}`)}
                className="mt-4 w-full py-2 px-4 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/50 text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                Показать на 3D-Карте Монолита (Node: voynich-{selectedFolio.folio})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: 8 Stacks & Token Router */}
      {activeTab === 'stacks' && (
        <div className="space-y-4 text-xs">
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg">
            <h3 className="text-sm font-bold text-white mb-2">Интерактивный маршрутизатор EVA-токенов в Forth-стеки</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={testToken}
                onChange={(e) => handleTestTokenChange(e.target.value)}
                placeholder="Введите токен (например, dain, daiin, daiiiin, qokedy, ychey)"
                className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-white font-mono text-xs flex-1 focus:outline-none focus:border-yellow-400"
              />
            </div>
            {routedStack ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded flex justify-between items-center">
                <span>
                  Токен <code className="text-yellow-300 font-bold">{testToken}</code> направлен в стек:
                </span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{routedStack}</span>
              </div>
            ) : (
              <div className="bg-slate-800/50 border border-slate-700 p-2.5 rounded text-slate-400">
                Префикс токена не привязан к стандартным стекам (передаётся как параметр).
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(Object.entries(VOYNICH_DECRYPTION_SPEC.decryptionRules.stackRoutingPrefixes) as [string, IVoynichStackConfigDTO][]).map(([prefix, info]) => (
              <div key={prefix} className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg flex justify-between items-start">
                <div>
                  <span className="font-mono text-xs text-yellow-400 font-bold">Префикс: {prefix}</span>
                  <div className="text-slate-300 mt-1">{info.function}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {info.stack}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Macros M1 - M5 */}
      {activeTab === 'macros' && (
        <div className="grid grid-cols-1 gap-3 text-xs">
          {(Object.entries(VOYNICH_DECRYPTION_SPEC.macroLibrary) as [string, IVoynichMacroDTO][]).map(([key, m]) => (
            <div key={key} className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-yellow-400 text-sm">{m.name}</span>
                <span className="font-mono text-[11px] text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                  Инвариант: {m.invariant}
                </span>
              </div>
              <div className="font-mono text-slate-300 bg-slate-900/80 p-2 rounded border border-slate-800 mb-2">
                Паттерн: {m.pattern}
              </div>
              <div className="text-slate-400">{m.physics}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Economic Profile */}
      {activeTab === 'economic' && (
        <div className="space-y-4 text-xs">
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg">
            <h3 className="text-sm font-bold text-white mb-2">Экономический профиль дешифровки ($50 Тлрн Рынок)</h3>
            <p className="text-slate-400 mb-4">
              Полное дешифрование гидроакустической схемы Рукописи Войнича открывает бестопливную кавитационную LENR энергетику, оцениваемую в $50 Тлрн.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-900 border border-slate-800 p-3 rounded text-center">
                <div className="text-slate-400">Стоимость без решения</div>
                <div className="text-lg font-bold text-rose-400">$1,000 Млрд</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded text-center">
                <div className="text-slate-400">Затраты на решение</div>
                <div className="text-lg font-bold text-emerald-400">$5 Млн</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded text-center">
                <div className="text-slate-400">Рыночный прирост</div>
                <div className="text-lg font-bold text-yellow-400">$50,000 Млрд</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded text-center">
                <div className="text-slate-400">Риск задержки</div>
                <div className="text-lg font-bold text-amber-400">$10,000 Млрд</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Interactive Simulator */}
      {activeTab === 'simulator' && (
        <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg text-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white">Симулятор Кавитационной Ячейки LENR (Folio f5r)</h3>
              <p className="text-slate-400">
                Моделирование импульсного схлопывания пузырька $0_P \times \infty_v = P \cdot v$ с узлами Хладни.
              </p>
            </div>
            <button
              onClick={() => setSimActive(!simActive)}
              className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
                simActive
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 hover:bg-yellow-500/30'
              }`}
            >
              <Zap className="w-4 h-4" /> {simActive ? 'Остановить Реактор' : 'Запустить Инициацию'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 mb-1 block">Глубина унарного заряда (Repeater Charge): {simCharge}</label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={simCharge}
                  onChange={(e) => setSimCharge(parseInt(e.target.value))}
                  className="w-full accent-yellow-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>dain (+1)</span>
                  <span>daiin (+2)</span>
                  <span>daiiin (+3)</span>
                  <span>daiiiin (+4)</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 mb-1 block">Давление схлопывания (P_implosion): {simPressure} МПа</label>
                <input
                  type="range"
                  min="10"
                  max="500"
                  value={simPressure}
                  onChange={(e) => setSimPressure(parseInt(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded flex flex-col justify-between font-mono">
              <div>
                <div className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">Состояние Схлопывания RICIS:</div>
                <div className="text-yellow-300 text-sm">
                  {simActive ? '⚡ КАВИТАЦИОННЫЙ РЕЗОНАНС АКТИВЕН' : '💤 РЕАКТОР В РЕЖИМЕ ОЖИДАНИЯ'}
                </div>
                <div className="text-slate-300 mt-2 text-[11px]">
                  P_implosion = {simPressure} МПа <br />
                  Charge = +{simCharge} (daiiiin) <br />
                  RICIS Invariant = {simCharge * simPressure * 4} MW/m³
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-emerald-400">
                0_P × ∞_v = P · v → {simActive ? 'СТАБИЛЬНЫЙ ВЫХОД (БЕЗ NaN / БЕЗ БОМБЫ)' : '0 MW'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
