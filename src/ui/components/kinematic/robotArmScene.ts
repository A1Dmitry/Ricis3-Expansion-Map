// ============================================================================
// ROBOT ARM SCENE RIG — the exact geometry the viewer sees, made traceable.
//
// Why this module exists: the arm used to be built by a closure inside
// RobotArm3DCanvas' useEffect, which also constructs a THREE.WebGLRenderer. In any
// environment without a WebGL context (jsdom, CI, headless probes) that effect bails
// out and falls back to the 2D view, so NOTHING of the 3D arm was ever constructed —
// the rendered pose could not be observed or asserted at all. Building the rig does
// not need a renderer (only drawing does), so extracting it makes the drawn link
// positions readable, traceable and testable on the very objects that get rendered.
//
// Geometry is moved verbatim; visual output is unchanged.
// ============================================================================

import * as THREE from 'three';
import type { JointState3D, Vector3D } from '../../../model/kinematicEngine.contracts';

/** The articulated nodes of one drawn arm, in scene-graph order. */
export interface IRobotArmRig {
  readonly armGroup: THREE.Group;
  /** Turntable — rotation.y = q1. Its origin is the shoulder pivot. */
  readonly baseRotGroup: THREE.Group;
  /** Shoulder pitch — rotation.z = q2. */
  readonly shoulderGroup: THREE.Group;
  /** Elbow — rotation.z = q3. Its origin is the elbow joint. */
  readonly elbowGroup: THREE.Group;
  /** Wrist. Its origin is the end-effector. */
  readonly gripperGroup: THREE.Group;
  readonly gripperFingers: { f1: THREE.Mesh; f2: THREE.Mesh } | null;
}

/**
 * World-space positions of the drawn link joints, in the THREE.js frame the viewer
 * sees. `shoulder` is the base pivot, `elbow` the elbow joint, `gripper` the
 * end-effector — i.e. exactly the three points the two links are drawn between.
 */
export interface IRobotArmWorldPose {
  readonly shoulder: Vector3D;
  readonly elbow: Vector3D;
  readonly gripper: Vector3D;
}

/**
 * Domain (x, y, z) -> THREE.js (x, z, -y). The scene is Y-up with the arm plane
 * rotated into +X, so this is the mapping every prop in the canvas uses.
 */
export function domainToRender(v: Vector3D): Vector3D {
  return { x: v.x, y: v.z, z: -v.y };
}

