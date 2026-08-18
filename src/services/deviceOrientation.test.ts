import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  alignDeltaToScreen,
  calculateOrientationDelta,
  isUsableOrientationSample,
  normalizeSignedDegrees,
  requestDeviceOrientationPermission,
  supportsDeviceOrientation,
} from './deviceOrientation';

describe('device orientation service', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports unsupported when the browser has no orientation event API', async () => {
    vi.stubGlobal('window', {});
    expect(supportsDeviceOrientation()).toBe(false);
    await expect(requestDeviceOrientationPermission()).resolves.toBe('unsupported');
  });

  it('accepts event-based browsers that do not require an explicit permission prompt', async () => {
    vi.stubGlobal('window', { DeviceOrientationEvent: {} });
    expect(supportsDeviceOrientation()).toBe(true);
    await expect(requestDeviceOrientationPermission()).resolves.toBe('granted');
  });

  it('forwards the explicit iOS permission result', async () => {
    const requestPermission = vi.fn().mockResolvedValue('granted');
    vi.stubGlobal('window', { DeviceOrientationEvent: { requestPermission } });

    await expect(requestDeviceOrientationPermission()).resolves.toBe('granted');
    expect(requestPermission).toHaveBeenCalledOnce();
  });

  it('keeps a denied permission as a non-throwing UI state', async () => {
    vi.stubGlobal('window', { DeviceOrientationEvent: { requestPermission: vi.fn().mockResolvedValue('denied') } });
    await expect(requestDeviceOrientationPermission()).resolves.toBe('denied');
  });

  it('validates samples and calculates signed pitch/yaw delta from the calibration baseline', () => {
    expect(isUsableOrientationSample({ alpha: null, beta: 18, gamma: -24 })).toBe(true);
    expect(isUsableOrientationSample({ alpha: 0, beta: null, gamma: 3 })).toBe(false);
    expect(calculateOrientationDelta({ alpha: 0, beta: 28, gamma: -5 }, { beta: 18, gamma: -24 })).toEqual({ pitch: 10, yaw: 19 });
  });

  it('normalizes angles across the -180..180 wrap boundary', () => {
    expect(normalizeSignedDegrees(190)).toBe(-170);
    expect(normalizeSignedDegrees(-190)).toBe(170);
    expect(normalizeSignedDegrees(720)).toBe(0);
  });

  it('maps physical pitch/yaw to the current visual orientation in landscape', () => {
    expect(alignDeltaToScreen({ pitch: 10, yaw: 20 }, 0)).toEqual({ pitch: 10, yaw: 20 });
    expect(alignDeltaToScreen({ pitch: 10, yaw: 20 }, 90)).toEqual({ pitch: -20, yaw: 10 });
    expect(alignDeltaToScreen({ pitch: 10, yaw: 20 }, 180)).toEqual({ pitch: -10, yaw: -20 });
    expect(alignDeltaToScreen({ pitch: 10, yaw: 20 }, 270)).toEqual({ pitch: 20, yaw: -10 });
  });
});
