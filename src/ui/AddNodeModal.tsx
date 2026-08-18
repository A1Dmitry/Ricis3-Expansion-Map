import React, { useState } from 'react';
import { useMapStore } from '../store/mapStore';
import { ProblemNode } from '../model/types';
import { ActionButton } from './ActionButton';
import { isAutoFormulaRequest } from '../model/audit';
import { Sparkles, Bot, Share2, Check } from 'lucide-react';
import { UrlShareService } from '../services/UrlShareService';
import { useI18nStore } from '../store/useI18nStore';
import {
  AddNodePrefillData,
  AiAssistantNodeResponse,
} from '../domain/node/nodeDraft.types';

export type { AddNodePrefillData } from '../domain/node/nodeDraft.types';

export function AddNodeModal({ 
  onClose, 
  parentId, 
  initialData 
}: { 
  onClose: () => void; 
  parentId?: string; 
  initialData?: AddNodePrefillData;
}) {
  const { t } = useI18nStore();
  const map = useMapStore();
  
  const [title, setTitle] = useState(initialData?.title || '');
  const [targetFunction, setTargetFunction] = useState(initialData?.targetFunction || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [hint, setHint] = useState(initialData?.hint || '');
  const [link, setLink] = useState(initialData?.link || '');
  const [zoneId, setZoneId] = useState(initialData?.zoneId || (map.zones.length > 0 ? map.zones[0].id : 'math'));
  const [newZoneName, setNewZoneName] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdNodeId, setCreatedNodeId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleAI = async () => {
    if (!title && !targetFunction) {
      setErrorMsg("Введите хотя бы название или функцию для подсказки агенту!");
      return;
    }
    setErrorMsg('');
    setLoadingAI(true);
    try {
      const { postJson } = await import('../model/apiClient');
      const api = await postJson<AiAssistantNodeResponse>('/api/aiAssistantNode', {
        title,
        targetFunction,
        zoneId: zoneId === 'NEW_ZONE' ? 'math' : zoneId,
        hint,
      });
      if (!api.ok) {
        setErrorMsg(api.error);
      } else {
        const data = api.data;
        if (data.title && (!title || title.trim().length < 3)) setTitle(data.title);
        const resolvedFn = data.normalizedFunction || data.targetFunction;
        if (resolvedFn) setTargetFunction(resolvedFn);
        if (data.description && !description) setDescription(data.description);
        if (data.hint && !hint) setHint(data.hint);
        if (data.link && !link) setLink(data.link);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Ошибка при запросе к ИИ-агенту Gemini');
    }
    setLoadingAI(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setErrorMsg('');
    
    let resolvedTargetFn = targetFunction.trim();
    let finalDesc = description.trim();
    let finalHint = hint.trim();
    let finalLink = link.trim();

    if (!resolvedTargetFn || isAutoFormulaRequest(resolvedTargetFn)) {
      setLoadingAI(true);
      try {
        const { postJson } = await import('../model/apiClient');
        const api = await postJson<AiAssistantNodeResponse>('/api/aiAssistantNode', {
          title,
          targetFunction: resolvedTargetFn || 'найди формулу сам',
          zoneId: zoneId === 'NEW_ZONE' ? 'math' : zoneId,
          hint: finalHint,
        });

        if (api.ok && api.data) {
          const fnFromAi = api.data.normalizedFunction || api.data.targetFunction;
          if (fnFromAi && !isAutoFormulaRequest(fnFromAi)) {
            resolvedTargetFn = fnFromAi;
          }
          if (api.data.description && !finalDesc) {
            finalDesc = api.data.description;
          }
          if (api.data.hint && !finalHint) {
            finalHint = api.data.hint;
          }
          if (api.data.link && !finalLink) {
            finalLink = api.data.link;
          }
        }
      } catch (e) {
        console.error('Auto formula fetch failed:', e);
      } finally {
        setLoadingAI(false);
      }
    }

    if (!resolvedTargetFn || isAutoFormulaRequest(resolvedTargetFn)) {
      resolvedTargetFn = `\\lim_{x \\to x_0} \\frac{f(x)}{g(x)} = \\left[\\frac{0}{0}\\right] \\xrightarrow{\\text{RICIS-III}} \\frac{0_f}{0_g} = \\frac{f}{g} \\quad [O(1)]`;
    }

    const normalizedLink = finalLink
      ? (/^https?:\/\//i.test(finalLink)
          ? finalLink
          : 'https://' + finalLink.replace(/^\/+/, ''))
      : undefined;

    const newId = 'custom-node-' + Date.now();

    const node: ProblemNode = {
      id: newId,
      title,
      description: finalDesc + (normalizedLink ? `\nИсточник: ${normalizedLink}` : ''),
      targetFunction: resolvedTargetFn,
      state: 'unresolved',
      type: 'scientific_task',
      zoneIds: [zoneId === 'NEW_ZONE' ? 'custom' : zoneId],
      dependencyIds: parentId ? [parentId] : [],
      dependentIds: [],
      fractalDepth: 1,
      economic: {
        costUnresolved: 100000000,
        costToSolve: 10000000,
        marketGain: 500000000,
        riskLoss: 200000000
      },
      rewardClass: 'reputation',
      prizeNote: 'Manual addition',
      singularityHint: finalHint || 'Разрешено через аксиомы RICIS-III',
      sourceUrl: normalizedLink,
    };

    await map.addCustomNode(node, parentId, zoneId === 'NEW_ZONE' ? newZoneName : undefined);
    
    setCreatedNodeId(newId);
    
    // Обновляем URL для deep-linking
    UrlShareService.updateBrowserUrl({ nodeId: newId });

    onClose();
  };

  const handleShareCreated = async () => {
    if (createdNodeId) {
      await UrlShareService.copyShareUrlToClipboard({ nodeId: createdNodeId });
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#090c12] border border-cyan-900/60 rounded-xl max-w-lg w-full p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
              {t('modal.addTitle')}
            </h2>
            {initialData && (
              <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-[10px] text-cyan-300 font-mono font-bold">
                {t('modal.fromSandbox')}
              </span>
            )}
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800/80 rounded-lg text-red-300 text-xs font-mono">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              {t('modal.taskTitle')}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="например, Разрешение 0_3 * inf_4 или Задача Эйлера"
              className="w-full bg-[#050810] border border-cyan-900/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-sans"
            />
          </div>

          {/* Target Function / Formula */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>{t('modal.taskFormula')}</span>
              <span className="text-[10px] text-slate-500 font-normal">LaTeX / RICIS</span>
            </label>
            <textarea
              rows={2}
              value={targetFunction}
              onChange={(e) => setTargetFunction(e.target.value)}
              placeholder="например, 0_3 * inf_4 = 12 или \lim_{x \to 2} \frac{x^2 - 4}{x - 2}"
              className="w-full bg-[#050810] border border-cyan-900/40 rounded-lg px-3 py-2 text-xs font-mono text-cyan-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* AI Helper Button */}
          <div className="flex justify-end">
            <button
              type="button"
              disabled={loadingAI}
              onClick={handleAI}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-violet-950/80 hover:bg-violet-900 border border-violet-700/80 text-violet-200 text-xs font-semibold transition-all cursor-pointer shadow-sm disabled:opacity-50"
              title="Заполнить или дополнить карточку с помощью ИИ-агента Gemini"
            >
              {loadingAI ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-violet-300 border-t-transparent rounded-full animate-spin" />
                  <span>ИИ анализирует...</span>
                </>
              ) : (
                <>
                  <Bot size={14} className="text-violet-300" />
                  <span>🤖 ИИ-Агент: Дополнить поля</span>
                </>
              )}
            </button>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Описание и доказательство
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Формальное описание, аксиоматический путь или пошаговый вывод..."
              className="w-full bg-[#050810] border border-cyan-900/40 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-sans"
            />
          </div>

          {/* Singularity Hint */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Значение инварианта / Примененная аксиома
            </label>
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="например, Инвариант = 12 [O(1)], Аксиома A6 (Geometric Bridge)"
              className="w-full bg-[#050810] border border-cyan-900/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          {/* Zone Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Сфера науки / Область знаний
            </label>
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="w-full bg-[#050810] border border-cyan-900/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              {map.zones.map(z => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
              <option value="NEW_ZONE">+ Создать новую сферу науки...</option>
            </select>

            {zoneId === 'NEW_ZONE' && (
              <input
                type="text"
                required
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                placeholder="Название новой сферы..."
                className="w-full mt-2 bg-[#050810] border border-cyan-700/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            )}
          </div>

          {/* Source Link */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Ссылка на первоисточник / DOI (опционально)
            </label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="например, https://doi.org/10.5281/zenodo.17872755"
              className="w-full bg-[#050810] border border-cyan-900/40 rounded-lg px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              {t('modal.cancel')}
            </button>
            <ActionButton
              type="submit"
              variant="emerald"
              className="px-5 py-2 text-xs uppercase font-bold tracking-wider"
            >
              {t('modal.submit')}
            </ActionButton>
          </div>

        </form>

      </div>
    </div>
  );
}
