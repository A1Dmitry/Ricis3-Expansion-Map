import { Suspense, type ReactNode } from 'react';

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

/**
 * Presents the one bounded loading state used while a route-level UI chunk resolves.
 * It intentionally does not own hydration, errors, RICIS state, Core calls, or trust state.
 */
export function RouteSurfaceBoundary({ children }: RouteSurfaceBoundaryProps) {
  return <Suspense fallback={<RouteSurfaceLoadingFallback />}>{children}</Suspense>;
}
