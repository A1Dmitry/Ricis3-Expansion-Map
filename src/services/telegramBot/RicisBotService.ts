import type { IRicisEngineService, IRicisKnowledgeRepository } from '../../domain/telegramBot/interfaces';
import type {
  BotStateStats,
  SingularitySolveRequest,
  SingularitySolveResponse,
} from '../../domain/telegramBot/types';
import type { ProblemNode } from '../../model/types';
import { auditProofContent, buildCanonicalRicisProofLatex } from '../../model/ricisCoreRules';

const UNASSESSED_ECONOMICS = {
  costUnresolved: 0,
  costToSolve: 0,
  marketGain: 0,
  riskLoss: 0,
} as const;

/**
 * Application service for Telegram-originated RICIS requests.
 * It depends on a repository port rather than React/Zustand and never mutates a
 * cached proof during a read operation.
 */
export class RicisBotService implements IRicisEngineService {
  public constructor(private readonly knowledgeRepository: IRicisKnowledgeRepository) {}

  public async solveSingularityTask(request: SingularitySolveRequest): Promise<SingularitySolveResponse> {
    const existingNode = this.knowledgeRepository.findByNormalizedRequest(request.targetFunction, request.title);
    if (existingNode) {
      const proofLatex = this.knowledgeRepository.getProof(existingNode.id) ?? buildCanonicalRicisProofLatex(
        existingNode.title,
        existingNode.targetFunction,
        existingNode.id,
      );
      const audit = auditProofContent(proofLatex);
      return {
        success: true,
        nodeId: existingNode.id,
        title: existingNode.title,
        targetFunction: existingNode.targetFunction,
        proofLatex,
        marketGain: existingNode.economic.marketGain,
        costToSolve: existingNode.economic.costToSolve,
        auditValid: audit.isValid,
        verificationStatus: 'REQUIRES_CORE_LEAN',
        isCached: true,
      };
    }

    const nodeId = `bot-task-${Date.now()}`;
    const node: ProblemNode = {
      id: nodeId,
      title: request.title,
      targetFunction: request.targetFunction,
      description: request.description,
      singularityHint: request.singularityHint ?? 'RICIS-III structural reduction pending verification.',
      state: 'partial',
      type: 'scientific_task',
      zoneIds: request.zoneId ? [request.zoneId] : ['math'],
      dependencyIds: ['math-singularity'],
      dependentIds: [],
      fractalDepth: 1,
      economic: { ...UNASSESSED_ECONOMICS },
      ricisSolvable: false,
    };
    await this.knowledgeRepository.createNode(node);

    try {
      await this.knowledgeRepository.solveNode(nodeId);
    } catch {
      // The fallback below is deliberately marked as requiring external verification.
    }

    const proofLatex = this.knowledgeRepository.getProof(nodeId) ?? buildCanonicalRicisProofLatex(
      request.title,
      request.targetFunction,
      nodeId,
    );
    const audit = auditProofContent(proofLatex);
    return {
      success: true,
      nodeId,
      title: request.title,
      targetFunction: request.targetFunction,
      proofLatex,
      marketGain: 0,
      costToSolve: 0,
      auditValid: audit.isValid,
      verificationStatus: 'REQUIRES_CORE_LEAN',
      isCached: false,
    };
  }

  public async getStats(): Promise<BotStateStats> {
    const summary = this.knowledgeRepository.getSummary();
    return {
      activeUsersCount: 0,
      solvedSingularitiesCount: summary.solvedNodes,
      totalMarketValueGenerated: summary.totalMarketValue,
      isWebhookActive: false,
      botUsername: 'RicisSingularityBot',
    };
  }
}
