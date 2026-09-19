// ============================================================================
// MANIPULATOR RENDER TRACE
//
// Records what the 3D viewport actually DRAWS, per frame, in world space — not what
// the solver reported. The 2026-09-19 elbow-branch incident passed every existing
// gate because all of them read the solver's Cartesian output, while the mirror
// identity left the end-effector untouched and only the DRAWN joints jumped. A trace
// taken downstream of the joint->geometry mapping is the only observation point that
// can see that class of defect.
//
// Bounded ring buffer, no I/O, no timers: 60 FPS x 2 arms is a few dozen numbers per
// frame and the buffer is capped, so it is safe to leave permanently wired in.
// ============================================================================

import type { Vector3D } from '../../model/kinematicEngine.contracts';

export type RenderTraceArm = 'RICIS' | 'DLS_GHOST';

/** One drawn frame of one arm: the world-space joints the links are drawn between. */
export interface IRenderTraceFrame {
  readonly frameIndex: number;
  readonly arm: RenderTraceArm;
  /** Base pivot. */
  readonly shoulder: Vector3D;
  /** Elbow joint. */
  readonly elbow: Vector3D;
  /** End-effector. */
  readonly gripper: Vector3D;
}

/** Measured continuity of the drawn arm, in metres per frame. */
export interface IRenderContinuityReport {
  readonly arm: RenderTraceArm;
  readonly frames: number;
  readonly maxElbowStepM: number;
  readonly maxGripperStepM: number;
  readonly maxElbowStepFrame: number;
  /** Lowest drawn elbow height (world Y, floor = 0). Negative means under the floor. */
  readonly minElbowY: number;
}

type TraceListener = (frames: readonly IRenderTraceFrame[]) => void;

function distance(a: Vector3D, b: Vector3D): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

export class ManipulatorRenderTrace {
  private readonly capacity: number;
  private buffer: IRenderTraceFrame[] = [];
  private frameCounter = 0;
  private readonly listeners = new Set<TraceListener>();

  constructor(capacity = 900) {
    this.capacity = capacity;
  }

  /** Record one drawn frame of one arm. */
  public record(
    arm: RenderTraceArm,
    pose: { readonly shoulder: Vector3D; readonly elbow: Vector3D; readonly gripper: Vector3D }
  ): void {
    this.buffer.push({
      frameIndex: this.frameCounter++,
      arm,
      shoulder: { ...pose.shoulder },
      elbow: { ...pose.elbow },
      gripper: { ...pose.gripper },
    });
    if (this.buffer.length > this.capacity) {
      this.buffer.splice(0, this.buffer.length - this.capacity);
    }
  }

  public subscribe(listener: TraceListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSnapshot(): readonly IRenderTraceFrame[] {
    return Object.freeze([...this.buffer]);
  }

  public framesFor(arm: RenderTraceArm): readonly IRenderTraceFrame[] {
    return this.buffer.filter((f) => f.arm === arm);
  }

  public clear(): void {
    this.buffer = [];
    this.frameCounter = 0;
    this.notify();
  }

  /**
   * Turn the drawn frames into the objective numbers: how far the DRAWN elbow and
   * gripper moved between consecutive frames, and how low the elbow was drawn.
   * A branch teleport shows up here as a multi-metre single-frame elbow jump even
   * though the gripper never moved at all.
   */
  public analyzeContinuity(arm: RenderTraceArm): IRenderContinuityReport {
    const frames = this.framesFor(arm);
    let maxElbowStepM = 0;
    let maxGripperStepM = 0;
    let maxElbowStepFrame = -1;
    let minElbowY = Infinity;
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      if (f.elbow.y < minElbowY) minElbowY = f.elbow.y;
      if (i === 0) continue;
      const prev = frames[i - 1];
      const elbowStep = distance(prev.elbow, f.elbow);
      const gripperStep = distance(prev.gripper, f.gripper);
      if (elbowStep > maxElbowStepM) {
        maxElbowStepM = elbowStep;
        maxElbowStepFrame = f.frameIndex;
      }
      if (gripperStep > maxGripperStepM) maxGripperStepM = gripperStep;
    }
    return {
      arm,
      frames: frames.length,
      maxElbowStepM,
      maxGripperStepM,
      maxElbowStepFrame,
      minElbowY: frames.length === 0 ? Infinity : minElbowY,
    };
  }

  private notify(): void {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot);
  }
}

/** Process-wide trace of the manipulator viewport. */
export const manipulatorRenderTrace = new ManipulatorRenderTrace();
