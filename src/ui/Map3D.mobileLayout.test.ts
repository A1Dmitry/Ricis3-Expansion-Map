import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const mapSource = readFileSync(resolve(process.cwd(), 'src/ui/Map3D.tsx'), 'utf8');

describe('Map3D mobile graph layout contract', () => {
  it('keeps mobile flow below the scene and docks the desktop task card in a dedicated right grid column', () => {
    expect(mapSource).toContain('order-3 h-[58dvh]');
    expect(mapSource).toContain('order-1 relative flex min-h-0 w-full min-w-0 flex-1 flex-col');
    expect(mapSource).toContain('data-testid="desktop-task-panel"');
    expect(mapSource).toContain('md:col-start-2 md:row-start-1');
    expect(mapSource).toContain('md:grid-cols-[minmax(0,1fr)_minmax(24rem,30rem)]');
    expect(mapSource).not.toContain("taskPanelMode === 'rail' ? 'md:w-[2.75rem]' : 'md:w-auto'");
    expect(mapSource).toContain("taskPanelMode === 'rail' ? 'md:hidden' : 'md:w-auto'");
    expect(mapSource).toContain('Развернуть правую панель задачи');
    expect(mapSource).toContain('>Задача</span>');
    expect(mapSource).toContain('<NodeCardDetails');
    expect(mapSource).not.toContain('onClick={() => setIsNodeExpanded(!isNodeExpanded)}');
    expect(mapSource).toContain('h-full w-full');
    expect(mapSource).toContain('w-full min-w-0 shrink-0 md:col-start-1');
    expect(mapSource).not.toContain('md:absolute md:inset-x-auto');
    expect(mapSource).not.toContain('fixed inset-x-2 bottom-2 z-30');
    expect(mapSource).toContain("taskPanelMode === 'open'");
    expect(mapSource).toContain("md:grid-cols-[0_minmax(0,1fr)");
    expect(mapSource).toContain("leftPanelMode === 'open'");
    expect(mapSource).toContain('data-testid="desktop-navigation-panel"');
    expect(mapSource).toContain('data-panel-mode={leftPanelMode}');
    expect(mapSource).toContain('data-panel-mode={taskPanelMode}');
    expect(mapSource).toContain('md:hidden');
    expect(mapSource).toContain('Развернуть правую панель задачи');
    expect(mapSource).toContain('Развернуть левую панель');
    expect(mapSource).toContain('Свернуть правую панель в узкую полосу');
  });

  it('assigns canvas-only touch suppression and explicit two-finger OrbitControls configuration', () => {
    expect(mapSource).toContain('configureGraphTouchControls(controls)');
    expect(mapSource).toContain('<Canvas className="touch-none block h-full w-full"');
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

  it('keeps the desktop status strip out of mobile and immersive presentations', () => {
    expect(mapSource).toContain('data-testid="desktop-status-strip"');
    expect(mapSource).toContain('!isMobileLayout && !isImmersive');
    expect(mapSource).toContain('mobile-map-layout__quickbar');
  });

  it('makes mobile navigation task-first and reserves secondary tools for an explicit group', () => {
    expect(mapSource).toContain('data-testid="mobile-map-focus-node"');
    expect(mapSource).toContain('mobile-menu-selected-task');
    expect(mapSource).toContain('mobile-menu-secondary');
    expect(mapSource).toContain('Инструменты и настройки');
    expect(mapSource).toContain('mobile-menu-secondary-grid');
    expect(mapSource).not.toContain('onClick={handleNavigateBack} className="min-h-10 shrink-0');
  });
});
