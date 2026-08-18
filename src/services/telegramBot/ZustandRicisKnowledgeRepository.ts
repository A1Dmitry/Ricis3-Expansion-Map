import type { ProblemNode } from '../../model/types';
import type { IRicisKnowledgeRepository } from '../../domain/telegramBot/interfaces';
import { useMapStore } from '../../store/mapStore';

/** Infrastructure adapter between the Telegram application service and Zustand. */
export class ZustandRicisKnowledgeRepository implements IRicisKnowledgeRepository {
  public findByNormalizedRequest(targetFunction: string, title: string): ProblemNode | undefined {
    const normalizedTarget = targetFunction.trim().toLowerCase();
    const normalizedTitle = title.trim().toLowerCase();
    return useMapStore.getState().nodes.find(node => {
      const nodeTarget = node.targetFunction.trim().toLowerCase();
      const nodeTitle = node.title.trim().toLowerCase();
      return (normalizedTarget !== '' && nodeTarget === normalizedTarget) ||
        (normalizedTitle !== '' && nodeTitle === normalizedTitle);
    });
  }

  public getProof(nodeId: string): string | null {
    return useMapStore.getState().getLatexProof(nodeId);
  }

  public async createNode(node: ProblemNode): Promise<void> {
    await useMapStore.getState().addCustomNode(node);
  }

  public async solveNode(nodeId: string): Promise<void> {
    await useMapStore.getState().solveNode(nodeId);
  }

  public getSummary(): { solvedNodes: number; totalMarketValue: number } {
    const nodes = useMapStore.getState().nodes;
    return {
      solvedNodes: nodes.filter(node => node.state === 'resolved').length,
      totalMarketValue: nodes.reduce((total, node) => total + node.economic.marketGain, 0),
    };
  }
}
