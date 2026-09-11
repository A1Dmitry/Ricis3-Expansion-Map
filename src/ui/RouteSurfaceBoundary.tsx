import React, { Suspense, type ReactNode } from 'react';

export interface RouteSurfaceBoundaryProps {
  readonly children: ReactNode;
}

function RouteSurfaceLoadingFallback() {
  return (
    <div
      className="w-full h-screen bg-[#050505] text-cyan-400 flex items-center justify-center font-mono text-xs tracking-widest uppercase"
      role="status"
      aria-live="polite"
    >
      RICIS-III // loading application surface…
    </div>
  );
}

const AUTO_RELOAD_KEY = '__ricis_surface_auto_reload_count__';

class RouteSurfaceErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  public state: { hasError: boolean; error: Error | null } = { hasError: false, error: null };
  private autoReloadTimer: number | null = null;

  public static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error) {
    console.error('RouteSurfaceBoundary caught surface error:', error);
    const msg = error?.message || '';
    const isFetchError =
      msg.includes('dynamically imported module') ||
      msg.includes('Failed to fetch') ||
      msg.includes('Loading chunk');

    if (isFetchError && typeof window !== 'undefined') {
      try {
        const attempts = Number(sessionStorage.getItem(AUTO_RELOAD_KEY) || '0');
        if (attempts < 2) {
          sessionStorage.setItem(AUTO_RELOAD_KEY, String(attempts + 1));
          this.autoReloadTimer = window.setTimeout(() => {
            this.handleReload();
          }, 1200);
        }
      } catch {
        // Fallback for sandboxed context where sessionStorage is blocked
      }
    }
  }

  public componentWillUnmount() {
    if (this.autoReloadTimer !== null) {
      window.clearTimeout(this.autoReloadTimer);
    }
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(AUTO_RELOAD_KEY);
        window.location.reload();
      } catch {
        window.location.href = window.location.href;
      }
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen bg-[#050505] text-red-400 flex flex-col items-center justify-center font-mono text-xs p-4 text-center">
          <div className="mb-4 text-sm font-bold tracking-wider text-red-300">
            RICIS-III // SURFACE RENDERING ERROR
          </div>
          <div className="max-w-md bg-red-950/40 border border-red-800/60 p-4 rounded mb-6 text-red-200">
            {this.state.error?.message || 'Failed to load dynamic component surface'}
          </div>
          <button
            onClick={this.handleReload}
            className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 rounded font-mono text-xs uppercase tracking-widest transition-colors cursor-pointer"
          >
            Перезагрузить поверхность // Reload Surface
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Presents the one bounded loading state used while a route-level UI chunk resolves.
 * It intentionally does not own hydration, errors, RICIS state, Core calls, or trust state.
 */
export function RouteSurfaceBoundary({ children }: RouteSurfaceBoundaryProps) {
  React.useEffect(() => {
    try {
      sessionStorage.removeItem(AUTO_RELOAD_KEY);
    } catch {
      // Ignored in sandboxed iframes
    }
  }, []);

  return (
    <RouteSurfaceErrorBoundary>
      <Suspense fallback={<RouteSurfaceLoadingFallback />}>{children}</Suspense>
    </RouteSurfaceErrorBoundary>
  );
}

