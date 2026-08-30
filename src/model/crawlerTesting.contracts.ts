import type { ProblemNode } from './types';
import type { Vector3D } from './kinematicEngine.contracts';

/**
 * Уровни критичности дефектов
 */
export type BugSeverity = 'CRITICAL' | 'WARNING' | 'ERGONOMICS' | 'INFO';

/**
 * Категории дефектов приложения
 */
export type BugCategory =
  | 'GRAPH_STRUCTURE'       // Разорванные связи, циклы, недостижимые узлы
  | 'FORMULA_RENDER'        // Ошибки парсинга LaTeX/KaTeX, отсутствующие формулы
  | 'PROOF_INTEGRITY'       // Нарушение статуса доверия, потерянный leanProof, sorryAx
  | 'UI_ACCESSIBILITY'      // Нарушение контрастности, touch target < 44px, некликабельные элементы
  | 'KINEMATICS_ANOMALY'    // Скачки угловых скоростей, деформация звеньев L1, NaN/Infinity
  | 'NAVIGATION_ROUTING';   // Битые URL-параметры, модальные окна без закрытия

/**
 * Структурированный баг-репорт
 */
export interface IBugReport {
  readonly id: string;
  readonly timestamp: number;
  readonly severity: BugSeverity;
  readonly category: BugCategory;
  readonly title: string;
  readonly description: string;
  readonly targetComponentOrNodeId: string;
  readonly reproductionSteps: readonly string[];
  readonly expectedBehavior: string;
  readonly actualBehavior: string;
  readonly telemetryData?: Record<string, unknown>;
}

/**
 * Фазы процесса тестирования затоплением
 */
export type CrawlerPhase =
  | 'IDLE'
  | 'FLOOD_FILL_GRAPH_CRAWL'
  | 'UI_ELEMENTS_AUDIT'
  | 'MANIPULATOR_STRESS_RIG'
  | 'COMPLETED'
  | 'PAUSED';

/**
 * Конфигурация запуска тестирования
 */
export interface ICrawlerConfig {
  readonly maxGraphDepth: number;
  readonly verifyLatexRendering: boolean;
  readonly verifyProofAxioms: boolean;
  readonly auditTouchTargetSizes: boolean;
  readonly runManipulatorStressTest: boolean;
  readonly manipulatorStressIterations: number;
  readonly crawlDelayMs: number;
}

/**
 * Статистика выполнения краулера
 */
export interface ICrawlerMetrics {
  readonly totalNodesDiscovered: number;
  readonly visitedNodesCount: number;
  readonly uiElementsAuditedCount: number;
  readonly kinematicVectorsTestedCount: number;
  readonly criticalBugsCount: number;
  readonly warningBugsCount: number;
  readonly ergonomicsBugsCount: number;
  readonly elapsedTimeMs: number;
}

/**
 * Полное состояние сессии тестирования
 */
export interface ICrawlerSessionState {
  readonly phase: CrawlerPhase;
  readonly config: ICrawlerConfig;
  readonly metrics: ICrawlerMetrics;
  readonly currentNodeId: string | null;
  readonly currentKinematicTestName: string | null;
  readonly bugReports: readonly IBugReport[];
  readonly visitedNodeIds: readonly string[];
  readonly pendingNodeQueue: readonly string[];
}

/**
 * Результат проверки отдельного узла
 */
export interface INodeAuditResult {
  readonly nodeId: string;
  readonly passed: boolean;
  readonly bugs: readonly IBugReport[];
}

/**
 * Интерфейс движка стресс-тестирования кинематики
 */
export interface IManipulatorStressResult {
  readonly testId: string;
  readonly testName: string;
  readonly testedTargetsCount: number;
  readonly anomaliesDetected: number;
  readonly bugs: readonly IBugReport[];
}

/**
 * Интерфейс краулера (DI Contract)
 */
export interface IFloodFillCrawlerService {
  startSession(rootNodeId: string, allNodes: readonly ProblemNode[], config?: Partial<ICrawlerConfig>): void;
  pauseSession(): void;
  resumeSession(): void;
  stopSession(): void;
  stepOnce(): Promise<ICrawlerSessionState>;
  getState(): ICrawlerSessionState;
  clearBugs(): void;
  exportReportsAsJson(): string;
  exportReportsAsMarkdown(): string;
}
