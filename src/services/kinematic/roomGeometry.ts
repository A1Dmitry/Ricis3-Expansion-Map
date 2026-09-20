// ============================================================================
// ROOM GEOMETRY — BOUNDED CONTEXT
// ----------------------------------------------------------------------------
// The enclosure the scenario happens in: wall positions, ceiling, and the
// tennis automatons mounted on the walls. This is neither physics (gravity, air)
// nor machine (link lengths, joint limits) nor algorithm (solver gains) — it is
// the *stage*. Kept separate so the launch solver can consult it without
// importing the controller, which would be a dependency cycle.
//
// All values are metric and named; nothing here is derived from physics.
// ============================================================================

import type { Vector3D } from '../../model/kinematicEngine.contracts';

/** Room half-extent in X/Y (m): interior walls live at ±ROOM_HALF_EXTENT_M. */
export const ROOM_HALF_EXTENT_M = 2.4;

/** Room ceiling height (m). */
export const ROOM_HEIGHT_M = 2.8;

/** A wall-mounted tennis automaton: where it sits and which way it aims. */
export interface ITennisCannonProp {
  readonly id: string;
  readonly basePosition: Vector3D;
  readonly muzzlePosition: Vector3D;
  /** Unit vector; the shot speed is solved separately, never baked in here. */
  readonly aimDirection: Vector3D;
}

export const TENNIS_CANNONS: readonly ITennisCannonProp[] = [
  {
    id: 'A',
    basePosition: { x: 2.28, y: 0.55, z: 1.35 },
    muzzlePosition: { x: 2.28, y: 0.55, z: 1.35 },
    aimDirection: { x: -0.8419, y: -0.3547, z: 0.4067 },
  },
  {
    id: 'B',
    basePosition: { x: 0.75, y: 2.28, z: 0.62 },
    muzzlePosition: { x: 0.75, y: 2.28, z: 0.62 },
    aimDirection: { x: -0.1333, y: -0.8889, z: 0.4384 },
  },
];

/**
 * The playable floor area: walls inset by the projectile radius, so a ball
 * resting against a wall has its CENTRE here, not its surface.
 */
export function roomFloorInset(radiusM: number): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  floorZ: number;
} {
  const inset = ROOM_HALF_EXTENT_M - radiusM;
  return { minX: -inset, maxX: inset, minY: -inset, maxY: inset, floorZ: 0 };
}
