/**
 * Онтологическая 16-цветовая матрица состояний RICIS-III на базе RGB каналов.
 * Первичный источник истины — строго типизированные Enum-коды.
 * Цвета (RGB/Hex) и визуальные свойства являются детерминированной проекцией кодов.
 */

import { ProblemNode, Proof, DependencyEdge } from './types';

/**
 * 8–16 дискретных онтологических состояний узла задачи (Problem Node).
 * Базируется на RGB: R (Unresolved Singularity), G (Proven Invariant), B (Core / Active Path).
 */
export enum NodeResolutionStatusCode {
  /** G=1, R=0, B=0: Полностью решён и строго доказан по RICIS-III (Чистый зелёный #22c55e) */
  PROVEN_RESOLVED = 'PROVEN_RESOLVED',

  /** G=0.9, R=0, B=0.5: Решён в Core/Lean Kernel (Изумрудный #10b981) */
  LEAN_VERIFIED = 'LEAN_VERIFIED',

  /** G=0.75, R=0.25, B=0: Решён, но с предупреждениями аудита (Лайм-зелёный #84cc16) */
  RESOLVED_WITH_WARNINGS = 'RESOLVED_WITH_WARNINGS',

  /** G=0.5, R=0.5, B=0: Частично решён / Гипотеза / SP4 (Янтарно-жёлтый #eab308) */
  PARTIAL_HYPOTHESIS = 'PARTIAL_HYPOTHESIS',

  /** G=0.25, R=0.75, B=0: Ранний черновик / В процессе (Оранжевый #f97316) */
  EARLY_DRAFT = 'EARLY_DRAFT',

  /** R=1, G=0, B=0: Полностью не решена / Открытая сингулярность (Чистый красный #ef4444) */
  UNRESOLVED_SINGULARITY = 'UNRESOLVED_SINGULARITY',

  /** R=0.7, G=0, B=0.1: Заблокирована входящими неразрешёнными зависимостями (Бордово-малиновый #b91c1c) */
  LOCKED_BY_DEPENDENCIES = 'LOCKED_BY_DEPENDENCIES',

  /** B=1, R=0, G=0.7: Узел активного доказательного пути L1_Path (Неоновый циан #06b6d4) */
  ACTIVE_L1_PATH = 'ACTIVE_L1_PATH',

  /** B=1, R=0.1, G=0.3: Фундаментальный узел L0 Core / Monolith AXIOM (Глубокий синий #3b82f6) */
  CORE_AXIOM = 'CORE_AXIOM',

  /** R=0.7, G=0.1, B=0.9: Производное утверждение / Внешний клейм (Пурпурный #a855f7) */
  DERIVATIVE_CLAIM = 'DERIVATIVE_CLAIM',

  /** R=0.4, G=0.4, B=0.4: Деактивированный или архивный узел (Нейтральный серый #6b7280) */
  ARCHIVED_DORMANT = 'ARCHIVED_DORMANT'
}

/**
 * 16 комбинаторных состояний соединительной линии зависимости (Dependency Edge).
 * Тензорное произведение: State(Source) x State(Target) + топологические флаги.
 */
export enum EdgeStateCode {
  /** Чистый зелёный (#22c55e): Связь между двумя полностью доказанными узлами */
  STABLE_PROVEN = 'STABLE_PROVEN',

  /** Изумрудный (#10b981): Связь между Lean-верифицированными узлами */
  LEAN_ALIGNED = 'LEAN_ALIGNED',

  /** Лайм (#84cc16): Поток от доказанного к частично доказанному */
  PROGRESSING_FLOW = 'PROGRESSING_FLOW',

  /** Янтарно-жёлтый (#eab308): Частичная связь с гипотезами */
  HYPOTHESIS_LINK = 'HYPOTHESIS_LINK',

  /** Оранжевый (#f97316): Фронт перехода от решённого к нерешённому */
  TRANSITION_FRONT = 'TRANSITION_FRONT',

  /** Чистый красный (#ef4444): Связь между нерешёнными сингулярностями */
  OPEN_SINGULARITY_LINK = 'OPEN_SINGULARITY_LINK',

  /** Тёмно-красный (#991b1b): Заблокированная цепочка зависимостей */
  CRITICAL_BLOCK = 'CRITICAL_BLOCK',

  /** Бордовый (#7f1d1d): Тупиковая неразрешённая связь */
  DEADLOCK_DEPENDENCY = 'DEADLOCK_DEPENDENCY',

