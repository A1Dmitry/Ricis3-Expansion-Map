import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  NodeFocusOutcome,
  NodeFocusPlan,
  NodeFocusReadabilityPolicy,
  NodeFocusRequest,
  NodeFocusSource,
  ReadonlyVector3,
} from './contracts';

const readability: NodeFocusReadabilityPolicy = {
  minimumDesktopDistance: 32,
  minimumMobileDistance: 24,
  radiusMultiplier: 4,
  neighbourContextPadding: 8,
  maxInwardDistanceFactor: 0.72,
  minFlightDurationMs: 500,
  maxFlightDurationMs: 1_500,
};

const nodePosition: ReadonlyVector3 = { x: 120, y: 16, z: -48 };

function distance(from: ReadonlyVector3, to: ReadonlyVector3): number {
  return Math.hypot(from.x - to.x, from.y - to.y, from.z - to.z);
}

function expectedReadableFloor(input: Pick<NodeFocusRequest, 'nodeVisualRadius' | 'viewportKind'>): number {
  const viewportMinimum = input.viewportKind === 'mobile'
    ? readability.minimumMobileDistance
    : readability.minimumDesktopDistance;
  return Math.max(
    viewportMinimum,
    input.nodeVisualRadius * readability.radiusMultiplier,
    input.nodeVisualRadius + readability.neighbourContextPadding,
  );
}

function request(overrides: Partial<NodeFocusRequest> = {}): NodeFocusRequest {
  return {
    nodeId: 'real-catalog-38' as NodeFocusRequest['nodeId'],
    source: 'node_entry_handoff',
    nodePosition,
    nodeVisualRadius: 6,
    currentCameraPosition: { x: 180, y: 16, z: -48 },
    currentOrbitTarget: { x: 0, y: 0, z: 0 },
    viewportKind: 'desktop',
    ...overrides,
  };
}

function readablePlan(input: NodeFocusRequest, cameraPosition: ReadonlyVector3, durationMs = 1_000): NodeFocusPlan {
  return {
    nodeId: input.nodeId,
    orbitCenter: input.nodePosition,
    cameraPosition,
    distance: distance(cameraPosition, input.nodePosition),
    durationMs,
    mode: 'readable_context',
  };
}

function assertReadablePlan(input: NodeFocusRequest, plan: NodeFocusPlan): void {
  expect(plan.mode).toBe('readable_context');
  expect(plan.nodeId).toBe(input.nodeId);
  expect(plan.orbitCenter).toEqual(input.nodePosition);
  expect(plan.distance).toBeCloseTo(distance(plan.cameraPosition, input.nodePosition));
  expect(plan.distance).toBeGreaterThanOrEqual(expectedReadableFloor(input));
  expect(plan.durationMs).toBeGreaterThanOrEqual(readability.minFlightDurationMs);
  expect(plan.durationMs).toBeLessThanOrEqual(readability.maxFlightDurationMs);
}

function assertFocusOutcome(outcome: NodeFocusOutcome): string {
  switch (outcome.kind) {
    case 'focus_planned':
      return outcome.plan.mode;
    case 'node_position_unavailable':
    case 'invalid_focus_geometry':
      return outcome.kind;
  }
}

describe('Node focus — Step 3 readable-context policy QA', () => {
  it('NQA08: node-entry handoff plan uses the selected node as exact orbit center and preserves readable desktop distance', () => {
    const input = request();
    const plan = readablePlan(input, { x: 168, y: 16, z: -48 });
    assertReadablePlan(input, plan);
    expect(plan.orbitCenter).toEqual({ x: 120, y: 16, z: -48 });
    expect(plan.distance).toBe(48);
  });

  it('NQA09: a large visual node raises the safe focus floor above the generic desktop minimum', () => {
    const input = request({ nodeVisualRadius: 12 });
    const plan = readablePlan(input, { x: 176, y: 16, z: -48 });
    expect(expectedReadableFloor(input)).toBe(48);
    assertReadablePlan(input, plan);
    expect(plan.distance).toBe(56);
  });

  it('NQA10: when the camera is already too close, the expected plan moves outward instead of creating a full-screen zoom', () => {
    const input = request({
      currentCameraPosition: { x: 132, y: 16, z: -48 },
    });
    const plan = readablePlan(input, { x: 160, y: 16, z: -48 });
    const currentDistance = distance(input.currentCameraPosition, input.nodePosition);
    assertReadablePlan(input, plan);
    expect(currentDistance).toBe(12);
    expect(plan.distance).toBe(40);
    expect(plan.distance).toBeGreaterThan(currentDistance);
  });

  it('NQA11: mobile focus uses its own floor but preserves the same selected-node orbit center invariant', () => {
    const input = request({ viewportKind: 'mobile', nodeVisualRadius: 4, source: 'url_restore' });
    const plan = readablePlan(input, { x: 148, y: 16, z: -48 }, 750);
    assertReadablePlan(input, plan);
    expect(expectedReadableFloor(input)).toBe(24);
    expect(plan.orbitCenter).toEqual(nodePosition);
  });

  it('NQA12: every node-navigation source shares one typed focus contract rather than a source-specific zoom rule', () => {
    const sources: readonly NodeFocusSource[] = [
      'node_entry_handoff',
      'graph_click',
      'search_result',
      'dependency_navigation',
      'navigation_back',
      'url_restore',
    ];
    expect(sources).toHaveLength(6);
    expect(sources.every((source) => request({ source }).nodeId === 'real-catalog-38')).toBe(true);
  });

  it('NQA13: unavailable position and invalid geometry stay typed non-camera outcomes rather than NaN plans', () => {
    const outcomes: readonly NodeFocusOutcome[] = [
      { kind: 'node_position_unavailable' },
      { kind: 'invalid_focus_geometry' },
      { kind: 'focus_planned', plan: readablePlan(request(), { x: 168, y: 16, z: -48 }) },
    ];
    expect(outcomes.map(assertFocusOutcome)).toEqual([
      'node_position_unavailable',
      'invalid_focus_geometry',
      'readable_context',
    ]);
    expect(outcomes.filter((outcome) => outcome.kind === 'focus_planned').every((outcome) => Number.isFinite(outcome.plan.distance))).toBe(true);
  });

  it('NQA14: focus contracts contain presentation geometry only and cannot carry a graph mutation, proof status or Core/Lean result', () => {
    const plan = readablePlan(request(), { x: 168, y: 16, z: -48 });
    expect(plan).not.toHaveProperty('graphMutation');
    expect(plan).not.toHaveProperty('proof');
    expect(plan).not.toHaveProperty('coreResult');
    expect(plan).not.toHaveProperty('leanEvidence');
  });

  it('NQA15: TypeScript distinguishes immutable geometry, readable policy and typed outcome from Three.js runtime objects', () => {
    expectTypeOf<NodeFocusRequest['nodePosition']>().toEqualTypeOf<ReadonlyVector3>();
    expectTypeOf<NodeFocusPlan['orbitCenter']>().toEqualTypeOf<ReadonlyVector3>();
    expectTypeOf<NodeFocusPlan['mode']>().toEqualTypeOf<'readable_context'>();
    expectTypeOf<NodeFocusOutcome>().toMatchTypeOf<{ readonly kind: string }>();
  });
});
