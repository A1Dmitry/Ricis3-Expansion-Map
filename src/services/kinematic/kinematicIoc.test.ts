// ============================================================================
// QA AUTOMATION SUITE: KINEMATIC IOC & CAPABILITY GUARD UNIT TESTS
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { KinematicModuleRegistry } from './kinematicModuleRegistry';
import type { IKinematicCapabilityProvider, IKinematicModuleMetadata } from './kinematicIoc.contracts';

describe('RICIS-III Kinematic IoC & Capability Guard Automation', () => {
  let registry: KinematicModuleRegistry;

  const mock3LinkModule: IKinematicCapabilityProvider = {
    metadata: {
      id: 'planar-3link-two-stage',
      name: '3-Link Planar Two-Stage Manipulator',
      description: 'Production-ready 3-DOF planar arm with Polar Transition and RICIS Reduction.',
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
    },
    supportsCapability(cap) {
      return this.metadata.supportedCapabilities.includes(cap);
    },
    isReady() {
      return this.metadata.status === 'READY';
    },
  };

  const mock5LinkInDevModule: IKinematicCapabilityProvider = {
    metadata: {
      id: 'planar-5link-redundant',
      name: '5-Link Hyper-Redundant Planar Manipulator',
      description: '5-DOF hyper-redundant manipulator with 3-dimensional null-space manifolds.',
      status: 'IN_DEVELOPMENT',
      dof: 5,
      plannedVersion: 'v0.5.0',
      supportedCapabilities: [
        'POLAR_TRANSITION',
        'RICIS_STAGE2_REDUCTION',
        'SELF_MOTION_ESCAPE',
      ],
      requiredInterfaces: ['IGenericKinematicManipulatorService', 'IHyperRedundantNullSpaceSolver'],
    },
    supportsCapability(cap) {
      return this.metadata.supportedCapabilities.includes(cap);
    },
    isReady() {
      return this.metadata.status === 'READY';
    },
  };

  beforeEach(() => {
    registry = new KinematicModuleRegistry();
  });

  it('QA-IOC-01: успешно регистрирует модули и возвращает их метаданные', () => {
    registry.register(mock3LinkModule);
    registry.register(mock5LinkInDevModule);

    const list = registry.listModules();
    expect(list).toHaveLength(2);
    expect(list[0]?.id).toBe('planar-3link-two-stage');
    expect(list[1]?.id).toBe('planar-5link-redundant');
  });

  it('QA-IOC-02: корректно разрешает готовый модуль со всеми поддерживаемыми возможностями', () => {
    registry.register(mock3LinkModule);

    const result = registry.resolveOrFallback('planar-3link-two-stage', 'POLAR_TRANSITION');
    expect(result.isAvailable).toBe(true);
    if (result.isAvailable) {
      expect(result.module).toBe(mock3LinkModule);
      expect(result.metadata.status).toBe('READY');
    }
  });

  it('QA-IOC-03: возвращает безопасный fallback статус для модуля в разработке (IN_DEVELOPMENT)', () => {
    registry.register(mock5LinkInDevModule);

    const result = registry.resolveOrFallback('planar-5link-redundant');
    expect(result.isAvailable).toBe(false);
    if (!result.isAvailable) {
      expect(result.reason).toBe('IN_DEVELOPMENT');
      expect(result.metadata?.plannedVersion).toBe('v0.5.0');
      expect(result.metadata?.requiredInterfaces).toContain('IHyperRedundantNullSpaceSolver');
    }
  });

  it('QA-IOC-04: возвращает NOT_FOUND при запросе незарегистрированного модуля без сбоя', () => {
    const result = registry.resolveOrFallback('spatial-6dof-ricis');
    expect(result.isAvailable).toBe(false);
    if (!result.isAvailable) {
      expect(result.reason).toBe('NOT_FOUND');
    }
  });

  it('QA-IOC-05: отклоняет запрос, если запрашиваемая возможность не поддерживается модулем', () => {
    registry.register(mock3LinkModule);

    const result = registry.resolveOrFallback('planar-3link-two-stage', 'SPATIAL_3D_SOLVER');
    expect(result.isAvailable).toBe(false);
    if (!result.isAvailable) {
      expect(result.reason).toBe('CAPABILITY_UNSUPPORTED');
    }
  });

  it('QA-IOC-06: проверяет соблюдение L1_IDENTITY и неизменность контракта дескриптора', () => {
    registry.register(mock3LinkModule);
    const mod = registry.getModule('planar-3link-two-stage');
    expect(mod?.metadata.id).toBe('planar-3link-two-stage');
    expect(mod?.supportsCapability('ASYNC_CRITICAL_LOGGING')).toBe(true);
    expect(mod?.supportsCapability('SPATIAL_3D_SOLVER')).toBe(false);
  });
});
