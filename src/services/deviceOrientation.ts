export type DeviceOrientationPermission = 'granted' | 'denied' | 'unsupported' | 'error';

export interface OrientationSample {
  readonly alpha: number | null;
  readonly beta: number | null;
  readonly gamma: number | null;
}

export interface OrientationPermissionEvent {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

export interface OrientationEventConstructor {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

export function supportsDeviceOrientation(): boolean {
  return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
}

/**
 * Must be called from a user gesture. Browsers that do not expose
 * requestPermission are treated as available and rely on the event listener.
 */
export async function requestDeviceOrientationPermission(): Promise<DeviceOrientationPermission> {
  if (!supportsDeviceOrientation()) return 'unsupported';

  const orientationEvent = window.DeviceOrientationEvent as unknown as OrientationEventConstructor;
  if (typeof orientationEvent.requestPermission !== 'function') return 'granted';

  try {
    return await orientationEvent.requestPermission();
  } catch {
    return 'error';
  }
}

export function isUsableOrientationSample(event: OrientationSample): boolean {
  return Number.isFinite(event.beta) && Number.isFinite(event.gamma);
}

export function normalizeSignedDegrees(value: number): number {
  let normalized = value % 360;
  if (normalized > 180) normalized -= 360;
  if (normalized < -180) normalized += 360;
  return normalized;
}

export interface OrientationBaseline {
  readonly beta: number;
  readonly gamma: number;
}

export function calculateOrientationDelta(sample: OrientationSample, baseline: OrientationBaseline) {
  if (!isUsableOrientationSample(sample)) return null;
  return {
    pitch: normalizeSignedDegrees((sample.beta as number) - baseline.beta),
    yaw: normalizeSignedDegrees((sample.gamma as number) - baseline.gamma),
  } as const;
}

export function screenOrientationAngle(): number {
  if (typeof screen === 'undefined') return 0;
  const angle = screen.orientation?.angle;
  return typeof angle === 'number' && Number.isFinite(angle) ? ((angle % 360) + 360) % 360 : 0;
}

/** Rotates physical pitch/yaw deltas into the current visual screen orientation. */
export function alignDeltaToScreen(delta: { pitch: number; yaw: number }, angle = screenOrientationAngle()) {
  switch (angle) {
    case 90:
      return { pitch: -delta.yaw, yaw: delta.pitch } as const;
    case 180:
      return { pitch: -delta.pitch, yaw: -delta.yaw } as const;
    case 270:
      return { pitch: delta.yaw, yaw: -delta.pitch } as const;
    default:
      return delta;
  }
}
