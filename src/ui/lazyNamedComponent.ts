import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export type NamedComponentModule<
  TProps,
  TExportName extends string,
> = Readonly<Record<TExportName, ComponentType<TProps>>>;

export type NamedComponentLoader<
  TProps,
  TExportName extends string,
> = () => Promise<NamedComponentModule<TProps, TExportName>>;

const RETRY_DELAYS_MS = [400, 1000, 2000, 3000] as const;

/**
 * Adapts a named React component export to React.lazy's default-export module contract
 * with exponential backoff retries for transient chunk loading disruptions.
 *
 * This presentation-layer helper preserves the component's exact props type and intentionally
 * has no dependency on application state, RICIS operations, Core transport, or proof evidence.
 */
export function lazyNamedComponent<TProps, TExportName extends string>(
  load: NamedComponentLoader<TProps, TExportName>,
  exportName: TExportName,
): LazyExoticComponent<ComponentType<TProps>> {
  return lazy(async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      try {
        const module = await load();
        if (module && module[exportName]) {
          return { default: module[exportName] };
        }
        throw new Error(`Export '${exportName}' not found in loaded chunk.`);
      } catch (err) {
        lastError = err;
        if (attempt < RETRY_DELAYS_MS.length) {
          const delay = RETRY_DELAYS_MS[attempt];
          console.warn(
            `Chunk '${exportName}' load attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
            err,
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  });
}
