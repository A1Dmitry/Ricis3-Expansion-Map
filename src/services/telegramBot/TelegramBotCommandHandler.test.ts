import { describe, expect, it, vi } from 'vitest';
import { TelegramBotCommandHandler } from './TelegramBotCommandHandler';
import type {
  SingularitySolveRequest,
  SingularitySolveResponse,
  TelegramIncomingMessage,
} from '../../domain/telegramBot/types';
import type { IRicisEngineService } from '../../domain/telegramBot/interfaces';

const incoming = (text: string): TelegramIncomingMessage => ({
  chatId: 1001,
  messageId: 1,
  user: { id: 42, firstName: 'Researcher', username: 'researcher' },
  text,
  timestamp: 1,
});

const verifiedResponse: SingularitySolveResponse = {
  success: true,
  nodeId: 'node-1',
  title: 'Test',
  targetFunction: '(x * 0) * (1 / x)',
  proofLatex: 'RICIS reduction',
  marketGain: 0,
  costToSolve: 0,
  auditValid: true,
  verificationStatus: 'RICIS_PROVEN',
};

function createEngine(response: SingularitySolveResponse = verifiedResponse): IRicisEngineService {
  return {
    solveSingularityTask: vi.fn(async (_request: SingularitySolveRequest) => response),
  };
}

describe('TelegramBotCommandHandler', () => {
  it('rejects API-key contribution commands without reproducing the secret', async () => {
    const handler = new TelegramBotCommandHandler(createEngine());
    const secret = 'AIzaSensitiveUserProvidedSecret';

    const reply = await handler.handleMessage(incoming(`/addkey ${secret}`));

    expect(reply.text).toContain('не принимает API-ключи');
    expect(reply.text).not.toContain(secret);
  });

  it('does not expose a shared key-pool command', async () => {
    const handler = new TelegramBotCommandHandler(createEngine());

    const reply = await handler.handleMessage(incoming('/pool'));

    expect(reply.text).toContain('не использует общий пул ключей');
    expect(reply.text).not.toContain('AIStudio_');
  });

  it('passes only a singularity request to the injected engine and labels its trust status', async () => {
    const engine = createEngine();
    const handler = new TelegramBotCommandHandler(engine);

    const reply = await handler.handleMessage(incoming('/solve (x * 0) * (1 / x)'));

    expect(engine.solveSingularityTask).toHaveBeenCalledTimes(1);
    expect(engine.solveSingularityTask).toHaveBeenCalledWith(expect.objectContaining({
      targetFunction: '(x * 0) * (1 / x)',
    }));
    expect(reply.text).toContain('RICIS reduction');
    expect(reply.text).toContain('Статус доверия: RICIS_PROVEN');
  });
});
