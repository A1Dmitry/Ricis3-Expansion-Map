import { ContentButton } from '../ContentButton';
import { IconButton } from '../IconButton';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type {
  IKinematicState3D,
  Vector3D,
  IBallEntity,
  IBoxContainer,
} from '../../../model/kinematicEngine.contracts';
import {
  TENNIS_CANNONS,
  ROOM_HALF_EXTENT_M,
  ROOM_HEIGHT_M,
} from '../../../services/kinematic/catchBallController';
import { manipulatorRenderTrace } from '../../../services/kinematic/renderTrace';
import {
  applyRobotArmPose,
  createRobotArmRig,
  disposeRobotArmRig,
  readRobotArmWorldPose,
  type IRobotArmRig,
} from './robotArmScene';

interface Props {
  readonly ricisState: IKinematicState3D;
  readonly dlsState: IKinematicState3D;
  readonly target: Vector3D;
  readonly balls: readonly IBallEntity[];
  readonly box: IBoxContainer;
  readonly showDlsGhost?: boolean;
  readonly linkLengths: readonly [number, number, number];
  /** Show the two tennis-ball automatons (catch-the-falling-ball / cannon scenario). */
  readonly showCannons?: boolean;
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
  showCannons = false,
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

  // Arm rigs — the articulated nodes the viewer sees, and the handle the render
  // trace reads the DRAWN pose from.
  const ricisRigRef = useRef<IRobotArmRig | null>(null);
  const dlsRigRef = useRef<IRobotArmRig | null>(null);

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

    // Floor Grid & Circular Boundaries (court grid matches the room footprint)
    const grid = new THREE.GridHelper(2 * ROOM_HALF_EXTENT_M, 24, 0x06b6d4, 0x1e293b);
    grid.position.y = 0.001;
    scene.add(grid);

