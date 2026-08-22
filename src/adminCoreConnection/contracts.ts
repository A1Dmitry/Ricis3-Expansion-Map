import type {
  CoreOperation,
  HostMode,
  HostState,
} from '../hostControl/hostControlApplication';
import type {
  CoreExecutionFailure,
  CoreExecutionResult,
  RicisEvaluationRequest,
} from '../services/ricisCore/IRicisCoreEngine';

/** Browser-safe feature marker; authority is always decided by the server. */
export type AdminCoreFeature = 'admin_core_manage';

export type AdminCoreSectionState =
  | 'available'
  | 'server_capability_unavailable'
  | 'requires_authentication'
  | 'requires_entitlement'
  | 'step_up_required'
  | 'policy_unavailable';

/** Projection only; it deliberately excludes transport configuration and credentials. */
export interface AdminCoreHostSummary {
  readonly hostId: string;
  readonly displayName: string;
  readonly mode: Extract<HostMode, 'agent_tunnel'>;
  readonly state: HostState;
  readonly operations: readonly CoreOperation[];
  readonly coreBuildId?: string;
  readonly keyFingerprintSuffix?: string;
  readonly redactedEndpoint?: string;
  readonly updatedAt?: number;
}

export interface AdminCoreFeatureSnapshot {
  readonly feature: AdminCoreFeature;
  readonly state: AdminCoreSectionState;
  readonly hosts: readonly AdminCoreHostSummary[];
  readonly safeDetail?: string;
}

export type AdminCoreFeatureDecision =
  | { readonly kind: 'allowed'; readonly accountId: string }
  | { readonly kind: 'server_capability_unavailable' }
  | { readonly kind: 'requires_authentication' }
  | { readonly kind: 'requires_entitlement'; readonly entitlement: 'host:manage:self' }
  | { readonly kind: 'policy_unavailable' };

export interface AdminCoreCreateAgentHostDraft {
  readonly displayName: string;
  readonly mode: 'agent_tunnel';
  readonly expectedOperations: readonly ('core.health' | 'expression.simplify')[];
  readonly confirmation: 'connect_my_routing_host';
}

export interface AdminCoreIssueEnrollment {
  readonly hostId: string;
  readonly confirmation: 'reveal_one_time_enrollment';
}

/** The assertion can be displayed once by a future UI but is never persisted in browser state. */
export interface AdminCoreEnrollmentDisplay {
  readonly hostId: string;
  readonly opaqueAssertion: string;
  readonly expiresAt: number;
  readonly shownOnce: true;
  readonly copyInstructionResourceKey: 'admin_core.enrollment.copy_to_host_agent';
}

export interface AdminCoreRevokeHost {
  readonly hostId: string;
  readonly confirmation: 'revoke_external_core_host';
  readonly reason: 'owner_requested' | 'credential_compromised' | 'security_incident';
}

export type AdminCoreCommandResult =
  | { readonly kind: 'draft_created'; readonly host: AdminCoreHostSummary }
  | { readonly kind: 'enrollment_issued'; readonly display: AdminCoreEnrollmentDisplay }
  | { readonly kind: 'host_revoked'; readonly hostId: string }
  | { readonly kind: 'requires_authentication' }
  | { readonly kind: 'requires_entitlement'; readonly entitlement: 'host:manage:self' }
  | { readonly kind: 'step_up_required'; readonly method: 'passkey' | 'external_mfa' }
  | { readonly kind: 'server_capability_unavailable' }
  | { readonly kind: 'policy_denied'; readonly safeReason: string }
  | { readonly kind: 'conflict'; readonly safeReason: string };

/** Operational provenance is not proof or Lean verification evidence. */
export interface AdminCoreExecutionProvenance {
  readonly hostId: string;
  readonly coreBuildId: string;
  readonly routeDecisionId: string;
  readonly correlationId: string;
}

/** Closed request union; no host URL, method, path, header or credential is representable. */
export type BoundedExternalCoreRequest =
  | { readonly kind: 'core.health' }
  | {
      readonly kind: 'expression.simplify';
      readonly request: Pick<RicisEvaluationRequest, 'expression' | 'contextProblemId'>;
    };

export type BoundedExternalCoreResponse =
  | {
      readonly kind: 'core_result';
      readonly result: CoreExecutionResult;
      readonly provenance: AdminCoreExecutionProvenance;
    }
  | { readonly kind: 'core_failure'; readonly failure: CoreExecutionFailure }
  | { readonly kind: 'route_unavailable'; readonly safeReason: string };

export interface IAdminCoreFeatureReader {
  readForCurrentSession(): Promise<AdminCoreFeatureDecision>;
}

export interface IAdminCoreSettingsQuery {
  snapshotForCurrentSession(): Promise<AdminCoreFeatureSnapshot>;
}

/** Browser/BFF command boundary. A future implementation derives actor and fresh-auth server-side. */
export interface IAdminCoreCommandService {
  createAgentHostDraft(command: AdminCoreCreateAgentHostDraft): Promise<AdminCoreCommandResult>;
  issueEnrollment(command: AdminCoreIssueEnrollment): Promise<AdminCoreCommandResult>;
  revokeHost(command: AdminCoreRevokeHost): Promise<AdminCoreCommandResult>;
}

/** Server-only adapter reached only after existing HostControl issued a valid bounded route decision. */
export interface IBoundedExternalCoreGateway {
  execute(input: BoundedExternalCoreRequest): Promise<BoundedExternalCoreResponse>;
}

/** Server composition seam; it must never be injected into browser UI or static deployment composition. */
export interface IServerRoutedRicisCoreEngine {
  evaluateThroughApprovedHost(request: RicisEvaluationRequest): Promise<BoundedExternalCoreResponse>;
}
