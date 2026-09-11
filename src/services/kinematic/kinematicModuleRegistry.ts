// ============================================================================
// RICIS-III KINEMATIC IOC REGISTRY & CONTAINER (Loose Coupling & DDD)
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import type {
  IKinematicModuleRegistry,
  IKinematicCapabilityProvider,
  IKinematicModuleMetadata,
  KinematicModuleId,
  KinematicCapabilityId,
  ResolveResult,
} from './kinematicIoc.contracts';

export class KinematicModuleRegistry implements IKinematicModuleRegistry {
  private readonly modules = new Map<KinematicModuleId, IKinematicCapabilityProvider>();

  public register(module: IKinematicCapabilityProvider): void {
    this.modules.set(module.metadata.id, module);
  }

  public getModule(id: KinematicModuleId): IKinematicCapabilityProvider | undefined {
    return this.modules.get(id);
  }

  public listModules(): readonly IKinematicModuleMetadata[] {
    return Array.from(this.modules.values()).map((m) => m.metadata);
  }

  public resolveOrFallback<T extends IKinematicCapabilityProvider = IKinematicCapabilityProvider>(
    id: KinematicModuleId,
    requiredCapability?: KinematicCapabilityId,
  ): ResolveResult<T> {
    const provider = this.modules.get(id);
    if (!provider) {
      return {
        isAvailable: false,
        reason: 'NOT_FOUND',
      };
    }

    if (!provider.isReady()) {
      return {
        isAvailable: false,
        metadata: provider.metadata,
        reason: 'IN_DEVELOPMENT',
      };
    }

    if (requiredCapability && !provider.supportsCapability(requiredCapability)) {
      return {
        isAvailable: false,
        metadata: provider.metadata,
        reason: 'CAPABILITY_UNSUPPORTED',
      };
    }

    return {
      isAvailable: true,
      module: provider as T,
      metadata: provider.metadata,
    };
  }
}

/** Default Global Kinematic IoC Container */
export const kinematicContainer = new KinematicModuleRegistry();