    // ------------------------------------------------------------------
    // ROOM (floor, 4 walls, ceiling) — see-through for the orbiting camera.
    // The walls/ceiling use a semi-transparent double-sided material with
    // depthWrite disabled, so the camera ALWAYS sees through the nearest
    // wall; faint edge lines keep the room volume readable.
    // Model coords (x, y, z-up) map to three.js as (x, z, -y).
    // ------------------------------------------------------------------
    const roomHalf = ROOM_HALF_EXTENT_M;
    const roomHeight = ROOM_HEIGHT_M;

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0b1220,
      metalness: 0.1,
      roughness: 0.9,
    });
    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(2 * roomHalf, 2 * roomHalf), floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.002;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.0,
      roughness: 1.0,
      transparent: true,
      opacity: 0.07,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.0,
      roughness: 1.0,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const roomSurfaces: Array<{ geo: THREE.PlaneGeometry; pos: [number, number, number]; rot: [number, number, number]; mat: THREE.Material }> = [
      // Ceiling
      { geo: new THREE.PlaneGeometry(2 * roomHalf, 2 * roomHalf), pos: [0, roomHeight, 0], rot: [Math.PI / 2, 0, 0], mat: ceilingMat },
      // Wall at three-x = +roomHalf (model x = +roomHalf)
      { geo: new THREE.PlaneGeometry(2 * roomHalf, roomHeight), pos: [roomHalf, roomHeight / 2, 0], rot: [0, -Math.PI / 2, 0], mat: wallMat },
      // Wall at three-x = -roomHalf (model x = -roomHalf)
      { geo: new THREE.PlaneGeometry(2 * roomHalf, roomHeight), pos: [-roomHalf, roomHeight / 2, 0], rot: [0, Math.PI / 2, 0], mat: wallMat },
      // Wall at three-z = +roomHalf (model y = -roomHalf)
      { geo: new THREE.PlaneGeometry(2 * roomHalf, roomHeight), pos: [0, roomHeight / 2, roomHalf], rot: [0, Math.PI, 0], mat: wallMat },
      // Wall at three-z = -roomHalf (model y = +roomHalf)
      { geo: new THREE.PlaneGeometry(2 * roomHalf, roomHeight), pos: [0, roomHeight / 2, -roomHalf], rot: [0, 0, 0], mat: wallMat },
    ];
    for (const surface of roomSurfaces) {
      const mesh = new THREE.Mesh(surface.geo, surface.mat);
      mesh.position.set(...surface.pos);
      mesh.rotation.set(...surface.rot);
      scene.add(mesh);
    }

    // Room outline edges (keep the volume readable through the transparent walls)
    const roomBoxGeo = new THREE.BoxGeometry(2 * roomHalf, roomHeight, 2 * roomHalf);
    const roomEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(roomBoxGeo),
      new THREE.LineBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.35 })
    );
    roomEdges.position.y = roomHeight / 2;
    scene.add(roomEdges);
    roomBoxGeo.dispose();

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

    // BUILD RICIS ROBOT ARM (Emerald Theme) and DLS Arm.
    // Built by the shared rig module so the drawn pose is traceable without a
    // WebGL context (see robotArmScene.ts). Geometry is identical.

    const ricisArm = createRobotArmRig(true, linkLengths);
    scene.add(ricisArm.armGroup);
    ricisRigRef.current = ricisArm;

    const dlsArm = createRobotArmRig(false, linkLengths);
    scene.add(dlsArm.armGroup);
    dlsRigRef.current = dlsArm;

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
      if (ricisRigRef.current) disposeRobotArmRig(ricisRigRef.current);
      if (dlsRigRef.current) disposeRobotArmRig(dlsRigRef.current);
      ricisRigRef.current = null;
      dlsRigRef.current = null;
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

    // Apply the live joint state to the drawn rig and trace what it now draws.
    // The trace is taken AFTER the joint->geometry mapping, so it observes the pose
    // the viewer actually sees — the only place a joint-space discontinuity that
    // leaves the end-effector untouched can be detected.
    if (ricisRigRef.current) {
      applyRobotArmPose(ricisRigRef.current, ricisState.joints, ricisState.gripperClosed);
      manipulatorRenderTrace.record('RICIS', readRobotArmWorldPose(ricisRigRef.current));
    }
    if (dlsRigRef.current) {
      applyRobotArmPose(dlsRigRef.current, dlsState.joints, false);
      dlsRigRef.current.armGroup.visible = showDlsGhost;
      manipulatorRenderTrace.record('DLS_GHOST', readRobotArmWorldPose(dlsRigRef.current));
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
  // TENNIS AUTOMATONS (weak pneumatic cannons) — visible in the catch scenario.
  // Each prop: pedestal column, breech block, oriented barrel and muzzle ring.
  // Model coords (x, y, z-up) map to three.js as (x, z, -y).
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (presentationMode !== '3d' || !sceneRef.current) return;
    const scene = sceneRef.current;
    if (!showCannons) return;

    const cannonGroup = new THREE.Group();

    for (const cannon of TENNIS_CANNONS) {
      const muzzle = cannon.muzzlePosition;
      const dir = new THREE.Vector3(cannon.aimDirection.x, cannon.aimDirection.z, -cannon.aimDirection.y).normalize();

      const accent = cannon.id === 'A' ? 0xf59e0b : 0xa855f7;
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 });
      const accentMat = new THREE.MeshStandardMaterial({ color: accent, metalness: 0.6, roughness: 0.35 });

      // Pedestal column up to the breech
      const pedestalH = Math.max(0.15, muzzle.z - 0.32);
      const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, pedestalH, 16), bodyMat);
      pedestal.position.set(muzzle.x, pedestalH / 2, -muzzle.y);
      cannonGroup.add(pedestal);

      // Breech block
      const muzzleThree = new THREE.Vector3(muzzle.x, muzzle.z, -muzzle.y);
      const breech = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.26), bodyMat);
      breech.position.copy(muzzleThree.clone().addScaledVector(dir, -0.2));
      breech.lookAt(muzzleThree.clone().add(dir));
      cannonGroup.add(breech);

      // Barrel (protrudes slightly beyond the muzzle plane)
      const barrelLen = 0.5;
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.062, barrelLen, 20), bodyMat);
      const upAxis = new THREE.Vector3(0, 1, 0);
      const orient = new THREE.Quaternion().setFromUnitVectors(upAxis, dir);
      barrel.quaternion.copy(orient);
      barrel.position.copy(muzzleThree.clone().addScaledVector(dir, -(barrelLen / 2) + 0.05));
      cannonGroup.add(barrel);

      // Muzzle ring + glow disc (weak pneumatic "breath" look, not a firearm flash)
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.014, 12, 24), accentMat);
      ring.quaternion.copy(orient);
      ring.rotateX(Math.PI / 2);
      ring.position.copy(muzzleThree);
      cannonGroup.add(ring);

      const glow = new THREE.Mesh(
        new THREE.CircleGeometry(0.05, 20),
        new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
      );
      glow.quaternion.copy(orient);
      glow.rotateX(-Math.PI / 2);
      glow.position.copy(muzzleThree.clone().addScaledVector(dir, 0.012));
      cannonGroup.add(glow);

      // Pressure tank hint at the pedestal base
      const tank = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), accentMat);
      tank.position.set(muzzle.x, 0.22, -muzzle.y);
      cannonGroup.add(tank);
    }

    scene.add(cannonGroup);
    return () => {
      scene.remove(cannonGroup);
      cannonGroup.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const material = obj.material as THREE.Material | THREE.Material[];
          if (Array.isArray(material)) material.forEach(m => m.dispose());
          else material.dispose();
        }
      });
    };
  }, [presentationMode, showCannons]);

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
      // Fit the whole ROOM (±2.4m walls, 2.8m ceiling) into both schematic views.
      const scale = Math.min(
        (halfW - 40) / (ROOM_HALF_EXTENT_M * 1.08),
        (height / 2 - 40) / ROOM_HALF_EXTENT_M,
        (height - 80) / ROOM_HEIGHT_M
      );

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

      // Room walls (top-down outline)
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(
        cx1 - ROOM_HALF_EXTENT_M * scale,
        cy1 - ROOM_HALF_EXTENT_M * scale,
        2 * ROOM_HALF_EXTENT_M * scale,
        2 * ROOM_HALF_EXTENT_M * scale
      );
      ctx.fillStyle = '#64748b';
      ctx.font = '9px monospace';
      ctx.fillText('СТЕНЫ КОМНАТЫ', cx1 + ROOM_HALF_EXTENT_M * scale - 68, cy1 - ROOM_HALF_EXTENT_M * scale + 11);

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

      // Ceiling line (room height)
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)';
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(halfW + 15, cy2 - ROOM_HEIGHT_M * scale);
      ctx.lineTo(width - 15, cy2 - ROOM_HEIGHT_M * scale);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#64748b';
      ctx.font = '9px monospace';
      ctx.fillText('ПОТОЛОК', width - 66, cy2 - ROOM_HEIGHT_M * scale - 4);

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
          <ContentButton
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
          </ContentButton>
          <ContentButton
            type="button"
            onClick={() => setPresentationMode('2d')}
            className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
              presentationMode === '2d'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2D Схема (XY & RZ)
          </ContentButton>
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
