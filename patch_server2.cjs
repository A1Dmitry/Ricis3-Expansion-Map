const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const t = `    // Start live Telegram Bot polling
    TelegramLiveBotService.getInstance().start().catch((err) => {
      console.warn("[Telegram Live Bot] Initial connection error:", err);
    });`;
code = code.replace(t, '');

fs.writeFileSync('server.ts', code);
console.log("Server patched 2");
