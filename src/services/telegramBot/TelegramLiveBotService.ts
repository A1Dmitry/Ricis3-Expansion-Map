/**
 * Live Telegram Bot Listener (Polling Engine)
 * Connects the real Telegram Bot API (@Ricis3bot) directly to RICIS-III Analytical Engine.
 */

import { TelegramBotCommandHandler } from './TelegramBotCommandHandler';
import { RicisBotService } from './RicisBotService';
import type { TelegramIncomingMessage } from '../../domain/telegramBot/types';

export class TelegramLiveBotService {
  private static instance: TelegramLiveBotService | null = null;
  private token: string;
  private isPolling = false;
  private offset = 0;
  private commandHandler: TelegramBotCommandHandler;

  private constructor(botToken: string) {
    this.token = botToken;
    const engine = new RicisBotService();
    this.commandHandler = new TelegramBotCommandHandler(engine);
  }

  public static getInstance(token?: string): TelegramLiveBotService {
    const activeToken = token || process.env.TELEGRAM_BOT_TOKEN || '8953522240:AAHGlxxe1b4Vzdwajf0HnR5_tboKTcRFUpY';
    if (!TelegramLiveBotService.instance) {
      TelegramLiveBotService.instance = new TelegramLiveBotService(activeToken);
    }
    return TelegramLiveBotService.instance;
  }

  public async start(): Promise<void> {
    if (this.isPolling) return;
    this.isPolling = true;

    console.log(`[Telegram Live Bot] Initializing @Ricis3bot with token ${this.token.slice(0, 10)}...`);

    // 1. Set Bot Commands & Description in Telegram
    await this.setupBotMetadata();

    // 2. Start Long-Polling Loop
    this.pollLoop();
  }

  private async setupBotMetadata(): Promise<void> {
    try {
      const baseUrl = `https://api.telegram.org/bot${this.token}`;

      // Set My Commands
      await fetch(`${baseUrl}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commands: [
            { command: 'solve', description: 'Разрешить сингулярность и создать доказательство Lean 4' },
            { command: 'addkey', description: 'Добавить API-ключ в пул (вскладчину) для безлимита' },
            { command: 'pool', description: 'Статистика токен-пула и активность ключей' },
            { command: 'stats', description: 'Состояние базы знаний RICIS-III v7.7' },
            { command: 'help', description: 'Справка по аксиоматике и командам' },
          ],
        }),
      });

      // Set Short Description
      await fetch(`${baseUrl}/setMyShortDescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          short_description: 'RICIS-III v7.7: Аксиоматический аналитический движок разрешения сингулярностей за O(1).',
        }),
      });

      // Set Description
      await fetch(`${baseUrl}/setMyDescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description:
            'Официальный Telegram-бот системы RICIS-III (Recursive Indexed Calculus of Identity and Singularity v7.7).\n\n' +
            'Автор: Дмитрий В. Алейников (ORCID: 0009-0004-3226-7700).\n\n' +
            '• Разрешение неопределенностей (0/0, 0*inf, inf-inf) без пределов за O(1).\n' +
            '• Автоматическое создание формальных доказательств в Lean 4 и LaTeX.\n' +
            '• Коллективный токен-пул "Вскладчину" с бесплатным DRY-кэшированием для участников.',
        }),
      });

      console.log('[Telegram Live Bot] Metadata & commands set successfully!');
    } catch (err) {
      console.warn('[Telegram Live Bot] Failed to set bot metadata:', err);
    }
  }

  private async pollLoop(): Promise<void> {
    const baseUrl = `https://api.telegram.org/bot${this.token}`;

    while (this.isPolling) {
      try {
        const res = await fetch(`${baseUrl}/getUpdates?offset=${this.offset}&timeout=20`, {
          method: 'GET',
        });

        if (!res.ok) {
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }

        const data: any = await res.json();
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            this.offset = update.update_id + 1;
            this.processUpdate(update);
          }
        }
      } catch (err) {
        console.warn('[Telegram Live Bot] Polling error, retrying in 3s...', err);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  private async processUpdate(update: any): Promise<void> {
    const message = update.message || update.edited_message;
    if (!message || !message.chat) return;

    const chatId = message.chat.id;
    const text = message.text || '';
    const user = message.from || {};

    const incoming: TelegramIncomingMessage = {
      messageId: message.message_id,
      chatId,
      user: {
        id: user.id || chatId,
        firstName: user.first_name || 'Ученый',
        username: user.username,
      },
      text,
      timestamp: message.date ? message.date * 1000 : Date.now(),
    };

    console.log(`[Telegram Live Bot] Incoming from @${user.username || user.id}: "${text}"`);

    try {
      const reply = await this.commandHandler.handleMessage(incoming);
      await this.sendTelegramReply(chatId, reply);
    } catch (err) {
      console.error('[Telegram Live Bot] Error handling update:', err);
      await this.sendTelegramMessage(chatId, `❌ Ошибка обработки запроса: ${String(err)}`);
    }
  }

  private async sendTelegramReply(chatId: number, reply: any): Promise<void> {
    const baseUrl = `https://api.telegram.org/bot${this.token}`;

    const formattedText = this.sanitizeForTelegramMarkdown(reply.text || '');

    const body: any = {
      chat_id: chatId,
      text: formattedText,
      parse_mode: 'Markdown',
    };

    if (reply.replyMarkup) {
      body.reply_markup = reply.replyMarkup;
    }

    try {
      const res = await fetch(`${baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // If Telegram returns 400 due to Markdown formatting error, retry as plain text
      if (!res.ok) {
        body.parse_mode = undefined;
        body.text = reply.text;
        await fetch(`${baseUrl}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
    } catch (err) {
      console.error('[Telegram Live Bot] Send error:', err);
    }
  }

  private sanitizeForTelegramMarkdown(text: string): string {
    // Preserve code blocks (```...```) and inline code (`...`)
    const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g);
    return parts
      .map((part, idx) => {
        // Inside code block/inline code, return as is
        if (idx % 2 === 1) return part;
        // Outside code blocks, escape lone or math underscores so Telegram doesn't treat them as unclosed italic tags
        return part.replace(/(?<!\\)_/g, '\\_');
      })
      .join('');
  }

  private async sendTelegramMessage(chatId: number, text: string): Promise<void> {
    const baseUrl = `https://api.telegram.org/bot${this.token}`;
    await fetch(`${baseUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    }).catch(() => {});
  }
}
