import React, { useState } from 'react';
import { X, Upload, CheckCircle2, AlertTriangle, FileCode, ArrowRight, ShieldCheck } from 'lucide-react';
import { defaultMapPatchIngestionService } from '../model/mapPatchIngestion';
import type { IMapPatchPayloadDTO, IMapPatchIngestionResult } from '../model/mapPatchIngestion.types';
import { useMapStore } from '../store/mapStore';

interface MapPatchImportModalProps {
  onClose: () => void;
}

export const MapPatchImportModal: React.FC<MapPatchImportModalProps> = ({ onClose }) => {
  const map = useMapStore();
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    mode: 'patch_merge' | 'direct_full_state' | 'unknown';
    payload?: IMapPatchPayloadDTO;
  } | null>(null);
  const [applyResult, setApplyResult] = useState<IMapPatchIngestionResult | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleTextChange = (text: string) => {
    setJsonText(text);
    setError(null);
    setApplyResult(null);

    if (!text.trim()) {
      setValidationResult(null);
      return;
    }

    const res = defaultMapPatchIngestionService.validateAndParse(text);
    if (!res.valid) {
      setValidationResult(null);
      setError(res.error || 'Некорректный JSON');
    } else {
      setValidationResult({
        valid: true,
        mode: res.mode,
        payload: res.payload,
      });
      setError(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleTextChange(content);
    };
    reader.readAsText(file);
  };

  const handleApply = () => {
    if (!validationResult?.payload) return;
    setIsApplying(true);
    setError(null);

    try {
      const currentNodes = map.nodes || [];
      const currentEdges = map.edges || [];
      const currentProofs = map.proofs || {};

      const { nextNodes, nextEdges, nextProofs, result } = defaultMapPatchIngestionService.applyPatch(
        currentNodes,
        currentEdges,
        currentProofs,
        validationResult.payload
      );

      if (!result.success) {
        setError(result.error || 'Не удалось применить патч');
        setIsApplying(false);
        return;
      }

      // Update store state with newly merged/created nodes & proofs
      useMapStore.setState({
        nodes: nextNodes,
        edges: nextEdges,
        proofs: nextProofs,
      });

      // Save to IndexedDB
      void map.saveNow();

      setApplyResult(result);
    } catch (err: any) {
      setError(err?.message || 'Непредвиденная ошибка при слиянии');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b0f19] border border-cyan-900/60 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-950 bg-cyan-950/20">
          <div className="flex items-center gap-2.5">
            <FileCode className="text-cyan-400" size={20} />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                ⚡ Импорт решений и патчей RICIS-III (JSON)
              </h2>
              <p className="text-[11px] text-cyan-300/70 font-mono">
                Поддержка пакетов RICIS.MapStatePatch, полных экспортов и Lean-доказательств
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* File drag-and-drop or select */}
          <div className="border-2 border-dashed border-cyan-900/50 hover:border-cyan-500/50 rounded-lg p-4 text-center transition-colors bg-cyan-950/10">
            <input
              type="file"
              id="patch-file-input"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="patch-file-input"
              className="cursor-pointer flex flex-col items-center gap-2 text-slate-300 hover:text-white"
            >
              <Upload className="text-cyan-400" size={24} />
              <span className="text-xs font-semibold">Выберите файл .json или перетащите его сюда</span>
              <span className="text-[10px] text-slate-500 font-mono">RICIS.MapStatePatch / MapState Export</span>
            </label>
          </div>

          {/* JSON Template/Schema Description */}
          <div className="bg-cyan-950/20 border border-cyan-900/40 rounded-lg p-3 text-[11px] text-slate-300 font-mono space-y-1.5 mb-2">
            <div className="font-bold text-cyan-400 mb-1">Формат RICIS.MapStatePatch:</div>
            <div>- Корневое поле <span className="text-emerald-400">"@type"</span> должно быть <span className="text-amber-300">"RICIS.MapStatePatch"</span></div>
            <div>- Массив <span className="text-emerald-400">"nodePatches"</span>: элементы обязаны содержать <span className="text-emerald-400">"id"</span> (строка).</div>
            <div>- Опционально: <span className="text-emerald-400">"proofs"</span>, ключи которого соответствуют ID узлов.</div>
            <div className="text-cyan-500/70 pt-1 border-t border-cyan-900/50 mt-1.5">
              Также поддерживается полный экспорт карты (массивы "nodes" и "edges").
            </div>
          </div>

          {/* Direct JSON input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Или вставьте JSON вручную:</span>
              {validationResult && (
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle2 size={12} /> Синтаксис валиден ({validationResult.mode})
                </span>
              )}
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder='{\n  "meta": { "method": "flood_fill_BFS" },\n  "nodePatches": [\n    { "id": "math-singularity", "state": "resolved" }\n  ]\n}'
              className="w-full h-44 bg-[#060911] border border-cyan-950 focus:border-cyan-500/60 rounded-lg p-3 text-xs font-mono text-cyan-200/90 placeholder-slate-600 focus:outline-none resize-y"
            />
          </div>

          {/* Validation Error */}
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg flex items-start gap-2.5 text-rose-300 text-xs">
              <AlertTriangle className="shrink-0 text-rose-400 mt-0.5" size={16} />
              <div>
                <span className="font-bold">Ошибка валидации:</span> {error}
              </div>
            </div>
          )}

          {/* Preview of Ingestion Package */}
          {validationResult?.payload && (
            <div className="p-3.5 bg-cyan-950/20 border border-cyan-900/40 rounded-lg space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-cyan-300">
                <ShieldCheck size={14} /> Метаданные пакета решений:
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500">Режим:</span>{' '}
                  <span className="text-cyan-200">{validationResult.mode}</span>
                </div>
                <div>
                  <span className="text-slate-500">Метод:</span>{' '}
                  <span className="text-cyan-200">{validationResult.payload.meta?.method || 'custom'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Патчи узлов:</span>{' '}
                  <span className="text-emerald-400">{validationResult.payload.nodePatches?.length || 0} шт.</span>
                </div>
                <div>
                  <span className="text-slate-500">Доказательства:</span>{' '}
                  <span className="text-emerald-400">
                    {validationResult.payload.proofs ? Object.keys(validationResult.payload.proofs).length : 0} шт.
                  </span>
                </div>
              </div>
              {validationResult.payload.meta?.trustPolicy && (
                <div className="text-[10px] text-slate-400 pt-1 border-t border-cyan-950/60">
                  <span className="text-amber-400/90 font-semibold">Trust Policy:</span>{' '}
                  {validationResult.payload.meta.trustPolicy}
                </div>
              )}
            </div>
          )}

          {/* Success Apply Result */}
          {applyResult && (
            <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/60 rounded-lg space-y-1.5 text-xs text-emerald-200">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <CheckCircle2 size={16} /> Пакет успешно применен и синхронизирован с картой:
              </div>
              <ul className="list-disc list-inside text-[11px] font-mono space-y-0.5 text-emerald-300/80">
                <li>Обновлено существующих узлов: <strong>{applyResult.updatedNodeCount}</strong></li>
                <li>Создано новых узлов: <strong>{applyResult.createdNodeCount}</strong></li>
                <li>Прикреплено доказательств: <strong>{applyResult.proofsAttachedCount}</strong></li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-cyan-950 bg-cyan-950/30">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            Закрыть
          </button>
          <button
            onClick={handleApply}
            disabled={!validationResult?.valid || isApplying || !!applyResult}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold font-mono transition-all ${
              validationResult?.valid && !applyResult
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/50 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            {isApplying ? 'Слияние...' : 'Применить к карте'}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
