import { describe, expect, it, vi } from 'vitest';
import { RicisBotService } from './RicisBotService';
import type { IRicisKnowledgeRepository } from '../../domain/telegramBot/interfaces';
import type { ProblemNode } from '../../model/types';
import type { SingularitySolveRequest } from '../../domain/telegramBot/types';

const request: SingularitySolveRequest = {
  chatId: 1,
  user: { id: 1, firstName: 'Researcher' },
  title: 'Test singularity',
  targetFunction: '(x * 0) * (1 / x)',
  description: 'Test request',
};

const cachedNode: ProblemNode = {
  id: 'cached',
  title: request.title,
  targetFunction: request.targetFunction,
  description: request.description,
  state: 'partial',
  type: 'scientific_task',
  zoneIds: ['math'],
  dependencyIds: [],
  dependentIds: [],
  fractalDepth: 1,
  economic: { costUnresolved: 10, costToSolve: 2, marketGain: 30, riskLoss: 4 },
};

function createRepository(existing: ProblemNode | undefined): IRicisKnowledgeRepository {
  return {
    findByNormalizedRequest: vi.fn(() => existing),
    getProof: vi.fn(() => 'stored proof'),
    createNode: vi.fn(async () => undefined),
    solveNode: vi.fn(async () => undefined),
    getSummary: vi.fn(() => ({ solvedNodes: 0, totalMarketValue: 0 })),
  };
}

describe('RicisBotService', () => {
  it('reads cached proof without creating or solving a node', async () => {
    const repository = createRepository(cachedNode);
    const service = new RicisBotService(repository);

    const result = await service.solveSingularityTask(request);

    expect(result.isCached).toBe(true);
    expect(result.verificationStatus).toBe('REQUIRES_CORE_LEAN');
    expect(repository.createNode).not.toHaveBeenCalled();
    expect(repository.solveNode).not.toHaveBeenCalled();
  });

  it('creates new Telegram tasks with unassessed economics rather than random valuations', async () => {
    const repository = createRepository(undefined);
    const service = new RicisBotService(repository);

    const result = await service.solveSingularityTask(request);

    expect(repository.createNode).toHaveBeenCalledWith(expect.objectContaining({
      economic: { costUnresolved: 0, costToSolve: 0, marketGain: 0, riskLoss: 0 },
    }));
    expect(result.marketGain).toBe(0);
    expect(result.costToSolve).toBe(0);
    expect(result.verificationStatus).toBe('REQUIRES_CORE_LEAN');
  });
});
