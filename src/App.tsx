import { ContentButton } from './ui/components/ContentButton';
import { IconButton } from './ui/components/IconButton';
import { ArrowLeft as ButtonIconPanelTop } from 'lucide-react';
// ============================================================================
// MODIFIED APP CONTAINER WITH ACTIVE APPLET CENTRAL WORKSPACE (MVVM / DDD)
// Visual Studio / MS Word 2000 style layout:
// Compact Command Menu Bar at top -> Central Workspace Applet -> Deep-link support
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import { ShieldCheck } from 'lucide-react';
import { RouteSurfaceBoundary } from './ui/RouteSurfaceBoundary';
import { lazyNamedComponent } from './ui/lazyNamedComponent';
import { isCoreRecoveryRoute } from './services/coreRecovery';
import { useMapStore } from './store/mapStore';
import { CompactCommandMenuBar } from './ui/components/CompactCommandMenuBar';
import { AppletActionToolbar } from './ui/components/AppletActionToolbar';
import { TopProgressBar } from './ui/components/TopProgressBar';
import { AppletNavigationService } from './services/AppletNavigationService';
import type { AppletId } from './types/appletRegistry';
import type { CommandContext } from './types/commandTypes';
import { CommandRegistry } from './services/commandRegistry';
import {
  RICIS_COMMAND_EVENTS,
  subscribeRicisCommand,
} from './services/commandBus';
import { runSystemDiagnostics } from './services/systemDiagnostics';
import { APP_BUILD_LABEL } from './version';

const Map3D = lazyNamedComponent(() => import('./ui/Map3D'), 'Map3D');
const CoreRecoveryPage = lazyNamedComponent(() => import('./ui/CoreRecoveryPage'), 'CoreRecoveryPage');
const RoadmapPage = lazyNamedComponent(() => import('./ui/RoadmapPage'), 'RoadmapPage');
const KinematicEnginePage = lazyNamedComponent(() => import('./ui/KinematicEnginePage'), 'KinematicEnginePage');
const ProofGraphComparisonPage = lazyNamedComponent(() => import('./ui/ProofGraphComparisonPage'), 'ProofGraphComparisonPage');
const RicisSeedPage = lazyNamedComponent(() => import('./ui/RicisSeedPage'), 'RicisSeedPage');
const VoynichDecryptionPanel = lazyNamedComponent(() => import('./ui/VoynichDecryptionPanel'), 'VoynichDecryptionPanel');
const RicisProofConsoleModal = lazyNamedComponent(() => import('./ui/RicisProofConsoleModal'), 'RicisProofConsoleModal');
const AutoProverModal = lazyNamedComponent(() => import('./ui/AutoProverModal'), 'AutoProverModal');
const SettingsAppletPage = lazyNamedComponent(() => import('./ui/SettingsAppletPage'), 'SettingsAppletPage');
const ProofLogsApplet = lazyNamedComponent(() => import('./ui/ProofLogsApplet'), 'ProofLogsApplet');
const FactorizationApplet = lazyNamedComponent(() => import('./ui/FactorizationApplet'), 'FactorizationApplet');

