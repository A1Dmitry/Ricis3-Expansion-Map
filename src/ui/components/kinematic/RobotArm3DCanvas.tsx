import React, { useRef, useEffect, useState } from 'react';
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

function supportsWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
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
  const canvas2dRef = useRef<HTMLCanvasElement>(null);

  const [presentationMode, setPresentationMode] = useState<'3d' | '2d'>(() =>
    supportsWebGL() ? '3d' : '2d'
  );
  const [webglSupported] = useState<boolean>(() => supportsWebGL());
  const [webglError, setWebglError] = useState<string | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Arm Object Refs (RICIS)
  const ricisBaseRef = useRef<THREE.Group | null>(null);
  const ricisShoulderRef = useRef<THREE.Group | null>(null);
  const ricisElbowRef = useRef<THREE.Group | null>(null);

  // Arm Object Refs (DLS Ghost)
  const dlsBaseRef = useRef<THREE.Group | null>(null);
  const dlsShoulderRef = useRef<THREE.Group | null>(null);
  const dlsElbowRef = useRef<THREE.Group | null>(null);

  // Target & Environment Refs
  const targetMeshRef = useRef<THREE.Mesh | null>(null);
  const ballMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const boxGroupRef = useRef<THREE.Group | null>(null);

  const [L0, L1, L2] = linkLengths;

  // Initialize 3D Scene when in 3D mode
  useEffect(() => {
    if (presentationMode !== '3d' || !containerRef.current) return;
    const container = containerRef.current;
    const width = Math.max(100, container.clientWidth || 600);
    const height = Math.max(100, container.clientHeight || 450);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (err) {
      console.warn('WebGLRenderer initialization failed, switching to 2D view:', err);
      setWebglError(err instanceof Error ? err.message : String(err));
      setPresentationMode('2d');
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#07090e');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(3.8, 3.2, 3.8);
    cameraRef.current = camera;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.replaceChildren(renderer.domElement);
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

    // BUILD RICIS ROBOT ARM (Emerald Theme) and DLS Arm
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

    const dlsArm = createArm(false);
    scene.add(dlsArm.armGroup);
    dlsBaseRef.current = dlsArm.baseRotGroup;
    dlsShoulderRef.current = dlsArm.shoulderGroup;
    dlsElbowRef.current = dlsArm.elbowGroup;

    // TARGET POINTER
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

    // BOX CONTAINER
    const boxGroup = new THREE.Group();
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      metalness: 0.5,
      roughness: 0.4,
      transparent: true,
      opacity: 0.85,
    });
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

    // ResizeObserver for reliable dynamic container resizing
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = Math.max(100, Math.floor(entry.contentRect.width));
        const h = Math.max(100, Math.floor(entry.contentRect.height));
        if (cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      container.replaceChildren();
      sceneRef.current = null;
      rendererRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      ballMeshesRef.current.clear();
    };
  }, [presentationMode, L0, L1, L2]);

  // Update Joint Rotations in Real-Time (3D)
  useEffect(() => {
    if (presentationMode !== '3d') return;

    if (ricisBaseRef.current && ricisShoulderRef.current && ricisElbowRef.current) {
      ricisBaseRef.current.rotation.y = -ricisState.joints.q1;
      ricisShoulderRef.current.rotation.z = ricisState.joints.q2;
      ricisElbowRef.current.rotation.z = ricisState.joints.q3;
    }

    if (dlsBaseRef.current && dlsShoulderRef.current && dlsElbowRef.current) {
      dlsBaseRef.current.rotation.y = -dlsState.joints.q1;
      dlsShoulderRef.current.rotation.z = dlsState.joints.q2;
      dlsElbowRef.current.rotation.z = dlsState.joints.q3;
      if (dlsBaseRef.current.parent) {
        dlsBaseRef.current.parent.visible = showDlsGhost;
      }
    }

    if (targetMeshRef.current) {
      targetMeshRef.current.position.set(target.x, target.z, -target.y);
    }

    if (boxGroupRef.current) {
      boxGroupRef.current.position.set(box.position.x, box.position.z, -box.position.y);
    }
  }, [presentationMode, ricisState, dlsState, target, box, showDlsGhost]);

  // Update Ball Meshes (3D)
  useEffect(() => {
    if (presentationMode !== '3d' || !sceneRef.current) return;
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
      mesh.position.set(ball.currentPosition.x, ball.currentPosition.z, -ball.currentPosition.y);
    });
  }, [presentationMode, balls]);

  // --------------------------------------------------------------------------
  // 2D Canvas Fallback Renderer (Orthographic Top-Down and Side-Elevation Views)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (presentationMode !== '2d' || !canvas2dRef.current) return;
    const canvas = canvas2dRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const draw = () => {
      const width = canvas.clientWidth || 600;
      const height = canvas.clientHeight || 450;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.fillStyle = '#07090e';
      ctx.fillRect(0, 0, width, height);

      const halfW = width / 2;
      const maxReach = L1 + L2; // 1.50m
      const scale = Math.min((halfW - 40) / (maxReach * 1.3), (height - 80) / (maxReach * 1.3));

      // Divider line
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(halfW, 10);
      ctx.lineTo(halfW, height - 10);
      ctx.stroke();

      // ==========================================
      // VIEW 1: TOP-DOWN (X - Y PLANE) - LEFT HALF
      // ==========================================
      const cx1 = halfW / 2;
      const cy1 = height / 2 + 10;

      // Header
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('ВИД СВЕРХУ (X-Y Горизонталь)', 15, 25);

      // Concentric reach circles
      [0.5, 1.0, maxReach].forEach(r => {
        ctx.beginPath();
        ctx.arc(cx1, cy1, r * scale, 0, Math.PI * 2);
        ctx.strokeStyle = r === maxReach ? '#ef4444' : '#1e293b';
        ctx.setLineDash(r === maxReach ? [4, 4] : [2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#64748b';
        ctx.font = '9px monospace';
        ctx.fillText(`${r.toFixed(1)}m`, cx1 + r * scale + 3, cy1 - 2);
      });

      // Axes
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx1 - maxReach * scale - 15, cy1);
      ctx.lineTo(cx1 + maxReach * scale + 15, cy1);
      ctx.moveTo(cx1, cy1 - maxReach * scale - 15);
      ctx.lineTo(cx1, cy1 + maxReach * scale + 15);
      ctx.stroke();

      // Box in Top-Down
      const boxX = cx1 + box.position.x * scale;
      const boxY = cy1 - box.position.y * scale;
      ctx.fillStyle = 'rgba(30, 58, 138, 0.4)';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.5;
      ctx.fillRect(boxX - 16, boxY - 16, 32, 32);
      ctx.strokeRect(boxX - 16, boxY - 16, 32, 32);
      ctx.fillStyle = '#93c5fd';
      ctx.font = '9px monospace';
      ctx.fillText('КОРОБКА', boxX - 18, boxY + 26);

      // Balls in Top-Down
      balls.forEach(ball => {
        const bx = cx1 + ball.currentPosition.x * scale;
        const by = cy1 - ball.currentPosition.y * scale;
        ctx.beginPath();
        ctx.arc(bx, by, Math.max(4, ball.radius * scale), 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.strokeStyle = ball.isSingularZone ? '#ef4444' : '#ffffff';
        ctx.stroke();
      });

      // Target in Top-Down
      const tx = cx1 + target.x * scale;
      const ty = cy1 - target.y * scale;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tx, ty, 6, 0, Math.PI * 2);
      ctx.moveTo(tx - 10, ty);
      ctx.lineTo(tx + 10, ty);
      ctx.moveTo(tx, ty - 10);
      ctx.lineTo(tx, ty + 10);
      ctx.stroke();

      // DLS Ghost Arm in Top-Down
      if (showDlsGhost) {
        const dlsEeX = cx1 + dlsState.endEffector.x * scale;
        const dlsEeY = cy1 - dlsState.endEffector.y * scale;
        ctx.strokeStyle = '#64748b';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx1, cy1);
        ctx.lineTo(dlsEeX, dlsEeY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // RICIS Arm in Top-Down
      const ricisEeX = cx1 + ricisState.endEffector.x * scale;
      const ricisEeY = cy1 - ricisState.endEffector.y * scale;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx1, cy1);
      ctx.lineTo(ricisEeX, ricisEeY);
      ctx.stroke();

      // Arm base joint & end-effector circles
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(cx1, cy1, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(ricisEeX, ricisEeY, 5, 0, Math.PI * 2);
      ctx.fill();

      // ==============================================
      // VIEW 2: SIDE-ELEVATION (R - Z PLANE) - RIGHT HALF
      // ==============================================
      const cx2 = halfW + halfW / 2;
      const cy2 = height - 45;

      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('ВИД СБОКУ (R-Z Высота & Плечо)', halfW + 15, 25);

      // Floor line
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(halfW + 15, cy2);
      ctx.lineTo(width - 15, cy2);
      ctx.stroke();

      // Base Pedestal L0
      const shoulderX = cx2;
      const shoulderY = cy2 - L0 * scale;

      ctx.strokeStyle = '#0f172a';
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx2 - 8, shoulderY, 16, L0 * scale);
      ctx.strokeRect(cx2 - 8, shoulderY, 16, L0 * scale);

      // Forward kinematics for RICIS joints in R-Z plane
      const q2 = ricisState.joints.q2;
      const q3 = ricisState.joints.q3;

      const elbowX = shoulderX + L1 * Math.cos(q2) * scale;
      const elbowY = shoulderY - L1 * Math.sin(q2) * scale;

      const eeR = L1 * Math.cos(q2) + L2 * Math.cos(q2 + q3);
      const eeZ = L0 + L1 * Math.sin(q2) + L2 * Math.sin(q2 + q3);
      const eeX2 = shoulderX + eeR * scale;
      const eeY2 = cy2 - eeZ * scale;

      // Max reach arc from shoulder
      ctx.beginPath();
      ctx.arc(shoulderX, shoulderY, maxReach * scale, -Math.PI / 2, Math.PI / 2);
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // DLS Ghost Arm in Side Elevation
      if (showDlsGhost) {
        const dq2 = dlsState.joints.q2;
        const dq3 = dlsState.joints.q3;
        const dElbowX = shoulderX + L1 * Math.cos(dq2) * scale;
        const dElbowY = shoulderY - L1 * Math.sin(dq2) * scale;
        const dEeR = L1 * Math.cos(dq2) + L2 * Math.cos(dq2 + dq3);
        const dEeZ = L0 + L1 * Math.sin(dq2) + L2 * Math.sin(dq2 + dq3);
        const dEeX = shoulderX + dEeR * scale;
        const dEeY = cy2 - dEeZ * scale;

        ctx.strokeStyle = '#64748b';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(dElbowX, dElbowY);
        ctx.lineTo(dEeX, dEeY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // RICIS Link 1 (Shoulder to Elbow)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(shoulderX, shoulderY);
      ctx.lineTo(elbowX, elbowY);
      ctx.stroke();

      // RICIS Link 2 (Elbow to EE)
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(elbowX, elbowY);
      ctx.lineTo(eeX2, eeY2);
      ctx.stroke();

      // Joint Nodes
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(shoulderX, shoulderY, 5, 0, Math.PI * 2);
      ctx.arc(elbowX, elbowY, 4, 0, Math.PI * 2);
      ctx.fill();

      // End-Effector Gripper Node
      ctx.fillStyle = '#6ee7b7';
      ctx.beginPath();
      ctx.arc(eeX2, eeY2, 5, 0, Math.PI * 2);
      ctx.fill();

      // Target in Side Elevation
      const targetR = Math.hypot(target.x, target.y);
      const targetSideX = shoulderX + targetR * scale;
      const targetSideY = cy2 - target.z * scale;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(targetSideX, targetSideY, 6, 0, Math.PI * 2);
      ctx.moveTo(targetSideX - 8, targetSideY);
      ctx.lineTo(targetSideX + 8, targetSideY);
      ctx.moveTo(targetSideX, targetSideY - 8);
      ctx.lineTo(targetSideX, targetSideY + 8);
      ctx.stroke();

      // Telemetry Summary in Canvas
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(`Target: (${target.x.toFixed(2)}, ${target.y.toFixed(2)}, ${target.z.toFixed(2)})m`, 15, height - 12);
      ctx.fillText(`EE Ricis: (${ricisState.endEffector.x.toFixed(2)}, ${ricisState.endEffector.y.toFixed(2)}, ${ricisState.endEffector.z.toFixed(2)})m`, halfW + 15, height - 12);

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [presentationMode, ricisState, dlsState, target, balls, box, showDlsGhost, L0, L1, L2]);

  return (
    <div className="relative w-full h-full min-h-[380px] bg-neutral-950 rounded-lg overflow-hidden border border-neutral-800/80 shadow-2xl">
      {presentationMode === '3d' ? (
        <div ref={containerRef} className="w-full h-full" />
      ) : (
        <canvas ref={canvas2dRef} className="w-full h-full block" />
      )}

      {/* Top Left Status & View Mode Switcher */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
        <div className="flex items-center gap-1.5 bg-neutral-950/90 backdrop-blur border border-neutral-800 p-1 rounded-md text-xs">
          <button
            type="button"
            onClick={() => {
              if (webglSupported) {
                setPresentationMode('3d');
              }
            }}
            disabled={!webglSupported}
            className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
              presentationMode === '3d'
                ? 'bg-cyan-600 text-white'
                : webglSupported
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title={webglSupported ? '3D WebGL сцены' : 'WebGL недоступен в данном браузере'}
          >
            3D WebGL
          </button>
          <button
            type="button"
            onClick={() => setPresentationMode('2d')}
            className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
              presentationMode === '2d'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2D Схема (XY & RZ)
          </button>
        </div>

        {webglError && presentationMode === '2d' && (
          <div className="bg-amber-950/90 border border-amber-800/80 text-amber-200 text-[10px] px-2 py-1 rounded max-w-xs font-mono">
            ⚠️ WebGL недоступен. Активен режим 2D-векторной проекции.
          </div>
        )}

        {/* Legend */}
        <div className="bg-neutral-950/80 backdrop-blur border border-neutral-800/80 p-2.5 rounded text-xs space-y-1.5 pointer-events-none">
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
      </div>

      <div className="absolute bottom-3 right-3 bg-neutral-950/80 backdrop-blur border border-neutral-800/80 px-2.5 py-1.5 rounded text-[10px] text-neutral-400 pointer-events-none z-10">
        <span className="font-mono">
          {presentationMode === '3d'
            ? '🖱️ Вращение: ЛКМ | Панорама: ПКМ | Зум: Колёсико'
            : '📐 Ортогональная проекция: X-Y (план) и R-Z (высота)'}
        </span>
      </div>
    </div>
  );
};
