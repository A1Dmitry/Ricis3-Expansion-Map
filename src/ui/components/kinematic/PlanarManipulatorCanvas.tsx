// ============================================================================
// 3-LINK PLANAR KINEMATIC WORKSPACE CANVAS (2D Fast Vector Renderer)
// Supports Polar Background Mode, Directions Arrows, Singular Markers & Escape Arrow
// ============================================================================

import React, { useRef, useEffect } from 'react';
import type {
  ParameterizationMode,
  IRicisReductionOverlayState,
} from '../../../services/kinematic/twoStageSingularity.contracts';

interface Props {
  readonly joints: readonly [number, number, number];
  readonly links: readonly [number, number, number];
  readonly mode: ParameterizationMode;
  readonly overlay: IRicisReductionOverlayState;
  readonly onJointDrag?: (index: number, newAngle: number) => void;
}

export const PlanarManipulatorCanvas: React.FC<Props> = ({
  joints,
  links,
  mode,
  overlay,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Origin in canvas space (centered lower bottom)
    const originX = width * 0.45;
    const originY = height * 0.65;
    const scale = Math.min(width, height) * 0.38; // 1 meter = scale pixels

    // Background styling based on Parameterization Mode
    ctx.clearRect(0, 0, width, height);

    const bgGradient = ctx.createRadialGradient(
      originX,
      originY,
      10,
      originX,
      originY,
      width * 0.8,
    );
    if (mode === 'POLAR') {
      bgGradient.addColorStop(0, '#101726');
      bgGradient.addColorStop(0.7, '#0c101d');
      bgGradient.addColorStop(1, '#06080e');
    } else {
      bgGradient.addColorStop(0, '#13111c');
      bgGradient.addColorStop(0.7, '#0f0e17');
      bgGradient.addColorStop(1, '#08070d');
    }
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw Polar or Cartesian Grid Lines
    ctx.lineWidth = 1;
    if (mode === 'POLAR') {
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.12)';
      const totalReach = (links[0] + links[1] + links[2]) * scale;
      for (let r = scale * 0.3; r <= totalReach; r += scale * 0.3) {
        ctx.beginPath();
        ctx.arc(originX, originY, r, 0, 2 * Math.PI);
        ctx.stroke();
      }
      for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 6) {
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(originX + totalReach * Math.cos(angle), originY - totalReach * Math.sin(angle));
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      for (let x = 0; x <= width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // Forward Kinematics Joint Positions
    const [l1, l2, l3] = links;
    const [q1, q2, q3] = joints;

    const p0 = { x: originX, y: originY };
    const p1 = {
      x: originX + l1 * scale * Math.cos(q1),
      y: originY - l1 * scale * Math.sin(q1),
    };
    const p2 = {
      x: p1.x + l2 * scale * Math.cos(q1 + q2),
      y: p1.y - l2 * scale * Math.sin(q1 + q2),
    };
    const p3 = {
      x: p2.x + l3 * scale * Math.cos(q1 + q2 + q3),
      y: p2.y - l3 * scale * Math.sin(q1 + q2 + q3),
    };

    // Draw Manipulator Links
    const linkColors = mode === 'POLAR' ? ['#c084fc', '#a855f7', '#9333ea'] : ['#38bdf8', '#0284c7', '#0369a1'];

    // Link 1
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.strokeStyle = linkColors[0];
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();

    // Link 2
    ctx.strokeStyle = linkColors[1];
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Link 3
    ctx.strokeStyle = linkColors[2];
    ctx.beginPath();
    ctx.moveTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.stroke();

    // Draw Joint Nodes
    const drawJoint = (p: { x: number; y: number }, label: string, isBase = false) => {
      ctx.fillStyle = isBase ? '#475569' : '#0f172a';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, isBase ? 9 : 7, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(label, p.x + 10, p.y - 10);
    };

    drawJoint(p0, 'Base (J0)', true);
    drawJoint(p1, 'Shoulder (θ₁)');
    drawJoint(p2, 'Elbow (θ₂)');
    drawJoint(p3, 'End-Effector (θ₃)');

    // Overlay: Red Warning Marker on Joints if Singular
    if (overlay.isActive) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(p2.x, p2.y, 16, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p3.x, p3.y, 18, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);

      // Preserved Directions (Solid Emerald Arrows)
      overlay.preservedDirections.forEach((dir) => {
        const arrowLen = 45;
        const targetPos = dir.joint === 1 ? p1 : p2;
        const vx = dir.vector[0] * arrowLen;
        const vy = -dir.vector[1] * arrowLen;

        ctx.strokeStyle = '#10b981';
        ctx.fillStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(targetPos.x, targetPos.y);
        ctx.lineTo(targetPos.x + vx, targetPos.y + vy);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(vy, vx);
        ctx.beginPath();
        ctx.moveTo(targetPos.x + vx, targetPos.y + vy);
        ctx.lineTo(targetPos.x + vx - 8 * Math.cos(angle - Math.PI / 6), targetPos.y + vy - 8 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(targetPos.x + vx - 8 * Math.cos(angle + Math.PI / 6), targetPos.y + vy - 8 * Math.sin(angle + Math.PI / 6));
        ctx.fill();
      });

      // Lost Directions (Faded Dashed Red Arrows)
      overlay.lostDirections.forEach((dir) => {
        const arrowLen = 50;
        const vx = dir.vector[0] * arrowLen;
        const vy = -dir.vector[1] * arrowLen;

        ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
        ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p3.x + vx, p3.y + vy);
        ctx.stroke();
        ctx.setLineDash([]);

        const angle = Math.atan2(vy, vx);
        ctx.beginPath();
        ctx.moveTo(p3.x + vx, p3.y + vy);
        ctx.lineTo(p3.x + vx - 8 * Math.cos(angle - Math.PI / 6), p3.y + vy - 8 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(p3.x + vx - 8 * Math.cos(angle + Math.PI / 6), p3.y + vy - 8 * Math.sin(angle + Math.PI / 6));
        ctx.fill();
      });

      // Self-Motion Escape Direction (Green Arrow at End-Effector)
      const escVx = overlay.escapeVectorTaskSpace[0] * scale * 2.5;
      const escVy = -overlay.escapeVectorTaskSpace[1] * scale * 2.5;
      if (Math.abs(escVx) + Math.abs(escVy) > 2) {
        ctx.strokeStyle = '#22c55e';
        ctx.fillStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p3.x + escVx, p3.y + escVy);
        ctx.stroke();

        const angle = Math.atan2(escVy, escVx);
        ctx.beginPath();
        ctx.moveTo(p3.x + escVx, p3.y + escVy);
        ctx.lineTo(p3.x + escVx - 9 * Math.cos(angle - Math.PI / 6), p3.y + escVy - 9 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(p3.x + escVx - 9 * Math.cos(angle + Math.PI / 6), p3.y + escVy - 9 * Math.sin(angle + Math.PI / 6));
        ctx.fill();
      }
    }
  }, [joints, links, mode, overlay]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex flex-col">
      {/* Parameterization Banner */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <div
          className={`px-3 py-1 rounded-full text-xs font-mono font-semibold flex items-center gap-1.5 shadow-lg ${
            mode === 'POLAR'
              ? 'bg-purple-950/90 text-purple-300 border border-purple-500/50 shadow-purple-950/50'
              : 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 shadow-cyan-950/50'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${mode === 'POLAR' ? 'bg-purple-400 animate-pulse' : 'bg-cyan-400'}`}
          />
          <span>
            Active Parameterization: {mode === 'POLAR' ? 'Polar (transition active)' : 'Cartesian'}
          </span>
        </div>
      </div>

      <canvas ref={canvasRef} width={640} height={480} className="w-full h-full object-cover" />
    </div>
  );
};
