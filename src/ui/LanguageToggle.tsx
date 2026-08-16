import React from 'react';
import { useI18nStore } from '../store/useI18nStore';
import { Languages } from 'lucide-react';

export function LanguageToggle() {
  const { locale, setLocale } = useI18nStore();

  return (
    <div className="flex items-center bg-neutral-900 border border-neutral-700/80 rounded-md p-0.5 text-xs font-mono select-none">
      <button
        type="button"
        onClick={() => setLocale('ru')}
        className={`px-2 py-1 rounded transition-all cursor-pointer font-bold ${
          locale === 'ru'
            ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Русский язык"
      >
        RU
      </button>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`px-2 py-1 rounded transition-all cursor-pointer font-bold ${
          locale === 'en'
            ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="English Language"
      >
        EN
      </button>
    </div>
  );
}
