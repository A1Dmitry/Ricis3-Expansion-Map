import type {
  AdminCoreCommandResult,
  AdminCoreCreateAgentHostDraft,
  AdminCoreFeatureDecision,
  AdminCoreFeatureSnapshot,
  AdminCoreIssueEnrollment,
  AdminCoreRevokeHost,
  IAdminCoreCommandService,
  IAdminCoreFeatureReader,
  IAdminCoreSettingsQuery,
} from './contracts';

export const STATIC_ADMIN_CORE_SAFE_DETAIL =
  'Для управления внешним Ricis.Core требуется серверный control plane с авторизацией, fresh-auth, audit и защищённым channel host agent.';

export const STATIC_ADMIN_CORE_SNAPSHOT: AdminCoreFeatureSnapshot = {
  feature: 'admin_core_manage',
  state: 'server_capability_unavailable',
  hosts: [],
  safeDetail: STATIC_ADMIN_CORE_SAFE_DETAIL,
};

/**
 * Static GitHub Pages composition is intentionally fail-closed. It contains no
 * browser host registry, endpoint configuration, network operation, credential
 * or local persistence fallback. A server composition replaces this facade.
 */
export class StaticAdminCoreConnection
  implements IAdminCoreFeatureReader, IAdminCoreSettingsQuery, IAdminCoreCommandService {
  public async readForCurrentSession(): Promise<AdminCoreFeatureDecision> {
    return { kind: 'server_capability_unavailable' };
  }

  public async snapshotForCurrentSession(): Promise<AdminCoreFeatureSnapshot> {
    return STATIC_ADMIN_CORE_SNAPSHOT;
  }

  public async createAgentHostDraft(_command: AdminCoreCreateAgentHostDraft): Promise<AdminCoreCommandResult> {
    return { kind: 'server_capability_unavailable' };
  }

  public async issueEnrollment(_command: AdminCoreIssueEnrollment): Promise<AdminCoreCommandResult> {
    return { kind: 'server_capability_unavailable' };
  }

  public async revokeHost(_command: AdminCoreRevokeHost): Promise<AdminCoreCommandResult> {
    return { kind: 'server_capability_unavailable' };
  }
}
