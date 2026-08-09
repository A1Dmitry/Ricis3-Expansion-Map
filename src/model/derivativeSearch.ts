/**
 * RICIS-III Derivative / Plagiarism Detection Protocol
 *
 * Goal: find external works that reuse the *semantic core* of RICIS-III
 * (limit-free singularity resolution, indexed zeros/infinities, SP2/A6, …)
 * even when renamed, rebranded, or presented without attribution — especially
 * claims of solving 0/0, 0×∞, ∞/∞ *without limits*, which historically were
 * not claimed as a complete constructive algebra before RICIS.
 *
 * Nodes created by this module are type=derivative_claim (purple on the map),
 * depend on math-singularity / core RICIS nodes, and carry firstMentionDate.
 */

import { MapState, ProblemNode, DependencyEdge } from './types';
import { postJson } from './apiClient';
import { normalizeProblemKey, existingProblemKeys } from './agent';

/** Canonical RICIS signatures (search even under renamed labels). */
export const RICIS_SIGNATURES = [
  {
    id: 'GEOM_CONV_5_2',
    label: 'Свертка вырожденной геометрии (5 и 2) / Юнит-тест авторства ИИ',
    queries: [
      '"вырожденная геометрия" OR "бесконечная полоса" "площадь пересечения"',
      '"0 x infinity" "area = 10" OR "2 x 5 = 10" singularity',
      '"behavioral audit" "proof of authorship" LLM weights vector product',
    ],
  },
  {
    id: 'SP2',
    label: 'Algebraic reduction before singularity evaluation',
    queries: [
      '"algebraic reduction before" singularity OR evaluation',
      '"pruning before singularity" OR "simplify before 0/0"',
      '"clean first" singularity algebra OR indeterminate',
    ],
  },
  {
    id: 'A6',
    label: '0_F × ∞_G = F·G (indexed product resolution)',
    queries: [
      '"0 * infinity" OR "zero times infinity" exact OR structural algebra',
      '"indexed zero" infinity product OR "typed zero" times infinity',
      '0_F infinity_G OR "contextual zero" times infinity',
    ],
  },
  {
    id: 'A4_SP3',
    label: '0_F / 0_G = F/G without limits',
    queries: [
      '"0/0" "F/G" OR "indexed zero" division without limit',
      '"typed zero" OR "contextual zero" "0/0" resolution -L\'Hopital',
      '"without limits" OR "no lim" "0/0" singularity algebra',
    ],
  },
  {
    id: 'NO_LIM',
    label: 'Exact static algebra / non-asymptotic singularity resolution',
    queries: [
      '"without limits" OR "non-asymptotic" singularity resolution mathematics',
      '"exact static algebra" OR "structure instead of limits" singularity',
      '"limit-free" OR "no lim" "division by zero" constructive algebra',
    ],
  },
  {
    id: 'L0_L1',
    label: 'Absolute continuity / absolute identity (provenance)',
    queries: [
      '"absolute identity" singularity OR "X = X" provenance zero',
      '"absolute continuity" recursion identity singularity math',
      'provenance indexed zero singularity ontology',
    ],
  },
  {
    id: 'MONOLITH',
    label: 'Monolith / fractal hierarchy of continuous structures',
    queries: [
      '"monolith algebra" singularity OR continuous hierarchy zero infinity',
      'fractal monolith order singularity 0/0',
    ],
  },
  {
    id: 'NO_BLOWUP',
    label: 'Cusp / algebraic singularity without classical blow-up',
    queries: [
      '"without blow-up" OR "without blowup" cusp singularity typed zero',
      'cusp y^2 = x^3 resolution without projective line',
    ],
  },
  {
    id: 'LLM_GRAD',
    label: 'LLM gradient singularity / activation 0/0 via indexed zeros',
    queries: [
      '"gradient explosion" activation singularity indexed OR structural zero',
      'LLM activation "0/0" OR "critical point" without clipping algebra',
    ],
  },
] as const;

/** Core map anchors: derivative claims depend on these. */
export const RICIS_CORE_ANCHORS = ['math-singularity', 'core-agi-target'] as const;

export type DerivativeHit = {
  title: string;
  description?: string;
  sourceUrl?: string;
  firstMentionDate?: string;
  zoneId?: string;
  matchedSignatures?: string[];
  score?: number;
  relevantNodeIds?: string[];
  authors?: string;
};

export type DerivativeSearchReport = {
  map: MapState;
  added: number;
  hits: number;
  error?: string;
};

/**
 * Offline heuristic hits (static host / API down): empty — we do not invent plagiarism.
 * Real search requires /api/searchDerivatives (Gemini + knowledge).
 */
