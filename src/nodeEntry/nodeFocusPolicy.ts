import type {
  INodeFocusPolicy,
  NodeFocusOutcome,
  NodeFocusPlan,
  NodeFocusReadabilityPolicy,
  NodeFocusRequest,
  ReadonlyVector3,
} from './contracts';

export const DEFAULT_NODE_FOCUS_READABILITY_POLICY: NodeFocusReadabilityPolicy = {
  minimumDesktopDistance: 32,
  minimumMobileDistance: 24,
  radiusMultiplier: 4,
  neighbourContextPadding: 8,
  maxInwardDistanceFactor: 0.72,
  minFlightDurationMs: 500,
  maxFlightDurationMs: 1_500,
};

const FALLBACK_DIRECTION: ReadonlyVector3 = Object.freeze({ x: 0.58, y: 0.34, z: 0.74 });

function isFiniteVector(value: ReadonlyVector3): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
}

function subtract(left: ReadonlyVector3, right: ReadonlyVector3): ReadonlyVector3 {
  return { x: left.x - right.x, y: left.y - right.y, z: left.z - right.z };
}

function length(value: ReadonlyVector3): number {
  return Math.hypot(value.x, value.y, value.z);
}

function normalizedOrFallback(value: ReadonlyVector3): ReadonlyVector3 {
  const valueLength = length(value);
  if (!Number.isFinite(valueLength) || valueLength < 0.000_001) return FALLBACK_DIRECTION;
  return { x: value.x / valueLength, y: value.y / valueLength, z: value.z / valueLength };
}

function addScaled(origin: ReadonlyVector3, direction: ReadonlyVector3, distance: number): ReadonlyVector3 {
  return {
    x: origin.x + direction.x * distance,
    y: origin.y + direction.y * distance,
    z: origin.z + direction.z * distance,
  };
}

function clamp(value: number, lower: number, upper: number): number {
  return Math.max(lower, Math.min(upper, value));
}

/**
 * Pure policy for node selection camera plans. It deliberately knows nothing
 * about Three.js controls or map state mutation; adapters execute its plan.
 */
export class ReadableNodeFocusPolicy implements INodeFocusPolicy {
  public constructor(private readonly policy: NodeFocusReadabilityPolicy = DEFAULT_NODE_FOCUS_READABILITY_POLICY) {}

  public plan(input: NodeFocusRequest): NodeFocusOutcome {
    if (
      !isFiniteVector(input.nodePosition) ||
      !isFiniteVector(input.currentCameraPosition) ||
      !isFiniteVector(input.currentOrbitTarget) ||
      !Number.isFinite(input.nodeVisualRadius) ||
      input.nodeVisualRadius <= 0
    ) {
      return { kind: 'invalid_focus_geometry' };
    }

    const readableFloor = this.readableFloor(input);
    if (!Number.isFinite(readableFloor) || readableFloor <= 0) return { kind: 'invalid_focus_geometry' };

    const currentNodeDistance = length(subtract(input.currentCameraPosition, input.nodePosition));
    if (!Number.isFinite(currentNodeDistance)) return { kind: 'invalid_focus_geometry' };

    const desiredDistance = currentNodeDistance < readableFloor
      ? readableFloor
      : Math.max(readableFloor, currentNodeDistance * this.policy.maxInwardDistanceFactor);
    const viewDirection = normalizedOrFallback(subtract(input.currentCameraPosition, input.currentOrbitTarget));
    const cameraPosition = addScaled(input.nodePosition, viewDirection, desiredDistance);

    if (!isFiniteVector(cameraPosition)) return { kind: 'invalid_focus_geometry' };

    const travelDistance = length(subtract(cameraPosition, input.currentCameraPosition));
    const durationMs = clamp(
      this.policy.minFlightDurationMs + travelDistance * 7,
      this.policy.minFlightDurationMs,
      this.policy.maxFlightDurationMs,
    );

    const plan: NodeFocusPlan = {
      nodeId: input.nodeId,
      orbitCenter: input.nodePosition,
      cameraPosition,
      distance: desiredDistance,
      durationMs,
      mode: 'readable_context',
    };
    return { kind: 'focus_planned', plan };
  }

  private readableFloor(input: NodeFocusRequest): number {
    const viewportMinimum = input.viewportKind === 'mobile'
      ? this.policy.minimumMobileDistance
      : this.policy.minimumDesktopDistance;
    return Math.max(
      viewportMinimum,
      input.nodeVisualRadius * this.policy.radiusMultiplier,
      input.nodeVisualRadius + this.policy.neighbourContextPadding,
    );
  }
}
