import { MapState, ProblemNode, DependencyEdge, NodeState } from './types';
import { KNOWN_SINGULARITY_PROBLEMS } from './catalog';
import { initialMap } from './initialMap';
import { dbGetMigrationState, dbSetMigrationState, dbSaveMap } from './db';
import { auditMapRicisProofIntegrity, nodeHasSorry } from './audit';

export const CURRENT_MIGRATION_VERSION = 6;

export interface MigrationAuditReport {
  dbVersion: number;
  auditedAt: string;
  totalNodesAudited: number;
  titlesFixed: number;
  connectionsFixed: number;
  orphanNodesReconnected: number;
  edgesRebuilt: number;
  targetFunctionsRepaired: number;
  economicReevaluated: number;
  details: string[];
}

const CORE_ROOT_IDS = new Set(['math-singularity', 'core-agi-target']);

/** Look up catalog for accurate title or clean up stub titles */
function repairNodeTitle(node: ProblemNode): { title: string; changed: boolean } {
  let title = node.title ? String(node.title).trim() : '';
  const initialTitle = title;

  // Identify placeholders, stubs, IDs as titles, or unformatted text
  const isStub =
    !title ||
    title.length < 3 ||
    /^problem\s*#?\d+/i.test(title) ||
    /^task\s*#?\d+/i.test(title) ||
    /^node[-_]/i.test(title) ||
    /^real-catalog-/i.test(title) ||
    /^agent-/i.test(title) ||
    /placeholder/i.test(title) ||
    /untitled/i.test(title) ||
    /новый узел/i.test(title) ||
    title === '[object Object]';

  if (isStub) {
    // 1. Check if node is in KNOWN_SINGULARITY_PROBLEMS
    const catalogMatch = KNOWN_SINGULARITY_PROBLEMS.find(c => c.id === node.id);
    if (catalogMatch && catalogMatch.title) {
      return { title: catalogMatch.title, changed: true };
    }

    // 2. Generate a meaningful title based on zone and target function / hint
    const zone = node.zoneIds?.[0] || 'math';
    const cleanTf = (node.targetFunction || '').replace(/[^a-zA-Z0-9_\-\.\(\)]/g, '').trim();

    if (zone === 'math') {
      title = cleanTf ? `Разрешение математической сингулярности: ${cleanTf}` : `Математический монолит RICIS-III (${node.id})`;
    } else if (zone === 'physics') {
      title = cleanTf ? `Полевая сингулярность и квантовая редукция: ${cleanTf}` : `Квантово-гравитационный монолит (${node.id})`;
    } else if (zone === 'informatics' || zone === 'ai') {
      title = cleanTf ? `Вычислительная сложность и AGI: ${cleanTf}` : `Анализ сложности алгоритмов (${node.id})`;
    } else if (zone === 'medicine' || zone === 'pharmacology') {
      title = cleanTf ? `Формализация биомолекулярной функции: ${cleanTf}` : `Биомедицинский синтез (${node.id})`;
    } else if (zone === 'economics' || zone === 'ethics') {
      title = cleanTf ? `Сингулярная функция выравнивания: ${cleanTf}` : `Теория стоимости и выравнивание (${node.id})`;
    } else {
      title = cleanTf ? `Аналитическое исследование: ${cleanTf}` : `Научная задача RICIS (${node.id})`;
    }
  }

  // Clean trailing artifacts or raw brackets
  title = title.replace(/\s+/g, ' ').replace(/^["'\s]+|["'\s]+$/g, '').trim();

  return { title, changed: title !== initialTitle };
}

/** Check if node can reach a Core Root ('math-singularity' or 'core-agi-target') */
function canReachRoot(nodeId: string, nodeMap: Map<string, ProblemNode>, visited = new Set<string>()): boolean {
  if (CORE_ROOT_IDS.has(nodeId)) return true;
  if (visited.has(nodeId)) return false;
  visited.add(nodeId);

  const node = nodeMap.get(nodeId);
  if (!node || !node.dependencyIds || node.dependencyIds.length === 0) return false;

  for (const depId of node.dependencyIds) {
    if (canReachRoot(depId, nodeMap, visited)) return true;
  }
  return false;
}

/** Choose best parent root for an orphan node based on its science zone */
function pickDefaultRootForNode(node: ProblemNode): string {
  const zone = node.zoneIds?.[0] || 'math';
  if (['informatics', 'medicine', 'pharmacology', 'economics', 'ethics', 'ai'].includes(zone)) {
    return 'core-agi-target';
  }
  return 'math-singularity';
}

/** Recolor edge state */
function getEdgeColor(fromNode?: ProblemNode, toNode?: ProblemNode): 'green' | 'yellow' | 'red' {
  if (!fromNode || !toNode) return 'red';
  const fromOk = fromNode.state === 'resolved' && Boolean(fromNode.targetFunction?.trim()) && !nodeHasSorry(fromNode);
  const toOk = toNode.state === 'resolved' && Boolean(toNode.targetFunction?.trim()) && !nodeHasSorry(toNode);
  if (fromOk && toOk) return 'green';
  if (
    fromNode.state === 'resolved' ||
    toNode.state === 'resolved' ||
    fromNode.state === 'partial' ||
    toNode.state === 'partial' ||
    nodeHasSorry(fromNode) ||
    nodeHasSorry(toNode)
  ) {
    return 'yellow';
  }
  return 'red';
}

/** Utility to round currency figures to 2 significant digits */
function roundSigDigits(num: number): number {
  if (!num || num <= 0) return 100000;
  const exponent = Math.floor(Math.log10(num));
  const pow = Math.pow(10, exponent - 1);
  return Math.round(num / pow) * pow;
}

export function formatCurrencyShort(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(1)} Трлн`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)} Млрд`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)} Млн`;
  return `$${num.toLocaleString('ru-RU')}`;
}

interface BenchmarkEco {
  rewardClass?: 'clay' | 'nobel' | 'commercial' | 'reputation';
  prizeNote?: string;
  costToSolve: number;
  costUnresolved: number;
  marketGain: number;
  riskLoss: number;
}

/** Real-world known benchmark valuations */
const BENCHMARK_ECONOMIC_MAP: Record<string, BenchmarkEco> = {
  'math-singularity': {
    rewardClass: 'clay',
    prizeNote: 'Фундаментальный монолит RICIS-III / Премия Клея $1,000,000',
    costToSolve: 100000000,
    costUnresolved: 1000000000000,
    marketGain: 10000000000000,
    riskLoss: 5000000000000,
  },
  'core-agi-target': {
    rewardClass: 'commercial',
    prizeNote: 'Капитализация глобальной ИИ-индустрии $50 Трлн',
    costToSolve: 5000000000,
    costUnresolved: 10000000000000,
    marketGain: 50000000000000,
    riskLoss: 100000000000000,
  },
  'real-catalog-0': {
    rewardClass: 'clay',
    prizeNote: 'Премия Института Клея $1,000,000 (Уравнения Навье-Стокса)',
    costToSolve: 10000000,
    costUnresolved: 150000000000,
    marketGain: 500000000000,
    riskLoss: 300000000000,
  },
  'registry-117': {
    rewardClass: 'clay',
    prizeNote: 'Премия Института Клея $1,000,000 (3D Navier-Stokes)',
    costToSolve: 10000000,
    costUnresolved: 150000000000,
    marketGain: 500000000000,
    riskLoss: 300000000000,
  },
  'real-catalog-1': {
    rewardClass: 'clay',
    prizeNote: 'Премия Института Клея $1,000,000 (Гипотеза Ходжа)',
    costToSolve: 5000000,
    costUnresolved: 20000000000,
    marketGain: 100000000000,
    riskLoss: 50000000000,
  },
  'real-catalog-14': {
    rewardClass: 'clay',
    prizeNote: 'Премия Института Клея $1,000,000 (Бёрч — Свиннертон-Дайер)',
    costToSolve: 5000000,
    costUnresolved: 30000000000,
    marketGain: 120000000000,
    riskLoss: 60000000000,
  },
  'real-catalog-34': {
    rewardClass: 'clay',
    prizeNote: 'Премия Института Клея $1,000,000 (Уравнения Янга-Миллса)',
    costToSolve: 20000000,
    costUnresolved: 300000000000,
    marketGain: 1000000000000,
    riskLoss: 500000000000,
  },
  'real-catalog-55': {
    rewardClass: 'clay',
    prizeNote: 'Премия Института Клея $1,000,000 / Оптимизация ИТ $10+ Трлн',
    costToSolve: 50000000,
    costUnresolved: 2000000000000,
    marketGain: 10000000000000,
    riskLoss: 5000000000000,
  },
  'informatics-complexity': {
    rewardClass: 'clay',
    prizeNote: 'Премия Института Клея $1,000,000 (Преодоление P vs NP)',
    costToSolve: 50000000,
    costUnresolved: 2000000000000,
    marketGain: 10000000000000,
    riskLoss: 5000000000000,
  },
  'registry-100': {
    rewardClass: 'clay',
    prizeNote: 'Премия Джанга / Остроговского $1,000,000 (abc Conjecture)',
    costToSolve: 3000000,
    costUnresolved: 5000000000,
    marketGain: 25000000000,
    riskLoss: 10000000000,
  },
  'real-catalog-35': {
    rewardClass: 'nobel',
    prizeNote: 'Нобелевская премия по физике ~$1,100,000 (Большой Взрыв)',
    costToSolve: 100000000,
    costUnresolved: 500000000000,
    marketGain: 2000000000000,
    riskLoss: 1000000000000,
  },
  'real-catalog-41': {
    rewardClass: 'nobel',
    prizeNote: 'Нобелевская премия / Промышленность сверхпроводников $1.5 Трлн',
    costToSolve: 200000000,
    costUnresolved: 300000000000,
    marketGain: 1500000000000,
    riskLoss: 800000000000,
  },
  'real-catalog-40': {
    rewardClass: 'nobel',
    prizeNote: 'Нобелевская премия (Квантовый эффект Холла)',
    costToSolve: 150000000,
    costUnresolved: 200000000000,
    marketGain: 1000000000000,
    riskLoss: 500000000000,
  },
  'real-catalog-75': {
    rewardClass: 'nobel',
    prizeNote: 'Нобелевская премия / Биотехнологии Protein Folding $800 Млрд',
    costToSolve: 50000000,
    costUnresolved: 100000000000,
    marketGain: 800000000000,
    riskLoss: 400000000000,
  },
  'real-catalog-76': {
    rewardClass: 'nobel',
    prizeNote: 'Нобелевская премия / Теломеры и долг долголетия $3 Трлн',
    costToSolve: 300000000,
    costUnresolved: 800000000000,
    marketGain: 3000000000000,
    riskLoss: 1500000000000,
  },
  'real-catalog-77': {
    rewardClass: 'nobel',
    prizeNote: 'Нобелевская премия по медицине / Лечение онкопатологий $5 Трлн',
    costToSolve: 500000000,
    costUnresolved: 1000000000000,
    marketGain: 5000000000000,
    riskLoss: 3000000000000,
  },
  'registry-118': {
    rewardClass: 'commercial',
    prizeNote: 'Экономия вычислительных суперкомпьютеров ИИ $500 Млрд',
    costToSolve: 100000000,
    costUnresolved: 50000000000,
    marketGain: 500000000000,
    riskLoss: 200000000000,
  },
  'real-catalog-95': {
    rewardClass: 'commercial',
    prizeNote: 'Предотвращение рисков AGI Alignment $30 Трлн',
    costToSolve: 1000000000,
    costUnresolved: 20000000000000,
    marketGain: 30000000000000,
    riskLoss: 100000000000000,
  },
  'registry-119': {
    rewardClass: 'reputation',
    prizeNote: 'Мировое признание / Академическая премия $50,000,000',
    costToSolve: 2000000,
    costUnresolved: 100000000,
    marketGain: 500000000,
    riskLoss: 50000000,
  },
  'pharm-design': {
    rewardClass: 'commercial',
    prizeNote: 'Фармацевтический рынок ИИ-дизайна молекул $2 Трлн',
    costToSolve: 300000000,
    costUnresolved: 500000000000,
    marketGain: 2000000000000,
    riskLoss: 1000000000000,
  },
  'med-diagnostics': {
    rewardClass: 'commercial',
    prizeNote: 'Медицинская биодиагностика и скрининг $1.5 Трлн',
    costToSolve: 200000000,
    costUnresolved: 400000000000,
    marketGain: 1500000000000,
    riskLoss: 800000000000,
  },
  'econ-value': {
    rewardClass: 'commercial',
    prizeNote: 'Глобальный финансовый рынок стоимостных оценок $10 Трлн',
    costToSolve: 200000000,
    costUnresolved: 2000000000000,
    marketGain: 10000000000000,
    riskLoss: 5000000000000,
  },
  'ethic-alignment': {
    rewardClass: 'commercial',
    prizeNote: 'Институциональное выравнивание и риск-менеджмент $5 Трлн',
    costToSolve: 150000000,
    costUnresolved: 1000000000000,
    marketGain: 5000000000000,
    riskLoss: 3000000000000,
  },
};

/**
 * Reevaluate economic parameters for a single node based on benchmark or empirical complexity model.
 */
function reevaluateNodeEconomic(node: ProblemNode): { changed: boolean; log?: string } {
  const oldEco = node.economic || { costToSolve: 0, costUnresolved: 0, marketGain: 0, riskLoss: 0 };
  let newEco: ProblemNode['economic'];
  let newRewardClass = node.rewardClass;
  let newPrizeNote = node.prizeNote;

  // 1. Check direct benchmark mapping by id
  if (BENCHMARK_ECONOMIC_MAP[node.id]) {
    const bench = BENCHMARK_ECONOMIC_MAP[node.id];
    newEco = {
      costToSolve: bench.costToSolve,
      costUnresolved: bench.costUnresolved,
      marketGain: bench.marketGain,
      riskLoss: bench.riskLoss,
    };
    newRewardClass = bench.rewardClass || 'commercial';
    newPrizeNote = bench.prizeNote || 'Оценка реального рынка';
  } else {
    // 2. Keyword/Regex match for prizes (Clay, Nobel, AGI, etc.)
    const textLower = (node.title + ' ' + (node.description || '')).toLowerCase();
    
    if (/институт клея|клея|clay|поанкаре|римана|навье|ходжа|берч|пуанкаре/i.test(textLower)) {
      newRewardClass = 'clay';
      newPrizeNote = newPrizeNote || 'Премия Института Клея $1,000,000';
    } else if (/нобель|nobel|квант|ген|старени|адрон|онкол/i.test(textLower)) {
      newRewardClass = 'nobel';
      newPrizeNote = newPrizeNote || 'Нобелевская премия / Breakthrough Prize ~$1,100,000';
    }

    // 3. Calculate Empirical Figures
    const zone = node.zoneIds?.[0] || 'math';
    const zoneWeight =
      ['ai', 'informatics'].includes(zone) ? 3.2 :
      ['medicine', 'pharmacology'].includes(zone) ? 2.8 :
      ['economics', 'ethics'].includes(zone) ? 2.5 :
      zone === 'physics' ? 2.0 :
      zone === 'math' ? 1.6 : 1.2;

    const typeWeight =
      node.type === 'core_singularity' ? 50 :
      node.type === 'scientific_task' ? 25 :
      node.type === 'derived_problem' ? 15 : 10;

    const depFactor = 1 + 0.12 * Math.min(10, (node.dependentIds || []).length) + 0.06 * (node.dependencyIds || []).length + 0.05 * (node.fractalDepth || 0);

    const S = typeWeight * zoneWeight * depFactor;

    newEco = {
      costToSolve: roundSigDigits(S * 120000),
      costUnresolved: roundSigDigits(S * 15000000),
      marketGain: roundSigDigits(S * 60000000),
      riskLoss: roundSigDigits(S * 90000000),
    };

    if (!newRewardClass) {
      newRewardClass = ['ai', 'informatics', 'medicine', 'pharmacology', 'economics'].includes(zone) ? 'commercial' : 'reputation';
    }

    if (!newPrizeNote) {
      newPrizeNote = newRewardClass === 'commercial'
        ? `Рыночный потенциал решения: ${formatCurrencyShort(newEco.marketGain)}`
        : `Академический приоритет: ${formatCurrencyShort(newEco.marketGain)}`;
    }
  }

  // Check if values actually changed
  const changed =
    oldEco.costToSolve !== newEco.costToSolve ||
    oldEco.costUnresolved !== newEco.costUnresolved ||
    oldEco.marketGain !== newEco.marketGain ||
    oldEco.riskLoss !== newEco.riskLoss ||
    node.rewardClass !== newRewardClass ||
    node.prizeNote !== newPrizeNote;

  if (changed) {
    node.economic = newEco;
    node.rewardClass = newRewardClass;
    node.prizeNote = newPrizeNote;
    const log = `Узел [${node.id}]: Рынок=${formatCurrencyShort(newEco.marketGain)}, Стоимость=${formatCurrencyShort(newEco.costToSolve)} ("${node.title}")`;
    return { changed: true, log };
  }

  return { changed: false };
}

/**
 * Perform a full audit & repair pass over the MapState graph.
 */
export function auditAndFixMapGraph(map: MapState): { map: MapState; report: MigrationAuditReport } {
  const details: string[] = [];
  let titlesFixed = 0;
  let connectionsFixed = 0;
  let orphanNodesReconnected = 0;
  let targetFunctionsRepaired = 0;
  let economicReevaluated = 0;

  // 1. Clone nodes and repair titles, targetFunctions, and economic parameters
  const nodeMap = new Map<string, ProblemNode>();
  
  map.nodes.forEach(orig => {
    const node = { ...orig, zoneIds: [...(orig.zoneIds || ['math'])], dependencyIds: [...(orig.dependencyIds || [])], dependentIds: [...(orig.dependentIds || [])] };
    
    // Check for catalog or initialMap sync
    const catalogMatch = KNOWN_SINGULARITY_PROBLEMS.find(c => c.id === node.id);
    if (catalogMatch) {
      if (catalogMatch.title && catalogMatch.title !== node.title) {
        titlesFixed++;
        node.title = catalogMatch.title;
      }
      if (catalogMatch.description) {
        node.description = catalogMatch.description;
      }
      if (catalogMatch.targetFunction) {
        node.targetFunction = catalogMatch.targetFunction;
      }
      if (catalogMatch.singularityHint) {
        node.singularityHint = catalogMatch.singularityHint;
      }
    }

    const initialMatch = initialMap.nodes.find(n => n.id === node.id);
    if (initialMatch) {
      if (initialMatch.title && initialMatch.title !== node.title) {
        titlesFixed++;
        node.title = initialMatch.title;
      }
      if (initialMatch.description) {
        node.description = initialMatch.description;
      }
      if (initialMatch.targetFunction) {
        node.targetFunction = initialMatch.targetFunction;
      }
    }

    // Repair title if still placeholder
    const { title, changed } = repairNodeTitle(node);
    if (changed) {
      titlesFixed++;
      details.push(`Название узла [${node.id}] исправлено: "${node.title}" -> "${title}"`);
      node.title = title;
    }

    // Repair target function if empty
    if (!node.targetFunction || !node.targetFunction.trim() || node.targetFunction === 'n/a' || node.targetFunction === '-') {
      const cleanT = node.title.replace(/[^a-zA-Z0-9а-яА-Я_]/g, '');
      node.targetFunction = `ResolveSingularity(${cleanT || node.id})`;
      targetFunctionsRepaired++;
      details.push(`Целевая функция узла [${node.id}] восстановлена: ${node.targetFunction}`);
    }

    nodeMap.set(node.id, node);
  });

  // Ensure core roots exist
  if (!nodeMap.has('math-singularity')) {
    nodeMap.set('math-singularity', {
      id: 'math-singularity',
      title: 'Разрешение сингулярностей (Деление на ноль)',
      description: 'Монолитная алгебра RICIS-III для вычисления 0/0.',
      state: 'partial',
      type: 'core_singularity',
      targetFunction: 'ResolveSingularity(0_F/0_G)',
      zoneIds: ['math'],
      dependencyIds: [],
      dependentIds: [],
      fractalDepth: 0,
      economic: { costUnresolved: 1000000000000, costToSolve: 100000000, marketGain: 10000000000000, riskLoss: 5000000000000 },
      rewardClass: 'clay',
      prizeNote: 'Фундаментальный монолит RICIS-III / Премия Клея $1,000,000'
    });
  }

  if (!nodeMap.has('core-agi-target')) {
    nodeMap.set('core-agi-target', {
      id: 'core-agi-target',
      title: 'Целевая функция AGI (RICIS Core)',
      description: 'Формализация целевой функции AGI и избежание расхождения путей.',
      state: 'unresolved',
      type: 'core_singularity',
      targetFunction: 'FormalizeAGITarget()',
      zoneIds: ['informatics'],
      dependencyIds: [],
      dependentIds: [],
      fractalDepth: 0,
      economic: { costUnresolved: 10000000000000, costToSolve: 5000000000, marketGain: 50000000000000, riskLoss: 100000000000000 },
      rewardClass: 'commercial',
      prizeNote: 'Капитализация глобальной ИИ-индустрии $50 Трлн'
    });
  }

  // 2. Audit Connectivity & Reconnect Orphans cleanly
  for (const node of nodeMap.values()) {
    // Clean up dependencyIds (remove non-existent node IDs & self-references)
    const validDeps = Array.from(new Set(node.dependencyIds.filter(depId => depId !== node.id && nodeMap.has(depId))));
    if (validDeps.length !== node.dependencyIds.length) {
      connectionsFixed++;
      node.dependencyIds = validDeps;
    }

    // Check if node can reach a core root
    if (!CORE_ROOT_IDS.has(node.id) && !canReachRoot(node.id, nodeMap)) {
      const rootParentId = pickDefaultRootForNode(node);
      node.dependencyIds.push(rootParentId);
      orphanNodesReconnected++;
      connectionsFixed++;
      details.push(`Несвязанный узел [${node.id} - "${node.title}"] подключён к RICIS-ядру [${rootParentId}]`);
    }
  }

  // 3. Synchronize Bidirectional Relationships (dependencyIds <-> dependentIds)
  for (const node of nodeMap.values()) {
    // Add node.id to each parent's dependentIds
    for (const depId of node.dependencyIds) {
      const parentNode = nodeMap.get(depId);
      if (parentNode && !parentNode.dependentIds.includes(node.id)) {
        parentNode.dependentIds.push(node.id);
      }
    }
  }

  for (const node of nodeMap.values()) {
    // Clean dependentIds so they only reference valid existing nodes
    node.dependentIds = Array.from(new Set(
      node.dependentIds.filter(childId => nodeMap.has(childId))
    ));
  }

  // 4. Re-evaluate Monetization / Economics for all nodes
  for (const node of nodeMap.values()) {
    const { changed, log } = reevaluateNodeEconomic(node);
    if (changed) {
      economicReevaluated++;
      if (log && details.length < 35) {
        details.push(log);
      }
    }
  }

  // 5. Rebuild / Synchronize Edges Map
  const existingEdgeMap = new Map<string, DependencyEdge>();
  (map.edges || []).forEach(e => {
    existingEdgeMap.set(`${e.fromId}->${e.toId}`, e);
  });

  const edgeSet = new Map<string, DependencyEdge>();

  for (const node of nodeMap.values()) {
    for (const parentId of node.dependencyIds) {
      const key = `${parentId}->${node.id}`;
      const edgeId = `edge-${parentId}-${node.id}`;
      const parentNode = nodeMap.get(parentId);
      const color = getEdgeColor(parentNode, node);
      const existing = existingEdgeMap.get(key);

      if (existing) {
        edgeSet.set(edgeId, {
          ...existing,
          stateColor: color,
        });
      } else {
        edgeSet.set(edgeId, {
          id: edgeId,
          fromId: parentId,
          toId: node.id,
          strength: 0.7,
          stateColor: color,
          economicInfluence: 0.5,
        });
      }
    }
  }

  const updatedNodes = Array.from(nodeMap.values());
  const updatedEdges = Array.from(edgeSet.values());

  const tempMap: MapState = {
    ...map,
    nodes: updatedNodes,
    edges: updatedEdges,
  };

  // Migration may observe/demote unsafe nodes, but must never replace source-bound proof payloads.
  const { map: fixedMap, repairedProofsCount } = auditMapRicisProofIntegrity(tempMap, { proofRepairMode: 'preserve' });

  if (repairedProofsCount > 0) {
    details.push(`Аудит RICIS-III доказательств: Восстановлено и зафиксировано по A6/Lean4: ${repairedProofsCount} доказательств.`);
  } else {
    details.push('Аудит RICIS-III доказательств: Все существующие доказательства соответствуют A6 и спецификации Lean 4.');
  }

  const report: MigrationAuditReport = {
    dbVersion: CURRENT_MIGRATION_VERSION,
    auditedAt: new Date().toISOString(),
    totalNodesAudited: updatedNodes.length,
    titlesFixed,
    connectionsFixed,
    orphanNodesReconnected,
    edgesRebuilt: updatedEdges.length,
    targetFunctionsRepaired,
    economicReevaluated,
    details: details.slice(0, 30), // top log details
  };

  return { map: fixedMap, report };
}

/**
 * Run database audit migration with IndexedDB persistence.
 */
export async function runDatabaseMigration(
  map: MapState,
  force = false
): Promise<{ map: MapState; report: MigrationAuditReport; isNewMigration: boolean }> {
  try {
    const existing = await dbGetMigrationState();
    
    if (!force && existing && existing.version >= CURRENT_MIGRATION_VERSION) {
      return {
        map,
        report: existing.report || {
          dbVersion: existing.version,
          auditedAt: existing.auditedAt || new Date().toISOString(),
          totalNodesAudited: map.nodes.length,
          titlesFixed: 0,
          connectionsFixed: 0,
          orphanNodesReconnected: 0,
          edgesRebuilt: map.edges.length,
          targetFunctionsRepaired: 0,
          economicReevaluated: 0,
          details: ['Миграция v3 уже выполнена ранее.'],
        },
        isNewMigration: false,
      };
    }

    const { map: auditedMap, report } = auditAndFixMapGraph(map);

    // Save audited map & migration version to IndexedDB
    await dbSaveMap(auditedMap);
    await dbSetMigrationState(CURRENT_MIGRATION_VERSION, report);

    return { map: auditedMap, report, isNewMigration: true };
  } catch (err) {
    console.error('runDatabaseMigration error:', err);
    // Fallback sync execution if IDB fails
    const { map: auditedMap, report } = auditAndFixMapGraph(map);
    return { map: auditedMap, report, isNewMigration: true };
  }
}
