import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export type NamedComponentModule<
  TProps,
  TExportName extends string,
> = Readonly<Record<TExportName, ComponentType<TProps>>>;

export type NamedComponentLoader<
  TProps,
  TExportName extends string,
> = () => Promise<NamedComponentModule<TProps, TExportName>>;

/**
 * Adapts a named React component export to React.lazy's default-export module contract.
 *
 * This presentation-layer helper preserves the component's exact props type and intentionally
 * has no dependency on application state, RICIS operations, Core transport, or proof evidence.
 */
export function lazyNamedComponent<TProps, TExportName extends string>(
  load: NamedComponentLoader<TProps, TExportName>,
  exportName: TExportName,
): LazyExoticComponent<ComponentType<TProps>> {
  return lazy(async () => {
    try {
      const module = await load();
      return { default: module[exportName] };
    } catch (err) {
      console.warn(`Initial load failed for chunk ${exportName}, retrying load...`, err);
      await new Promise(r => setTimeout(r, 300));
      const module = await load();
      return { default: module[exportName] };
    }
  });
}
