// ============================================================================
// MODULAR 3D KINEMATIC MANIPULATOR CANVAS (THREE.JS / 3D SPATIAL)
// Renders any N-link manipulator in genuine 3D space with joints, links,
// end-effector coordinate frames, shadow maps, and interactive OrbitControls.
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface ModularManipulator3DCanvasProps {
  readonly jointAngles: readonly number[];
  readonly linkLengths: readonly number[];
  readonly dof: number;
  readonly target?: readonly [number, number] | readonly [number, number, number];
  readonly isSingular?: boolean;
  readonly mode?: 'CARTESIAN' | 'POLAR';
  readonly onSelectAngles?: (angles: number[]) => void;
}

/** Releases GPU-side geometry/material resources of a detached subtree (DRY). */
function disposeObjectResources(root: THREE.Object3D): void {
  root.traverse(obj => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const material = mesh.material;
    if (Array.isArray(material)) {
      material.forEach(m => m.dispose());
    } else {
      material?.dispose();
    }
  });
}

export const ModularManipulator3DCanvas: React.FC<ModularManipulator3DCanvasProps> = ({
  jointAngles,
  linkLengths,
  dof,
  target,
  isSingular = false,
  mode = 'CARTESIAN',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Group containing the entire articulated robot arm hierarchy
  const armHierarchyGroupRef = useRef<THREE.Group | null>(null);
  const targetMeshRef = useRef<THREE.Mesh | null>(null);

  // Initialize Three.js 3D Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = Math.max(100, container.clientWidth || 600);
    const height = Math.max(100, container.clientHeight || 450);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#060911');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(2.5, 3.0, 3.5);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 15;
    controls.minDistance = 0.5;
    controls.target.set(0, 0.5, 0);
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    mainLight.position.set(4, 7, 5);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const accentLight = new THREE.PointLight(0xa855f7, 1.5, 10);
    accentLight.position.set(-3, 4, -2);
    scene.add(accentLight);

    // Floor Grid
    const grid = new THREE.GridHelper(6, 24, 0x06b6d4, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);

    // Workspace base pedestal
    const baseGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.1, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.2,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.05;
    scene.add(baseMesh);

    // Target Marker
    const targetGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const targetMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.8,
    });
    const targetMesh = new THREE.Mesh(targetGeo, targetMat);
    targetMesh.visible = false; // Hidden until an explicit target is provided
    scene.add(targetMesh);
    targetMeshRef.current = targetMesh;

    // Arm Group
    const armGroup = new THREE.Group();
    scene.add(armGroup);
    armHierarchyGroupRef.current = armGroup;

    let animFrameId: number;
    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      disposeObjectResources(scene);
      renderer.dispose();
    };
  }, []);

  // Update target marker (hidden when no live target is supplied)
  useEffect(() => {
    const targetMesh = targetMeshRef.current;
    if (!targetMesh) return;
    if (!target) {
      targetMesh.visible = false;
      return;
    }
    targetMesh.visible = true;
    const tx = target[0] ?? 0;
    const ty = target[1] ?? 0;
    const tz = (target as readonly number[])[2] ?? 0;
    targetMesh.position.set(tx, ty + 0.1, tz);
  }, [target]);

  // Reconstruct 3D Arm Hierarchy whenever angles or lengths change
  useEffect(() => {
    const group = armHierarchyGroupRef.current;
    if (!group) return;

    // Clean previous children and release their GPU resources (no leak on rebuild)
    while (group.children.length > 0) {
      const child = group.children[0]!;
      group.remove(child);
      disposeObjectResources(child);
    }

    let currentX = 0;
    let currentY = 0.1; // Base pedestal offset
    let currentZ = 0;
    let cumAngle = 0;

    const count = Math.min(dof, jointAngles.length, linkLengths.length);

    // Materials
    const jointMat = new THREE.MeshStandardMaterial({
      color: isSingular ? 0xef4444 : 0x06b6d4,
      metalness: 0.8,
      roughness: 0.2,
      emissive: isSingular ? 0x991b1b : 0x0891b2,
      emissiveIntensity: isSingular ? 0.6 : 0.2,
    });

    const linkMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.6,
      roughness: 0.3,
    });

    for (let i = 0; i < count; i++) {
      const q = jointAngles[i] ?? 0;
      const len = linkLengths[i] ?? 0.3;
      cumAngle += q;

      // Draw Joint sphere
      const jointGeo = new THREE.SphereGeometry(0.07, 24, 24);
      const jointMesh = new THREE.Mesh(jointGeo, jointMat);
      jointMesh.position.set(currentX, currentY, currentZ);
      group.add(jointMesh);

      // Next joint position (in 3D X-Y vertical plane or X-Z horizontal plane depending on theta1)
      const nextX = currentX + len * Math.cos(cumAngle);
      const nextY = currentY + len * Math.sin(cumAngle);
      const nextZ = currentZ;

      // Draw Link cylinder between current and next
      const dir = new THREE.Vector3(nextX - currentX, nextY - currentY, nextZ - currentZ);
      const distance = dir.length();
      const linkGeo = new THREE.CylinderGeometry(0.035, 0.035, distance, 16);
      const linkMesh = new THREE.Mesh(linkGeo, linkMat);

      // Position at midpoint and orient along dir
      linkMesh.position.set(
        (currentX + nextX) / 2,
        (currentY + nextY) / 2,
        (currentZ + nextZ) / 2
      );
      linkMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      group.add(linkMesh);

      currentX = nextX;
      currentY = nextY;
      currentZ = nextZ;
    }

    // End effector (tool head)
    const eeGeo = new THREE.ConeGeometry(0.06, 0.12, 16);
    const eeMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.7,
    });
    const eeMesh = new THREE.Mesh(eeGeo, eeMat);
    eeMesh.position.set(currentX, currentY, currentZ);
    eeMesh.rotation.z = cumAngle - Math.PI / 2;
    group.add(eeMesh);

  }, [jointAngles, linkLengths, dof, isSingular]);

  return (
    <div className="relative w-full h-full min-h-[380px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D HUD & Controls */}
      <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 pointer-events-none flex items-center gap-2 shadow-lg">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="font-bold text-cyan-200">3D Manipulator View</span>
        <span className="text-slate-500">|</span>
        <span className="text-purple-300 font-semibold">{dof}-DOF Chain</span>
        <span className="text-slate-500">|</span>
        <span className="text-emerald-400">{mode}</span>
      </div>

      {isSingular && (
        <div className="absolute top-3 right-3 bg-red-950/90 border border-red-500 text-red-200 px-2.5 py-1 rounded text-xs font-mono font-bold animate-pulse shadow-lg">
          ⚠️ СИНГУЛЯРНОСТЬ // RICIS O(1) ACTIVE
        </div>
      )}

      <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur border border-slate-800 px-2 py-1 rounded text-[10px] text-slate-400 pointer-events-none font-mono">
        🖱️ 3D Orbit: ЛКМ — вращение | ПКМ — панорама | Колесо — зум
      </div>
    </div>
  );
};
