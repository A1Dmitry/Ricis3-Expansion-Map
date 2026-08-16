import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SliderController } from './useSliderController';

interface MockPhysicsParams {
  zoneG: number;
  springK: number;
  label: string;
}

describe('useSliderController / SliderController Unit Tests', () => {
  let initialValues: MockPhysicsParams;
  let commitSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    initialValues = {
      zoneG: 20,
      springK: 1.5,
      label: 'default',
    };
    commitSpy = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('1. Изоляция при перемещении ползунка (Drag Isolation)', () => {
    it('не должен вызывать onCommit во время непрерывного изменения значений ползунка', () => {
      const controller = new SliderController({
        initialValues,
        onCommit: commitSpy,
        idleDelayMs: 500,
      });

      controller.startInteraction();
      expect(controller.status).toBe('dragging');

      // Симулируем серию быстрых смещений бегунка
      controller.updateValue('zoneG', 25);
      controller.updateValue('zoneG', 30);
      controller.updateValue('zoneG', 35);
      controller.updateValue('springK', 2.0);

      // Кружок ползунка и локальное состояние обновились
      expect(controller.workingParams.zoneG).toBe(35);
      expect(controller.workingParams.springK).toBe(2.0);

      // Внешний мир/физический движок НЕ получал обновлений
      expect(commitSpy).not.toHaveBeenCalled();
      expect(controller.committedParams.zoneG).toBe(20);
      expect(controller.committedParams.springK).toBe(1.5);
    });
  });

  describe('2. Фиксация по отпусканию (Release Event)', () => {
    it('должен немедленно вызывать onCommit с новыми параметрами при вызове endInteraction()', () => {
      const controller = new SliderController({
        initialValues,
        onCommit: commitSpy,
        idleDelayMs: 500,
      });

      controller.startInteraction();
      controller.updateValue('zoneG', 50);

      expect(commitSpy).not.toHaveBeenCalled();

      // Пользователь отпустил кнопку мыши / палец от экрана
      controller.endInteraction();

      expect(commitSpy).toHaveBeenCalledTimes(1);
      expect(commitSpy).toHaveBeenCalledWith({
        zoneG: 50,
        springK: 1.5,
        label: 'default',
      });
      expect(controller.committedParams.zoneG).toBe(50);
      expect(controller.status).toBe('idle');
    });

    it('не должен повторно вызывать onCommit при отпускании, если значения не менялись (L1_IDENTITY)', () => {
      const controller = new SliderController({
        initialValues,
        onCommit: commitSpy,
        idleDelayMs: 500,
      });

      controller.startInteraction();
      // Нажали и отпустили без сдвига
      controller.endInteraction();

      expect(commitSpy).not.toHaveBeenCalled();
      expect(controller.status).toBe('idle');
    });
  });

  describe('3. Фиксация по таймауту бездействия (IDLE Event)', () => {
    it('должен вызывать onCommit, если пользователь удерживает ползунок без движения дольше idleDelayMs', () => {
      const controller = new SliderController({
        initialValues,
        onCommit: commitSpy,
        idleDelayMs: 600,
      });

      controller.startInteraction();
      controller.updateValue('zoneG', 42);

      expect(commitSpy).not.toHaveBeenCalled();

      // Прошло 300 мс (меньше таймаута) — коммита все еще нет
      vi.advanceTimersByTime(300);
      expect(commitSpy).not.toHaveBeenCalled();

      // Прошло еще 350 мс (суммарно 650 мс > 600 мс) — наступило состояние IDLE
      vi.advanceTimersByTime(350);

      expect(commitSpy).toHaveBeenCalledTimes(1);
      expect(commitSpy).toHaveBeenCalledWith(expect.objectContaining({ zoneG: 42 }));
      expect(controller.committedParams.zoneG).toBe(42);
      expect(controller.status).toBe('idle');
    });

    it('должен сбрасывать таймер IDLE при возобновлении движения до истечения таймаута', () => {
      const controller = new SliderController({
        initialValues,
        onCommit: commitSpy,
        idleDelayMs: 600,
      });

      controller.startInteraction();
      controller.updateValue('zoneG', 30);

      // Ждем 400 мс
      vi.advanceTimersByTime(400);
      expect(commitSpy).not.toHaveBeenCalled();

      // Продолжаем двигать бегунок
      controller.updateValue('zoneG', 35);

      // Ждем еще 400 мс (от прошлого обновления прошло 400 мс, суммарно 800 мс, но таймер сбросился)
      vi.advanceTimersByTime(400);
      expect(commitSpy).not.toHaveBeenCalled();

      // Ждем еще 250 мс (650 мс после последнего updateValue) — срабатывает IDLE
      vi.advanceTimersByTime(250);
      expect(commitSpy).toHaveBeenCalledTimes(1);
      expect(commitSpy).toHaveBeenCalledWith(expect.objectContaining({ zoneG: 35 }));
    });
  });

  describe('4. Сброс и утилизация ресурсов', () => {
    it('должен немедленно сбрасывать значения к defaults и очищать таймеры при reset()', () => {
      const controller = new SliderController({
        initialValues,
        onCommit: commitSpy,
        idleDelayMs: 500,
      });

      controller.startInteraction();
      controller.updateValue('zoneG', 99);

      // Сброс
      controller.reset();

      expect(commitSpy).toHaveBeenCalledWith(initialValues);
      expect(controller.workingParams.zoneG).toBe(20);
      expect(controller.committedParams.zoneG).toBe(20);

      // Убеждаемся, что отложенных таймеров не осталось
      vi.advanceTimersByTime(1000);
      expect(commitSpy).toHaveBeenCalledTimes(1);
    });

    it('должен безопасно очищать слушатели и таймеры при dispose()', () => {
      const controller = new SliderController({
        initialValues,
        onCommit: commitSpy,
        idleDelayMs: 500,
      });

      controller.startInteraction();
      controller.updateValue('zoneG', 77);
      controller.dispose();

      vi.advanceTimersByTime(1000);
      expect(commitSpy).not.toHaveBeenCalled();
    });
  });
});
