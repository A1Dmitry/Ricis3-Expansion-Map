import React, { useState, useRef, useEffect } from 'react';
import { TelegramBotCommandHandler } from '../services/telegramBot/TelegramBotCommandHandler';
import { RicisBotService } from '../services/telegramBot/RicisBotService';
import type { TelegramIncomingMessage, TelegramBotReply } from '../domain/telegramBot/types';
import { useMapStore } from '../store/mapStore';
import { TokenPoolManager } from '../services/tokenPool/TokenPoolManager';
import { LatexRenderer } from './LatexRenderer';

type ChatMessage = {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  replyMarkup?: any;
};

export const TelegramBotPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const nodes = useMapStore(s => s.nodes);
  const solvedCount = nodes.filter(n => n.state === 'resolved').length;
  const totalMarket = nodes.reduce((acc, n) => acc + (n.economic?.marketGain || 0), 0);

  const [activeTab, setActiveTab] = useState<'bot' | 'pool' | 'api'>('bot');
  const [input, setInput] = useState('/solve (x^2 - 9)/(x - 3) при x=3');
  const [isProcessing, setIsProcessing] = useState(false);
  const [newApiKeyInput, setNewApiKeyInput] = useState('');
  const [contributeMessage, setContributeMessage] = useState<string | null>(null);

  const tokenPool = TokenPoolManager.getInstance();
  const poolStats = tokenPool.getPoolStats();
  const maskedKeys = tokenPool.listMaskedKeys();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text:
        '🤖 *Добро пожаловать в Telegram-Бот RICIS-III (v7.7)*\n\n' +
        '🔑 *Модель монетизации токенов ("Вскладчину" / Shared Key Pool):*\n' +
        '• Каждый пользователь получает **1 бесплатный запрос**.\n' +
        '• Добавьте свой ключ AI Studio (\`/addkey AIzaSy...\`), чтобы получить доступ ко всем ключам общего пула!\n\n' +
        'Попробуйте отправить команду:\n`/solve (x^2 - 9)/(x - 3) при x=3`',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'bot') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const ricisServiceRef = useRef(new RicisBotService());
  const commandHandlerRef = useRef(new TelegramBotCommandHandler(ricisServiceRef.current, tokenPool));

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isProcessing) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
      const incoming: TelegramIncomingMessage = {
        chatId: 777000,
        messageId: Date.now(),
        user: { id: 777000, firstName: 'Исследователь', username: 'ricis_researcher' },
        text,
        timestamp: Date.now(),
      };

      const reply: TelegramBotReply = await commandHandlerRef.current.handleMessage(incoming);

      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: reply.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        replyMarkup: reply.replyMarkup,
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          sender: 'bot',
          text: `❌ Ошибка обработки: ${String(err)}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContributeDirect = async () => {
    if (!newApiKeyInput.trim()) return;
    const res = await tokenPool.contributeKey(newApiKeyInput.trim(), 'ui-contributor');
    setContributeMessage(res.message);
    setNewApiKeyInput('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[#090d14] border border-cyan-500/50 rounded-xl shadow-2xl flex flex-col h-[85vh] max-h-[720px] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[#05080e] border-b border-cyan-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  RICIS-III Telegram Bot & Token Pool API
                </h3>
                <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/80 rounded uppercase">
                  ONLINE
                </span>
              </div>
              <p className="text-[10px] text-gray-400">
                Монетизация Токенов Вскладчину • 1 Запрос Free • Пул API Keys
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-sm font-bold px-2.5 py-1 rounded bg-neutral-900 border border-neutral-700 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#04060c] px-4 pt-2 border-b border-cyan-900/50 flex items-center gap-4 text-xs font-mono">
          <button
            onClick={() => setActiveTab('bot')}
            className={`pb-2 border-b-2 font-bold cursor-pointer transition-all ${
              activeTab === 'bot'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            💬 Telegram-Бот
          </button>
          <button
            onClick={() => setActiveTab('pool')}
            className={`pb-2 border-b-2 font-bold cursor-pointer transition-all ${
              activeTab === 'pool'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            🔑 Пул Ключей ("Вскладчину")
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`pb-2 border-b-2 font-bold cursor-pointer transition-all ${
              activeTab === 'api'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            🌐 REST API Specification
          </button>
        </div>

        {/* Tab 1: Bot Interface */}
        {activeTab === 'bot' && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#030509]">
            {/* Stats bar */}
            <div className="px-4 py-2 bg-cyan-950/30 border-b border-cyan-900/40 flex items-center justify-between text-[10px] text-cyan-300 font-mono">
              <span>Решено узлов через БД: <strong>{solvedCount}</strong></span>
              <span>Капитализация БД: <strong>${(totalMarket / 1e6).toFixed(1)}M</strong></span>
              <span className="text-emerald-400 font-bold">1 Free Req + Key Pool</span>
            </div>

            {/* Messages area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map(m => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-cyan-950 border border-cyan-700/80 text-cyan-100 rounded-br-none'
                        : 'bg-[#0e131f] border border-cyan-900/60 text-gray-200 rounded-bl-none shadow-lg'
                    }`}
                  >
                    <LatexRenderer content={m.text} />
                    {m.replyMarkup?.inlineKeyboard && (
                      <div className="mt-2.5 pt-2 border-t border-cyan-900/50 flex flex-wrap gap-2">
                        {m.replyMarkup.inlineKeyboard.flat().map((btn: any, idx: number) => (
                          <a
                            key={idx}
                            href={btn.url || '#'}
                            target={btn.url ? '_blank' : '_self'}
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-cyan-900/40 hover:bg-cyan-800/60 border border-cyan-700/60 rounded text-[10px] text-cyan-300 font-bold transition-colors inline-block"
                          >
                            {btn.text}
                          </a>
                        ))}
                      </div>
                    )}
                    <div className="text-[9px] text-gray-500 text-right mt-1 font-mono">
                      {m.timestamp}
                    </div>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-[#0e131f] border border-cyan-900/60 rounded-lg p-3 text-xs text-cyan-400 font-mono flex items-center gap-2 animate-pulse">
                    <span>⚡ Выполняю детерминированный прогон RICIS-III...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="p-3 bg-[#060911] border-t border-cyan-900/60 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Введите команду (/solve <формула>, /addkey <ключ>, /pool)..."
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none font-mono"
              />
              <button
                onClick={handleSend}
                disabled={isProcessing || !input.trim()}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 disabled:opacity-50 rounded-lg text-white font-bold text-xs transition-all shadow-md flex items-center gap-1 cursor-pointer"
              >
                <span>Отправить</span>
                <span>🚀</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Pool Management */}
        {activeTab === 'pool' && (
          <div className="flex-1 p-5 overflow-y-auto bg-[#030509] space-y-5 text-xs">
            <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-xl p-4">
              <h4 className="text-sm font-bold text-cyan-300 mb-1">
                💡 Принцип Монетизации: Коллективный Пул ("Вскладчину")
              </h4>
              <p className="text-gray-300 text-xs leading-relaxed">
                Каждый пользователь получает <strong>1 бесплатный запрос</strong>. Далее пользователь предоставляет свой персональный ключ Google AI Studio. Все внесенные ключи объединяются в защищенный пул. Покупая или принося 1 ключ, пользователь получает распределенный доступ ко всей мощности пула с авто-балансировкой и обходом 429 (Resource Exhausted).
              </p>
            </div>

            {/* Add Key Form */}
            <div className="bg-[#0d1322] border border-cyan-900/60 rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-white text-xs">➕ Добавить ключ AI Studio в общий пул</h4>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={newApiKeyInput}
                  onChange={e => setNewApiKeyInput(e.target.value)}
                  placeholder="Вставьте ваш Google AI Studio API Key (AIzaSy...)"
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-cyan-500 font-mono"
                />
                <button
                  onClick={handleContributeDirect}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 rounded text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Внести в Пул
                </button>
              </div>
              {contributeMessage && (
                <p className="text-emerald-400 font-mono text-[11px] bg-emerald-950/60 p-2 rounded border border-emerald-900">
                  {contributeMessage}
                </p>
              )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="bg-[#0a0f1d] border border-cyan-900/50 p-3 rounded-lg text-center">
                <div className="text-[10px] text-gray-400 uppercase">Активных Ключей</div>
                <div className="text-lg font-bold text-cyan-300 mt-1">{poolStats.totalActiveKeys}</div>
              </div>
              <div className="bg-[#0a0f1d] border border-cyan-900/50 p-3 rounded-lg text-center">
                <div className="text-[10px] text-gray-400 uppercase">Участников Вскладчину</div>
                <div className="text-lg font-bold text-emerald-400 mt-1">{poolStats.totalContributors}</div>
              </div>
              <div className="bg-[#0a0f1d] border border-cyan-900/50 p-3 rounded-lg text-center">
                <div className="text-[10px] text-gray-400 uppercase">Обработано Запросов</div>
                <div className="text-lg font-bold text-blue-300 mt-1">{poolStats.totalQueriesProcessed}</div>
              </div>
              <div className="bg-[#0a0f1d] border border-cyan-900/50 p-3 rounded-lg text-center">
                <div className="text-[10px] text-gray-400 uppercase">Cooldown (429)</div>
                <div className="text-lg font-bold text-amber-400 mt-1">{poolStats.totalCooldownKeys}</div>
              </div>
            </div>

            {/* Masked Keys List */}
            <div className="bg-[#080c16] border border-cyan-900/50 rounded-xl p-4">
              <h4 className="font-bold text-gray-300 text-xs mb-3">📋 Зарегистрированные Ключи Пула:</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-[11px]">
                {maskedKeys.length === 0 ? (
                  <p className="text-gray-500 italic">Пользовательских ключей еще не добавлено.</p>
                ) : (
                  maskedKeys.map((k, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-[#0e1526] p-2 rounded border border-cyan-900/40"
                    >
                      <span className="text-cyan-300 font-bold">{k.maskedKey}</span>
                      <span className="text-gray-400">Tier: {k.tier}</span>
                      <span className="text-emerald-400">Usages: {k.successCount}</span>
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded text-[9px] uppercase border border-emerald-800">
                        {k.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: REST API Documentation */}
        {activeTab === 'api' && (
          <div className="flex-1 p-5 overflow-y-auto bg-[#030509] space-y-4 font-mono text-xs text-gray-300">
            <div className="bg-[#0a0f1d] border border-cyan-900/60 p-4 rounded-xl">
              <h4 className="font-bold text-cyan-300 text-sm mb-2">🌐 REST API v1 Specification</h4>
              <p className="text-gray-400 text-xs leading-relaxed font-sans">
                Внешний REST API работает по аналогичной логике: 1 запрос бесплатно с клиентского ID, последующие — при передаче API-ключа или взносе в общий токен-пул.
              </p>
            </div>

            <div className="bg-[#080c16] border border-neutral-800 p-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-900 text-blue-200 rounded font-bold">POST</span>
                <span className="text-white font-bold">/api/v1/solve</span>
              </div>
              <p className="text-[11px] text-gray-400">Разрешить сингулярность через движок RICIS-III v7.7</p>
              <pre className="bg-black/60 p-2.5 rounded text-[11px] text-emerald-400 overflow-x-auto">
{`// Body (JSON):
{
  "targetFunction": "(x^2 - 4)/(x - 2) при x=2",
  "clientIdentifier": "my_client_id_123",
  "userProvidedKey": "AIzaSy..." // Необязательно (внесет ключ в пул)
}`}
              </pre>
            </div>

            <div className="bg-[#080c16] border border-neutral-800 p-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-900 text-emerald-200 rounded font-bold">POST</span>
                <span className="text-white font-bold">/api/v1/keys/contribute</span>
              </div>
              <p className="text-[11px] text-gray-400">Добавить ключ в коллективный пул</p>
              <pre className="bg-black/60 p-2.5 rounded text-[11px] text-cyan-300 overflow-x-auto">
{`// Body (JSON):
{
  "apiKey": "AIzaSyYourGoogleAIStudioKeyHere",
  "contributorId": "developer_or_user_id"
}`}
              </pre>
            </div>

            <div className="bg-[#080c16] border border-neutral-800 p-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-purple-900 text-purple-200 rounded font-bold">GET</span>
                <span className="text-white font-bold">/api/v1/keys/pool-stats</span>
              </div>
              <p className="text-[11px] text-gray-400">Получить статистику пула и список публично маскированных ключей</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