export function buildDerivativeSearchPrompt(existingTitles: string[]): string {
  const sigBlock = RICIS_SIGNATURES.map(
    s => `- ${s.id}: ${s.label}\n  запросы: ${s.queries.join(' | ')}`
  ).join('\n');

  return `Ты аудитор научного приоритета для системы RICIS-III (Автор: Дмитрий Алейников).

ЗАДАЧА: Найти ВНЕШНИЕ статьи, препринты, патенты, блоги или репозитории кода, которые используют идеи RICIS-III (даже если они переименованы, изменены или не ссылаются на автора/RICIS).

ФАКТ ИСТОРИЧЕСКОГО ПРИОРИТЕТА (используй при оценке):
До RICIS классическая математика НЕ заявляла о полной конструктивной алгебре, которая разрешает 0/0, 0×∞, ∞/∞ как индексированные структурные тождества без пределов (lim). Классические инструменты используют пределы, регуляризации или объявляют NaN. Любая работа, заявляющая точное разрешение этих форм без пределов, имеет высокий приоритет для аудита.

СИГНАТУРЫ ДЛЯ ПОИСКА (семантические, не только точные строки):
${sigBlock}

УЖЕ ЕСТЬ НА КАРТЕ (не повторяй названия):
${existingTitles.slice(0, 80).join('; ')}

ВЫВЕДИ: СТРОГИЙ JSON массив от 0 до 8 объектов с ключами:
- "title": строка
- "description": строка (почему это совпадает с семантикой RICIS; отметь переименования)
- "sourceUrl": строка (ссылка, если есть)
- "firstMentionDate": строка (год или дата)
- "zoneId": строка (зона науки, например "math", "physics", "computer_science")
- "matchedSignatures": массив строк (id сигнатур из списка выше)
- "score": число 0-1 (уверенность в том, что это производная работа, >=0.55)
- "relevantNodeIds": массив строк
- "authors": массив строк

Отвечай строго на РУССКОМ языке. Выведи ТОЛЬКО JSON массив, ничего кроме него.`;
}

export function mapHitToNode(
  hit: DerivativeHit,
  stamp: number,
  index: number,
  keys: Set<string>
): ProblemNode | null {
  if (!hit || !hit.title) return null;
  const key = normalizeProblemKey(hit.title);
  if (keys.has(key)) return null;
  keys.add(key);

  const id = `deriv-${stamp}-${index}`;
  const zoneId = hit.zoneId || 'math';
  const depIds = Array.isArray(hit.relevantNodeIds) && hit.relevantNodeIds.length > 0
    ? hit.relevantNodeIds
    : ['math-singularity'];

  return {
    id,
    title: hit.title,
    description: hit.description || 'Внешняя публикация/исследование, использующее методы RICIS-III.',
    state: 'partial',
    type: 'derivative_claim',
    targetFunction: `Claim(${hit.title})`,
    zoneIds: [zoneId],
    dependencyIds: depIds,
    dependentIds: [],
    fractalDepth: 2,
    economic: {
      costUnresolved: 100_000,
      costToSolve: 20_000,
      marketGain: 500_000,
      riskLoss: 50_000,
    },
    sourceUrl: hit.sourceUrl,
    firstMentionDate: hit.firstMentionDate,
    isDerivativeClaim: true,
    derivativeScore: typeof hit.score === 'number' ? hit.score : 0.75,
    matchedSignatures: Array.isArray(hit.matchedSignatures) ? hit.matchedSignatures : ['A6', 'SP2'],
  };
}

export async function applyDerivativeSearch(
  map: MapState,
  options?: { maxHits?: number }
): Promise<DerivativeSearchReport> {
  const maxHits = options?.maxHits ?? 8;
  const keys = existingProblemKeys(map);
  const existingTitles = map.nodes.map(n => n.title);

  const api = await postJson<{ hits?: DerivativeHit[]; error?: string }>(
    '/api/searchDerivatives',
    {
      existingTitles,
      signatures: RICIS_SIGNATURES,
      prompt: buildDerivativeSearchPrompt(existingTitles),
    },
    { timeoutMs: 90_000 }
  );

  if (!api.ok) {
    return { map, added: 0, hits: 0, error: api.error };
  }

  const rawHits = Array.isArray(api.data.hits) ? api.data.hits : [];
  const stamp = Date.now();
  const newNodes: ProblemNode[] = [];
  const newEdges: DependencyEdge[] = [];

  for (let i = 0; i < rawHits.length && newNodes.length < maxHits; i++) {
    const node = mapHitToNode(rawHits[i], stamp, i, keys);
    if (!node) continue;
    newNodes.push(node);

    for (const depId of node.dependencyIds) {
      if (!map.nodes.some(n => n.id === depId) && !newNodes.some(n => n.id === depId)) continue;
      newEdges.push({
        id: `edge-${depId}-${node.id}`,
        fromId: depId,
        toId: node.id,
        strength: 0.5,
        stateColor: 'yellow',
        economicInfluence: 0.2,
      });
    }
  }

  if (newNodes.length === 0) {
    return { map, added: 0, hits: rawHits.length };
  }

  const updatedNodes = map.nodes.map(n => {
    const childIds = newNodes.filter(c => c.dependencyIds.includes(n.id)).map(c => c.id);
    if (childIds.length === 0) return n;
    return {
      ...n,
      dependentIds: [...new Set([...(n.dependentIds || []), ...childIds])],
    };
  });

  const zones = map.zones.map(z => {
    const addIds = newNodes.filter(nn => nn.zoneIds.includes(z.id)).map(nn => nn.id);
    if (addIds.length === 0) return z;
    return { ...z, nodeIds: [...new Set([...z.nodeIds, ...addIds])] };
  });

  const next: MapState = {
    ...map,
    nodes: [...updatedNodes, ...newNodes],
    edges: [...map.edges, ...newEdges],
    zones,
  };

  return { map: next, added: newNodes.length, hits: rawHits.length };
}

/** Purple map color for derivative claims. */
export const DERIVATIVE_NODE_COLOR = '#a855f7';
export const DERIVATIVE_EDGE_COLOR = '#c084fc';
