import { useEffect, useState } from 'react';
import { RouteSurfaceBoundary } from './ui/RouteSurfaceBoundary';
import { lazyNamedComponent } from './ui/lazyNamedComponent';
import { isCoreRecoveryRoute } from './services/coreRecovery';
import { UrlShareService } from './services/UrlShareService';
import { useMapStore } from './store/mapStore';

const Map3D = lazyNamedComponent(() => import('./ui/Map3D'), 'Map3D');
const CoreRecoveryPage = lazyNamedComponent(() => import('./ui/CoreRecoveryPage'), 'CoreRecoveryPage');
const RoadmapPage = lazyNamedComponent(() => import('./ui/RoadmapPage'), 'RoadmapPage');

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

  const roadmapParams = new URLSearchParams(locationSearch);
  if (roadmapParams.get('view') === 'roadmap') {
    return (
      <RouteSurfaceBoundary>
        <RoadmapPage
          contextNodeId={roadmapParams.get('node')}
          initialRootNodeId={roadmapParams.get('root')}
          onBackToMap={() => {
            UrlShareService.updateBrowserUrl({ roadmap: false, rootNodeId: null });
            setLocationSearch(window.location.search);
          }}
        />
      </RouteSurfaceBoundary>
    );
  }

  return (
    <RouteSurfaceBoundary>
      <Map3D />
    </RouteSurfaceBoundary>
  );
}
