import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const mapSource = readFileSync(resolve(process.cwd(), 'src/ui/Map3D.tsx'), 'utf8');

describe('Map3D mobile graph layout contract', () => {
  it('keeps mobile flow below the scene and docks the desktop task card in a dedicated right grid column', () => {
    expect(mapSource).toContain('order-3 h-[58dvh]');
    expect(mapSource).toContain('order-1 relative flex min-h-0 flex-1 flex-col');
    expect(mapSource).toContain('data-testid="desktop-task-panel"');
    expect(mapSource).toContain('md:col-start-3 md:row-start-1');
    expect(mapSource).not.toContain('md:absolute md:inset-x-auto');
    expect(mapSource).not.toContain('fixed inset-x-2 bottom-2 z-30');
    expect(mapSource).toContain("taskPanelMode === 'open'");
    expect(mapSource).toContain("md:grid-cols-[21rem_minmax(0,1fr)_2.75rem]");
    expect(mapSource).toContain('data-panel-mode={taskPanelMode}');
    expect(mapSource).toContain('Развернуть правую панель задачи');
    expect(mapSource).toContain('Свернуть правую панель в узкую полосу');
  });

  it('assigns canvas-only touch suppression and explicit two-finger OrbitControls configuration', () => {
    expect(mapSource).toContain('configureGraphTouchControls(controls)');
    expect(mapSource).toContain('<Canvas className="touch-none"');
    expect(mapSource).toContain('touch-pan-y md:order-1');
  });

  it('keeps a distinct mobile shell with screen-stack menu navigation and a separate details screen', () => {
    expect(mapSource).toContain('const renderMobileShell = () =>');
    expect(mapSource).toContain('data-testid="mobile-map-shell"');
    expect(mapSource).toContain('data-testid="mobile-menu-screen"');
    expect(mapSource).toContain('data-testid="mobile-details-screen"');
    expect(mapSource).toContain("openMobileView('menu')");
    expect(mapSource).toContain("openMobileView('settings')");
    expect(mapSource).toContain("openMobileView('details')");
  });

  it('uses the portrait/landscape mobile layout class and fullscreen-aware viewport interaction', () => {
    expect(mapSource).toContain('mobile-map-layout');
    expect(mapSource).toContain('onPointerUp={handleScenePointerUp}');
    expect(mapSource).toContain('toggleImmersiveCanvas(sceneContainerRef.current)');
  });
});
