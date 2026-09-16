// ============================================================================
// MODIFIED APP CONTAINER WITH ACTIVE APPLET CENTRAL WORKSPACE (MVVM / DDD)
// Visual Studio / MS Word 2000 style layout:
// Compact Command Menu Bar at top -> Central Workspace Applet -> Deep-link support
// ============================================================================

import React, { useEffect, useState } from 'react';
import { RouteSurfaceBoundary } from './ui/RouteSurfaceBoundary';
import { lazyNamedComponent } from './ui/lazyNamedComponent';
import { isCoreRecoveryRoute } from './services/coreRecovery';
import { useMapStore } from './store/mapStore';
import { useCommandStateStore } from './store/useCommandStateStore';
import { CompactCommandMenuBar } from './ui/components/CompactCommandMenuBar';
import { AppletActionToolbar } from './ui/components/AppletActionToolbar';
import { AppletNavigationService } from './services/AppletNavigationService';
import { SettingsApplet } from './ui/SettingsApplet';
import type { AppletId } from './types/appletRegistry';
import type { CommandContext } from './types/commandTypes';
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
  // BUG-02: shared command-bus state (read by the command context for
  // active indicators, owned by the pages that perform the actions).
  const is3DMode = useCommandStateStore(s => s.is3DMode);
  const toggle3DMode = useCommandStateStore(s => s.toggle3DMode);
  const isSimulationRunning = useCommandStateStore(s => s.isSimulationRunning);
  const isAutoProverRunning = useCommandStateStore(s => s.isAutoProverRunning);

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

  const handleSelectApplet = (applet: AppletId) => {
    // BUG-09: navigateTo() already syncs the URL (replaceState + popstate);
    // the second updateBrowserUrl call here caused a double URL update on
    // every applet switch.
    AppletNavigationService.navigateTo(applet);
    setLocationSearch(window.location.search);
  };

  // BUG-02: global.diagnostics — run the real system audit (mapStore) and
  // surface its report on the Map3D audit panel.
  useEffect(() => {
    const onRunDiagnostics = () => {
      void useMapStore.getState().runSystemAudit().then(report => {
        console.info(
          `[diagnostics] System audit completed: valid=${report.isValid}, inspected=${report.totalInspected}, ` +
          `orphans=${report.orphans.length}, brokenEdges=${report.brokenEdges.length}, duplicates=${report.duplicates.length}`,
        );
        if (AppletNavigationService.getActiveApplet() !== 'map') {
          AppletNavigationService.navigateTo('map');
          setLocationSearch(window.location.search);
        }
      });
    };
    window.addEventListener('ricis:run-diagnostics', onRunDiagnostics);
    return () => window.removeEventListener('ricis:run-diagnostics', onRunDiagnostics);
  }, []);

  const commandContext: CommandContext = {
    activeApplet: currentApplet,
    is3DMode,
    isSimulationRunning,
    isAutoProverRunning,
    onSelectApplet: handleSelectApplet,
    onToggle3DMode: () => {
      // BUG-02: store-driven presentation switch; Map3D subscribes to the
      // same state and applies the camera projection.
      toggle3DMode();
    },
    onResetCamera: () => {
      window.dispatchEvent(new CustomEvent('ricis:reset-camera'));
    },
    onSearchNodes: () => {
      window.dispatchEvent(new CustomEvent('ricis:open-search'));
    },
    onToggleSimulation: () => {
      window.dispatchEvent(new CustomEvent('ricis:kinematic-toggle-play'));
    },
    onResetSimulation: () => {
      window.dispatchEvent(new CustomEvent('ricis:kinematic-reset'));
    },
    onStepSimulation: () => {
      window.dispatchEvent(new CustomEvent('ricis:kinematic-step'));
    },
    onClearTerminal: () => {
      window.dispatchEvent(new CustomEvent('ricis:terminal-clear'));
    },
    onRunProver: () => {
      window.dispatchEvent(new CustomEvent('ricis:qa-run-floodfill'));
    },
    onRunDiagnostics: () => {
      window.dispatchEvent(new CustomEvent('ricis:run-diagnostics'));
    },
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
        };
        if (keyNum in appletMap) {
          e.preventDefault();
          handleSelectApplet(appletMap[keyNum]!);
        }
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
              onBackToMap={() => handleSelectApplet('map')}
            />
          );
        }
        return <Map3D />;
      }
      case 'voynich':
        return (
          <div className="w-full h-full overflow-y-auto p-4 bg-[#070b14]">
            <div className="max-w-6xl mx-auto mb-4 flex items-center justify-between">
              <button
                onClick={() => handleSelectApplet('map')}
                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors flex items-center gap-1.5"
              >
                ← Вернуться к 3D Карте
              </button>
            </div>
            <VoynichDecryptionPanel onClose={() => handleSelectApplet('map')} />
          </div>
        );
      case 'terminal':
        return (
          <div className="w-full h-full overflow-y-auto p-4 bg-[#070b14]">
            <div className="max-w-6xl mx-auto mb-4 flex items-center justify-between">
              <button
                onClick={() => handleSelectApplet('map')}
                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors flex items-center gap-1.5"
              >
                ← Вернуться к 3D Карте
              </button>
            </div>
            <RicisProofConsoleModal
              isOpen={true}
              onClose={() => handleSelectApplet('map')}
            />
          </div>
        );
      case 'qa-tests':
        return (
          <div className="w-full h-full overflow-y-auto p-4 bg-[#070b14]">
            <div className="max-w-6xl mx-auto mb-4 flex items-center justify-between">
              <button
                onClick={() => handleSelectApplet('map')}
                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors flex items-center gap-1.5"
              >
                ← Вернуться к 3D Карте
              </button>
            </div>
            <AutoProverModal
              isOpen={true}
              onClose={() => handleSelectApplet('map')}
            />
          </div>
        );
      case 'settings':
        return (
          <div className="w-full h-full overflow-y-auto p-4 bg-[#070b14]">
            <div className="max-w-6xl mx-auto mb-4 flex items-center justify-between">
              <button
                onClick={() => handleSelectApplet('map')}
                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors flex items-center gap-1.5"
              >
                ← Вернуться к 3D Карте
              </button>
            </div>
            {/* BUG-03: full-featured settings (adaptive roles, panel
                visibility, physics) — the same instance Map3D composes. */}
            <SettingsApplet onClose={() => handleSelectApplet('map')} />
          </div>
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

        {/* Dynamic Context-Aware Action Toolbar */}
        <AppletActionToolbar
          activeApplet={currentApplet}
          commandContext={commandContext}
        />

        {/* Central Workspace: Replaces with the active applet */}
        <div className="flex-1 relative min-h-0 overflow-hidden">
          {renderActiveApplet()}
        </div>
      </div>
    </RouteSurfaceBoundary>
  );
}
