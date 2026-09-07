// ============================================================================
// IOC BOOTSTRAP & MODULE PROVIDER ADAPTERS
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import { kinematicContainer } from './kinematicModuleRegistry';
import { Planar3LinkKinematicService } from './planar3LinkKinematicService';
import type {
  IKinematicCapabilityProvider,
  IKinematicModuleMetadata,
  KinematicCapabilityId,
} from './kinematicIoc.contracts';

/**
 * 3-Link Planar Two-Stage Kinematic Service Provider (Production READY)
 */
export class Planar3LinkModuleProvider implements IKinematicCapabilityProvider {
  public readonly metadata: IKinematicModuleMetadata = {
    id: 'planar-3link-two-stage',
    name: '3-Link Planar Two-Stage Manipulator',
    description: 'Axiomatic Polar Transition and RICIS null-space self-motion reduction for 3-DOF planar arm.',
    status: 'READY',
    dof: 3,
    supportedCapabilities: [
      'POLAR_TRANSITION',
      'RICIS_STAGE2_REDUCTION',
      'SINGULAR_HEATMAP_2D',
      'SELF_MOTION_ESCAPE',
      'ASYNC_CRITICAL_LOGGING',
    ],
    requiredInterfaces: ['ITwoStageKinematicService', 'IGenericKinematicManipulatorService'],
  };

  public readonly service = new Planar3LinkKinematicService();

  public supportsCapability(capability: KinematicCapabilityId): boolean {
    return this.metadata.supportedCapabilities.includes(capability);
  }

  public isReady(): boolean {
    return this.metadata.status === 'READY';
  }
}

/**
 * 5-Link Hyper-Redundant Planar Manipulator Provider (IN_DEVELOPMENT Placeholder)
 */
export class Planar5LinkInDevModuleProvider implements IKinematicCapabilityProvider {
  public readonly metadata: IKinematicModuleMetadata = {
    id: 'planar-5link-redundant',
    name: '5-Link Hyper-Redundant Planar Manipulator',
    description: '5-DOF hyper-redundant manipulator with 3-dimensional null-space manifolds and multi-cluster polar parameterization.',
    status: 'IN_DEVELOPMENT',
    dof: 5,
    plannedVersion: 'v0.5.0',
    supportedCapabilities: [
      'POLAR_TRANSITION',
      'RICIS_STAGE2_REDUCTION',
      'SELF_MOTION_ESCAPE',
      'ASYNC_CRITICAL_LOGGING',
    ],
    requiredInterfaces: ['IGenericKinematicManipulatorService', 'IHyperRedundantNullSpaceSolver'],
  };

  public supportsCapability(capability: KinematicCapabilityId): boolean {
    return this.metadata.supportedCapabilities.includes(capability);
  }

  public isReady(): boolean {
    return this.metadata.status === 'READY';
  }
}

/**
 * Spatial 6-DOF RICIS Manipulator Provider (IN_DEVELOPMENT Placeholder)
 */
export class Spatial6DofInDevModuleProvider implements IKinematicCapabilityProvider {
  public readonly metadata: IKinematicModuleMetadata = {
    id: 'spatial-6dof-ricis',
    name: 'Spatial 6-DOF Industrial Arm (RICIS)',
    description: 'Full 3D spatial manipulator with spherical wrist singularity isolation and Cartesian/Polar dual solver.',
    status: 'IN_DEVELOPMENT',
    dof: 6,
    plannedVersion: 'v0.6.0',
    supportedCapabilities: [
      'SPATIAL_3D_SOLVER',
      'RICIS_STAGE2_REDUCTION',
      'ASYNC_CRITICAL_LOGGING',
    ],
    requiredInterfaces: ['ISpatialKinematicService', 'ISphericalWristIsolator'],
  };

  public supportsCapability(capability: KinematicCapabilityId): boolean {
    return this.metadata.supportedCapabilities.includes(capability);
  }

  public isReady(): boolean {
    return this.metadata.status === 'READY';
  }
}

// Bootstrap default registrations
kinematicContainer.register(new Planar3LinkModuleProvider());
kinematicContainer.register(new Planar5LinkInDevModuleProvider());
kinematicContainer.register(new Spatial6DofInDevModuleProvider());
