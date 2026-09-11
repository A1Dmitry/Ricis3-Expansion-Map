// ============================================================================
// RICIS-III KINEMATIC IOC & CAPABILITY GUARD CONTRACTS (DDD / SOLID)
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

export type KinematicModuleId =
  | 'planar-3link-two-stage'
  | 'planar-5link-redundant'
  | 'spatial-6dof-ricis'
  | 'spherical-wrist-subspace';

export type KinematicCapabilityId =
  | 'POLAR_TRANSITION'
  | 'RICIS_STAGE2_REDUCTION'
  | 'SINGULAR_HEATMAP_2D'
  | 'SELF_MOTION_ESCAPE'
  | 'ASYNC_CRITICAL_LOGGING'
  | 'SPATIAL_3D_SOLVER';

export type ModuleReadinessStatus = 'READY' | 'IN_DEVELOPMENT' | 'EXPERIMENTAL';

export interface IKinematicModuleMetadata {
  readonly id: KinematicModuleId;
  readonly name: string;
  readonly description: string;
  readonly status: ModuleReadinessStatus;
  readonly dof: number;
  readonly plannedVersion?: string;
  readonly supportedCapabilities: readonly KinematicCapabilityId[];
  readonly requiredInterfaces: readonly string[];
}

export interface IKinematicCapabilityProvider {
  readonly metadata: IKinematicModuleMetadata;
  supportsCapability(capability: KinematicCapabilityId): boolean;
  isReady(): boolean;
}

export type ResolveResult<T extends IKinematicCapabilityProvider = IKinematicCapabilityProvider> =
  | {
      readonly isAvailable: true;
      readonly module: T;
      readonly metadata: IKinematicModuleMetadata;
      readonly reason?: never;
    }
  | {
      readonly isAvailable: false;
      readonly module?: undefined;
      readonly metadata?: IKinematicModuleMetadata;
      readonly reason: 'NOT_FOUND' | 'IN_DEVELOPMENT' | 'CAPABILITY_UNSUPPORTED';
    };

export interface IKinematicModuleRegistry {
  register(module: IKinematicCapabilityProvider): void;
  getModule(id: KinematicModuleId): IKinematicCapabilityProvider | undefined;
  listModules(): readonly IKinematicModuleMetadata[];
  resolveOrFallback<T extends IKinematicCapabilityProvider = IKinematicCapabilityProvider>(
    id: KinematicModuleId,
    requiredCapability?: KinematicCapabilityId,
  ): ResolveResult<T>;
}
