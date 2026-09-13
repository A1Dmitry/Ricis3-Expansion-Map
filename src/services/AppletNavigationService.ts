// ============================================================================
// APPLET NAVIGATION SERVICE & BROWSER HISTORY (MVVM / DRY / SOLID)
// Manages active applet, back/forward history stacks, and URL synchronization.
// ============================================================================

import type { AppletId } from '../types/appletRegistry';
import { UrlShareService } from './UrlShareService';

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

    if (appletParam && ['map', 'kinematic', 'seed', 'comparison', 'roadmap', 'voynich', 'qa-tests', 'terminal', 'settings'].includes(appletParam)) {
      this.currentApplet = appletParam;
      return appletParam;
    }

    if (viewParam === 'kinematic') {
      this.currentApplet = 'kinematic';
      return 'kinematic';
    }
    if (viewParam === 'seed') {
      this.currentApplet = 'seed';
      return 'seed';
    }
    if (viewParam === 'comparison') {
      this.currentApplet = 'comparison';
      return 'comparison';
    }
    if (viewParam === 'roadmap') {
      this.currentApplet = 'roadmap';
      return 'roadmap';
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

  /**
   * Browser-like Back
   */
  public static goBack(): void {
    if (this.historyStack.length === 0) {
      if (window.history.length > 1) {
        window.history.back();
      }
      return;
    }

    const previous = this.historyStack.pop()!;
    this.forwardStack.push(this.currentApplet);
    this.currentApplet = previous;

    this.syncUrl(previous);
  }

  /**
   * Browser-like Forward
   */
  public static goForward(): void {
    if (this.forwardStack.length === 0) {
      if (window.history.length > 1) {
        window.history.forward();
      }
      return;
    }

    const next = this.forwardStack.pop()!;
    this.historyStack.push(this.currentApplet);
    this.currentApplet = next;

    this.syncUrl(next);
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
