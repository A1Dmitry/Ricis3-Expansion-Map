const fs = require('fs');
const path = 'src/ui/Map3D.tsx';
let code = fs.readFileSync(path, 'utf8');

const target = `<div className="pt-2 border-t border-neutral-800/40 flex items-center justify-between">
                          <span className="text-xs text-slate-300">Telegram Агент</span>
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/60">
                            АКТИВЕН
                          </span>
                        </div>`;

const replacement = `<div className="pt-2 border-t border-neutral-800/40 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-300">Telegram Агент</span>
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/60">
                              АКТИВЕН
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowTelegramBot(true)}
                            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs py-1.5 rounded transition-colors"
                          >
                            Открыть Telegram-интерфейс
                          </button>
                        </div>`;

code = code.replace(target, replacement);
fs.writeFileSync(path, code);
console.log("Replaced");
