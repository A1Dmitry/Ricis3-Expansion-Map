/**
 * Service Layer: Telegram Bot Command Handler
 * SOLID & DRY Principles:
 * - Single Responsibility: Handles command parsing, routing, and reply formatting.
 * - Open/Closed: Easily extendable for new slash-commands (/proof, /market, etc).
 * - DRY: Reusable response formatters for Lean 4 proofs, LaTeX, and mathematical summaries.
 */

import type {
  TelegramIncomingMessage,
  TelegramBotReply,
  SingularitySolveRequest,
} from '../../domain/telegramBot/types';
import type { IRicisEngineService } from '../../domain/telegramBot/interfaces';
import type { ITokenPoolService } from '../../domain/tokenPool/interfaces';
import { TokenPoolManager } from '../tokenPool/TokenPoolManager';

export class TelegramBotCommandHandler {
  private readonly tokenPool: ITokenPoolService;

  constructor(
    private readonly ricisEngine: IRicisEngineService,
    tokenPoolService?: ITokenPoolService
  ) {
    this.tokenPool = tokenPoolService || TokenPoolManager.getInstance();
  }

  public async handleMessage(msg: TelegramIncomingMessage): Promise<TelegramBotReply> {
    const text = (msg.text || '').trim();
    const chatId = msg.chatId;

    if (!text) {
      return this.formatReply(chatId, '⚠️ Отправьте текстовую команду или выражение с сингулярностью.');
    }

    if (text.startsWith('/start')) {
      return this.handleStart(chatId, msg.user.firstName || 'Ученый');
    }

    if (text.startsWith('/help')) {
      return this.handleHelp(chatId);
    }

    if (text.startsWith('/stats') || text.startsWith('/status')) {
      return this.handleStats(chatId);
    }

    if (text.startsWith('/addkey') || text.startsWith('/key')) {
      return this.handleAddKey(msg);
    }

    if (text.startsWith('/pool') || text.startsWith('/keys')) {
      return this.handlePoolStats(chatId, String(msg.user.id || chatId));
    }

    if (text.startsWith('/solve') || text.startsWith('/ricis')) {
      return this.handleSolveCommand(msg);
    }

    // Default handler: treat non-command messages containing mathematical expressions as singularity solving requests
    return this.handleSolveExpression(msg, text);
  }

  private handleStart(chatId: number, userName: string): TelegramBotReply {
    const welcome =
      `🤖 *Добро пожаловать в RICIS-III Singularity Bot, ${this.escapeMarkdown(userName)}!*\n\n` +
      `Я — официальный ИИ-агент аксиоматического аналитического движка **RICIS-III v7.7** (автор: Дмитрий Алейников, ORCID: 0009-0004-3226-7700).\n\n` +
      `🔑 *Модель токен-пула ("Вскладчину" / Key Pool):*\n` +
      `• Вам предоставляется **1 бесплатный запрос** для разрешения сингулярности!\n` +
      `• Добавьте свой API-ключ Google AI Studio командой:\n` +
      `  \`/addkey AIzaSy...\`\n` +
      `• **Бонус участникам:** все внесшие вклад добавлением ключа получают бесплатные ответы из DRY-кэша 3D-базы знаний, пока действует их активный ключ!\n` +
      `• Добавляя 1 свой ключ, вы получаете полнофункциональный доступ к коллективной мощности всего пула!\n\n` +
      `💡 *Как использовать:*\n` +
      `Отправьте запрос: \`/solve (x^2-4)/(x-2) при x=2\``;

    return this.formatReply(chatId, welcome, [
      [{ text: '🔑 Состояние Пул-Ключей', callbackData: '/pool' }],
      [{ text: '📊 Посмотреть 3D-Карту', url: 'https://ai.studio/build' }],
      [{ text: '⚡ Помощь / Команды', callbackData: '/help' }],
    ]);
  }

