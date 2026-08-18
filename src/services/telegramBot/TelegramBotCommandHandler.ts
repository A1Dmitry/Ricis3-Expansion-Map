import type {
  TelegramBotReply,
  TelegramIncomingMessage,
  SingularitySolveRequest,
} from '../../domain/telegramBot/types';
import type { IRicisEngineService } from '../../domain/telegramBot/interfaces';

/**
 * Telegram command application service.
 *
 * The handler accepts mathematical requests only. It never accepts, stores,
 * displays, or routes third-party API keys. Infrastructure dependencies are
 * injected by the composition root rather than obtained through a singleton.
 */
export class TelegramBotCommandHandler {
  public constructor(private readonly ricisEngine: IRicisEngineService) {}

  public async handleMessage(msg: TelegramIncomingMessage): Promise<TelegramBotReply> {
    const text = msg.text.trim();
    if (!text) {
      return this.formatReply(msg.chatId, '⚠️ Отправьте текстовую команду или выражение с сингулярностью.');
    }

    if (text.startsWith('/start')) {
      return this.handleStart(msg.chatId, msg.user.firstName || 'Исследователь');
    }
    if (text.startsWith('/help')) {
      return this.handleHelp(msg.chatId);
    }
    if (text.startsWith('/stats') || text.startsWith('/status')) {
      return this.handleStats(msg.chatId);
    }
    if (text.startsWith('/addkey') || text.startsWith('/key') || text.startsWith('/pool') || text.startsWith('/keys')) {
      return this.handleUnsafeKeyCommand(msg.chatId);
    }
    if (text.startsWith('/solve') || text.startsWith('/ricis')) {
      return this.handleSolveCommand(msg);
    }

    return this.handleSolveExpression(msg, text);
  }

  private handleStart(chatId: number, userName: string): TelegramBotReply {
    return this.formatReply(
      chatId,
      `🤖 *Добро пожаловать в RICIS-III, ${this.escapeMarkdown(userName)}!*\n\n` +
        'Бот принимает только математические выражения. Для безопасности он **не принимает и не хранит API-ключи**.\n\n' +
        'Отправьте запрос: `/solve (x^2-4)/(x-2) при x=2`\n\n' +
        'Каждый ответ содержит явный статус доверия: RICIS, Core, Lean, классическое наследование, гипотеза или необходимость внешней проверки.',
      [
        [{ text: '⚡ Помощь / Команды', callbackData: '/help' }],
      ],
    );
  }

  private handleHelp(chatId: number): TelegramBotReply {
    return this.formatReply(
      chatId,
      '📜 *Команды RICIS-III:*\n\n' +
        '• `/solve <выражение>` — выполнить RICIS-обработку выражения.\n' +
        '• `/stats` — описание статусов доверия результата.\n' +
        '• `/help` — эта справка.\n\n' +
        'Пример: `/solve (sin(x))/x при x=0`\n\n' +
        'Не передавайте в чат API-ключи, пароли или другие секреты.',
    );
  }

  private handleUnsafeKeyCommand(chatId: number): TelegramBotReply {
    return this.formatReply(
      chatId,
      '🔒 Для безопасности бот не принимает API-ключи и не использует общий пул ключей. ' +
        'Если секрет уже был отправлен в чат, его следует немедленно отозвать у соответствующего провайдера.',
    );
  }

  private handleStats(chatId: number): TelegramBotReply {
    return this.formatReply(
      chatId,
      '🔬 *Статусы доверия RICIS-III:*\n\n' +
        '• `RICIS_PROVEN` — проверенный структурный RICIS-переход.\n' +
        '• `CORE_VERIFIED` — результат подтверждён Ricis.Core.\n' +
        '• `LEAN_VERIFIED` — результат подтверждён Lean с известной границей аксиом.\n' +
        '• `CLASSICAL_INHERITED` — применено классическое правило, не перекрытое RICIS.\n' +
        '• `HYPOTHESIS` — предположение.\n' +
        '• `REQUIRES_CORE_LEAN` — результат требует отдельной проверки Core или Lean.',
    );
  }

  private async handleSolveCommand(msg: TelegramIncomingMessage): Promise<TelegramBotReply> {
    const expression = msg.text.replace(/^\/(solve|ricis)\s*/i, '').trim();
    if (!expression) {
      return this.formatReply(
        msg.chatId,
        '⚠️ Укажите выражение для решения. Пример:\n`/solve (x^2 - 4)/(x - 2) при x=2`',
      );
    }
    return this.handleSolveExpression(msg, expression);
  }

  private async handleSolveExpression(
    msg: TelegramIncomingMessage,
    expression: string,
  ): Promise<TelegramBotReply> {
    const request: SingularitySolveRequest = {
      chatId: msg.chatId,
      user: msg.user,
      title: `Задача Telegram: ${expression.slice(0, 30)}`,
      targetFunction: expression,
      description: `Запрос на структурную обработку RICIS-III: ${expression}`,
      singularityHint: 'Применять RICIS-III с явной границей доверия результата.',
    };

    try {
      const result = await this.ricisEngine.solveSingularityTask(request);
      if (!result.success) {
        return this.formatReply(
          msg.chatId,
          `❌ Ошибка обработки RICIS-III:\n${this.escapeMarkdown(result.errorMessage || 'Неизвестный сбой')}`,
        );
      }

      const cacheNote = result.isCached ? '📦 *Извлечено из локальной базы знаний*\n\n' : '';
      const proofText = result.proofLatex.slice(0, 3800);
      return this.formatReply(
        msg.chatId,
        `${cacheNote}${proofText}\n\n*Статус доверия: ${result.verificationStatus}*`,
      );
    } catch {
      return this.formatReply(
        msg.chatId,
        '🚨 Внутренняя ошибка обработки. Результат не был объявлен доказанным.',
      );
    }
  }

  private formatReply(
    chatId: number,
    text: string,
    inlineKeyboard?: NonNullable<TelegramBotReply['replyMarkup']>['inlineKeyboard'],
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
