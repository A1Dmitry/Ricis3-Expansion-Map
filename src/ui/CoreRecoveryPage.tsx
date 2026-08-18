import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, Clipboard, RefreshCw, ServerCrash, ShieldAlert } from 'lucide-react';
import {
  probeRicisCoreHealth,
  readStoredCoreRecovery,
  returnFromCoreRecovery,
  type StoredCoreRecovery,
} from '../services/coreRecovery';

interface RecoveryStep {
  readonly title: string;
  readonly detail: string;
  readonly command?: string;
}

function recoveryTitle(code: StoredCoreRecovery['code']): string {
  switch (code) {
    case 'CORE_UNAVAILABLE':
      return 'Ricis.Core недоступно';
    case 'CORE_INPUT_REJECTED':
      return 'Ricis.Core отклонил выражение';
    case 'CORE_INVALID_RESPONSE':
      return 'Ответ Ricis.Core не прошёл проверку';
    default:
      return 'Инфраструктура Ricis.Core не завершила запрос';
  }
}

function recoverySteps(recovery: StoredCoreRecovery): readonly RecoveryStep[] {
  if (recovery.code === 'CORE_INPUT_REJECTED') {
    return [
      {
        title: 'Проверьте форму выражения',
        detail: 'Core принимает ограниченное lambda-выражение вида x => <математическое выражение>.',
      },
      {
        title: 'Используйте поддерживаемую грамматику',
        detail: 'Допустимы +, -, *, /, %, ^, скобки, pi, e и математические функции Core: Sin, Cos, Exp, Log, Sqrt, Abs, Pow, Min, Max.',
      },
      {
        title: 'Не используйте legacy-монолиты fallback',
        detail: 'Строка вида 0_5 * inf_3 не является lambda-входом C# Core и не будет автоматически преобразована TypeScript-кодом.',
      },
      {
        title: 'Исправьте ввод и повторите расчёт',
        detail: recovery.diagnostic.parserPosition === undefined
          ? 'Вернитесь к исходному экрану, скорректируйте выражение и запустите Core снова.'
          : `Core указал позицию ${recovery.diagnostic.parserPosition}. Исправьте выражение около этой позиции и повторите расчёт.`,
      },
    ];
  }

  if (recovery.code === 'CORE_UNAVAILABLE') {
    return [
      {
        title: 'Убедитесь, что математический результат не был создан',
        detail: 'Это безопасное состояние: TypeScript fallback не использовался, поэтому инвариант, trace и proof отсутствуют.',
      },
      {
        title: 'Повторите проверку Core',
        detail: 'Кнопка ниже выполняет только health-check C# runtime и не запускает fallback.',
      },
      {
        title: 'В локальном режиме запустите C# API',
        detail: 'Откройте Ricis.Core solution и запустите Web API на локальном порту.',
        command: 'dotnet run --project Ricis.WebApi/Ricis.WebApi.csproj --urls http://localhost:5044',
      },
      {
        title: 'Проверьте health endpoint',
        detail: 'Откройте http://localhost:5044/health. Контролируемый ответ должен содержать service Ricis.WebApi и status ok.',
      },
      {
        title: 'Учитывайте ограничение GitHub Pages',
        detail: 'Статический Pages не запускает .NET DLL. Для публичного расчёта требуется развёрнутый C# API либо настоящий browser-WASM host Ricis.Core.',
      },
    ];
  }

  if (recovery.code === 'CORE_INVALID_RESPONSE') {
    return [
      {
        title: 'Повторите health-check',
        detail: 'Проверка ниже определит, доступен ли Core runtime без запуска вычисления.',
      },
      {
        title: 'Не принимайте неполный ответ за инвариант',
        detail: 'Приложение намеренно не создало математический результат, trace или proof из неполного Core payload.',
      },
      {
        title: 'Передайте безопасную диагностику администратору',
        detail: 'Скопируйте summary: он содержит только код, точку вызова и время, без выражения, токенов и stack trace.',
      },
    ];
  }

  return [
    {
      title: 'Повторите проверку Core',
      detail: 'Проверка ниже обращается только к health endpoint и не запускает TypeScript fallback.',
    },
    {
      title: 'Проверьте развертывание Core API',
      detail: 'В локальном режиме убедитесь, что Ricis.WebApi запущен. В развернутой среде передайте администратору безопасную диагностику.',
    },
    {
      title: 'Повторите расчёт только после ready status',
      detail: 'До готовности C# Core приложение не создаёт математический инвариант, trace или proof.',
    },
  ];
}