  private handleHelp(chatId: number): TelegramBotReply {
    const helpText =
      `📜 *Список команд RICIS-III Чат-Бота:*\n\n` +
      `• \`/solve <выражение>\` — Решить сингулярность и создать доказательство Lean 4\n` +
      `• \`/addkey <ключ_AI_Studio>\` — Добавить свой API-ключ в общий пул ("вскладчину") и открыть безлимит\n` +
      `• \`/pool\` — Статистика активных ключей пула и ваш личный статус\n` +
      `• \`/stats\` — Состояние глобальной базы знаний RICIS-III и авто-обучения\n` +
      `• \`/help\` — Вызов справки по аксиоматике RICIS-III (SP1–SP4, A6 Skew Product)\n\n` +
      `🔬 *Примеры запросов:*\n` +
      `1. \`/addkey AIzaSyYourGoogleAIStudioApiKeyHere\`\n` +
      `2. \`/solve (sin(x))/x при x=0\`\n` +
      `3. \`/solve lim (x^2 - 9)/(x - 3)\``;

    return this.formatReply(chatId, helpText);
  }

  private async handleAddKey(msg: TelegramIncomingMessage): Promise<TelegramBotReply> {
    const keyCandidate = msg.text.replace(/^\/(addkey|key)\s*/i, '').trim();
    const userId = String(msg.user.id || msg.chatId);

    if (!keyCandidate) {
      return this.formatReply(
        msg.chatId,
        '⚠️ Пожалуйста, укажите API-ключ после команды. Пример:\n`/addkey AIzaSyYourKeyHere`'
      );
    }

    const result = await this.tokenPool.contributeKey(keyCandidate, userId);

    if (!result.success) {
      return this.formatReply(msg.chatId, `❌ *Ошибка добавления ключа:*\n${result.message}`);
    }

    return this.formatReply(
      msg.chatId,
      `🎉 *Ключ успешно добавлен в пул!*\n\n` +
      `• *Маскированный ключ:* \`${result.maskedKey}\`\n` +
      `• *Статус:* \`Участник Коллективного Пула (Безлимит + Бесплатный DRY-кэш)\`\n\n` +
      `Теперь вам доступны все ключи пула и бесплатные мгновенные ответы из DRY-кэша 3D-базы знаний без расхода лимитов пока действует ваш ключ!`,
      [[{ text: '📊 Проверить Пул', callbackData: '/pool' }]]
    );
  }

  private async handlePoolStats(chatId: number, userId: string): Promise<TelegramBotReply> {
    const poolStats = this.tokenPool.getPoolStats();
    const userQuota = this.tokenPool.checkUserQuota(userId);
    const maskedKeys = this.tokenPool.listMaskedKeys();

    const keysListFormatted = maskedKeys.length > 0
      ? maskedKeys.map(k => `• \`${k.maskedKey}\` | Tier: \`${k.tier}\` | Usages: \`${k.successCount}\` | Status: \`${k.status}\``).join('\n')
      : '_В пользовательском пуле пока нет внешних ключей. Будьте первым!_';

    const text =
      `🔑 *Состояние Коллективного Пула Ключей (Вскладчину):*\n\n` +
      `• *Ваш текущий доступ:* \`${userQuota.isFreeTier ? 'Бесплатный (1 запрос)' : 'Безлимитный Пул'}\`\n` +
      `• *Запросов оставлено:* \`${userQuota.quotaRemaining === 999999 ? 'Безлимитно' : userQuota.quotaRemaining}\`\n\n` +
      `📈 *Метрики Пула:* \n` +
      `• Активных пользовательских ключей: \`${poolStats.totalActiveKeys}\`\n` +
      `• Всего участников вскладчину: \`${poolStats.totalContributors}\`\n` +
      `• Запросов обработано пулом: \`${poolStats.totalQueriesProcessed}\`\n` +
      `• Ключей на охлаждении (429 backoff): \`${poolStats.totalCooldownKeys}\`\n` +
      `• Мастер-ключи разработчика: \`Защищены (Developer Vault)\`\n\n` +
      `📋 *Список Ключей в Пуле:*\n${keysListFormatted}\n\n` +
      `💡 _Добавьте свой ключ через \`/addkey <ключ>\`, чтобы поддерживать пул и использовать коллективную мощность!_`;

    return this.formatReply(chatId, text);
  }

