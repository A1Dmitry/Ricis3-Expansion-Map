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

/**
 * Single source of truth for the legacy `?view=` deep-link flags.
 * Every flag maps to the value written into the `view` URL parameter.
 * Used by BOTH generateShareUrl and updateBrowserUrl so the two can never drift
 * again (BUG-04: `seed` was missing from updateBrowserUrl).
 */
const VIEW_FLAG_TO_PARAM_VALUE: ReadonlyArray<{
  readonly flag: 'roadmap' | 'kinematic' | 'seed' | 'comparison';
  readonly viewParamValue: string;
}> = [
  { flag: 'roadmap', viewParamValue: 'roadmap' },
  { flag: 'kinematic', viewParamValue: 'kinematic' },
  { flag: 'seed', viewParamValue: 'seed' },
  { flag: 'comparison', viewParamValue: 'comparison' },
];

export class UrlShareService {
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
    for (const { flag, viewParamValue } of VIEW_FLAG_TO_PARAM_VALUE) {
      if (params[flag]) {
        url.searchParams.set('view', viewParamValue);
      }
    }
    if (params.rootNodeId) {
      url.searchParams.set('root', params.rootNodeId);
    }

    return url.toString();
  }

  /**
   * Скопировать сгенерированную ссылку в буфер обмена
   */
  public static async copyShareUrlToClipboard(params: ShareParams): Promise<boolean> {
    try {
      const shareUrl = this.generateShareUrl(params);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        return true;
      }
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (e) {
      console.warn('Failed to copy share url:', e);
      return false;
    }
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

      for (const { flag, viewParamValue } of VIEW_FLAG_TO_PARAM_VALUE) {
        if (params[flag] !== undefined) {
          if (params[flag]) {
            url.searchParams.set('view', viewParamValue);
          } else {
            url.searchParams.delete('view');
          }
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