function formatHydrationError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) {
    const candidate = error as Record<string, unknown>;
    if (typeof candidate.kind === 'string') {
      const details = Object.entries(candidate)
        .filter(([key]) => key !== 'kind' && (typeof candidate[key] === 'string' || Array.isArray(candidate[key])))
        .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join(',') : String(value)}`)
        .join('; ');
      return details ? `${candidate.kind}: ${details}` : candidate.kind;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return 'unknown_hydration_error';
    }
  }
  return String(error);
}

export default function App() {
  const hydrate = useMapStore(s => s.hydrate);
  const hydrated = useMapStore(s => s.hydrated);
  const [error, setError] = useState<string | null>(null);
  const [locationSearch, setLocationSearch] = useState(() => window.location.search);
  const [is3DMode, setIs3DMode] = useState(true);

  useEffect(() => {
    hydrate().catch(e => {
      console.error(e);
      setError(formatHydrationError(e));
    });
  }, [hydrate]);

  useEffect(() => {
    const onPopState = () => setLocationSearch(window.location.search);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const currentApplet = AppletNavigationService.resolveCurrentApplet(locationSearch);
  const selectedNodeId = new URLSearchParams(locationSearch).get('node');

  const handleSelectApplet = (applet: AppletId) => {
    // navigateTo() already syncs the URL (replaceState + popstate) exactly once;
    // a second URL-sync call from App duplicated history events and re-renders
    // on every navigation (BUG-09).
    AppletNavigationService.navigateTo(applet);
    setLocationSearch(window.location.search);
  };

  // Command-bus state feedback: pages report real runtime state so command
  // indicators (Play/Pause, crawler, 3D/2D) light up from live data.
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [isAutoProverRunning, setIsAutoProverRunning] = useState(false);
  const [diagnosticsToast, setDiagnosticsToast] = useState<string | null>(null);

  const handleRunDiagnostics = useCallback(async () => {
    const report = await runSystemDiagnostics(useMapStore.getState());
    setDiagnosticsToast(report.summaryMessage);
    setTimeout(() => {
      setDiagnosticsToast(null);
    }, 6500);
  }, []);

  useEffect(() => {
    const unsubscribers = [
      subscribeRicisCommand(RICIS_COMMAND_EVENTS.presentationModeChanged, detail => {
        setIs3DMode(Boolean(detail?.is3D));
      }),
      subscribeRicisCommand(RICIS_COMMAND_EVENTS.kinematicRunningChanged, detail => {
        setIsSimulationRunning(Boolean(detail?.isRunning));
      }),
      subscribeRicisCommand(RICIS_COMMAND_EVENTS.qaRunningChanged, detail => {
        setIsAutoProverRunning(Boolean(detail?.isRunning));
      }),
      subscribeRicisCommand(RICIS_COMMAND_EVENTS.runDiagnostics, () => {
        void handleRunDiagnostics();
      }),
    ];
    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, [handleRunDiagnostics]);

  // Commands dispatch exactly one bus event each (see commandRegistry);
  // applet pages subscribe via useRicisCommand. Context callbacks are
  // integration seams only — no duplicate dispatch from App anymore.
  const commandContext: CommandContext = {
    activeApplet: currentApplet,
    is3DMode,
    isSimulationRunning,
    isAutoProverRunning,
    onSelectApplet: handleSelectApplet,
    onRunDiagnostics: handleRunDiagnostics,
  };

  // Global Keyboard Shortcuts (Alt+1..9, Space, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input, textarea or contenteditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        const keyNum = parseInt(e.key, 10);
        const appletMap: Record<number, AppletId> = {
          1: 'map',
          2: 'kinematic',
          3: 'seed',
          4: 'comparison',
          5: 'roadmap',
          6: 'voynich',
          7: 'terminal',
          8: 'qa-tests',
          9: 'settings',
          0: 'proof-logs',
        };
        if (keyNum in appletMap) {
          e.preventDefault();
          handleSelectApplet(appletMap[keyNum]!);
        }
      }

      if (e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleSelectApplet('p-vs-np');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [locationSearch]);

  if (error) {
    return (
      <div className="w-full h-screen bg-[#050505] text-red-400 flex items-center justify-center font-mono text-sm">
        Ошибка загрузки БД: {error}
      </div>
    );
  }

  if (!hydrated) {
    return (
      <div className="w-full h-screen bg-[#050505] text-cyan-400 flex items-center justify-center font-mono text-xs tracking-widest uppercase">
        RICIS-III // loading map from IndexedDB…
      </div>
    );
  }

  if (isCoreRecoveryRoute(locationSearch)) {
    return (
      <RouteSurfaceBoundary>
        <CoreRecoveryPage />
      </RouteSurfaceBoundary>
    );
  }

  const renderActiveApplet = () => {
    switch (currentApplet) {
      case 'kinematic':
        return (
          <KinematicEnginePage
            onBackToMap={() => handleSelectApplet('map')}
          />
        );
      case 'comparison':
        return (
          <ProofGraphComparisonPage
            onBackToMap={() => handleSelectApplet('map')}
          />
        );
      case 'seed':
        return (
          <RicisSeedPage
            onBackToMap={() => handleSelectApplet('map')}
          />
        );
      case 'roadmap': {
        const roadmapParams = new URLSearchParams(locationSearch);
        if (roadmapParams.get('view') === 'roadmap' || currentApplet === 'roadmap') {
          return (
            <RoadmapPage
              contextNodeId={roadmapParams.get('node')}
              initialRootNodeId={roadmapParams.get('root')}
              initialMode={roadmapParams.get('mode')}
              onBackToMap={() => handleSelectApplet('map')}
              onNavigateToMap={(_nodeId, _mode) => handleSelectApplet('map')}
            />
          );
        }
        return <Map3D />;
      }
      case 'voynich':
        return (
          <div className="w-full h-full overflow-y-auto p-4 bg-[#070b14]">
            <div className="max-w-6xl mx-auto mb-4 flex items-center justify-between">
              <ContentButton
                onClick={() => handleSelectApplet('map')}
                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors flex items-center gap-1.5"
              >
                ← Вернуться к 3D Карте
              </ContentButton>
            </div>
            <VoynichDecryptionPanel onClose={() => handleSelectApplet('map')} />
          </div>
        );
      case 'terminal':
        return (
          <div className="w-full h-full overflow-y-auto p-4 bg-[#070b14]">
            <div className="max-w-6xl mx-auto mb-4 flex items-center justify-between">
              <ContentButton
                onClick={() => handleSelectApplet('map')}
                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors flex items-center gap-1.5"
              >
                ← Вернуться к 3D Карте
              </ContentButton>
            </div>
            <RicisProofConsoleModal
              isOpen={true}
              onClose={() => handleSelectApplet('map')}
            />
          </div>
        );
      case 'proof-logs':
        return (
          <ProofLogsApplet
            activeNodeId={selectedNodeId}
            onBackToMap={() => handleSelectApplet('map')}
          />
        );
      case 'p-vs-np':
        return <FactorizationApplet />;
      case 'qa-tests':
        return (
          <div className="w-full h-full overflow-y-auto p-4 bg-[#070b14]">
            <div className="max-w-6xl mx-auto mb-4 flex items-center justify-between">
              <ContentButton
                onClick={() => handleSelectApplet('map')}
                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors flex items-center gap-1.5"
              >
                ← Вернуться к 3D Карте
              </ContentButton>
            </div>
            <AutoProverModal
              isOpen={true}
              onClose={() => handleSelectApplet('map')}
            />
          </div>
        );
      case 'settings':
        return (
          <SettingsAppletPage
            onBackToMap={() => handleSelectApplet('map')}
          />
        );
      case 'map':
      default:
        return <Map3D />;
    }
  };

  return (
    <RouteSurfaceBoundary>
      <div className="w-full h-screen flex flex-col overflow-hidden bg-[#050505] text-slate-100 font-sans">
        {/* Top Compact Command Menu Bar (Office / Visual Studio style) */}
        <CompactCommandMenuBar
          activeApplet={currentApplet}
          onSelectApplet={handleSelectApplet}
          commandContext={commandContext}
          appBuildLabel={APP_BUILD_LABEL}
        />

        {/* Global Progress Bar (IProgressBar) for Long-Running Tasks (>2s) */}
        <TopProgressBar />

        {/* Dynamic Context-Aware Action Toolbar */}
        <AppletActionToolbar
          activeApplet={currentApplet}
          commandContext={commandContext}
        />

        {/* Central Workspace: Replaces with the active applet */}
        <div className="flex-1 relative min-h-0 overflow-hidden">
          {renderActiveApplet()}
        </div>

        {/* System Diagnostics Toast Feedback */}
        {diagnosticsToast && (
          <div
            role="status"
            aria-live="polite"
            data-testid="system-diagnostics-toast"
            className="fixed bottom-4 right-4 z-50 max-w-md bg-slate-900/95 border border-cyan-500/60 text-cyan-200 text-xs px-4 py-2.5 rounded-lg shadow-2xl backdrop-blur flex items-center gap-2.5 transition-all"
          >
            <ShieldCheck size={16} className="text-cyan-400 shrink-0" />
            <span className="flex-1 font-mono text-[11px] leading-relaxed">{diagnosticsToast}</span>
            <ContentButton
              type="button"
              onClick={() => setDiagnosticsToast(null)}
              className="text-slate-400 hover:text-white text-xs px-1"
            >
              ✕
            </ContentButton>
          </div>
        )}
      </div>
    </RouteSurfaceBoundary>
  );
}
