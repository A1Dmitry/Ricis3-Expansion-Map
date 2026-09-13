// ============================================================================
// MODIFIED APP CONTAINER WITH ACTIVE APPLET CENTRAL WORKSPACE (MVVM / DDD)
// Visual Studio / MS Word 2000 style layout:
// Compact Command Menu Bar at top -> Central Workspace Applet -> Deep-link support
// ============================================================================

import React, { useEffect, useState } from 'react';
import { RouteSurfaceBoundary } from './ui/RouteSurfaceBoundary';
import { lazyNamedComponent } from './ui/lazyNamedComponent';
import { isCoreRecoveryRoute } from './services/coreRecovery';
import { UrlShareService } from './services/UrlShareService';
import { useMapStore } from './store/mapStore';
import { CompactCommandMenuBar } from './ui/components/CompactCommandMenuBar';
import { AppletNavigationService } from './services/AppletNavigationService';
import type { AppletId } from './types/appletRegistry';
import { APP_BUILD_LABEL } from './version';

const Map3D = lazyNamedComponent(() => import('./ui/Map3D'), 'Map3D');
const CoreRecoveryPage = lazyNamedComponent(() => import('./ui/CoreRecoveryPage'), 'CoreRecoveryPage');
const RoadmapPage = lazyNamedComponent(() => import('./ui/RoadmapPage'), 'RoadmapPage');
const KinematicEnginePage = lazyNamedComponent(() => import('./ui/KinematicEnginePage'), 'KinematicEnginePage');
const ProofGraphComparisonPage = lazyNamedComponent(() => import('./ui/ProofGraphComparisonPage'), 'ProofGraphComparisonPage');
const RicisSeedPage = lazyNamedComponent(() => import('./ui/RicisSeedPage'), 'RicisSeedPage');

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

  const currentApplet = AppletNavigationService.resolveCurrentApplet(locationSearch);

  const handleSelectApplet = (applet: AppletId) => {
    AppletNavigationService.navigateTo(applet);
    UrlShareService.updateBrowserUrl({ applet: applet === 'map' ? undefined : applet });
    setLocationSearch(window.location.search);
  };

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
      case 'roadmap':
        const roadmapParams = new URLSearchParams(locationSearch);
        return (
          <RoadmapPage
            contextNodeId={roadmapParams.get('node')}
            initialRootNodeId={roadmapParams.get('root')}
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
          appBuildLabel={APP_BUILD_LABEL}
        />

        {/* Central Workspace: Replaces with the active applet */}
        <div className="flex-1 relative min-h-0 overflow-hidden">
          {renderActiveApplet()}
        </div>
      </div>
    </RouteSurfaceBoundary>
  );
}
