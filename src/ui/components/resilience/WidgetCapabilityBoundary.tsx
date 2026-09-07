// ============================================================================
// UNIVERSAL WIDGET CAPABILITY & RESILIENCE BOUNDARY COMPONENT (SOLID / DRY)
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, Construction, RefreshCw, Layers } from 'lucide-react';
import type {
  IWidgetCapabilityBoundaryProps,
  IWidgetBoundaryState,
} from './widgetResilience.contracts';

export class WidgetCapabilityBoundary extends Component<
  IWidgetCapabilityBoundaryProps,
  IWidgetBoundaryState
> {
  public override state: IWidgetBoundaryState = {
    hasError: false,
    error: undefined,
  };

  public static getDerivedStateFromError(error: Error): IWidgetBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.warn(
      `[WidgetCapabilityBoundary] Isolated error in <${this.props.componentName}>:`,
      error,
      errorInfo
    );
  }

  public handleReset = (): void => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  public override render(): ReactNode {
    const {
      componentName,
      title,
      mode = 'CARD_STUB',
      requiredCapability,
      isCapabilitySupported = true,
      fallbackNode,
      children,
    } = this.props;
    const { hasError, error } = this.state;

    // 1. If capability guard check fails (feature in development)
    if (!isCapabilitySupported) {
      if (typeof fallbackNode === 'function') {
        return fallbackNode({
          componentName,
          error,
          resetError: this.handleReset,
        });
      }
      if (fallbackNode) return fallbackNode;

      return (
        <div
          className={`rounded-xl border border-dashed border-amber-500/40 bg-slate-950/70 p-4 text-slate-300 flex flex-col items-center justify-center text-center ${
            mode === 'FULL_CONTAINER_STUB' ? 'h-full min-h-[260px]' : 'p-4 my-2'
          }`}
        >
          <div className="p-2.5 rounded-full bg-amber-500/10 text-amber-400 mb-2 border border-amber-500/30">
            <Construction className="w-5 h-5 animate-pulse" />
          </div>
          <h4 className="font-semibold text-xs text-slate-100 mb-1">
            {title || componentName}: В процессе разработки
          </h4>
          <p className="text-[11px] text-slate-400 max-w-sm mb-2 font-sans">
            Данный компонент ожидает завершения реализации интерфейса и появится в следующих версиях.
          </p>
          {requiredCapability && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-purple-300">
              <Layers className="w-3 h-3 text-purple-400" />
              <span>Требуемый контракт: {requiredCapability}</span>
            </div>
          )}
        </div>
      );
    }

    // 2. If runtime rendering threw an error
    if (hasError) {
      if (typeof fallbackNode === 'function') {
        return fallbackNode({
          componentName,
          error,
          resetError: this.handleReset,
        });
      }
      if (fallbackNode) return fallbackNode;

      return (
        <div
          className={`rounded-xl border border-red-500/40 bg-red-950/20 p-4 text-slate-200 flex flex-col items-center justify-center text-center ${
            mode === 'FULL_CONTAINER_STUB' ? 'h-full min-h-[260px]' : 'p-4 my-2'
          }`}
        >
          <div className="p-2 rounded-full bg-red-500/10 text-red-400 mb-2 border border-red-500/30">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h4 className="font-semibold text-xs text-slate-100 mb-1">
            {title || componentName}: Модуль временно недоступен
          </h4>
          <p className="text-[11px] text-slate-400 max-w-sm mb-3 font-sans">
            Произошла изолированная ошибка при отображении виджета. Остальные разделы системы функционируют в штатном режиме.
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Повторить попытку</span>
          </button>
        </div>
      );
    }

    // 3. Normal execution
    return children;
  }
}
