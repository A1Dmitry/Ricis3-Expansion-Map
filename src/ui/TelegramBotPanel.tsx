import React, { useEffect, useRef, useState } from 'react';
import { TelegramBotCommandHandler } from '../services/telegramBot/TelegramBotCommandHandler';
import { RicisBotService } from '../services/telegramBot/RicisBotService';
import { ZustandRicisKnowledgeRepository } from '../services/telegramBot/ZustandRicisKnowledgeRepository';
import type { TelegramBotReply, TelegramIncomingMessage } from '../domain/telegramBot/types';
import { LatexRenderer } from './LatexRenderer';

type ChatMessage = {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  replyMarkup?: TelegramBotReply['replyMarkup'];
};

/** Local simulator for the safe Telegram command surface. It never receives API keys. */
export const TelegramBotPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [input, setInput] = useState('/solve (x^2 - 9)/(x - 3) при x=3');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome',
    sender: 'bot',
    text: '🤖 *RICIS-III Telegram simulator*\n\nВведите `/solve <выражение>`. Не передавайте в чат API-ключи, пароли или другие секреты. Каждый результат содержит явный статус доверия.',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const repositoryRef = useRef(new ZustandRicisKnowledgeRepository());
  const serviceRef = useRef(new RicisBotService(repositoryRef.current));
  const handlerRef = useRef(new TelegramBotCommandHandler(serviceRef.current));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isProcessing) return;
    setMessages(current => [...current, {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
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
      const reply = await handlerRef.current.handleMessage(incoming);
      setMessages(current => [...current, {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: reply.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        replyMarkup: reply.replyMarkup,
      }]);
    } catch {
      setMessages(current => [...current, {
        id: `error-${Date.now()}`,
        sender: 'bot',
        text: '❌ Внутренняя ошибка. Неподтверждённый результат не был объявлен доказанным.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
      <section className="w-full max-w-3xl bg-[#090d14] border border-cyan-500/50 rounded-xl shadow-2xl flex flex-col h-[85vh] max-h-[720px] overflow-hidden" onClick={event => event.stopPropagation()}>
        <header className="p-4 bg-[#05080e] border-b border-cyan-900/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">RICIS-III Telegram Simulator</h3>
            <p className="text-[10px] text-gray-400">Локальная симуляция без сбора, хранения и передачи пользовательских API-ключей.</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-sm font-bold px-2.5 py-1 rounded bg-neutral-900 border border-neutral-700">✕</button>
        </header>
        <div className="px-4 py-2 bg-amber-950/30 border-b border-amber-900/40 text-[11px] text-amber-200">
          Статус доказательства всегда указан в ответе. Шаблон LaTeX не является Lean-верификацией.
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#030509]">
          {messages.map(message => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${message.sender === 'user' ? 'bg-cyan-950 border border-cyan-700/80 text-cyan-100' : 'bg-[#0e131f] border border-cyan-900/60 text-gray-200'}`}>
                <LatexRenderer content={message.text} />
                <div className="text-[9px] text-gray-500 text-right mt-1 font-mono">{message.timestamp}</div>
              </div>
            </div>
          ))}
          {isProcessing && <div className="text-xs text-cyan-400 font-mono animate-pulse">Выполняется структурная обработка RICIS-III…</div>}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-3 bg-[#060911] border-t border-cyan-900/60 flex items-center gap-2">
          <input type="text" value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => event.key === 'Enter' && handleSend()} placeholder="/solve <формула> или /help" className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none font-mono" />
          <button type="button" onClick={handleSend} disabled={isProcessing || !input.trim()} className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 disabled:opacity-50 rounded-lg text-white font-bold text-xs">Отправить</button>
        </div>
      </section>
    </div>
  );
};