/** Build one arm rig. Needs no WebGL context — only drawing does. */
export function createRobotArmRig(
  isRicis: boolean,
  linkLengths: readonly [number, number, number]
): IRobotArmRig {
  const [L0, L1, L2] = linkLengths;
    const armGroup = new THREE.Group();

    // Base Pedestal
    const baseGeo = new THREE.CylinderGeometry(0.28, 0.35, L0, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: isRicis ? 0x0f172a : 0x1e293b,
      metalness: 0.8,
      roughness: 0.3,
      transparent: !isRicis,
      opacity: isRicis ? 1.0 : 0.4,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = L0 / 2;
    armGroup.add(baseMesh);

    // Rotating Turntable (q1)
    const baseRotGroup = new THREE.Group();
    baseRotGroup.position.y = L0;
    armGroup.add(baseRotGroup);

    const turretGeo = new THREE.SphereGeometry(0.22, 24, 24);
    const turretMat = new THREE.MeshStandardMaterial({
      color: isRicis ? 0x059669 : 0x475569,
      metalness: 0.7,
      roughness: 0.2,
      transparent: !isRicis,
      opacity: isRicis ? 1.0 : 0.4,
    });
    const turretMesh = new THREE.Mesh(turretGeo, turretMat);
    baseRotGroup.add(turretMesh);

    // Shoulder Group (q2)
    const shoulderGroup = new THREE.Group();
    baseRotGroup.add(shoulderGroup);

    // Link 1 (Shoulder to Elbow)
    const link1Geo = new THREE.CylinderGeometry(0.1, 0.12, L1, 24);
    link1Geo.translate(0, L1 / 2, 0);
    const link1Mat = new THREE.MeshStandardMaterial({
      color: isRicis ? 0x10b981 : 0x64748b,
      metalness: 0.9,
      roughness: 0.25,
      transparent: !isRicis,
      opacity: isRicis ? 1.0 : 0.45,
    });
    const link1Mesh = new THREE.Mesh(link1Geo, link1Mat);
    link1Mesh.rotation.z = -Math.PI / 2;
    shoulderGroup.add(link1Mesh);

    // Elbow Group (q3)
    const elbowGroup = new THREE.Group();
    elbowGroup.position.x = L1;
    shoulderGroup.add(elbowGroup);

    const elbowServoGeo = new THREE.SphereGeometry(0.15, 20, 20);
    const elbowServo = new THREE.Mesh(elbowServoGeo, turretMat);
    elbowGroup.add(elbowServo);

    // Link 2 (Forearm to Gripper)
    const link2Geo = new THREE.CylinderGeometry(0.08, 0.1, L2, 24);
    link2Geo.translate(0, L2 / 2, 0);
    const link2Mat = new THREE.MeshStandardMaterial({
      color: isRicis ? 0x34d399 : 0x94a3b8,
      metalness: 0.85,
      roughness: 0.25,
      transparent: !isRicis,
      opacity: isRicis ? 1.0 : 0.45,
    });
    const link2Mesh = new THREE.Mesh(link2Geo, link2Mat);
    link2Mesh.rotation.z = -Math.PI / 2;
    elbowGroup.add(link2Mesh);

    // Gripper / Wrist
    const gripperGroup = new THREE.Group();
    gripperGroup.position.x = L2;
    elbowGroup.add(gripperGroup);

    let gripperFingers: { f1: THREE.Mesh; f2: THREE.Mesh } | null = null;

    if (isRicis) {
      // 2-finger claw
      const clawBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.12, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x047857, metalness: 0.9 })
      );
      gripperGroup.add(clawBase);

      const fingerGeo = new THREE.BoxGeometry(0.12, 0.02, 0.03);
      const fingerMat = new THREE.MeshStandardMaterial({ color: 0x34d399 });
      const f1 = new THREE.Mesh(fingerGeo, fingerMat);
      f1.position.set(0.06, 0.04, 0);
      const f2 = new THREE.Mesh(fingerGeo, fingerMat);
      f2.position.set(0.06, -0.04, 0);
      gripperGroup.add(f1, f2);
      gripperFingers = { f1, f2 };
    }

  return {
    armGroup,
    baseRotGroup,
    shoulderGroup,
    elbowGroup,
    gripperGroup,
    gripperFingers,
  };
}

/**
 * Apply a joint state to the rig. This is the ONLY place joint angles become drawn
 * geometry, so it is also the place the render trace is taken from.
 */
export function applyRobotArmPose(
  rig: IRobotArmRig,
  joints: JointState3D,
  gripperClosed: boolean
): void {
  // Correct mathematical azimuth: in Three.js right-handed frame with link along +X,
  // positive q1 (atan2(y, x)) maps to rotation.y = +q1 to aim at target (x, z, -y)
  rig.baseRotGroup.rotation.y = joints.q1;
  rig.shoulderGroup.rotation.z = joints.q2;
  rig.elbowGroup.rotation.z = joints.q3;

  if (rig.gripperFingers) {
    const halfGap = gripperClosed ? 0.022 : 0.04;
    rig.gripperFingers.f1.position.y = halfGap;
    rig.gripperFingers.f2.position.y = -halfGap;
  }
}

const _tmp = new THREE.Vector3();

function worldOf(node: THREE.Object3D): Vector3D {
  node.getWorldPosition(_tmp);
  return { x: _tmp.x, y: _tmp.y, z: _tmp.z };
}

/**
 * Read what the rig is currently drawing: world-space shoulder / elbow / gripper.
 * Forces a matrix refresh so the reading is the pose that would be drawn this frame.
 */
export function readRobotArmWorldPose(rig: IRobotArmRig): IRobotArmWorldPose {
  rig.armGroup.updateMatrixWorld(true);
  return {
    shoulder: worldOf(rig.baseRotGroup),
    elbow: worldOf(rig.elbowGroup),
    gripper: worldOf(rig.gripperGroup),
  };
}

/** Free the GPU resources owned by a rig (call on scene teardown). */
export function disposeRobotArmRig(rig: IRobotArmRig): void {
  rig.armGroup.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(material)) material.forEach((m) => m.dispose());
    else if (material) material.dispose();
  });
  rig.armGroup.removeFromParent();
}