  /** Неоновый циан (#06b6d4): Связь на активном L1-пути навигации */
  ACTIVE_L1_STREAM = 'ACTIVE_L1_STREAM',

  /** Глубокий синий (#2563eb): Связь с фундаментальной аксиомой Core */
  CORE_FOUNDATION = 'CORE_FOUNDATION',

  /** Пурпурный (#9333ea): Связь с производным утверждением */
  DERIVATIVE_FLOW = 'DERIVATIVE_FLOW',

  /** Фиалковый (#7c3aed): Межуровневая связь L0-L4 */
  CROSS_HIERARCHY_LINK = 'CROSS_HIERARCHY_LINK',

  /** Индиго (#4f46e5): Верифицированная связь Войнич-реактора */
  VOYNICH_CIRCUIT_LINK = 'VOYNICH_CIRCUIT_LINK',

  /** Бирюзовый (#14b8a6): Связь с доказательным каталогом */
  CATALOG_SPEC_LINK = 'CATALOG_SPEC_LINK',

  /** Серо-стальной (#64748b): Пассивная/структурная связь */
  PASSIVE_TOPOLOGY = 'PASSIVE_TOPOLOGY',

  /** Серо-тёмный (#334155): Фоновая ненаправленная связь */
  DORMANT_TRACE = 'DORMANT_TRACE'
}

