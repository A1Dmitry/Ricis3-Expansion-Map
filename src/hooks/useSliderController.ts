import { useState, useEffect, useRef, useCallback } from 'react';

export type SliderInteractionState = 'idle' | 'dragging' | 'pending_idle';

export interface SliderState<T> {
  workingParams: T;
  committedParams: T;
  status: SliderInteractionState;
}

export type SliderListener<T> = (state: SliderState<T>) => void;
export type CommitCallback<T> = (params: T) => void;

export interface SliderControllerOptions<T extends Record<string, any>> {
  initialValues?: T;
  onCommit: CommitCallback<T>;
  idleDelayMs?: number;
}

/**
 * Чистый бизнес-слой (MVVM / Controller) для изолированного управления ползунками:
 * 1. Пока двигают (dragging):
 *    - Изменяется ТОЛЬКО workingParams (кружок бегунка и текстовое поле).
 *    - Внешний коллбек onCommit НЕ вызывается.
 *    - Запускается / перезапускается таймер ожидания IDLE.
 * 2. При наступлении события IDLE (пауза в движении > idleDelayMs):
 *    - Автоматически отправляется событие изменения onCommit(workingParams).
 *    - Статус переходит в 'idle'.
 * 3. При отпускании (RELEASE / pointerup / touchend / blur):
 *    - Немедленно очищается IDLE-таймер.
 *    - Сразу вызывается onCommit(workingParams) (если есть изменения).
 *    - Статус переходит в 'idle'.
 */
export class SliderController<T extends Record<string, any>> {
  private _workingParams: T;
  private _committedParams: T;
  private _status: SliderInteractionState = 'idle';
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<SliderListener<T>> = new Set();
  private onCommit: CommitCallback<T>;
  private readonly idleDelayMs: number;

  constructor(
    initialParams: T | SliderControllerOptions<T>,
    maybeOnCommit?: CommitCallback<T>,
    maybeIdleDelayMs: number = 600
  ) {
    if (typeof maybeOnCommit === 'function') {
      this._workingParams = { ...(initialParams as T) };
      this._committedParams = { ...(initialParams as T) };
      this.onCommit = maybeOnCommit;
      this.idleDelayMs = maybeIdleDelayMs;
    } else {
      const opts = initialParams as SliderControllerOptions<T>;
      this._workingParams = { ...(opts.initialValues as T) };
      this._committedParams = { ...(opts.initialValues as T) };
      this.onCommit = opts.onCommit;
      this.idleDelayMs = opts.idleDelayMs ?? 600;
    }
  }

  public get status(): SliderInteractionState {
    return this._status;
  }

  public get workingParams(): T {
    return { ...this._workingParams };
  }

  public get committedParams(): T {
    return { ...this._committedParams };
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
      workingParams: { ...this._workingParams },
      committedParams: { ...this._committedParams },
      status: this._status,
    };
  }

  /**
   * Начало взаимодействия (pointerdown / mousedown / touchstart / focus).
   */
  public startInteraction(): void {
    this._status = 'dragging';
    this.restartIdleTimer();
    this.notify();
  }

  /**
   * Непрерывное перемещение кружка ползунка.
   * Синхронно обновляет workingParams без вызова onCommit.
   */
  public updateValue<K extends keyof T>(key: K, value: T[K]): void {
    this._workingParams = { ...this._workingParams, [key]: value };
    this._status = 'dragging';
    this.restartIdleTimer();
    this.notify();
  }

  /**
   * Пакетное обновление локальных значений.
   */
  public updateWorkingParams(partial: Partial<T>): void {
    this._workingParams = { ...this._workingParams, ...partial };
    this._status = 'dragging';
    this.restartIdleTimer();
    this.notify();
  }

  /**
   * Завершение взаимодействия (pointerup / mouseup / touchend / blur).
   */
  public endInteraction(): void {
    this.clearIdleTimer();
    this.commitIfChanged();
  }

  /**
   * Принудительная фиксация изменений.
   */
  public commitNow(): void {
    this.clearIdleTimer();
    this.commitIfChanged();
  }

  /**
   * Сброс к значениям по умолчанию с немедленным коммитом.
   */
  public reset(defaultParams?: T): void {
    this.clearIdleTimer();
    const target = defaultParams ? { ...defaultParams } : { ...this._committedParams };
    this._workingParams = { ...target };
    this._committedParams = { ...target };
    this._status = 'idle';
    this.notify();
    this.onCommit(this._committedParams);
  }

  /**
   * Синхронизация внешних параметров (если они изменились извне в состоянии покоя).
   */
  public syncExternalParams(externalParams: T): void {
    if (this._status === 'idle') {
      const hasChanged = JSON.stringify(this._workingParams) !== JSON.stringify(externalParams);
      if (hasChanged) {
        this._workingParams = { ...externalParams };
        this._committedParams = { ...externalParams };
        this.notify();
      }
    }
  }

  public dispose(): void {
    this.clearIdleTimer();
    this.listeners.clear();
  }

  public destroy(): void {
    this.dispose();
  }

  private restartIdleTimer(): void {
    this.clearIdleTimer();
    this.idleTimer = setTimeout(() => {
      // Истек таймаут бездействия — фиксируем результат (IDLE событие)
      this.commitIfChanged();
    }, this.idleDelayMs);
  }

  private clearIdleTimer(): void {
    if (this.idleTimer !== null) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  private commitIfChanged(): void {
    const hasChanged = JSON.stringify(this._workingParams) !== JSON.stringify(this._committedParams);
    this._committedParams = { ...this._workingParams };
    this._status = 'idle';
    this.notify();
    if (hasChanged) {
      this.onCommit(this._committedParams);
    }
  }

  private notify(): void {
    const currentState = this.getState();
    this.listeners.forEach((listener) => listener(currentState));
  }
}

/**
 * Обобщенный React-хук бизнес-слоя управления параметрами.
 */
export function useSliderController<T extends Record<string, any>>(
  externalParams: T,
  onChange: (params: T) => void,
  idleDelayMs: number = 600
) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const controllerRef = useRef<SliderController<T> | null>(null);

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
      if (controllerRef.current?.getState().status !== 'idle') {
        controllerRef.current?.endInteraction();
      }
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

  const startInteraction = useCallback(() => {
    controllerRef.current?.startInteraction();
  }, []);

  const endInteraction = useCallback(() => {
    controllerRef.current?.endInteraction();
  }, []);

  const updateValue = useCallback(<K extends keyof T>(key: K, val: T[K]) => {
    controllerRef.current?.updateValue(key, val);
  }, []);

  const updateWorkingParams = useCallback((partial: Partial<T>) => {
    controllerRef.current?.updateWorkingParams(partial);
  }, []);

  const commitNow = useCallback(() => {
    controllerRef.current?.commitNow();
  }, []);

  const reset = useCallback((defaultParams?: T) => {
    controllerRef.current?.reset(defaultParams);
  }, []);

  return {
    workingParams: state.workingParams,
    committedParams: state.committedParams,
    status: state.status,
    isInteracting: state.status !== 'idle',
    startInteraction,
    endInteraction,
    updateValue,
    updateWorkingParams,
    commitNow,
    reset,
  };
}
