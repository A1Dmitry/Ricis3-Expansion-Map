const fs = require('fs');
const path = 'src/ui/Map3D.tsx';
let code = fs.readFileSync(path, 'utf8');

const target1 = `  const removeFromHistory = (e: React.MouseEvent, itemToRemove: string) => {
    e.stopPropagation();
    setSearchHistory(prev => {
      const next = prev.filter(item => item !== itemToRemove);
      try {
        localStorage.setItem('ricis_search_history', JSON.stringify(next));
      } catch {}
      return next;
    });
  };`;

const target1Replacement = `  const persistSearchHistory = (history: string[]) => {
    try {
      localStorage.setItem('ricis_search_history', JSON.stringify(history));
    } catch {}
  };

  const removeFromHistory = (e: React.MouseEvent, itemToRemove: string) => {
    e.stopPropagation();
    setSearchHistory(prev => {
      const next = prev.filter(item => item !== itemToRemove);
      persistSearchHistory(next);
      return next;
    });
  };`;

const target2 = `  const saveToHistory = useCallback((query: string) => {
    if (query.length > 1) {
      setSearchHistory(prev => {
        if (prev.includes(query)) return prev;
        const next = [query, ...prev].slice(0, 50);
        try {
          localStorage.setItem('ricis_search_history', JSON.stringify(next));
        } catch (e) {
          console.error('Failed to save search history', e);
        }
        return next;
      });
    }
  }, [map.nodes, hiddenZones, showOnlyDerivatives]);`;

const target2Replacement = `  const saveToHistory = useCallback((query: string) => {
    if (query.length > 1) {
      setSearchHistory(prev => {
        if (prev.includes(query)) return prev;
        const next = [query, ...prev].slice(0, 50);
        persistSearchHistory(next);
        return next;
      });
    }
  }, [map.nodes, hiddenZones, showOnlyDerivatives]);`;

if (code.includes(target1) && code.includes(target2)) {
  code = code.replace(target1, target1Replacement);
  code = code.replace(target2, target2Replacement);
  fs.writeFileSync(path, code);
  console.log("History persistence patched");
} else {
  console.log("Could not find blocks");
}
