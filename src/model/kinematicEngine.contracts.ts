export interface Vector3D {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface JointState3D {
  readonly q1: number; // base rotation (rad)
  readonly q2: number; // shoulder pitch (rad)
  readonly q3: number; // elbow pitch (rad)
}

export interface IKinematicState3D {
  readonly timestamp: number;
  readonly joints: JointState3D;
  readonly endEffector: Vector3D;
  readonly jacobianDeterminant: number;
  readonly isSingularZone: boolean;
  readonly isWorkspaceBoundaryExceeded: boolean;
  readonly gripperClosed: boolean;
}

export interface ISolverMetrics3D {
  readonly positionError: number;
  readonly velocityError: number;
  readonly directionPreservedDeg: number;
  readonly singularityIndex: number;
  readonly nearSingularityBehavior: 'degraded' | 'recovered' | 'stable';
  readonly recoverySuccess: boolean;
  readonly invariantPreserved: boolean;
}

export interface ISolverResult3D {
  readonly nextState: IKinematicState3D;
  readonly metrics: ISolverMetrics3D;
}

export interface IKinematicSolver3D {
  readonly solverId: 'DLS_BASELINE' | 'RICIS_INVARIANT_ENGINE';
  solve(
    currentState: IKinematicState3D,
    targetPosition: Vector3D,
    linkLengths: readonly [number, number, number],
    dt: number
  ): ISolverResult3D;
}

export type BallStatus = 'ON_SPAWN' | 'GRASPED' | 'IN_BOX';

export interface IBallEntity {
  readonly id: string;
  readonly initialPosition: Vector3D;
  readonly currentPosition: Vector3D;
  readonly radius: number;
  readonly color: string;
  readonly status: BallStatus;
  readonly isSingularZone: boolean;
}

export interface IBoxContainer {
  readonly position: Vector3D;
  readonly dimensions: Vector3D;
  readonly collectedBallIds: readonly string[];
}

export type PickAndPlacePhase =
  | 'IDLE'
  | 'NAVIGATING_TO_BALL'
  | 'ALIGNING_GRIPPER'
  | 'GRASPING'
  | 'LIFTING'
  | 'TRANSFERRING_TO_BOX'
  | 'RELEASING'
  | 'COMPLETED';

export interface IPickAndPlaceSimulationState {
  readonly phase: PickAndPlacePhase;
  readonly currentTargetBallId: string | null;
  readonly balls: readonly IBallEntity[];
  readonly box: IBoxContainer;
  readonly ballsPlacedCount: number;
  readonly graspFailuresCount: number;
}

export type KinematicEngineMode =
  | 'PICK_AND_PLACE_BOX'
  | 'BOUNDARY_ORBIT'
  | 'SINGULARITY_PENETRATION'
  | 'MANUAL_3D_TARGET';

export type AdvantageTriggerKind =
  | 'DIRECTION_LOSS_PREVENTED'
  | 'VELOCITY_SPIKE_AVOIDED'
  | 'BOUNDARY_GRASP_SUCCESS'
  | 'INVARIANT_PRESERVED';

export interface IAdvantageEvent {
  readonly id: string;
  readonly timestamp: number;
  readonly kind: AdvantageTriggerKind;
  readonly description: string;
  readonly jacobianDet: number;
  readonly dlsDirectionLoss: number;
  readonly ricisDirectionLoss: number;
  readonly dlsVelocityError: number;
  readonly ricisVelocityError: number;
}

export interface IKinematicLogEntry {
  readonly id: string;
  readonly stepIndex: number;
  readonly timestamp: number;
  readonly mode: KinematicEngineMode;
  readonly jacobianDet: number;
  readonly target: Vector3D;
  readonly dlsEE: Vector3D;
  readonly ricisEE: Vector3D;
  readonly dlsMetrics: ISolverMetrics3D;
  readonly ricisMetrics: ISolverMetrics3D;
  readonly advantageEvent: IAdvantageEvent | null;
}

export interface IKinematicTelemetryLedger {
  readonly logs: readonly IKinematicLogEntry[];
  readonly advantageEvents: readonly IAdvantageEvent[];
  readonly totalAdvantageCount: number;
  readonly dlsScore: { placedBalls: number; graspMisses: number; avgDeviationDeg: number };
  readonly ricisScore: { placedBalls: number; graspMisses: number; avgDeviationDeg: number };
}
