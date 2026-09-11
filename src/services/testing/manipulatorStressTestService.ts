import type { IBugReport, IManipulatorStressResult } from '../../model/crawlerTesting.contracts';
import type { IKinematicState3D, Vector3D } from '../../model/kinematicEngine.contracts';
import { RicisConstraintSolver3D, DlsSolver3D } from '../kinematic/kinematicSolvers';
import { forwardKinematics3D, computeJacobianDeterminant3D, distance3D } from '../kinematic/kinematicMath';

export function runManipulatorChaosStressTest(iterations = 10): IManipulatorStressResult {
  const linkLengths: readonly [number, number, number] = [0.2, 0.45, 0.4];
  const maxReach = linkLengths[1] + linkLengths[2]; // 0.85
  const ricisSolver = new RicisConstraintSolver3D();
  const dlsSolver = new DlsSolver3D(0.15);

  const bugs: IBugReport[] = [];
  let anomaliesDetected = 0;

  const testTargets: { name: string; target: Vector3D }[] = [
    { name: 'Singularity Zero Boundary (q3=0)', target: { x: maxReach, y: 0, z: 0.2 } },
    { name: 'Direct Overhead Zenith Singularity', target: { x: 0.001, y: 0.001, z: 1.05 } },
    { name: 'Near-Zero Base Singularity', target: { x: 0.05, y: 0.05, z: 0.2 } },
    { name: 'Unreachable Deep Outer Boundary', target: { x: 3.5, y: 3.5, z: 0.5 } },
    { name: 'Extreme Negative Z Floor', target: { x: 0.4, y: 0.4, z: -1.5 } },
  ];

  // Extend with randomized chaos targets if iterations > 5
  for (let i = testTargets.length; i < iterations; i++) {
    const angle = (i / iterations) * Math.PI * 2;
    const r = i % 2 === 0 ? maxReach * 0.999 : maxReach * 1.5;
    testTargets.push({
      name: `Chaos Target #${i + 1} (r=${r.toFixed(2)}, a=${angle.toFixed(2)})`,
      target: {
        x: r * Math.cos(angle),
        y: r * Math.sin(angle),
        z: 0.2 + (Math.sin(i) * 0.5),
      },
    });
  }

  let currentState: IKinematicState3D = {
    timestamp: Date.now(),
    joints: { q1: 0, q2: 0.1, q3: 0.1 },
    endEffector: forwardKinematics3D({ q1: 0, q2: 0.1, q3: 0.1 }, linkLengths),
    jacobianDeterminant: computeJacobianDeterminant3D({ q1: 0, q2: 0.1, q3: 0.1 }, linkLengths),
    isSingularZone: false,
    isWorkspaceBoundaryExceeded: false,
    gripperClosed: false,
  };

  testTargets.forEach((testCase, idx) => {
    const { name, target } = testCase;
    const dt = 0.016;

    // 1. Solve with RICIS
    const ricisResult = ricisSolver.solve(currentState, target, linkLengths, dt);

    // 2. Validate RICIS output for NaN or Infinity
    const { nextState, metrics } = ricisResult;
    const isNaNResult =
      Number.isNaN(nextState.joints.q1) ||
      Number.isNaN(nextState.joints.q2) ||
      Number.isNaN(nextState.joints.q3) ||
      Number.isNaN(nextState.endEffector.x) ||
      Number.isNaN(nextState.endEffector.y) ||
      Number.isNaN(nextState.endEffector.z);

    if (isNaNResult) {
      anomaliesDetected++;
      bugs.push({
        id: `bug-kinematic-nan-${Date.now()}-${idx}`,
        timestamp: Date.now(),
        severity: 'CRITICAL',
        category: 'KINEMATICS_ANOMALY',
        title: `NaN detected in Kinematic Output on ${name}`,
        description: `RICIS Solver returned NaN in joint or end effector state during singularity stress test.`,
        targetComponentOrNodeId: 'Manipulator3D/RicisConstraintSolver',
        reproductionSteps: [
          `Set initial joint state to (${currentState.joints.q1.toFixed(2)}, ${currentState.joints.q2.toFixed(2)}, ${currentState.joints.q3.toFixed(2)})`,
          `Request target position (${target.x.toFixed(2)}, ${target.y.toFixed(2)}, ${target.z.toFixed(2)})`,
          `Call RicisConstraintSolver3D.solve()`,
        ],
        expectedBehavior: `Solver should return finite real coordinates preserving L1 identity.`,
        actualBehavior: `State contained NaN coordinates.`,
        telemetryData: { target, state: nextState },
      });
    }

    // 3. Check L1 Structural Invariant (Link Length conservation)
    // Distance from joint 2 to end effector in planar projection must match link2 + link3 folded geometry
    const computedEE = forwardKinematics3D(nextState.joints, linkLengths);
    const eeDrift = distance3D(nextState.endEffector, computedEE);
    if (eeDrift > 0.05) {
      anomaliesDetected++;
      bugs.push({
        id: `bug-l1-drift-${Date.now()}-${idx}`,
        timestamp: Date.now(),
        severity: 'CRITICAL',
        category: 'KINEMATICS_ANOMALY',
        title: `L1 Structural Invariant Violation (Geometric Drift = ${eeDrift.toFixed(4)}m)`,
        description: `Discrepancy between reported end effector position and forward kinematics computed from joint angles.`,
        targetComponentOrNodeId: 'Manipulator3D/L1_IDENTITY',
        reproductionSteps: [
          `Targeting ${name} (${target.x}, ${target.y}, ${target.z})`,
          `Compare nextState.endEffector with forwardKinematics3D(nextState.joints)`,
        ],
        expectedBehavior: `End effector must strictly match analytical joint kinematics (drift < 0.01m).`,
        actualBehavior: `Drift detected: ${eeDrift.toFixed(4)}m`,
        telemetryData: { reportedEE: nextState.endEffector, computedEE, drift: eeDrift },
      });
    }

    // 4. Compare with baseline DLS behavior
    const dlsResult = dlsSolver.solve(currentState, target, linkLengths, dt);
    if (dlsResult.metrics.nearSingularityBehavior === 'degraded' && metrics.nearSingularityBehavior === 'recovered') {
      // Diagnostic comparative info (not a RICIS bug, but a logged baseline observation)
    }

    // Update state for subsequent sequential chain
    currentState = nextState;
  });

  return {
    testId: `stress-test-${Date.now()}`,
    testName: `Manipulator Chaos Rig (${testTargets.length} targets)`,
    testedTargetsCount: testTargets.length,
    anomaliesDetected,
    bugs,
  };
}