export interface IRgbVectorDTO {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

export interface IVisualStateProjectionDTO {
  readonly stateCode: NodeResolutionStatusCode | EdgeStateCode;
  readonly hexColor: string;
  readonly rgb: IRgbVectorDTO;
  readonly glowColor: string;
  readonly opacity: number;
  readonly label: string;
  readonly description: string;
}

/**
 * 8-16 визуальных проекций для состояний узлов
 */
export const NODE_PROJECTIONS: Record<NodeResolutionStatusCode, IVisualStateProjectionDTO> = {
  [NodeResolutionStatusCode.PROVEN_RESOLVED]: {
    stateCode: NodeResolutionStatusCode.PROVEN_RESOLVED,
    hexColor: '#22c55e', // Pure Green
    rgb: { r: 0.133, g: 0.773, b: 0.369 },
    glowColor: 'rgba(34, 197, 94, 0.6)',
    opacity: 1.0,
    label: 'Полностью доказано (RICIS-III)',
    description: 'Аксиоматически вычисленный O(1)-инвариант с проверенным L1-доказательством'
  },
  [NodeResolutionStatusCode.LEAN_VERIFIED]: {
    stateCode: NodeResolutionStatusCode.LEAN_VERIFIED,
    hexColor: '#10b981', // Emerald
    rgb: { r: 0.063, g: 0.725, b: 0.506 },
    glowColor: 'rgba(16, 185, 129, 0.6)',
    opacity: 0.95,
    label: 'Lean 4 верифицировано',
    description: 'Машинно-верифицированное доказательство в ядре Lean'
  },
  [NodeResolutionStatusCode.RESOLVED_WITH_WARNINGS]: {
    stateCode: NodeResolutionStatusCode.RESOLVED_WITH_WARNINGS,
    hexColor: '#84cc16', // Lime Green
    rgb: { r: 0.518, g: 0.8, b: 0.086 },
    glowColor: 'rgba(132, 204, 22, 0.5)',
    opacity: 0.9,
    label: 'Решено (с замечаниями аудита)',
    description: 'Узел отмечен как решённый, но доказательство требует формализации'
  },
  [NodeResolutionStatusCode.PARTIAL_HYPOTHESIS]: {
    stateCode: NodeResolutionStatusCode.PARTIAL_HYPOTHESIS,
    hexColor: '#eab308', // Amber / Yellow
    rgb: { r: 0.918, g: 0.702, b: 0.031 },
    glowColor: 'rgba(234, 179, 8, 0.5)',
    opacity: 0.85,
    label: 'Частичное решение / Гипотеза',
    description: 'Выполнен предварительный протокол SP2/SP4, требуется завершение A6'
  },
  [NodeResolutionStatusCode.EARLY_DRAFT]: {
    stateCode: NodeResolutionStatusCode.EARLY_DRAFT,
    hexColor: '#f97316', // Orange
    rgb: { r: 0.976, g: 0.451, b: 0.086 },
    glowColor: 'rgba(249, 115, 22, 0.5)',
    opacity: 0.8,
    label: 'В процессе разработки',
    description: 'Сформулирована целевая функция, редукция начата'
  },
  [NodeResolutionStatusCode.UNRESOLVED_SINGULARITY]: {
    stateCode: NodeResolutionStatusCode.UNRESOLVED_SINGULARITY,
    hexColor: '#ef4444', // Pure Red
    rgb: { r: 0.937, g: 0.267, b: 0.267 },
    glowColor: 'rgba(239, 68, 68, 0.6)',
    opacity: 0.85,
    label: 'Открытая сингулярность',
    description: 'Нерешённая задача графа'
  },
  [NodeResolutionStatusCode.LOCKED_BY_DEPENDENCIES]: {
    stateCode: NodeResolutionStatusCode.LOCKED_BY_DEPENDENCIES,
    hexColor: '#b91c1c', // Dark Crimson Red
    rgb: { r: 0.725, g: 0.11, b: 0.11 },
    glowColor: 'rgba(185, 28, 28, 0.4)',
    opacity: 0.75,
    label: 'Топологически заблокирована',
    description: 'Ожидает предварительного разрешения родительских узлов'
  },
  [NodeResolutionStatusCode.ACTIVE_L1_PATH]: {
    stateCode: NodeResolutionStatusCode.ACTIVE_L1_PATH,
    hexColor: '#06b6d4', // Neon Cyan
    rgb: { r: 0.024, g: 0.714, b: 0.831 },
    glowColor: 'rgba(6, 182, 212, 0.7)',
    opacity: 1.0,
    label: 'Активный доказательный путь',
    description: 'Узел находится на выбранной траектории доказательства L1'
  },
  [NodeResolutionStatusCode.CORE_AXIOM]: {
    stateCode: NodeResolutionStatusCode.CORE_AXIOM,
    hexColor: '#3b82f6', // Deep Blue
    rgb: { r: 0.231, g: 0.51, b: 0.965 },
    glowColor: 'rgba(59, 130, 246, 0.6)',
    opacity: 0.95,
    label: 'Аксиоматический монолит ядра',
    description: 'Фундаментальная аксиома A1-A10 / L0-L1 монолита'
  },
  [NodeResolutionStatusCode.DERIVATIVE_CLAIM]: {
    stateCode: NodeResolutionStatusCode.DERIVATIVE_CLAIM,
    hexColor: '#a855f7', // Purple
    rgb: { r: 0.659, g: 0.333, b: 0.969 },
    glowColor: 'rgba(168, 85, 247, 0.6)',
    opacity: 0.9,
    label: 'Производное внешнее утверждение',
    description: 'Внешний результат, сопоставленный с семантикой RICIS'
  },
  [NodeResolutionStatusCode.ARCHIVED_DORMANT]: {
    stateCode: NodeResolutionStatusCode.ARCHIVED_DORMANT,
    hexColor: '#6b7280', // Neutral Gray
    rgb: { r: 0.42, g: 0.447, b: 0.502 },
    glowColor: 'rgba(107, 114, 128, 0.3)',
    opacity: 0.6,
    label: 'Архивный / Фоновый узел',
    description: 'Пассивный узел структуры'
  }
};

/**
 * 16 визуальных проекций для состояний ребер
 */
export const EDGE_PROJECTIONS: Record<EdgeStateCode, IVisualStateProjectionDTO> = {
  [EdgeStateCode.STABLE_PROVEN]: {
    stateCode: EdgeStateCode.STABLE_PROVEN,
    hexColor: '#22c55e', // Pure Green
    rgb: { r: 0.133, g: 0.773, b: 0.369 },
    glowColor: 'rgba(34, 197, 94, 0.7)',
    opacity: 0.85,
    label: 'Доказанная связь (Зелёный)',
    description: 'Связь между двумя полностью доказанными узлами'
  },
  [EdgeStateCode.LEAN_ALIGNED]: {
    stateCode: EdgeStateCode.LEAN_ALIGNED,
    hexColor: '#10b981', // Emerald
    rgb: { r: 0.063, g: 0.725, b: 0.506 },
    glowColor: 'rgba(16, 185, 129, 0.65)',
    opacity: 0.8,
    label: 'Lean-согласованная связь',
    description: 'Поток доказательств, верифицированный ядром'
  },
  [EdgeStateCode.PROGRESSING_FLOW]: {
    stateCode: EdgeStateCode.PROGRESSING_FLOW,
    hexColor: '#84cc16', // Lime
    rgb: { r: 0.518, g: 0.8, b: 0.086 },
    glowColor: 'rgba(132, 204, 22, 0.6)',
    opacity: 0.75,
    label: 'Прогрессирующий поток',
    description: 'Переход от доказанной вершины к формирующемуся узлу'
  },
  [EdgeStateCode.HYPOTHESIS_LINK]: {
    stateCode: EdgeStateCode.HYPOTHESIS_LINK,
    hexColor: '#eab308', // Amber / Yellow
    rgb: { r: 0.918, g: 0.702, b: 0.031 },
    glowColor: 'rgba(234, 179, 8, 0.6)',
    opacity: 0.7,
    label: 'Гипотетическая связь (Жёлтый)',
    description: 'Связь с промежуточным или частичным решением'
  },
  [EdgeStateCode.TRANSITION_FRONT]: {
    stateCode: EdgeStateCode.TRANSITION_FRONT,
    hexColor: '#f97316', // Orange
    rgb: { r: 0.976, g: 0.451, b: 0.086 },
    glowColor: 'rgba(249, 115, 22, 0.6)',
    opacity: 0.7,
    label: 'Фронт редукции (Оранжевый)',
    description: 'Переход от решённой вершины к нерешённой сингулярности'
  },
  [EdgeStateCode.OPEN_SINGULARITY_LINK]: {
    stateCode: EdgeStateCode.OPEN_SINGULARITY_LINK,
    hexColor: '#ef4444', // Pure Red
    rgb: { r: 0.937, g: 0.267, b: 0.267 },
    glowColor: 'rgba(239, 68, 68, 0.7)',
    opacity: 0.65,
    label: 'Нерешённая связь (Красный)',
    description: 'Связь между нерешёнными сингулярностями'
  },
  [EdgeStateCode.CRITICAL_BLOCK]: {
    stateCode: EdgeStateCode.CRITICAL_BLOCK,
    hexColor: '#991b1b', // Dark Red
    rgb: { r: 0.6, g: 0.106, b: 0.106 },
    glowColor: 'rgba(153, 27, 27, 0.5)',
    opacity: 0.6,
    label: 'Критическая блокировка',
    description: 'Заблокированная цепочка зависимостей'
  },
  [EdgeStateCode.DEADLOCK_DEPENDENCY]: {
    stateCode: EdgeStateCode.DEADLOCK_DEPENDENCY,
    hexColor: '#7f1d1d', // Dark Maroon
    rgb: { r: 0.498, g: 0.114, b: 0.114 },
    glowColor: 'rgba(127, 29, 29, 0.4)',
    opacity: 0.5,
    label: 'Тупиковая зависимость',
    description: 'Связь с взаимно заблокированным узлом'
  },
  [EdgeStateCode.ACTIVE_L1_STREAM]: {
    stateCode: EdgeStateCode.ACTIVE_L1_STREAM,
    hexColor: '#06b6d4', // Neon Cyan
    rgb: { r: 0.024, g: 0.714, b: 0.831 },
    glowColor: 'rgba(6, 182, 212, 0.8)',
    opacity: 0.95,
    label: 'Активный L1 поток',
    description: 'Связь, входящая в выбранный маршрут доказательства'
  },
  [EdgeStateCode.CORE_FOUNDATION]: {
    stateCode: EdgeStateCode.CORE_FOUNDATION,
    hexColor: '#2563eb', // Blue
    rgb: { r: 0.145, g: 0.388, b: 0.922 },
    glowColor: 'rgba(37, 99, 235, 0.65)',
    opacity: 0.8,
    label: 'Фундамент ядра Core',
    description: 'Связь с базовым аксиоматическим монолитом'
  },
  [EdgeStateCode.DERIVATIVE_FLOW]: {
    stateCode: EdgeStateCode.DERIVATIVE_FLOW,
    hexColor: '#9333ea', // Purple
    rgb: { r: 0.576, g: 0.2, b: 0.918 },
    glowColor: 'rgba(147, 51, 234, 0.6)',
    opacity: 0.75,
    label: 'Поток дериватива',
    description: 'Связь с производным утверждением'
  },
  [EdgeStateCode.CROSS_HIERARCHY_LINK]: {
    stateCode: EdgeStateCode.CROSS_HIERARCHY_LINK,
    hexColor: '#7c3aed', // Violet
    rgb: { r: 0.486, g: 0.227, b: 0.929 },
    glowColor: 'rgba(124, 58, 237, 0.6)',
    opacity: 0.75,
    label: 'Межиерархический мост',
    description: 'Связь между разными уровнями декомпозиции'
  },
  [EdgeStateCode.VOYNICH_CIRCUIT_LINK]: {
    stateCode: EdgeStateCode.VOYNICH_CIRCUIT_LINK,
    hexColor: '#4f46e5', // Indigo
    rgb: { r: 0.31, g: 0.275, b: 0.898 },
    glowColor: 'rgba(79, 70, 229, 0.65)',
    opacity: 0.8,
    label: 'Контур Войнич-реактора',
    description: 'Внутренняя иерархическая связь модулей Войнич'
  },
  [EdgeStateCode.CATALOG_SPEC_LINK]: {
    stateCode: EdgeStateCode.CATALOG_SPEC_LINK,
    hexColor: '#14b8a6', // Teal
    rgb: { r: 0.078, g: 0.722, b: 0.651 },
    glowColor: 'rgba(20, 184, 166, 0.6)',
    opacity: 0.75,
    label: 'Спецификация каталога',
    description: 'Связь с описанием решения каталога RICIS'
  },
  [EdgeStateCode.PASSIVE_TOPOLOGY]: {
    stateCode: EdgeStateCode.PASSIVE_TOPOLOGY,
    hexColor: '#64748b', // Slate Gray
    rgb: { r: 0.392, g: 0.455, b: 0.545 },
    glowColor: 'rgba(100, 116, 139, 0.4)',
    opacity: 0.5,
    label: 'Пассивная топология',
    description: 'Фоновая структурная связь графа'
  },
  [EdgeStateCode.DORMANT_TRACE]: {
    stateCode: EdgeStateCode.DORMANT_TRACE,
    hexColor: '#334155', // Dark Slate
    rgb: { r: 0.2, g: 0.255, b: 0.333 },
    glowColor: 'rgba(51, 65, 85, 0.3)',
    opacity: 0.4,
    label: 'Неактивный след',
    description: 'Связь между отключёнными узлами'
  }
};

/**
 * Сервис управления состояниями и цветами графа (Color & State Authority).
 */
export class GraphColorStateManager {
  /**
   * Определение кода состояния узла по его свойствам и доказательству
   */
  resolveNodeStatusCode(node: ProblemNode, proof?: Proof): NodeResolutionStatusCode {
    if (node.isDerivativeClaim || node.type === 'derivative_claim') {
      return NodeResolutionStatusCode.DERIVATIVE_CLAIM;
    }

    if (node.type === 'core_singularity' && (node.state === 'resolved' || (node as unknown as { resolved?: boolean }).resolved)) {
      return NodeResolutionStatusCode.CORE_AXIOM;
    }

    const isResolved = node.state === 'resolved' || (node as unknown as { resolved?: boolean }).resolved === true;

    if (isResolved) {
      if (!proof) {
        return NodeResolutionStatusCode.RESOLVED_WITH_WARNINGS;
      }
      const hasValidSteps = Array.isArray(proof.steps) && proof.steps.length > 0;
      const hasTarget = typeof proof.targetFunction === 'string' && proof.targetFunction.trim().length > 0;
      if (hasValidSteps && hasTarget) {
        const leanTrustStatus = proof.externalLean?.trustStatus;
        if (leanTrustStatus === 'LEAN_VERIFIED' || leanTrustStatus === 'TRUSTED_AXIOM') {
          return NodeResolutionStatusCode.LEAN_VERIFIED;
        }
        return NodeResolutionStatusCode.PROVEN_RESOLVED;
      }
      return NodeResolutionStatusCode.RESOLVED_WITH_WARNINGS;
    }

    if (node.state === 'partial') {
      return NodeResolutionStatusCode.PARTIAL_HYPOTHESIS;
    }

    return NodeResolutionStatusCode.UNRESOLVED_SINGULARITY;
  }

