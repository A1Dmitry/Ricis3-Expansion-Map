/**
 * Domain Entities and Value Objects for RICIS-III Telegram Bot Subsystem
 * Designed according to Domain-Driven Design (DDD) & SOLID principles.
 */

export interface TelegramUser {
  id: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  isBot?: boolean;
}

export interface TelegramIncomingMessage {
  chatId: number;
  messageId: number;
  user: TelegramUser;
  text: string;
  timestamp: number;
}

export interface TelegramInlineButton {
  text: string;
  callbackData?: string;
  url?: string;
}

export interface TelegramBotReply {
  chatId: number;
  text: string;
  parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML';
  replyMarkup?: {
    inlineKeyboard?: TelegramInlineButton[][];
  };
}

export interface SingularitySolveRequest {
  chatId: number;
  user: TelegramUser;
  title: string;
  targetFunction: string;
  description: string;
  singularityHint?: string;
  zoneId?: string;
}

export interface SingularitySolveResponse {
  success: boolean;
  nodeId: string;
  title: string;
  targetFunction: string;
  proofLatex: string;
  marketGain: number;
  costToSolve: number;
  auditValid: boolean;
  isCached?: boolean;
  errorMessage?: string;
}

export interface BotStateStats {
  activeUsersCount: number;
  solvedSingularitiesCount: number;
  totalMarketValueGenerated: number;
  lastSolvedNodeId?: string;
  isWebhookActive: boolean;
  botUsername: string;
}
