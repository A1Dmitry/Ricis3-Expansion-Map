import { describe, it, expect, beforeEach } from 'vitest';
import { AppletNavigationService } from './AppletNavigationService';
import type { AppletId } from '../types/appletRegistry';

describe('AppletNavigationService', () => {
  beforeEach(() => {
    AppletNavigationService.resetHistory();
  });

  it('resolves default map applet from empty search string', () => {
    const applet = AppletNavigationService.resolveCurrentApplet('');
    expect(applet).toBe('map');
  });

  it('resolves applet from ?applet= parameter', () => {
    const applets: AppletId[] = [
      'map',
      'kinematic',
      'seed',
      'comparison',
      'roadmap',
      'voynich',
      'qa-tests',
      'terminal',
      'settings',
    ];

    for (const id of applets) {
      const resolved = AppletNavigationService.resolveCurrentApplet(`?applet=${id}`);
      expect(resolved).toBe(id);
    }
  });

  it('supports legacy ?view= parameter fallback', () => {
    expect(AppletNavigationService.resolveCurrentApplet('?view=kinematic')).toBe('kinematic');
    expect(AppletNavigationService.resolveCurrentApplet('?view=seed')).toBe('seed');
    expect(AppletNavigationService.resolveCurrentApplet('?view=comparison')).toBe('comparison');
    expect(AppletNavigationService.resolveCurrentApplet('?view=roadmap')).toBe('roadmap');
  });

  it('supports legacy ?view= for ALL applets (BUG-10: voynich/terminal/qa-tests/settings fell back to map)', () => {
    expect(AppletNavigationService.resolveCurrentApplet('?view=voynich')).toBe('voynich');
    expect(AppletNavigationService.resolveCurrentApplet('?view=terminal')).toBe('terminal');
    expect(AppletNavigationService.resolveCurrentApplet('?view=qa-tests')).toBe('qa-tests');
    expect(AppletNavigationService.resolveCurrentApplet('?view=settings')).toBe('settings');
    expect(AppletNavigationService.resolveCurrentApplet('?view=map')).toBe('map');
  });

  it('falls back to map for unknown ?view= values', () => {
    expect(AppletNavigationService.resolveCurrentApplet('?view=nonsense')).toBe('map');
    expect(AppletNavigationService.resolveCurrentApplet('?applet=nonsense')).toBe('map');
  });

  it('handles navigation stack and back/forward operations correctly', () => {
    AppletNavigationService.navigateTo('kinematic');
    expect(AppletNavigationService.getActiveApplet()).toBe('kinematic');
    expect(AppletNavigationService.canGoBack()).toBe(true);

    AppletNavigationService.navigateTo('seed');
    expect(AppletNavigationService.getActiveApplet()).toBe('seed');

    const prev = AppletNavigationService.goBack();
    expect(prev).toBe('kinematic');
    expect(AppletNavigationService.canGoForward()).toBe(true);

    const fwd = AppletNavigationService.goForward();
    expect(fwd).toBe('seed');
  });

  it('navigateTo dispatches exactly one popstate event (BUG-09: no duplicate URL sync)', () => {
    let popstateCount = 0;
    const onPopState = () => { popstateCount += 1; };
    window.addEventListener('popstate', onPopState);
    try {
      AppletNavigationService.navigateTo('voynich');
      expect(popstateCount).toBe(1);
    } finally {
      window.removeEventListener('popstate', onPopState);
    }
  });

  it('navigateTo to the same applet is a no-op (no events)', () => {
    AppletNavigationService.navigateTo('settings');
    let popstateCount = 0;
    const onPopState = () => { popstateCount += 1; };
    window.addEventListener('popstate', onPopState);
    try {
      AppletNavigationService.navigateTo('settings');
      expect(popstateCount).toBe(0);
    } finally {
      window.removeEventListener('popstate', onPopState);
    }
  });
});
