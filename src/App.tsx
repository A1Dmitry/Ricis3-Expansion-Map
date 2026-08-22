import { useEffect, useState } from 'react';
import { Map3D } from './ui/Map3D';
import { CoreRecoveryPage } from './ui/CoreRecoveryPage';
import { RoadmapPage } from './ui/RoadmapPage';
import { isCoreRecoveryRoute } from './services/coreRecovery';
import { UrlShareService } from './services/UrlShareService';
import { useMapStore } from './store/mapStore';

export default function App() {
  const hydrate = useMapStore(s => s.hydrate);
  const hydrated = useMapStore(s => s.hydrated);
  const [error, setError] = useState<string | null>(null);
  const [locationSearch, setLocationSearch] = useState(() => window.location.search);

  useEffect(() => {
    hydrate().catch(e => {
      console.error(e);
      setError(String(e));
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
    return <CoreRecoveryPage />;
  }

  const roadmapParams = new URLSearchParams(locationSearch);
  if (roadmapParams.get('view') === 'roadmap') {
    return (
      <RoadmapPage
        contextNodeId={roadmapParams.get('node')}
        initialRootNodeId={roadmapParams.get('root')}
        onBackToMap={() => {
          UrlShareService.updateBrowserUrl({ roadmap: false, rootNodeId: null });
          setLocationSearch(window.location.search);
        }}
      />
    );
  }

  return <Map3D />;
}
