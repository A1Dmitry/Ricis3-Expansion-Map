const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const t = `import { TelegramLiveBotService } from "./src/services/telegramBot/TelegramLiveBotService";`;
code = code.replace(t, '');

const t2 = `const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (botToken) {
  try {
    const liveBot = TelegramLiveBotService.getInstance(botToken);
    console.log('[Telegram Bot] Background listener initialized in server');
  } catch (err) {
    console.error('[Telegram Bot] Failed to initialize background listener:', err);
  }
}`;
code = code.replace(t2, '');

fs.writeFileSync('server.ts', code);
console.log("Server patched");