  /**
   * Определение кода состояния связи по состояниям инцидентных вершин
   */
  resolveEdgeStateCode(
    fromStatus: NodeResolutionStatusCode,
    toStatus: NodeResolutionStatusCode,
    isL1Path: boolean = false
  ): EdgeStateCode {
    if (isL1Path) {
      return EdgeStateCode.ACTIVE_L1_STREAM;
    }

    if (fromStatus === NodeResolutionStatusCode.DERIVATIVE_CLAIM || toStatus === NodeResolutionStatusCode.DERIVATIVE_CLAIM) {
      return EdgeStateCode.DERIVATIVE_FLOW;
    }

    if (fromStatus === NodeResolutionStatusCode.CORE_AXIOM || toStatus === NodeResolutionStatusCode.CORE_AXIOM) {
      return EdgeStateCode.CORE_FOUNDATION;
    }

    const fromResolved =
      fromStatus === NodeResolutionStatusCode.PROVEN_RESOLVED ||
      fromStatus === NodeResolutionStatusCode.LEAN_VERIFIED ||
      fromStatus === NodeResolutionStatusCode.RESOLVED_WITH_WARNINGS;

    const toResolved =
      toStatus === NodeResolutionStatusCode.PROVEN_RESOLVED ||
      toStatus === NodeResolutionStatusCode.LEAN_VERIFIED ||
      toStatus === NodeResolutionStatusCode.RESOLVED_WITH_WARNINGS;

    if (fromResolved && toResolved) {
      if (fromStatus === NodeResolutionStatusCode.LEAN_VERIFIED && toStatus === NodeResolutionStatusCode.LEAN_VERIFIED) {
        return EdgeStateCode.LEAN_ALIGNED;
      }
      if (fromStatus === NodeResolutionStatusCode.RESOLVED_WITH_WARNINGS || toStatus === NodeResolutionStatusCode.RESOLVED_WITH_WARNINGS) {
        return EdgeStateCode.PROGRESSING_FLOW;
      }
      return EdgeStateCode.STABLE_PROVEN;
    }

    if (fromResolved && !toResolved) {
      if (toStatus === NodeResolutionStatusCode.PARTIAL_HYPOTHESIS) {
        return EdgeStateCode.HYPOTHESIS_LINK;
      }
      return EdgeStateCode.TRANSITION_FRONT;
    }

    if (!fromResolved && toResolved) {
      if (fromStatus === NodeResolutionStatusCode.PARTIAL_HYPOTHESIS) {
        return EdgeStateCode.HYPOTHESIS_LINK;
      }
      return EdgeStateCode.TRANSITION_FRONT;
    }

    // Both unresolved
    if (fromStatus === NodeResolutionStatusCode.PARTIAL_HYPOTHESIS && toStatus === NodeResolutionStatusCode.PARTIAL_HYPOTHESIS) {
      return EdgeStateCode.HYPOTHESIS_LINK;
    }

    if (fromStatus === NodeResolutionStatusCode.LOCKED_BY_DEPENDENCIES || toStatus === NodeResolutionStatusCode.LOCKED_BY_DEPENDENCIES) {
      return EdgeStateCode.CRITICAL_BLOCK;
    }

    return EdgeStateCode.OPEN_SINGULARITY_LINK;
  }

