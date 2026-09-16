// ============================================================================
// APPLET NAVIGATION SERVICE & BROWSER HISTORY (MVVM / DRY / SOLID)
// Manages active applet, back/forward history stacks, and URL synchronization.
// ============================================================================

import type { AppletId } from '../types/appletRegistry';
import { UrlShareService } from './UrlShareService';

/**
 * Canonical applet id list — single source of truth for deep links.
 */
const VALID_APPLET_IDS: readonly AppletId[] = [
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

/**
 * BUG-10: legacy `?view=` deep links must cover the same applets as
 * `?applet=`, otherwise old bookmarks silently fall back to the map.
 */
const LEGACY_VIEW_APPLETS: ReadonlyMap<string, AppletId> = new Map<string, AppletId>([
  ['kinematic', 'kinematic'],
  ['seed', 'seed'],
  ['comparison', 'comparison'],
  ['roadmap', 'roadmap'],
  ['voynich', 'voynich'],
  ['terminal', 'terminal'],
  ['qa-tests', 'qa-tests'],
  ['settings', 'settings'],
]);

export class AppletNavigationService {
  private static historyStack: AppletId[] = [];
  private static forwardStack: AppletId[] = [];
  private static currentApplet: AppletId = 'map';

  /**
   * Determine current applet from search string
   */
  public static resolveCurrentApplet(searchString: string): AppletId {
    const params = new URLSearchParams(searchString);
    const appletParam = params.get('applet') as AppletId | null;
    const viewParam = params.get('view');

    if (appletParam && VALID_APPLET_IDS.includes(appletParam)) {
      this.currentApplet = appletParam;
      return appletParam;
    }

    const legacyViewApplet = LEGACY_VIEW_APPLETS.get(viewParam ?? '');
    if (legacyViewApplet) {
      this.currentApplet = legacyViewApplet;
      return legacyViewApplet;
    }

    this.currentApplet = 'map';
    return 'map';
  }

  /**
   * Navigate to a new applet, updating URL and history stacks
   */
  public static navigateTo(target: AppletId): void {
    if (target === this.currentApplet) return;

    this.historyStack.push(this.currentApplet);
    this.forwardStack = []; // clear forward history on new navigation
    this.currentApplet = target;

    this.syncUrl(target);
  }

  public static getActiveApplet(): AppletId {
    return this.currentApplet;
  }

  public static resetHistory(): void {
    this.historyStack = [];
    this.forwardStack = [];
    this.currentApplet = 'map';
  }

  /**
   * Browser-like Back
   */
  public static goBack(): AppletId | null {
    if (this.historyStack.length === 0) {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        window.history.back();
      }
      return null;
    }

    const previous = this.historyStack.pop()!;
    this.forwardStack.push(this.currentApplet);
    this.currentApplet = previous;

    this.syncUrl(previous);
    return previous;
  }

  /**
   * Browser-like Forward
   */
  public static goForward(): AppletId | null {
    if (this.forwardStack.length === 0) {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        window.history.forward();
      }
      return null;
    }

    const next = this.forwardStack.pop()!;
    this.historyStack.push(this.currentApplet);
    this.currentApplet = next;

    this.syncUrl(next);
    return next;
  }

  public static canGoBack(): boolean {
    return this.historyStack.length > 0;
  }

  public static canGoForward(): boolean {
    return this.forwardStack.length > 0;
  }

  private static syncUrl(applet: AppletId): void {
    if (applet === 'map') {
      UrlShareService.updateBrowserUrl({
        applet: null,
        kinematic: false,
        seed: false,
        comparison: false,
        roadmap: false,
      });
    } else {
      UrlShareService.updateBrowserUrl({
        applet,
        kinematic: applet === 'kinematic',
        seed: applet === 'seed',
        comparison: applet === 'comparison',
        roadmap: applet === 'roadmap',
      });
    }
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}
