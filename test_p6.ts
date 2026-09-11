import { RicisSymbolicJacobianEngine } from './src/services/kinematic/ricisSymbolicJacobian';
import { JointState3D } from './src/model/kinematicEngine.contracts';

const engine = new RicisSymbolicJacobianEngine();
const q: JointState3D = { q1: Math.PI / 6, q2: Math.PI / 4, q3: Math.PI / 3 };
const linkLengths: [number, number, number] = [0.8, 1.0, 0.8];
const J = engine.buildSymbolicJacobian(q, linkLengths);
const row0 = [J.m00, J.m01, J.m02] as const;
const row1 = [J.m10, J.m11, J.m12] as const;

console.log(engine.areAstNodesIdentical(row0[0], row0[0]));
