import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type {
  IKinematicState3D,
  Vector3D,
  IBallEntity,
  IBoxContainer,
} from '../../../model/kinematicEngine.contracts';

interface Props {
  readonly ricisState: IKinematicState3D;
  readonly dlsState: IKinematicState3D;
  readonly target: Vector3D;
  readonly balls: readonly IBallEntity[];
  readonly box: IBoxContainer;
  readonly showDlsGhost?: boolean;
  readonly linkLengths: readonly [number, number, number];
}

export const RobotArm3DCanvas: React.FC<Props> = ({
  ricisState,
  dlsState,
  target,
  balls,
  box,
  showDlsGhost = true,
  linkLengths,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Arm Object Refs (RICIS)
  const ricisBaseRef = useRef<THREE.Group | null>(null);
  const ricisShoulderRef = useRef<THREE.Group | null>(null);
  const ricisElbowRef = useRef<THREE.Group | null>(null);
  const ricisGripperRef = useRef<THREE.Group | null>(null);

  // Arm Object Refs (DLS Ghost)
  const dlsBaseRef = useRef<THREE.Group | null>(null);
  const dlsShoulderRef = useRef<THREE.Group | null>(null);
  const dlsElbowRef = useRef<THREE.Group | null>(null);

  // Target & Environment Refs
  const targetMeshRef = useRef<THREE.Mesh | null>(null);
  const ballMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const boxGroupRef = useRef<THREE.Group | null>(null);

  const [L0, L1, L2] = linkLengths;

  // Initialize Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#07090e');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(3.8, 3.2, 3.8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.minDistance = 1.0;
    controls.maxDistance = 10.0;
    controls.target.set(0, 0, 0.6);
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    dirLight.position.set(5, 8, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const emeraldLight = new THREE.PointLight(0x10b981, 1.5, 8);
    emeraldLight.position.set(-2, 4, -2);
    scene.add(emeraldLight);

    // Floor Grid & Circular Boundaries
    const grid = new THREE.GridHelper(6, 24, 0x06b6d4, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);

    // Workspace boundary ring
    const maxReach = L1 + L2;
    const ringGeo = new THREE.RingGeometry(maxReach - 0.02, maxReach + 0.02, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.01;
    scene.add(ringMesh);

    // -------------------------------------------------------------
    // BUILD RICIS ROBOT ARM (Emerald Theme)
    // -------------------------------------------------------------
    const createArm = (isRicis: boolean) => {
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

      // Link 2 (Elbow to Gripper)
      const link2Geo = new THREE.CylinderGeometry(0.08, 0.09, L2, 24);
      link2Geo.translate(0, L2 / 2, 0);
      const link2Mat = new THREE.MeshStandardMaterial({
        color: isRicis ? 0x34d399 : 0x94a3b8,
        metalness: 0.8,
        roughness: 0.3,
        transparent: !isRicis,
        opacity: isRicis ? 1.0 : 0.45,
      });
      const link2Mesh = new THREE.Mesh(link2Geo, link2Mat);
      link2Mesh.rotation.z = -Math.PI / 2;
      elbowGroup.add(link2Mesh);

      // Gripper Group
      const gripperGroup = new THREE.Group();
      gripperGroup.position.x = L2;
      elbowGroup.add(gripperGroup);

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
      }

      return {
        armGroup,
        baseRotGroup,
        shoulderGroup,
        elbowGroup,
        gripperGroup,
      };
    };

    const ricisArm = createArm(true);
    scene.add(ricisArm.armGroup);
    ricisBaseRef.current = ricisArm.baseRotGroup;
    ricisShoulderRef.current = ricisArm.shoulderGroup;
    ricisElbowRef.current = ricisArm.elbowGroup;
    ricisGripperRef.current = ricisArm.gripperGroup;

    const dlsArm = createArm(false);
    scene.add(dlsArm.armGroup);
    dlsBaseRef.current = dlsArm.baseRotGroup;
    dlsShoulderRef.current = dlsArm.shoulderGroup;
    dlsElbowRef.current = dlsArm.elbowGroup;

    // -------------------------------------------------------------
    // TARGET POINTER
    // -------------------------------------------------------------
    const targetGeo = new THREE.OctahedronGeometry(0.1, 0);
    const targetMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.6,
      wireframe: false,
    });
    const targetMesh = new THREE.Mesh(targetGeo, targetMat);
    scene.add(targetMesh);
    targetMeshRef.current = targetMesh;

    // -------------------------------------------------------------
    // BOX CONTAINER
    // -------------------------------------------------------------
    const boxGroup = new THREE.Group();
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      metalness: 0.5,
      roughness: 0.4,
      transparent: true,
      opacity: 0.85,
    });
    // Outer open box
    const boxOuter = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.5), boxMat);
    boxGroup.add(boxOuter);
    scene.add(boxGroup);
    boxGroupRef.current = boxGroup;

    // Animation Loop
    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      if (targetMeshRef.current) {
        targetMeshRef.current.rotation.y += 0.02;
        targetMeshRef.current.rotation.x += 0.01;
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [L0, L1, L2]);

  // Update Joint Rotations in Real-Time
  useEffect(() => {
    // Coordinate mapping: Three.js Y is UP, Z is depth, X is lateral
    // RICIS Math: X is forward, Y is lateral, Z is height
    if (ricisBaseRef.current && ricisShoulderRef.current && ricisElbowRef.current) {
      ricisBaseRef.current.rotation.y = -ricisState.joints.q1;
      ricisShoulderRef.current.rotation.z = ricisState.joints.q2;
      ricisElbowRef.current.rotation.z = ricisState.joints.q3;
    }

    if (dlsBaseRef.current && dlsShoulderRef.current && dlsElbowRef.current) {
      dlsBaseRef.current.rotation.y = -dlsState.joints.q1;
      dlsShoulderRef.current.rotation.z = dlsState.joints.q2;
      dlsElbowRef.current.rotation.z = dlsState.joints.q3;
      dlsBaseRef.current.parent!.visible = showDlsGhost;
    }

    // Target mesh position: map math (x, y, z) to Three.js (x, z, -y)
    if (targetMeshRef.current) {
      targetMeshRef.current.position.set(target.x, target.z, -target.y);
    }

    // Box position
    if (boxGroupRef.current) {
      boxGroupRef.current.position.set(box.position.x, box.position.z, -box.position.y);
    }
  }, [ricisState, dlsState, target, box, showDlsGhost]);

  // Update Ball Meshes
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const currentMeshMap = ballMeshesRef.current;

    balls.forEach(ball => {
      let mesh = currentMeshMap.get(ball.id);
      if (!mesh) {
        const geo = new THREE.SphereGeometry(ball.radius, 20, 20);
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(ball.color),
          metalness: 0.6,
          roughness: 0.3,
          emissive: ball.isSingularZone ? new THREE.Color(0xef4444) : new THREE.Color(0x000000),
          emissiveIntensity: ball.isSingularZone ? 0.35 : 0.0,
        });
        mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);
        currentMeshMap.set(ball.id, mesh);
      }
      // Update pos
      mesh.position.set(ball.currentPosition.x, ball.currentPosition.z, -ball.currentPosition.y);
    });
  }, [balls]);

  return (
    <div className="relative w-full h-full min-h-[380px] bg-neutral-950 rounded-lg overflow-hidden border border-neutral-800/80 shadow-2xl">
      <div ref={containerRef} className="w-full h-full" />

      {/* 3D Overlays & Legend */}
      <div className="absolute top-3 left-3 bg-neutral-950/80 backdrop-blur border border-neutral-800/80 p-2.5 rounded text-xs space-y-1.5 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          <span className="font-bold text-emerald-300">RICIS-III Arm (Invariant $O(1)$)</span>
        </div>
        {showDlsGhost && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-500 opacity-60" />
            <span className="text-slate-400">DLS Baseline (Damped Least Squares)</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="text-amber-300">Target Trajectory Vector</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full border border-red-500" />
          <span className="text-red-400">Singularity Reach Boundary ({L1 + L2}m)</span>
        </div>
      </div>

      <div className="absolute bottom-3 right-3 bg-neutral-950/80 backdrop-blur border border-neutral-800/80 px-2.5 py-1.5 rounded text-[10px] text-neutral-400 pointer-events-none">
        <span className="font-mono">🖱️ Rotate: Left Click | Pan: Right Click | Zoom: Scroll</span>
      </div>
    </div>
  );
};