export function CoreRecoveryPage() {
  const recovery = useMemo(() => readStoredCoreRecovery(window.location.search), []);
  const [probeState, setProbeState] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [copied, setCopied] = useState(false);

  const onProbe = async () => {
    setProbeState('checking');
    const result = await probeRicisCoreHealth();
    setProbeState(result.available ? 'available' : 'unavailable');
  };

  const onCopy = async () => {
    const summary = [
      `RICIS Core recovery code: ${recovery.code}`,
      `Origin: ${recovery.diagnostic.origin}`,
      `Runtime: ${recovery.diagnostic.runtime}`,
      `Occurred at: ${new Date(recovery.diagnostic.occurredAt).toISOString()}`,
      recovery.diagnostic.httpStatus === undefined ? null : `HTTP status: ${recovery.diagnostic.httpStatus}`,
      recovery.diagnostic.parserPosition === undefined ? null : `Parser position: ${recovery.diagnostic.parserPosition}`,
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const steps = recoverySteps(recovery);

  return (
    <main className="min-h-screen bg-[#050505] text-slate-100 px-4 py-8 font-sans">
      <section className="mx-auto max-w-3xl rounded-2xl border border-amber-700/50 bg-[#0d1117] shadow-2xl shadow-black/40 overflow-hidden">
        <header className="border-b border-amber-900/50 bg-amber-950/20 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-amber-600/50 bg-amber-950/50 p-2 text-amber-300">
              <ServerCrash size={24} aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-amber-400">RICIS-III Core recovery</p>
              <h1 className="mt-1 text-xl font-semibold text-white">{recoveryTitle(recovery.code)}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">{recovery.userMessage}</p>
            </div>
          </div>
        </header>

        <div className="space-y-6 p-6">
          <div className="rounded-xl border border-red-900/60 bg-red-950/20 p-4">
            <div className="flex gap-2 text-red-300">
              <ShieldAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <h2 className="font-semibold">Математический результат не создан</h2>
                <p className="mt-1 text-sm leading-relaxed text-red-100/90">
                  TypeScript fallback не использовался. Нет инварианта, фазовой трассировки, proof-артефакта и изменения статуса узла на основании этой ошибки.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded-lg border border-neutral-800 bg-black/30 p-3">
              <span className="block text-[9px] uppercase tracking-wider text-slate-500">Код</span>
              <span className="mt-1 block font-mono text-cyan-300">{recovery.code}</span>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-black/30 p-3">
              <span className="block text-[9px] uppercase tracking-wider text-slate-500">Точка вызова</span>
              <span className="mt-1 block font-mono text-slate-200">{recovery.diagnostic.origin}</span>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-black/30 p-3">
              <span className="block text-[9px] uppercase tracking-wider text-slate-500">Runtime</span>
              <span className="mt-1 block font-mono text-slate-200">{recovery.diagnostic.runtime}</span>
            </div>
          </div>

          <section>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <AlertTriangle size={17} className="text-amber-300" aria-hidden="true" />
              Как восстановить работу
            </h2>
            <ol className="mt-3 space-y-3">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-3 rounded-xl border border-neutral-800 bg-black/20 p-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan-700/70 bg-cyan-950/40 font-mono text-xs text-cyan-300">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-slate-100">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-300">{step.detail}</p>
                    {step.command && (
                      <code className="mt-3 block overflow-x-auto rounded-md border border-neutral-700 bg-black/60 p-3 text-xs text-emerald-300">
                        {step.command}
                      </code>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {probeState !== 'idle' && (
            <div className={`rounded-lg border p-3 text-sm ${probeState === 'available'
              ? 'border-emerald-800 bg-emerald-950/30 text-emerald-200'
              : probeState === 'unavailable'
                ? 'border-red-900 bg-red-950/30 text-red-200'
                : 'border-cyan-900 bg-cyan-950/20 text-cyan-200'}`}>
              {probeState === 'checking' && 'Проверка health endpoint Ricis.Core…'}
              {probeState === 'available' && 'Ricis.Core сообщил ready status. Вернитесь к карте и повторите расчёт.'}
              {probeState === 'unavailable' && 'Health endpoint пока не подтвердил доступность Core. TypeScript fallback по-прежнему не используется.'}
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-neutral-800 pt-5 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={onProbe}
              disabled={probeState === 'checking'}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-700 bg-cyan-950/50 px-4 py-2.5 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-900/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} className={probeState === 'checking' ? 'animate-spin' : ''} aria-hidden="true" />
              Повторить проверку Core
            </button>
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-neutral-800"
            >
              {copied ? <Check size={16} className="text-emerald-300" aria-hidden="true" /> : <Clipboard size={16} aria-hidden="true" />}
              {copied ? 'Диагностика скопирована' : 'Скопировать безопасную диагностику'}
            </button>
            <button
              type="button"
              onClick={returnFromCoreRecovery}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-neutral-900 hover:text-white"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Вернуться к карте
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
