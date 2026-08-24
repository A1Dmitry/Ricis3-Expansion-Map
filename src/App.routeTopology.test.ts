import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf8');
const lazyAdapterSource = readFileSync(resolve(process.cwd(), 'src/ui/lazyNamedComponent.ts'), 'utf8');
const routeBoundarySource = readFileSync(resolve(process.cwd(), 'src/ui/RouteSurfaceBoundary.tsx'), 'utf8');

describe('App route-level lazy delivery topology', () => {
  it('keeps error, hydration, recovery, roadmap and map route selection in the established priority order', () => {
    const errorBranch = appSource.indexOf('if (error)');
    const hydrationBranch = appSource.indexOf('if (!hydrated)');
    const recoveryBranch = appSource.indexOf('if (isCoreRecoveryRoute(locationSearch))');
    const roadmapBranch = appSource.indexOf("roadmapParams.get('view') === 'roadmap'");
    const defaultMapBranch = appSource.indexOf('<Map3D />');

    expect(errorBranch).toBeGreaterThan(-1);
    expect(hydrationBranch).toBeGreaterThan(errorBranch);
    expect(recoveryBranch).toBeGreaterThan(hydrationBranch);
    expect(roadmapBranch).toBeGreaterThan(recoveryBranch);
    expect(defaultMapBranch).toBeGreaterThan(roadmapBranch);
  });

  it('declares literal dynamic imports for every route-level surface and removes their static component imports', () => {
    for (const [path, exportName] of [
      ['./ui/Map3D', 'Map3D'],
      ['./ui/CoreRecoveryPage', 'CoreRecoveryPage'],
      ['./ui/RoadmapPage', 'RoadmapPage'],
    ] as const) {
      expect(appSource).toContain(`lazyNamedComponent(() => import('${path}'), '${exportName}')`);
      expect(appSource).not.toMatch(new RegExp(`^import\\s+\\{\\s*${exportName}\\s*\\}\\s+from\\s+['"]${path}['"];?`, 'm'));
    }
  });

  it('keeps route delivery infrastructure separate from RICIS, Core, proof, Lean and 3D implementation dependencies', () => {
    expect(appSource).toContain("import { RouteSurfaceBoundary } from './ui/RouteSurfaceBoundary';");
    expect(appSource).toContain("import { lazyNamedComponent } from './ui/lazyNamedComponent';");
    for (const source of [appSource, lazyAdapterSource, routeBoundarySource]) {
      expect(source).not.toMatch(/from ['"].*(ricisCore|proof|lean|gateway|apiClient|three|react-three)['"]/i);
      expect(source).not.toMatch(/fetch\(|axios|XMLHttpRequest/);
    }
  });
});