  private async handleStats(chatId: number): Promise<TelegramBotReply> {
    const poolStats = this.tokenPool.getPoolStats();
    const statsText =
      `🌐 *Состояние Графа Знаний & Токен-Пула RICIS-III:*\n\n` +
      `• *Версия Движка:* v7.7 (RICIS-III Analytical Engine)\n` +
      `• *Модель Агента:* Gemini 3.6 Flash / 3.1 Pro\n` +
      `• *Аксиомы Движка:* SP1–SP4 + Geometric Bridge (Skew Product)\n` +
      `• *Формализатор:* Lean 4 / LaTeX Dual Proof Engine\n` +
      `• *Токен-Пул:* \`${poolStats.totalActiveKeys}\` активных ключей, \`${poolStats.totalQueriesProcessed}\` обработанных задач\n\n` +
      `Все новые задачи, решенные через чат-бот, мгновенно пополняют базу обучающих доказательств.`;

    return this.formatReply(chatId, statsText);
  }

  private async handleSolveCommand(msg: TelegramIncomingMessage): Promise<TelegramBotReply> {
    const rawText = msg.text.replace(/^\/(solve|ricis)\s*/i, '').trim();
    if (!rawText) {
      return this.formatReply(
        msg.chatId,
        '⚠️ Укажите выражение для решения. Пример:\n`/solve (x^2 - 4)/(x - 2) при x=2`'
      );
    }
    return this.handleSolveExpression(msg, rawText);
  }

  private async handleSolveExpression(
    msg: TelegramIncomingMessage,
    expression: string
  ): Promise<TelegramBotReply> {
    const userId = String(msg.user.id || msg.chatId);

    // 1. Check Freemium & Pool Quota
    const quota = this.tokenPool.checkUserQuota(userId);
    if (!quota.canExecute) {
      return this.formatReply(
        msg.chatId,
        `⛔ *Лимит исчерпан!*\n\n${quota.reason}`,
        [[{ text: '➕ Добавить свой ключ (/addkey)', callbackData: '/help' }]]
      );
    }

    // 2. Select optimal active key from pool with round-robin + rate-limit protection
    const keyInfo = this.tokenPool.getNextActiveKey();

    const solveReq: SingularitySolveRequest = {
      chatId: msg.chatId,
      user: msg.user,
      title: `Задача от @${msg.user.username || msg.user.firstName || 'user'}: ${expression.slice(0, 30)}`,
      targetFunction: expression,
      description: `Решить выражение с сингулярностью методом RICIS-III v7.7. Запрос пользователя: ${expression}`,
      singularityHint: 'Автоматическая редукция через аксиомы SP1-SP4 и Skew Product A6',
    };

    try {
      const res = await this.ricisEngine.solveSingularityTask(solveReq);

      if (!res.success) {
        this.tokenPool.reportKeyExecutionResult(keyInfo.maskedKey, false, false);
        return this.formatReply(
          msg.chatId,
          `❌ *Ошибка детерминированного вывода RICIS-III:*\n${this.escapeMarkdown(res.errorMessage || 'Неизвестный сбой')}`
        );
      }

      // Record successful quota consumption and key execution
      this.tokenPool.recordUserQuery(userId);
      this.tokenPool.reportKeyExecutionResult(keyInfo.maskedKey, true, false);

      const cacheNote = res.isCached
        ? `📦 *[Извлечено из 3D-базы знаний (DRY)]*\n\n`
        : '';

      const proofText = res.proofLatex || '';
      const resultText = `${cacheNote}${proofText.slice(0, 3800)}`;

      return this.formatReply(msg.chatId, resultText, [
        [{ text: '🌐 3D-Карта', url: 'https://ai.studio/build' }],
      ]);
    } catch (err: any) {
      const is429 = String(err).includes('429') || String(err).includes('RESOURCE_EXHAUSTED');
      this.tokenPool.reportKeyExecutionResult(keyInfo.maskedKey, false, is429);

      return this.formatReply(
        msg.chatId,
        `🚨 *Исключение при вычислении:* ${this.escapeMarkdown(String(err))}`
      );
    }
  }

  private formatReply(
    chatId: number,
    text: string,
    inlineKeyboard?: Array<Array<{ text: string; callbackData?: string; url?: string }>>
  ): TelegramBotReply {
    return {
      chatId,
      text,
      parseMode: 'Markdown',
      replyMarkup: inlineKeyboard ? { inlineKeyboard } : undefined,
    };
  }

  private escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
  }
}