  /**
   * Получение визуальной проекции для узла
   */
  getNodeProjection(statusCode: NodeResolutionStatusCode): IVisualStateProjectionDTO {
    return NODE_PROJECTIONS[statusCode] || NODE_PROJECTIONS[NodeResolutionStatusCode.UNRESOLVED_SINGULARITY];
  }

  /**
   * Получение визуальной проекции для ребра
   */
  getEdgeProjection(edgeCode: EdgeStateCode): IVisualStateProjectionDTO {
    return EDGE_PROJECTIONS[edgeCode] || EDGE_PROJECTIONS[EdgeStateCode.OPEN_SINGULARITY_LINK];
  }

  /**
   * Пакетный расчёт состояний всех ребер графа
   */
  recalculateGraphEdgeStates(
    nodes: readonly ProblemNode[],
    edges: readonly DependencyEdge[],
    proofs: Readonly<Record<string, Proof>>,
    l1PathNodeIds?: ReadonlySet<string>
  ): readonly DependencyEdge[] {
    const nodeStatusMap = new Map<string, NodeResolutionStatusCode>();
    for (const node of nodes) {
      nodeStatusMap.set(node.id, this.resolveNodeStatusCode(node, proofs[node.id]));
    }

    return edges.map(edge => {
      const fromStatus = nodeStatusMap.get(edge.fromId) ?? NodeResolutionStatusCode.UNRESOLVED_SINGULARITY;
      const toStatus = nodeStatusMap.get(edge.toId) ?? NodeResolutionStatusCode.UNRESOLVED_SINGULARITY;
      const isL1Path = Boolean(
        l1PathNodeIds &&
        l1PathNodeIds.has(edge.fromId) &&
        l1PathNodeIds.has(edge.toId)
      );

      const stateCode = this.resolveEdgeStateCode(fromStatus, toStatus, isL1Path);
      const projection = this.getEdgeProjection(stateCode);

      return {
        ...edge,
        stateCode,
        stateColor: projection.hexColor as unknown as import('./types').EdgeColor,
        rgbVector: projection.rgb,
        stateLabel: projection.label
      };
    });
  }
}

export const graphColorManager = new GraphColorStateManager();
