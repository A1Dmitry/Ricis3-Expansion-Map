/**
 * Сервис синхронизации URL, глубоких ссылок (Deep Linking) и генерации share-ссылок.
 * DRY, Pure Functions & Browser History Integration.
 */

export interface ShareParams {
  nodeId?: string | null;
  sandboxExpr?: string | null;
  mode?: string | null;
  roadmap?: boolean | null;
  rootNodeId?: string | null;
}

export class UrlShareService {
  /**
   * Сформировать абсолютный URL для обмена
   */
  public static generateShareUrl(params: ShareParams): string {
    const url = new URL(window.location.origin + window.location.pathname);
    
    if (params.nodeId) {
      url.searchParams.set('node', params.nodeId);
    }
    if (params.sandboxExpr) {
      url.searchParams.set('sandbox', params.sandboxExpr);
    }
    if (params.mode) {
      url.searchParams.set('mode', params.mode);
    }
    if (params.roadmap) {
      url.searchParams.set('view', 'roadmap');
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

      if (params.roadmap !== undefined) {
        if (params.roadmap) {
          url.searchParams.set('view', 'roadmap');
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

      window.history.replaceState({}, '', url.toString());
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
    initialRootNodeId: string | null;
  } {
    try {
      const params = new URLSearchParams(window.location.search);
      return {
        initialNodeId: params.get('node'),
        initialSandboxExpr: params.get('sandbox') || params.get('expr'),
        initialMode: params.get('mode'),
        initialRoadmap: params.get('view') === 'roadmap',
        initialRootNodeId: params.get('root'),
      };
    } catch {
      return {
        initialNodeId: null,
        initialSandboxExpr: null,
        initialMode: null,
        initialRoadmap: false,
        initialRootNodeId: null,
      };
    }
  }
}
