import { useState, useEffect, useRef } from 'react';
import { PhysicsParams, DEFAULT_PHYSICS_PARAMS } from '../model/physics';

export type SliderInteractionState = 'IDLE' | 'DRAGGING' | 'PENDING_IDLE';

export interface PhysicsSliderState {
  workingParams: PhysicsParams;
  committedParams: PhysicsParams;
  status: SliderInteractionState;
}

export type SliderListener = (state: PhysicsSliderState) => void;
export type CommitCallback = (params: PhysicsParams) => void;

/**
 * Бизнес-слой управления ползунками физической симуляции (Slider Business Layer).
 * 
 * Соблюдение бизнес-требований:
 * 1. Пока нажата кнопка мыши / происходит перетаскивание (DRAGGING):
 *    - Изменения происходят ИСКЛЮЧИТЕЛЬНО во внутреннем состоянии (workingParams).
 *    - Никакие события во внешнюю физическую систему НЕ отправляются.
 *    - Ползунки свободно и плавно передвигаются в интерфейсе.
 * 2. При отпускании кнопки мыши статус переходит в PENDING_IDLE и запускается 1-секундный таймер.
 * 3. Если пользователь сдвигает ползунок снова, таймер сбрасывается.
 * 4. Только при достижении статуса IDLE (1 сек полного покоя) отправляется ИТОГОВОЕ событие изменения.
 */
export class PhysicsSliderController {
  private workingParams: PhysicsParams;
  private committedParams: PhysicsParams;
  private status: SliderInteractionState = 'IDLE';
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<SliderListener> = new Set();
  private onCommit: CommitCallback;
  private readonly idleDelayMs: number;

  constructor(
    initialParams: PhysicsParams = DEFAULT_PHYSICS_PARAMS,
    onCommit: CommitCallback,
    idleDelayMs: number = 1000
  ) {
    this.workingParams = { ...initialParams };
    this.committedParams = { ...initialParams };
    this.onCommit = onCommit;
    this.idleDelayMs = idleDelayMs;
  }

  public subscribe(listener: SliderListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): PhysicsSliderState {
    return {
      workingParams: { ...this.workingParams },
      committedParams: { ...this.committedParams },
      status: this.status,
    };
  }

  /**
   * Начало зажатия мыши на слайдере
   */
  public startInteraction(): void {
    this.clearIdleTimer();
    this.status = 'DRAGGING';
    this.notify();
  }

  /**
   * Обновление значения ползунка только во внутреннем бизнес-слое
   */
  public updateValue(key: keyof PhysicsParams, value: number): void {
    if (isNaN(value)) return;
    this.workingParams = { ...this.workingParams, [key]: value };
    this.status = 'DRAGGING';
    this.clearIdleTimer(); // Сбрасываем таймер во время движения
    this.notify();
  }

  /**
   * Завершение перемещения (отпускание клавиши мыши)
   */
  public endInteraction(): void {
    if (this.status === 'DRAGGING') {
      this.status = 'PENDING_IDLE';
      this.startIdleTimer();
      this.notify();
    }
  }

  /**
   * Мгновенный сброс параметров к значениям по умолчанию
   */
  public resetToDefault(defaultParams: PhysicsParams = DEFAULT_PHYSICS_PARAMS): void {
    this.clearIdleTimer();
    this.workingParams = { ...defaultParams };
    this.committedParams = { ...defaultParams };
    this.status = 'IDLE';
    this.notify();
    this.onCommit(this.committedParams);
  }

  /**
   * Синхронизация с внешними изменениями (только в состоянии IDLE)
   */
  public syncExternalParams(externalParams: PhysicsParams): void {
    if (this.status === 'IDLE') {
      this.workingParams = { ...externalParams };
      this.committedParams = { ...externalParams };
      this.notify();
    }
  }

  public destroy(): void {
    this.clearIdleTimer();
    this.listeners.clear();
  }

  private startIdleTimer(): void {
    this.clearIdleTimer();
    this.idleTimer = setTimeout(() => {
      this.status = 'IDLE';
      const hasChanged = JSON.stringify(this.workingParams) !== JSON.stringify(this.committedParams);
      if (hasChanged) {
        this.committedParams = { ...this.workingParams };
        this.notify();
        // Отправка изменения внешней системе СТРОГО в состоянии IDLE
        this.onCommit(this.committedParams);
      } else {
        this.notify();
      }
    }, this.idleDelayMs);
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
 * React-хук бизнес-слоя управления ползунками
 */
export function usePhysicsSliderController(
  externalParams: PhysicsParams,
  onChange: (params: PhysicsParams) => void,
  idleDelayMs: number = 1000
) {
  const controllerRef = useRef<PhysicsSliderController | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  if (!controllerRef.current) {
    controllerRef.current = new PhysicsSliderController(
      externalParams,
      (committed) => onChangeRef.current(committed),
      idleDelayMs
    );
  }

  const [state, setState] = useState<PhysicsSliderState>(() =>
    controllerRef.current!.getState()
  );

  useEffect(() => {
    const controller = controllerRef.current!;
    const unsubscribe = controller.subscribe((newState) => {
      setState(newState);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    controllerRef.current?.syncExternalParams(externalParams);
  }, [externalParams]);

  // Глобальный перехват отпускания клавиши мыши
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
    updateValue: (key: keyof PhysicsParams, val: number) =>
      controllerRef.current?.updateValue(key, val),
    reset: () => controllerRef.current?.resetToDefault(),
  };
}
