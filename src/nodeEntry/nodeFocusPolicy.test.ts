import { describe, expect, it } from 'vitest';
import type { NodeFocusRequest } from './contracts';
import { ReadableNodeFocusPolicy } from './nodeFocusPolicy';

const policy = new ReadableNodeFocusPolicy({
  minimumDesktopDistance: 32,
  minimumMobileDistance: 24,
  radiusMultiplier: 4,
  neighbourContextPadding: 8,
  maxInwardDistanceFactor: 0.72,
  minFlightDurationMs: 500,
  maxFlightDurationMs: 1_500,
});

function request(overrides: Partial<NodeFocusRequest> = {}): NodeFocusRequest {
  return {
    nodeId: 'real-catalog-38' as NodeFocusRequest['nodeId'],
    source: 'graph_click',
    nodePosition: { x: 120, y: 16, z: -48 },
    nodeVisualRadius: 6,
    currentCameraPosition: { x: 180, y: 16, z: -48 },
    currentOrbitTarget: { x: 0, y: 0, z: 0 },
    viewportKind: 'desktop',
    ...overrides,
  };
}

function inputNodeX(): number {
  return 120;
}

describe('ReadableNodeFocusPolicy', () => {
  it('replaces fixed close zoom with a readable context plan centered on the selected node', () => {
    const outcome = policy.plan(request());
    expect(outcome.kind).toBe('focus_planned');
    if (outcome.kind !== 'focus_planned') return;

    expect(outcome.plan.orbitCenter).toEqual({ x: 120, y: 16, z: -48 });
    expect(outcome.plan.distance).toBeGreaterThanOrEqual(32);
    expect(outcome.plan.distance).toBeCloseTo(43.2);
    expect(outcome.plan.cameraPosition).not.toEqual(outcome.plan.orbitCenter);
    expect(outcome.plan.durationMs).toBeGreaterThanOrEqual(500);
    expect(outcome.plan.durationMs).toBeLessThanOrEqual(1_500);
  });

  it('moves outward to the readability floor when current camera position would create a full-screen node', () => {
    const outcome = policy.plan(request({ currentCameraPosition: { x: 132, y: 16, z: -48 } }));
    expect(outcome.kind).toBe('focus_planned');
    if (outcome.kind !== 'focus_planned') return;

    expect(outcome.plan.distance).toBe(32);
    expect(outcome.plan.cameraPosition.x).toBeGreaterThan(inputNodeX());
    expect(outcome.plan.cameraPosition).not.toEqual({ x: 132, y: 16, z: -48 });
    expect(Math.hypot(
      outcome.plan.cameraPosition.x - 120,
      outcome.plan.cameraPosition.y - 16,
      outcome.plan.cameraPosition.z + 48,
    )).toBeCloseTo(32);
  });

  it('scales focus distance for large visual nodes so labels and surrounding context stay visible', () => {
    const outcome = policy.plan(request({ nodeVisualRadius: 12 }));
    expect(outcome.kind).toBe('focus_planned');
    if (outcome.kind !== 'focus_planned') return;

    expect(outcome.plan.distance).toBe(48);
    expect(outcome.plan.distance).toBeGreaterThan(32);
  });

  it('uses a deterministic finite fallback direction when current camera and orbit target coincide', () => {
    const outcome = policy.plan(request({
      currentCameraPosition: { x: 0, y: 0, z: 0 },
      currentOrbitTarget: { x: 0, y: 0, z: 0 },
    }));
    expect(outcome.kind).toBe('focus_planned');
    if (outcome.kind !== 'focus_planned') return;

    expect(Number.isFinite(outcome.plan.cameraPosition.x)).toBe(true);
    expect(Number.isFinite(outcome.plan.cameraPosition.y)).toBe(true);
    expect(Number.isFinite(outcome.plan.cameraPosition.z)).toBe(true);
    expect(outcome.plan.orbitCenter).toEqual({ x: 120, y: 16, z: -48 });
  });

  it('rejects invalid geometry as a typed outcome rather than emitting NaN camera coordinates', () => {
    expect(policy.plan(request({ nodeVisualRadius: 0 }))).toEqual({ kind: 'invalid_focus_geometry' });
    expect(policy.plan(request({ nodePosition: { x: Number.NaN, y: 0, z: 0 } }))).toEqual({ kind: 'invalid_focus_geometry' });
  });

  it('uses a mobile floor while preserving exact node-centered orbit behavior', () => {
    const outcome = policy.plan(request({
      viewportKind: 'mobile',
      nodeVisualRadius: 4,
      currentCameraPosition: { x: 132, y: 16, z: -48 },
    }));
    expect(outcome.kind).toBe('focus_planned');
    if (outcome.kind !== 'focus_planned') return;

    expect(outcome.plan.distance).toBe(24);
    expect(outcome.plan.orbitCenter).toEqual({ x: 120, y: 16, z: -48 });
  });
});
