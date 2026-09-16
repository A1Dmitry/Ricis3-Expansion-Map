import { copyToClipboard } from './clipboard';

/**
 * Сервис синхронизации URL, глубоких ссылок (Deep Linking) и генерации share-ссылок.
 * DRY, Pure Functions & Browser History Integration.
 */

export interface ShareParams {
  nodeId?: string | null;
  sandboxExpr?: string | null;
  mode?: string | null;
  roadmap?: boolean | null;
  kinematic?: boolean | null;
  seed?: boolean | null;
  comparison?: boolean | null;
  rootNodeId?: string | null;
  applet?: string | null;
}

export class UrlShareService {
  /**
   * Single source of truth for the legacy `view` parameter: exactly one
   * view flag may be written at a time, in this priority order. BUG-04:
   * `seed` was missing from `updateBrowserUrl`, which made the
   * «Ссылка на это состояние (?view=seed)» action a silent no-op.
   */
  private static resolveViewValue(params: ShareParams): string | null {
    let viewValue: string | null = null;
    if (params.roadmap) viewValue = 'roadmap';
    if (params.kinematic) viewValue = 'kinematic';
    if (params.comparison) viewValue = 'comparison';
    if (params.seed) viewValue = 'seed';
    return viewValue;
  }

  /**
   * Сформировать абсолютный URL для обмена
   */
  public static generateShareUrl(params: ShareParams): string {
    const url = new URL(window.location.origin + window.location.pathname);
    
    if (params.applet) {
      url.searchParams.set('applet', params.applet);
    }
    if (params.nodeId) {
      url.searchParams.set('node', params.nodeId);
    }
    if (params.sandboxExpr) {
      url.searchParams.set('sandbox', params.sandboxExpr);
    }
    if (params.mode) {
      url.searchParams.set('mode', params.mode);
    }
    const viewValue = this.resolveViewValue(params);
    if (viewValue) {
      url.searchParams.set('view', viewValue);
    }
    if (params.rootNodeId) {
      url.searchParams.set('root', params.rootNodeId);
    }

    return url.toString();
  }

  /**
   * Скопировать сгенерированную ссылку в буфер обмена.
   * BUG-07: delegates to the single guarded clipboard helper (DRY).
   */
  public static async copyShareUrlToClipboard(params: ShareParams): Promise<boolean> {
    return copyToClipboard(this.generateShareUrl(params));
  }

  /**
   * Обновить URL в строке браузера без перезагрузки (replaceState)
   */
  public static updateBrowserUrl(params: ShareParams): void {
    try {
      const url = new URL(window.location.href);
      
      if (params.nodeId !== undefined) {
        if (params.nodeId) {
          url.searchParams.set('node', params.nodeId);
        } else {
          url.searchParams.delete('node');
        }
      }

      if (params.sandboxExpr !== undefined) {
        if (params.sandboxExpr) {
          url.searchParams.set('sandbox', params.sandboxExpr);
        } else {
          url.searchParams.delete('sandbox');
        }
      }

      if (params.mode !== undefined) {
        if (params.mode) {
          url.searchParams.set('mode', params.mode);
        } else {
          url.searchParams.delete('mode');
        }
      }

      // BUG-04: the `view` slot is single-valued; any explicit view flag
      // (including `seed`) rewrites it from the shared resolver above.
      if (
        params.roadmap !== undefined ||
        params.kinematic !== undefined ||
        params.comparison !== undefined ||
        params.seed !== undefined
      ) {
        const viewValue = this.resolveViewValue(params);
        if (viewValue) {
          url.searchParams.set('view', viewValue);
        } else {
          url.searchParams.delete('view');
        }
      }

      if (params.rootNodeId !== undefined) {
        if (params.rootNodeId) {
          url.searchParams.set('root', params.rootNodeId);
        } else {
          url.searchParams.delete('root');
        }
      }

      if (params.applet !== undefined) {
        if (params.applet) {
          url.searchParams.set('applet', params.applet);
        } else {
          url.searchParams.delete('applet');
        }
      }

      window.history.replaceState({}, '', url.toString());
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (e) {
      console.warn('Failed to update browser url:', e);
    }
  }

  /**
   * Прочитать параметры при инициализации приложения
   */
  public static parseInitialParams(): {
    initialNodeId: string | null;
    initialSandboxExpr: string | null;
    initialMode: string | null;
    initialRoadmap: boolean;
    initialKinematic: boolean;
    initialRootNodeId: string | null;
    initialApplet: string | null;
  } {
    try {
      const params = new URLSearchParams(window.location.search);
      return {
        initialNodeId: params.get('node'),
        initialSandboxExpr: params.get('sandbox') || params.get('expr'),
        initialMode: params.get('mode'),
        initialRoadmap: params.get('view') === 'roadmap' || params.get('applet') === 'roadmap',
        initialKinematic: params.get('view') === 'kinematic' || params.get('applet') === 'kinematic',
        initialRootNodeId: params.get('root'),
        initialApplet: params.get('applet'),
      };
    } catch {
      return {
        initialNodeId: null,
        initialSandboxExpr: null,
        initialMode: null,
        initialRoadmap: false,
        initialKinematic: false,
        initialRootNodeId: null,
        initialApplet: null,
      };
    }
  }
}
