// ============================================================================
// APPLET NAVIGATION SERVICE & BROWSER HISTORY (MVVM / DRY / SOLID)
// Manages active applet, back/forward history stacks, and URL synchronization.
// ============================================================================

import type { AppletId } from '../types/appletRegistry';
import { APPLET_DEFINITIONS } from '../types/appletRegistry';
import { UrlShareService } from './UrlShareService';

/** All applet ids recognized by the `?applet=` parameter. */
const KNOWN_APPLETS: readonly AppletId[] = Object.keys(APPLET_DEFINITIONS) as AppletId[];

export class AppletNavigationService {
  private static historyStack: AppletId[] = [];
  private static forwardStack: AppletId[] = [];
  private static currentApplet: AppletId = 'map';

  /**
   * Determine current applet from search string.
   * `?applet=` is canonical; legacy `?view=<appletId>` is accepted for ALL
   * applets (BUG-10: voynich/terminal/qa-tests/settings used to silently fall
   * back to the map, breaking old links/bookmarks).
   */
  public static resolveCurrentApplet(searchString: string): AppletId {
    const params = new URLSearchParams(searchString);
    const appletParam = params.get('applet') as AppletId | null;
    const viewParam = params.get('view');

    if (appletParam && KNOWN_APPLETS.includes(appletParam)) {
      this.currentApplet = appletParam;
      return appletParam;
    }

    if (viewParam && KNOWN_APPLETS.includes(viewParam as AppletId)) {
      this.currentApplet = viewParam as AppletId;
      return this.currentApplet;
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
    // updateBrowserUrl already dispatches a single `popstate` event;
    // a second dispatch here caused duplicated re-renders (BUG-09).
  }
}
