/**
 * Service Adapter for RICIS-III Engine & MapStore Integration
 * Adheres to Dependency Inversion & Single Responsibility Principles.
 */

import type {
  IRicisEngineService,
  ITelegramRepository,
} from '../../domain/telegramBot/interfaces';
import type {
  SingularitySolveRequest,
  SingularitySolveResponse,
  BotStateStats,
} from '../../domain/telegramBot/types';
import { useMapStore } from '../../store/mapStore';
import { auditProofContent, buildCanonicalRicisProofLatex } from '../../model/ricisCoreRules';

export class RicisBotService implements IRicisEngineService {
  constructor(private readonly repository?: ITelegramRepository) {}

  public async solveSingularityTask(
    request: SingularitySolveRequest
  ): Promise<SingularitySolveResponse> {
    const store = useMapStore.getState();

    // 1. DRY Lookup: Check if a node with this targetFunction or title already exists in 3D Database
    const cleanReqTarget = (request.targetFunction || '').trim().toLowerCase();
    const cleanReqTitle = (request.title || '').replace(/^задача от @\w+:\s*/i, '').trim().toLowerCase();

    const existingNode = store.nodes.find(n => {
      if (!n) return false;
      const nTarget = (n.targetFunction || '').trim().toLowerCase();
      const nTitle = (n.title || '').trim().toLowerCase();

      if (cleanReqTarget && nTarget && (nTarget === cleanReqTarget || cleanReqTarget.includes(nTarget) || nTarget.includes(cleanReqTarget))) {
        return true;
      }
      if (cleanReqTitle && nTitle && (nTitle === cleanReqTitle || cleanReqTitle.includes(nTitle) || nTitle.includes(cleanReqTitle))) {
        return true;
      }
      return false;
    });

    if (existingNode) {
      console.log(`[DRY Cache Hit] Reusing and updating existing node from 3D Knowledge Database: ${existingNode.id}`);

      // Всегда принудительно регенерируем доказательство по самым свежим локальным правилам вывода RICIS-III v7.7,
      // чтобы убрать DOI, устаревшие фазы и применить точные правила сокращения, заданные пользователем.
      const proofLatex = buildCanonicalRicisProofLatex(
        existingNode.title,
        existingNode.targetFunction || request.targetFunction,
        existingNode.id
      );

      // Синхронизируем обновленное доказательство с глобальным хранилищем и 3D-картой
      try {
        await store.updateProof(existingNode.id, proofLatex);
      } catch (err) {
        console.warn('Failed to update stored proof in MapStore:', err);
      }

      const audit = auditProofContent(proofLatex);
      const marketGain = existingNode.economic?.marketGain || 300000000;
      const costToSolve = existingNode.economic?.costToSolve || 1000000;

      if (this.repository) {
        await this.repository.incrementSolvedCount(marketGain);
      }

      return {
        success: true,
        nodeId: existingNode.id,
        title: existingNode.title,
        targetFunction: existingNode.targetFunction || request.targetFunction,
        proofLatex,
        marketGain,
        costToSolve,
        auditValid: audit.isValid,
        isCached: true,
      };
    }

    // 2. DRY Miss: Create new ProblemNode in MapStore & IndexedDB
    const nodeId = `bot-task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newMarketGain = Math.floor(Math.random() * 500000000) + 100000000;
    const newCostToSolve = Math.floor(Math.random() * 5000000) + 1000000;

    await store.addCustomNode({
      id: nodeId,
      title: request.title,
      targetFunction: request.targetFunction,
      description: request.description,
      singularityHint: request.singularityHint || 'RICIS-III Skew Product Reduction',
      state: 'partial',
      type: 'scientific_task',
      zoneIds: request.zoneId ? [request.zoneId] : ['math'],
      dependencyIds: ['math-singularity'],
      dependentIds: [],
      fractalDepth: 1,
      economic: {
        costUnresolved: newMarketGain * 0.2,
        costToSolve: newCostToSolve,
        marketGain: newMarketGain,
        riskLoss: newCostToSolve * 0.5,
      },
      ricisSolvable: true,
    });

    // 3. Invoke RICIS-III Solver Engine via MapStore solveNode
    let proofLatex = '';
    try {
      await store.solveNode(nodeId);
      proofLatex = store.getLatexProof(nodeId) || '';
    } catch (err) {
      console.warn('Fallback proof generation in RicisBotService:', err);
    }

    if (!proofLatex) {
      proofLatex = buildCanonicalRicisProofLatex(
        request.title,
        request.targetFunction,
        nodeId
      );
    }

    const audit = auditProofContent(proofLatex);

    // Update repository stats if repository is present
    if (this.repository) {
      await this.repository.incrementSolvedCount(newMarketGain);
    }

    return {
      success: true,
      nodeId,
      title: request.title,
      targetFunction: request.targetFunction,
      proofLatex,
      marketGain: newMarketGain,
      costToSolve: newCostToSolve,
      auditValid: audit.isValid,
      isCached: false,
    };
  }

  public async getStats(): Promise<BotStateStats> {
    if (this.repository) {
      return this.repository.getStats();
    }
    const store = useMapStore.getState();
    const solvedCount = store.nodes.filter(n => n.state === 'resolved').length;
    const marketVal = store.nodes.reduce((acc, n) => acc + (n.economic?.marketGain || 0), 0);

    return {
      activeUsersCount: 1,
      solvedSingularitiesCount: solvedCount,
      totalMarketValueGenerated: marketVal,
      isWebhookActive: true,
      botUsername: 'RicisSingularityBot',
    };
  }
}
