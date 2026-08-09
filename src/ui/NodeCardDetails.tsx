import React from 'react';
import type { ProblemNode } from '../model/types';

/** Normalize URL: add https:// if scheme is missing (www. or domain-like). */
function normalizeUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  if (/^https?:\/\//i.test(t)) return t;
  if (/^(www\.|[a-z0-9-]+\.[a-z]{2,})/i.test(t)) return 'https://' + t;
  return t;
}

/** Render free text with clickable http(s) / www links. */
export function renderTextWithLinks(text: string) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (/^(https?:\/\/|www\.)/i.test(part)) {
      const cleaned = part.replace(/[)\],.;:!?]+$/g, '');
      const trailing = part.slice(cleaned.length);
      const href = normalizeUrl(cleaned);
      return (
        <span key={i}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 hover:underline break-all"
            onClick={e => e.stopPropagation()}
          >
            {cleaned}
          </a>
          {trailing}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function extractSourceUrl(text?: string): string | null {
  if (!text) return null;
  const m = text.match(/https?:\/\/[^\s<>"']+|www\.[^\s<>"']+/i);
  if (!m) return null;
  return m[0].replace(/[)\],.;:!?]+$/g, '');
}

function formatCurrency(val?: number) {
  if (val === undefined || val === null) return '';
  if (val >= 1e9) return '$' + (val / 1e9).toFixed(1) + 'B';
  if (val >= 1e6) return '$' + (val / 1e6).toFixed(1) + 'M';
  return '$' + val.toLocaleString();
}

const TYPE_LABELS: Record<string, string> = {
  core_singularity: 'Ядро / сингулярность',
  derived_problem: 'Производная задача',
  scientific_task: 'Научная задача',
  derivative_claim: 'Производная / аудит приоритета',
};

type Props = {
  node: ProblemNode;
  isExpanded: boolean;
};

export function getReferencesForNode(node: ProblemNode) {
  const cleanTitle = node.title
    .replace(/\(RICIS.*?\)/gi, '')
    .replace(/\(Деление.*?\)/gi, '')
    .trim();

  const fromFields =
    node.sourceUrl ||
    extractSourceUrl(node.description) ||
    extractSourceUrl(node.singularityHint) ||
    null;

  const directUrl = fromFields ? normalizeUrl(fromFields) : null;

  // Wikipedia search link
  const wikiUrl = `https://ru.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(cleanTitle)}`;

  // Academic article / Scholar link
  const articleUrl = directUrl
    ? directUrl
    : `https://scholar.google.com/scholar?q=${encodeURIComponent(cleanTitle)}`;

  // DOI link selection based on topic/node
  let doiUrl = 'https://doi.org/10.5281/zenodo.17872755';
  let doiLabel = '10.5281/zenodo.17872755 (RICIS-III Core)';

  const tLower = (node.title + ' ' + node.id + ' ' + (node.description || '')).toLowerCase();
  if (tLower.includes('войнич') || tLower.includes('voynich')) {
    doiUrl = 'https://doi.org/10.5281/zenodo.18116204';
    doiLabel = '10.5281/zenodo.18116204 (Voynich MS)';
  } else if (tLower.includes('gradient') || tLower.includes('градиент') || tLower.includes('llm') || tLower.includes('обучение')) {
    doiUrl = 'https://doi.org/10.5281/zenodo.21309650';
    doiLabel = '10.5281/zenodo.21309650 (LLM Gradient / Deep Learning)';
  } else if (tLower.includes('p vs np') || tLower.includes('mersenne') || tLower.includes('факторизац') || tLower.includes('rsa') || tLower.includes('коммивояж') || tLower.includes('изоморфизм') || tLower.includes('сетев')) {
    doiUrl = 'https://doi.org/10.5281/zenodo.21827360';
    doiLabel = '10.5281/zenodo.21827360 (Mersenne Networks & NP)';
  } else if (tLower.includes('lean') || tLower.includes('доказательств') || tLower.includes('верификац')) {
    doiUrl = 'https://doi.org/10.5281/zenodo.21836220';
    doiLabel = '10.5281/zenodo.21836220 (Lean 4 Specs)';
  }

  return {
    directUrl,
    directDisplay: fromFields,
    wikiUrl,
    doiUrl,
    doiLabel,
    articleUrl,
    cleanTitle,
  };
}

/**
 * Expanded node card body:
 * description (with links), targetFunction, singularityHint,
 * dedicated source link, meta grid, economics.
 */
export const NodeCardDetails: React.FC<Props> = ({ node, isExpanded }) => {
  const refs = getReferencesForNode(node);

  return (
    <div className={`space-y-3 ${isExpanded ? 'text-[12px]' : 'text-[11px]'}`}>
      <div>
        <p className="text-[9px] font-bold uppercase text-gray-500 tracking-wider mb-1">Описание</p>
        <p
          className={`text-gray-300 leading-relaxed whitespace-pre-wrap ${
            !isExpanded ? 'line-clamp-5' : ''
          }`}
        >
          {renderTextWithLinks(node.description || '—')}
        </p>
      </div>

      <div>
        <p className="text-[9px] font-bold uppercase text-gray-500 tracking-wider mb-1">Целевая функция</p>
        <code
          className={`block font-mono text-cyan-200 bg-black/80 p-2.5 rounded border border-gray-800 break-all whitespace-pre-wrap ${
            isExpanded ? 'text-[11px]' : 'text-[10px]'
          }`}
        >
          {node.targetFunction || '—'}
        </code>
      </div>

      {node.singularityHint && (
        <div className="p-2.5 bg-purple-950/25 border border-purple-900/50 rounded-md">
          <p className="text-[9px] font-bold uppercase text-purple-400/90 tracking-wider mb-1">
            Подсказка о сингулярности
          </p>
          <p className="text-purple-100/85 leading-relaxed whitespace-pre-wrap">
            {renderTextWithLinks(node.singularityHint)}
          </p>
        </div>
      )}

      {(node.id === 'ai-authorship-provenance' || node.title.toLowerCase().includes('авторств')) && (
        <div className="p-3 bg-cyan-950/40 border border-cyan-500/60 rounded-md space-y-2.5 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <div className="flex items-center justify-between border-b border-cyan-800/50 pb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              🛡️ Юнит-тест доказательства авторства ИИ
            </span>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-cyan-900/80 text-cyan-200 border border-cyan-700/60">
              RICIS-III Provenance
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 bg-red-950/40 border border-red-900/50 rounded">
              <span className="block text-[8px] font-bold uppercase text-red-400 mb-0.5">Классический ИИ (Сбой)</span>
              <p className="font-mono text-red-200/90 text-[9px] leading-tight">
                X: 2 × 0 = 0<br />
                Y: ∞ × 5 = ∞<br />
                <strong>Area = 0 × ∞ = NaN</strong>
              </p>
            </div>
            <div className="p-2 bg-emerald-950/40 border border-emerald-800/60 rounded">
              <span className="block text-[8px] font-bold uppercase text-emerald-400 mb-0.5">RICIS-III (Инвариант)</span>
              <p className="font-mono text-emerald-200 text-[9px] leading-tight">
                S_vec = (2, ∞)ᵀ, R_vec = (0, 5)ᵀ<br />
                ||S_x · R_y|| = 2 × 5<br />
                <strong>Area = 10 [O(1)]</strong>
              </p>
            </div>
          </div>

          <div className="bg-black/40 p-2 rounded border border-cyan-900/40 text-[9px] text-cyan-200/90 space-y-1">
            <p className="font-bold text-cyan-300">Пошаговая доказательная база:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-gray-300">
              <li><strong>Digital Provenance:</strong> Публикация препринтов с временными метками (DOI Zenodo/Figshare).</li>
              <li><strong>Сессионные логи:</strong> Экспорт JSON-логов ИИ-студий до коммерческих релизов.</li>
              <li><strong>Метод абляции:</strong> Блокировка внимания ИИ заставляет модель откатиться к NaN, доказывая явное заимствование.</li>
            </ol>
          </div>
        </div>
      )}

      {/* Ссылки и научные первоисточники (Статья, Википедия, DOI) */}
      <div className="p-2.5 bg-neutral-900/90 border border-cyan-800/60 rounded-md space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-bold uppercase text-cyan-400 tracking-wider">
            Ссылки и первоисточники
          </p>
          {node.state === 'resolved' && (
            <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              Решено (Resolved)
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5 text-[11px]">
          {/* 1. Статья / Публикация */}
          <a
            href={refs.articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-cyan-300 hover:text-cyan-100 hover:underline break-all font-medium transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <span className="text-cyan-400 font-bold shrink-0">📄 Статья:</span>
            <span className="truncate max-w-[240px] text-[10px]">
              {refs.directUrl ? refs.directDisplay : `Google Scholar: ${refs.cleanTitle}`}
            </span>
            <span className="text-xs text-cyan-500 shrink-0">↗</span>
          </a>

          {/* 2. Википедия */}
          <a
            href={refs.wikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sky-300 hover:text-sky-100 hover:underline break-all font-medium transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <span className="text-sky-400 font-bold shrink-0">🌐 Википедия:</span>
            <span className="truncate max-w-[240px] text-[10px]">
              Поиск: {refs.cleanTitle}
            </span>
            <span className="text-xs text-sky-500 shrink-0">↗</span>
          </a>

          {/* 3. DOI */}
          <a
            href={refs.doiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-purple-300 hover:text-purple-100 hover:underline break-all font-medium transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <span className="text-purple-400 font-bold shrink-0">📑 DOI:</span>
            <span className="font-mono text-[10px] text-purple-200 truncate max-w-[240px]">
              {refs.doiLabel}
            </span>
            <span className="text-xs text-purple-500 shrink-0">↗</span>
          </a>
        </div>
      </div>

      {(node.type === 'derivative_claim' || node.isDerivativeClaim) && (
        <div className="p-2.5 bg-violet-950/40 border border-violet-700/60 rounded-md space-y-1.5">
          <p className="text-[9px] font-bold uppercase text-violet-300 tracking-wider">
            Аудит приоритета (производная семантика RICIS)
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
            <div>
              <span className="text-gray-500 block uppercase text-[8px]">Первое упоминание</span>
              <span className="text-violet-100">{node.firstMentionDate || '—'}</span>
            </div>
            <div>
              <span className="text-gray-500 block uppercase text-[8px]">Сходство</span>
              <span className="text-violet-100">
                {typeof node.derivativeScore === 'number'
                  ? (node.derivativeScore * 100).toFixed(0) + '%'
                  : '—'}
              </span>
            </div>
          </div>
          {node.matchedSignatures && node.matchedSignatures.length > 0 && (
            <p className="text-[10px] text-violet-200/90">
              Сигнатуры: {node.matchedSignatures.join(', ')}
            </p>
          )}
          {node.dependencyIds && node.dependencyIds.length > 0 && (
            <p className="text-[10px] text-violet-200/80">
              Связь с RICIS-узлами: {node.dependencyIds.join(', ')}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded border border-neutral-800 bg-neutral-950/60">
          <p className="text-[9px] text-gray-500 uppercase font-bold mb-0.5">Тип</p>
          <p className="text-gray-200 font-mono text-[10px]">
            {TYPE_LABELS[node.type] || node.type || '—'}
          </p>
        </div>
        <div className="p-2 rounded border border-neutral-800 bg-neutral-950/60">
          <p className="text-[9px] text-gray-500 uppercase font-bold mb-0.5">Глубина</p>
          <p className="text-gray-200 font-mono text-[10px]">{node.fractalDepth ?? '—'}</p>
        </div>
        <div className="p-2 rounded border border-neutral-800 bg-neutral-950/60">
          <p className="text-[9px] text-gray-500 uppercase font-bold mb-0.5">Класс награды</p>
          <p className="text-gray-200 font-mono text-[10px]">{node.rewardClass || '—'}</p>
        </div>
        <div className="p-2 rounded border border-neutral-800 bg-neutral-950/60">
          <p className="text-[9px] text-gray-500 uppercase font-bold mb-0.5">Примечание</p>
          <p className="text-gray-200 leading-snug text-[10px]">{node.prizeNote || '—'}</p>
        </div>
      </div>

      {node.economic && (() => {
        const netProfit = Math.max(0, (node.economic.marketGain || 0) - (node.economic.costToSolve || 0));
        return (
          <div className="p-2.5 rounded border border-emerald-900/45 bg-emerald-950/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-bold uppercase text-emerald-500/90 tracking-wider">
                Экономика и Прибыльность
              </p>
              <span className="text-[9px] text-emerald-400/80 font-mono">
                Лог-масштаб шара
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">Оценка рынка</span>
                <span className="text-emerald-300">{formatCurrency(node.economic.marketGain) || '—'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">Затраты на решение</span>
                <span className="text-amber-200/90">{formatCurrency(node.economic.costToSolve) || '—'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">Убыток нерешения</span>
                <span className="text-red-300/90">{formatCurrency(node.economic.costUnresolved) || '—'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">Риск-потери</span>
                <span className="text-orange-300/90">{formatCurrency(node.economic.riskLoss) || '—'}</span>
              </div>
              <div className="col-span-2 pt-1.5 mt-1 border-t border-emerald-900/40 flex justify-between items-center text-[11px]">
                <span className="text-emerald-400 font-semibold">Прибыльность решения (Net Profit):</span>
                <span className="text-emerald-300 font-bold font-mono">{formatCurrency(netProfit)}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {node.ricisSolvable && (
        <div className="text-[10px] text-cyan-400/90 border border-cyan-800/40 bg-cyan-950/20 rounded px-2 py-1.5">
          Решаема протоколом RICIS-III
        </div>
      )}
    </div>
  );
};
