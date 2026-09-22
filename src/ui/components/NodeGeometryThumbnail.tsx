import React, { useId, useMemo } from 'react';
import type { ProblemNode } from '../../model/types';
import { nodeVisualRadius } from '../../model/physics';
import { isRicisCore } from '../../model/access';
import { NodeResolutionStatusCode } from '../../model/colorMatrix';
import type { MapNodeVisualStatus } from '../../ricisSolutionCatalog';

export interface NodeGeometryThumbnailProps {
  readonly node: ProblemNode;
  readonly visual?: MapNodeVisualStatus;
  readonly allNodes?: readonly ProblemNode[];
  readonly size?: number;
  readonly className?: string;
}

/**
 * 2D SVG Thumbnail representing the node's geometry, mass, and 3D visual status.
 * Renders distinct geometric topologies:
 * - Core Singularity: Monolith diamond / octahedron with singularity center and event horizon ring.
 * - Derivative Claim: Hexagonal polyhedral facet with outward citation vectors.
 * - Derived Problem: Geodesic sphere with isometric latitude and longitude meridian rings.
 * - Scientific Task: 3D illuminated bubble sphere with specular highlight and orbital belt.
 */
export function NodeGeometryThumbnail({
  node,
  visual,
  allNodes,
  size = 32,
  className = '',
}: NodeGeometryThumbnailProps) {
  const gradientId = useId().replace(/:/g, '_');
  const baseColor = visual?.sphereColor || '#38bdf8';
  const isCore = isRicisCore(node);
  const isDerivative = node.type === 'derivative_claim' || node.isDerivativeClaim === true;
  const isDerivedProblem = node.type === 'derived_problem';
  const isLocked =
    node.state !== 'resolved' &&
    (visual?.statusCode === NodeResolutionStatusCode.LOCKED_BY_DEPENDENCIES ||
      Boolean(visual?.statusLabel?.includes('Заблокирован')));
  const isResolved =
    node.state === 'resolved' ||
    visual?.statusCode === NodeResolutionStatusCode.PROVEN_RESOLVED ||
    visual?.statusCode === NodeResolutionStatusCode.LEAN_VERIFIED ||
    visual?.statusCode === NodeResolutionStatusCode.RESOLVED_WITH_WARNINGS;

  // Compute normalized radius based on 3D physics mass calculation
  const computedRadius = useMemo(() => {
    if (!allNodes || allNodes.length === 0) return 9.5;
    const r = nodeVisualRadius(node, allNodes as ProblemNode[]);
    // Physics bounds: min 0.75, max 3.60
    const t = Math.max(0, Math.min(1, (r - 0.75) / (3.60 - 0.75)));
    return 7.5 + t * 4.5; // Scales between 7.5px and 12px in a 32x32 viewport (cx=16, cy=16)
  }, [node, allNodes]);

  const cx = 16;
  const cy = 16;
  const r = computedRadius;

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center rounded bg-slate-950/80 border border-slate-800/80 p-0.5 shadow-inner select-none ${className}`}
      style={{ width: size, height: size }}
      title={`${node.title} (${node.type || 'node'})`}
      data-testid={`node-geometry-thumbnail-${node.id}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 32 32"
        width={size - 4}
        height={size - 4}
        className="overflow-visible"
      >
        <defs>
          {/* 3D Spherical Radial Gradient with off-center specular reflection */}
          <radialGradient
            id={`grad-sphere-${gradientId}`}
            cx="32%"
            cy="28%"
            r="70%"
            fx="28%"
            fy="24%"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity={isLocked ? 0.4 : 0.85} />
            <stop offset="25%" stopColor={baseColor} stopOpacity={isLocked ? 0.6 : 0.95} />
            <stop offset="70%" stopColor={baseColor} stopOpacity={0.8} />
            <stop offset="100%" stopColor="#090d16" stopOpacity={0.9} />
          </radialGradient>

          {/* Core Monolith Linear Gradient */}
          <linearGradient
            id={`grad-monolith-${gradientId}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#e0f2fe" stopOpacity={0.9} />
            <stop offset="40%" stopColor={baseColor} stopOpacity={0.85} />
            <stop offset="100%" stopColor="#0369a1" stopOpacity={0.7} />
          </linearGradient>

          {/* Ambient Outer Glow */}
          <filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Aura / Resonant Glow Ring for Resolved or Core Nodes */}
        {isResolved && (
          <circle
            cx={cx}
            cy={cy}
            r={r + 2.5}
            fill="none"
            stroke={baseColor}
            strokeWidth="0.8"
            strokeOpacity="0.4"
            className="animate-pulse"
          />
        )}

        {/* 1. Core Singularity Monolith: Octahedral Diamond Geometry */}
        {isCore && (
          <g>
            {/* Event Horizon Orbital Ellipse */}
            <ellipse
              cx={cx}
              cy={cy}
              rx={r + 3.2}
              ry={(r + 3.2) * 0.38}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="0.9"
              strokeDasharray={isLocked ? '2 2' : undefined}
              opacity={0.75}
              transform={`rotate(-20 ${cx} ${cy})`}
            />
            {/* Upper & Lower Facets */}
            <polygon
              points={`${cx},${cy - r * 1.15} ${cx + r * 0.95},${cy} ${cx},${cy + r * 1.15} ${cx - r * 0.95},${cy}`}
              fill={`url(#grad-monolith-${gradientId})`}
              stroke={baseColor}
              strokeWidth="1.2"
              filter={`url(#glow-${gradientId})`}
            />
            {/* Internal Facet Edge Lines */}
            <line
              x1={cx - r * 0.95}
              y1={cy}
              x2={cx + r * 0.95}
              y2={cy}
              stroke="#ffffff"
              strokeWidth="0.8"
              opacity="0.6"
            />
            <line
              x1={cx}
              y1={cy - r * 1.15}
              x2={cx}
              y2={cy + r * 1.15}
              stroke="#ffffff"
              strokeWidth="0.8"
              opacity="0.6"
            />
            {/* Central Singularity Point */}
            <circle cx={cx} cy={cy} r="1.6" fill="#ffffff" />
          </g>
        )}

        {/* 2. Derivative Claim: Hexagonal Facet Geometry */}
        {!isCore && isDerivative && (
          <g>
            {/* Outward citation vector marks */}
            <line x1={cx - r - 2} y1={cy} x2={cx - r} y2={cy} stroke={baseColor} strokeWidth="1" opacity="0.6" />
            <line x1={cx + r} y1={cy} x2={cx + r + 2} y2={cy} stroke={baseColor} strokeWidth="1" opacity="0.6" />
            <line x1={cx} y1={cy - r - 2} x2={cx} y2={cy - r} stroke={baseColor} strokeWidth="1" opacity="0.6" />
            <line x1={cx} y1={cy + r} x2={cx} y2={cy + r + 2} stroke={baseColor} strokeWidth="1" opacity="0.6" />

            {/* Hexagon Body */}
            {(() => {
              const points = Array.from({ length: 6 }).map((_, i) => {
                const angle = (i * 60 - 30) * (Math.PI / 180);
                return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
              }).join(' ');
              return (
                <polygon
                  points={points}
                  fill={`url(#grad-sphere-${gradientId})`}
                  stroke={baseColor}
                  strokeWidth="1.2"
                  strokeDasharray={isLocked ? '2 1.5' : undefined}
                />
              );
            })()}

            {/* Inner Hexagonal wireframe accent */}
            {(() => {
              const innerPoints = Array.from({ length: 6 }).map((_, i) => {
                const angle = (i * 60 - 30) * (Math.PI / 180);
                return `${(cx + r * 0.5 * Math.cos(angle)).toFixed(1)},${(cy + r * 0.5 * Math.sin(angle)).toFixed(1)}`;
              }).join(' ');
              return (
                <polygon
                  points={innerPoints}
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="0.8"
                  opacity="0.7"
                />
              );
            })()}
          </g>
        )}

        {/* 3. Derived Problem: Geodesic Wireframe Sphere Geometry */}
        {!isCore && !isDerivative && isDerivedProblem && (
          <g>
            {/* Base Sphere */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={`url(#grad-sphere-${gradientId})`}
              stroke={baseColor}
              strokeWidth="1.1"
              strokeDasharray={isLocked ? '2 2' : undefined}
            />
            {/* Latitude Ellipse Arc */}
            <ellipse
              cx={cx}
              cy={cy}
              rx={r * 0.95}
              ry={r * 0.38}
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.75"
              opacity="0.5"
              transform={`rotate(-15 ${cx} ${cy})`}
            />
            {/* Longitude Meridian Arc */}
            <ellipse
              cx={cx}
              cy={cy}
              rx={r * 0.38}
              ry={r * 0.95}
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.75"
              opacity="0.4"
              transform={`rotate(-15 ${cx} ${cy})`}
            />
            {/* Specular Highlight Point */}
            <circle
              cx={cx - r * 0.35}
              cy={cy - r * 0.35}
              r={Math.max(1, r * 0.18)}
              fill="#ffffff"
              opacity="0.85"
            />
          </g>
        )}

        {/* 4. Scientific Task / Default: 3D Celestial Bubble with Orbital Belt */}
        {!isCore && !isDerivative && !isDerivedProblem && (
          <g>
            {/* Orbital Ring Back segment */}
            <ellipse
              cx={cx}
              cy={cy}
              rx={r + 2.8}
              ry={(r + 2.8) * 0.32}
              fill="none"
              stroke={baseColor}
              strokeWidth="0.8"
              opacity="0.4"
              transform={`rotate(-25 ${cx} ${cy})`}
            />
            {/* 3D Sphere Body */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={`url(#grad-sphere-${gradientId})`}
              stroke={baseColor}
              strokeWidth="1.1"
              strokeDasharray={isLocked ? '2 1.8' : undefined}
            />
            {/* Orbital Ring Front segment overlay */}
            <path
              d={`M ${cx - r * 1.15} ${cy + 1.2} A ${r + 2.8} ${(r + 2.8) * 0.32} 0 0 0 ${cx + r * 1.15} ${cy - 0.8}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.9"
              opacity="0.65"
              transform={`rotate(-25 ${cx} ${cy})`}
            />
            {/* Specular Highlight Gloss */}
            <circle
              cx={cx - r * 0.35}
              cy={cy - r * 0.35}
              r={Math.max(1.2, r * 0.22)}
              fill="#ffffff"
              opacity={isLocked ? 0.4 : 0.85}
            />
          </g>
        )}
      </svg>
    </div>
  );
}
