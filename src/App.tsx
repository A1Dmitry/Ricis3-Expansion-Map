import { useEffect, useState } from 'react';
import { Map3D } from './ui/Map3D';
import { CoreRecoveryPage } from './ui/CoreRecoveryPage';
import { isCoreRecoveryRoute } from './services/coreRecovery';
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

  return <Map3D />;
}
