/**
 * Domain Ports & Interfaces for Telegram Bot
 * Enforces Dependency Inversion Principle (DIP in SOLID).
 */

import type { ProblemNode } from '../../model/types';
import type {
  TelegramIncomingMessage,
  TelegramBotReply,
  SingularitySolveRequest,
  SingularitySolveResponse,
  BotStateStats,
} from './types';

export interface IRicisEngineService {
  solveSingularityTask(
    request: SingularitySolveRequest
  ): Promise<SingularitySolveResponse>;
}

export interface ITelegramBotGateway {
  processIncomingMessage(
    msg: TelegramIncomingMessage
  ): Promise<TelegramBotReply>;

  sendNotification(
    chatId: number,
    text: string
  ): Promise<boolean>;

  getStats(): Promise<BotStateStats>;
}

export interface IRicisKnowledgeRepository {
  findByNormalizedRequest(targetFunction: string, title: string): ProblemNode | undefined;
  getProof(nodeId: string): string | null;
  createNode(node: ProblemNode): Promise<void>;
  solveNode(nodeId: string): Promise<void>;
  getSummary(): { solvedNodes: number; totalMarketValue: number };
}

export interface ITelegramRepository {
  logInteraction(msg: TelegramIncomingMessage, reply: TelegramBotReply): Promise<void>;
  incrementSolvedCount(marketGain: number): Promise<void>;
  getStats(): Promise<BotStateStats>;
}
