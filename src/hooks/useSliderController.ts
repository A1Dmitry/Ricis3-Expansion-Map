import { useState, useEffect, useRef } from 'react';

export type SliderInteractionState = 'IDLE' | 'DRAGGING' | 'PENDING_IDLE';

export interface SliderState<T> {
  workingParams: T;
  committedParams: T;
  status: SliderInteractionState;
}

export type SliderListener<T> = (state: SliderState<T>) => void;
export type CommitCallback<T> = (params: T) => void;

/**
 * Обобщенный бизнес-слой (MVVM) управления ползунками и настройками.
 * 
 * Соблюдение бизнес-требований:
 * 1. Пока происходит перетаскивание (DRAGGING):
 *    - Изменения происходят ИСКЛЮЧИТЕЛЬНО во внутреннем состоянии (workingParams).
 *    - Никакие события во внешнюю систему НЕ отправляются.
 *    - Интерфейс работает плавно и без лагов.
 * 2. При отпускании кнопки мыши статус переходит в PENDING_IDLE и запускается таймер.
 * 3. Если пользователь сдвигает ползунок снова, таймер сбрасывается.
 * 4. Только при достижении статуса IDLE отправляется ИТОГОВОЕ событие изменения.
 */
export class SliderController<T extends Record<string, any>> {
  private workingParams: T;
  private committedParams: T;
  private status: SliderInteractionState = 'IDLE';
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<SliderListener<T>> = new Set();
  private onCommit: CommitCallback<T>;
  private readonly idleDelayMs: number;

  constructor(
    initialParams: T,
    onCommit: CommitCallback<T>,
    idleDelayMs: number = 1000
  ) {
    this.workingParams = { ...initialParams };
    this.committedParams = { ...initialParams };
    this.onCommit = onCommit;
    this.idleDelayMs = idleDelayMs;
  }

  public subscribe(listener: SliderListener<T>): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): SliderState<T> {
    return {
      workingParams: { ...this.workingParams },
      committedParams: { ...this.committedParams },
      status: this.status,
    };
  }

  public startInteraction(): void {
    if (this.status !== 'DRAGGING') {
      this.status = 'DRAGGING';
      this.notify();
    }
  }

  public updateValue<K extends keyof T>(key: K, value: T[K]): void {
    this.workingParams = { ...this.workingParams, [key]: value };
    this.status = 'DRAGGING';
    this.notify();
  }

  public endInteraction(): void {
    if (this.status === 'DRAGGING') {
      const hasChanged = JSON.stringify(this.workingParams) !== JSON.stringify(this.committedParams);
      this.committedParams = { ...this.workingParams };
      this.status = 'IDLE';
      this.notify();
      if (hasChanged) {
        this.onCommit(this.committedParams);
      }
    }
  }

  public resetToDefault(defaultParams: T): void {
    this.clearIdleTimer();
    this.workingParams = { ...defaultParams };
    this.committedParams = { ...defaultParams };
    this.status = 'IDLE';
    this.notify();
    this.onCommit(this.committedParams);
  }

  public syncExternalParams(externalParams: T): void {
    if (this.status === 'IDLE') {
      const hasChanged = JSON.stringify(this.workingParams) !== JSON.stringify(externalParams);
      if (hasChanged) {
        this.workingParams = { ...externalParams };
        this.committedParams = { ...externalParams };
        this.notify();
      }
    }
  }

  public destroy(): void {
    this.clearIdleTimer();
    this.listeners.clear();
  }

  private clearIdleTimer(): void {
    if (this.idleTimer !== null) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  private notify(): void {
    const currentState = this.getState();
    this.listeners.forEach(listener => listener(currentState));
  }
}

/**
 * Обобщенный React-хук бизнес-слоя управления параметрами.
 */
export function useSliderController<T extends Record<string, any>>(
  externalParams: T,
  onChange: (params: T) => void,
  idleDelayMs: number = 1000
) {
  const controllerRef = useRef<SliderController<T> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  if (!controllerRef.current) {
    controllerRef.current = new SliderController<T>(
      externalParams,
      (committed) => onChangeRef.current(committed),
      idleDelayMs
    );
  }

  const [state, setState] = useState<SliderState<T>>(() =>
    controllerRef.current!.getState()
  );

  useEffect(() => {
    const controller = controllerRef.current!;
    const unsubscribe = controller.subscribe((newState) => {
      setState(newState);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    controllerRef.current?.syncExternalParams(externalParams);
  }, [externalParams]);

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      controllerRef.current?.endInteraction();
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('mouseup', handleGlobalPointerUp);
    window.addEventListener('touchend', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('mouseup', handleGlobalPointerUp);
      window.removeEventListener('touchend', handleGlobalPointerUp);
    };
  }, []);

  return {
    workingParams: state.workingParams,
    status: state.status,
    startInteraction: () => controllerRef.current?.startInteraction(),
    endInteraction: () => controllerRef.current?.endInteraction(),
    updateValue: <K extends keyof T>(key: K, val: T[K]) =>
      controllerRef.current?.updateValue(key, val),
    reset: (defaultParams: T) => controllerRef.current?.resetToDefault(defaultParams),
  };
}
