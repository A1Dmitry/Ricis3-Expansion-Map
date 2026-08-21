export interface HostControlTestIds {
  readonly ownerId: string;
  readonly foreignOwnerId: string;
  readonly hostId: string;
  readonly foreignHostId: string;
  readonly freshAuthenticationId: string;
  readonly assertion: string;
  readonly hostPublicKey: string;
  readonly hostPrivateKeySentinel: string;
  readonly directIp: string;
  readonly forbiddenIp: string;
  readonly vpnTunnelIp: string;
  readonly publicKeyFingerprint: string;
  readonly correlationId: string;
}

export type HostMode = 'agent_tunnel' | 'direct_ip_webapi' | 'vpn_overlay' | 'browser_wasm';
export type HostState = 'draft' | 'key_bound' | 'verifying' | 'active' | 'degraded' | 'suspended' | 'revoked';
export type CoreOperation = 'core.health' | 'expression.simplify' | 'expression.derivative' | 'expression.system' | 'proof.document';

export interface DirectIpTransport {
  readonly kind: 'direct_ip_webapi';
  readonly address: string;
  readonly port: number;
  readonly tlsIdentity:
    | { readonly kind: 'ip_subject_alt_name'; readonly expectedCertificateFingerprint?: string }
    | { readonly kind: 'spki_pin'; readonly expectedPublicKeyFingerprint: string };
  readonly requireMutualTls: true;
}

export interface VpnTransport {
  readonly kind: 'vpn_overlay';
  readonly peerPublicKey: string;
  readonly assignedTunnelAddress: string;
  readonly allowedDestination: string;
  readonly allowedPort: number;
  readonly persistentKeepaliveSeconds?: number;
}

export interface AgentTunnelTransport {
  readonly kind: 'agent_tunnel';
  readonly controlPlaneAudience: string;
  readonly requiredMutualTls: true;
}

export interface BrowserWasmTransport {
  readonly kind: 'browser_wasm';
  readonly artifactId: string;
  readonly contentHash: string;
  readonly allowedOrigin: string;
}

export type HostTransport = DirectIpTransport | VpnTransport | AgentTunnelTransport | BrowserWasmTransport;

export interface CapabilityManifest {
  readonly apiVersion: string;
  readonly coreBuildId: string;
  readonly agentBuildId?: string;
  readonly operations: readonly CoreOperation[];
  readonly maxRequestBytes: number;
  readonly maxResponseBytes: number;
  readonly maxOperationSeconds: number;
  readonly manifestHash: string;
}

export interface RegisteredHost {
  readonly hostId: string;
  readonly ownerId: string;
  readonly displayName: string;
  readonly mode: HostMode;
  readonly transport: HostTransport;
  readonly state: HostState;
  readonly operations: readonly CoreOperation[];
  readonly policyVersion: string;
  readonly keyFingerprint?: string;
}

export interface EnrollmentAssertionRecord {
  readonly ticketId: string;
  readonly hostId: string;
  readonly assertionHash: string;
  readonly nonce: string;
  readonly expiresAt: number;
  readonly consumedAt?: number;
  readonly revokedAt?: number;
}

export interface BoundedRouteDecision {
  readonly routeDecisionId: string;
  readonly hostId: string;
  readonly operation: CoreOperation;
  readonly expiresAt: number;
  readonly maxRequestBytes: number;
  readonly maxResponseBytes: number;
  readonly maxOperationSeconds: number;
  readonly policyVersion: string;
}

export interface VpnPeerPlan {
  readonly hostId: string;
  readonly hostPeerPublicKey: string;
  readonly assignedTunnelAddress: string;
  readonly allowedDestination: string;
  readonly allowedPort: number;
  readonly keyFingerprint: string;
  readonly expiresAt: number;
}

export type AccessResult =
  | { readonly kind: 'allowed'; readonly ownerId: string }
  | { readonly kind: 'requires_authentication' }
  | { readonly kind: 'requires_entitlement'; readonly entitlement: 'host:manage:self' }
  | { readonly kind: 'tenant_access_denied' };

export type FreshAuthenticationResult =
  | { readonly kind: 'fresh'; readonly freshAuthenticationId: string; readonly expiresAt: number }
  | { readonly kind: 'step_up_required'; readonly method: 'passkey' | 'external_mfa' }
  | { readonly kind: 'unavailable' };

export type TransportPolicyResult =
  | { readonly kind: 'allowed'; readonly policyVersion: string }
  | { readonly kind: 'direct_ip_denied'; readonly reason: string }
  | { readonly kind: 'requires_vpn_peer_plan' }
  | { readonly kind: 'mode_not_enabled'; readonly mode: HostMode };

export type PublicKeyVerificationResult =
  | { readonly kind: 'verified'; readonly fingerprint: string }
  | { readonly kind: 'signature_invalid' }
  | { readonly kind: 'nonce_mismatch' }
  | { readonly kind: 'key_algorithm_not_allowed' }
  | { readonly kind: 'assertion_binding_mismatch' };

export type VpnPlanResult = VpnPeerPlan | { readonly kind: 'public_key_rejected' | 'tunnel_address_not_allowed' | 'route_not_allowed' | 'keepalive_out_of_policy' };

export type RouteDecisionResult =
  | { readonly kind: 'issued'; readonly routeDecision: BoundedRouteDecision }
  | { readonly kind: 'host_not_active'; readonly state: HostState }
  | { readonly kind: 'host_not_owned' }
  | { readonly kind: 'operation_not_supported'; readonly operation: CoreOperation }
  | { readonly kind: 'quota_denied' }
  | { readonly kind: 'static_host_unavailable' };

export interface HostControlApplicationDependencies {
  readonly authorization: {
    hasHostManagementAccess(input: { readonly accountId: string; readonly action: string }): Promise<AccessResult>;
    requireFreshAuthentication(input: { readonly accountId: string; readonly action: string }): Promise<FreshAuthenticationResult>;
  };
  readonly registry: {
    createDraft(host: RegisteredHost): Promise<void>;
    findById(hostId: string): Promise<RegisteredHost | null>;
    findOwnedBy(ownerId: string): Promise<readonly RegisteredHost[]>;
    transition(input: { readonly hostId: string; readonly nextState: HostState; readonly at: number }): Promise<RegisteredHost | void>;
    bindPublicKey(input: { readonly hostId: string; readonly publicKey: string; readonly fingerprint: string; readonly ticketId: string; readonly at: number }): Promise<RegisteredHost | void>;
    revoke(input: { readonly hostId: string; readonly actorId: string; readonly reason: string; readonly at: number }): Promise<void>;
  };
  readonly assertions: {
    issue(input: { readonly hostId: string; readonly actorId: string; readonly freshAuthenticationId: string; readonly now: number }): Promise<{ readonly hostId: string; readonly opaqueAssertion: string; readonly expiresAt: number; readonly shownOnce: true }>;
    consumeOnce(input: { readonly hostId: string; readonly opaqueAssertion: string; readonly presentedPublicKey: string; readonly presentedAt: number }): Promise<EnrollmentAssertionRecord>;
    revokeForHost(hostId: string, at: number): Promise<void>;
  };
  readonly publicKeys: {
    verifyPossession(input: { readonly hostId: string; readonly assertion: string; readonly hostPublicKey: string; readonly signedNonceResponse: string }): Promise<PublicKeyVerificationResult>;
    verifyHealthAttestation(input: unknown): Promise<{ readonly kind: string }>;
  };
  readonly transportPolicy: {
    evaluate(transport: HostTransport, actorId: string): Promise<TransportPolicyResult>;
  };
  readonly vpnPeers: {
    plan(input: { readonly hostId: string; readonly actorId: string; readonly peerPublicKey: string; readonly tunnelAddress: string; readonly destination: string; readonly port: number }): Promise<VpnPlanResult>;
    revoke(hostId: string, at: number): Promise<void>;
  };
  readonly routeDecisions: {
    issue(input: { readonly hostId: string; readonly ownerId: string; readonly operation: CoreOperation; readonly correlationId: string; readonly now: number }): Promise<RouteDecisionResult>;
    invalidateHost(hostId: string, at: number): Promise<void>;
  };
  readonly audit: {
    append(event: { readonly type: string; readonly hostId?: string; readonly actorId?: string; readonly at: number; readonly outcome: 'allowed' | 'denied' | 'failed' }): Promise<void>;
  };
  readonly executionProviders: {
    resolve(input: { readonly accountId: string; readonly operation: CoreOperation; readonly correlationId: string }): Promise<{ readonly kind: string; readonly routeDecision?: BoundedRouteDecision }>;
  };
  readonly clock: { now(): number };
  readonly ids: {
    newHostId(): string;
    newTicketId(): string;
    newNonce(): string;
    newCorrelationId(): string;
  };
  readonly deployment: { readonly kind: 'server' | 'static' };
}

export type CreateHostDraftCommand = {
  readonly ownerId: string;
  readonly displayName: string;
  readonly mode: HostMode;
  readonly transport: HostTransport;
  readonly expectedCapabilities: readonly CoreOperation[];
  readonly observedRequestIpHint?: string;
};

export type CreateHostDraftResult =
  | { readonly kind: 'draft_created'; readonly hostId: string; readonly ownershipProven: false }
  | { readonly kind: 'transport_policy_denied'; readonly reason: string }
  | Exclude<AccessResult, { readonly kind: 'allowed' }>;

export type IssueEnrollmentAssertionResult =
  | { readonly kind: 'assertion_issued'; readonly hostId: string; readonly assertion: string; readonly expiresAt: number; readonly shownOnce: true }
  | Exclude<AccessResult, { readonly kind: 'allowed' }>
  | Exclude<FreshAuthenticationResult, { readonly kind: 'fresh' }>;

export type CompleteEnrollmentResult =
  | { readonly kind: 'host_verifying'; readonly hostId: string; readonly keyFingerprint: string }
  | { readonly kind: 'assertion_expired' | 'assertion_replayed' }
  | Exclude<PublicKeyVerificationResult, { readonly kind: 'verified' }>
  | { readonly kind: 'capability_manifest_rejected' };

export type RequestVpnPeerPlanResult =
  | { readonly kind: 'vpn_peer_plan_issued'; readonly plan: VpnPeerPlan }
  | { readonly kind: 'vpn_policy_denied'; readonly reason: string }
  | Exclude<AccessResult, { readonly kind: 'allowed' }>
  | Exclude<FreshAuthenticationResult, { readonly kind: 'fresh' }>;

export type RevokeHostResult =
  | { readonly kind: 'host_revoked'; readonly hostId: string }
  | Exclude<AccessResult, { readonly kind: 'allowed' }>
  | Exclude<FreshAuthenticationResult, { readonly kind: 'fresh' }>;

function isAccessDenied(result: AccessResult): result is Exclude<AccessResult, { readonly kind: 'allowed' }> {
  return result.kind !== 'allowed';
}

function isFreshDenied(result: FreshAuthenticationResult): result is Exclude<FreshAuthenticationResult, { readonly kind: 'fresh' }> {
  return result.kind !== 'fresh';
}

function isVpnPlan(result: VpnPlanResult): result is VpnPeerPlan {
  return !('kind' in result);
}

function isPolicyDenied(result: TransportPolicyResult): result is Extract<TransportPolicyResult, { readonly kind: 'direct_ip_denied' }> {
  return result.kind === 'direct_ip_denied';
}

function hasCapability(manifest: CapabilityManifest): boolean {
  return manifest.operations.length > 0 &&
    manifest.maxRequestBytes > 0 &&
    manifest.maxResponseBytes > 0 &&
    manifest.maxOperationSeconds > 0 &&
    manifest.manifestHash.length > 0;
}

/**
 * In-process orchestration only. Every external concern is injected.
 * This class never opens a socket, invokes a VPN tool, generates a private key,
 * persists data directly, reads environment secrets, or forwards OAuth material.
 */
export class HostControlApplicationService {
  public constructor(private readonly dependencies: HostControlApplicationDependencies) {}

  public async createDraft(command: CreateHostDraftCommand): Promise<CreateHostDraftResult> {
    const access = await this.dependencies.authorization.hasHostManagementAccess({
      accountId: command.ownerId,
      action: 'create_draft',
    });
    if (isAccessDenied(access)) return access;

    const policy = await this.dependencies.transportPolicy.evaluate(command.transport, command.ownerId);
    if (isPolicyDenied(policy)) {
      await this.appendAudit('transport_denied', command.ownerId, undefined, 'denied');
      return { kind: 'transport_policy_denied', reason: policy.reason };
    }
    if (policy.kind !== 'allowed') {
      await this.appendAudit('transport_denied', command.ownerId, undefined, 'denied');
      return { kind: 'transport_policy_denied', reason: policy.kind };
    }

    const hostId = this.dependencies.ids.newHostId();
    await this.dependencies.registry.createDraft({
      hostId,
      ownerId: command.ownerId,
      displayName: command.displayName,
      mode: command.mode,
      transport: command.transport,
      state: 'draft',
      operations: command.expectedCapabilities,
      policyVersion: policy.policyVersion,
    });
    await this.appendAudit('draft_created', command.ownerId, hostId, 'allowed');
    return { kind: 'draft_created', hostId, ownershipProven: false };
  }

  public async issueEnrollmentAssertion(command: { readonly hostId: string; readonly actorId: string; readonly freshAuthenticationId: string; readonly requestedPublicKey?: string }): Promise<IssueEnrollmentAssertionResult> {
    const access = await this.dependencies.authorization.hasHostManagementAccess({ accountId: command.actorId, action: 'issue_enrollment' });
    if (isAccessDenied(access)) return access;
    const fresh = await this.dependencies.authorization.requireFreshAuthentication({ accountId: command.actorId, action: 'issue_enrollment' });
    if (isFreshDenied(fresh)) return fresh;

    const issued = await this.dependencies.assertions.issue({
      hostId: command.hostId,
      actorId: command.actorId,
      freshAuthenticationId: fresh.freshAuthenticationId,
      now: this.dependencies.clock.now(),
    });
    await this.appendAudit('assertion_issued', command.actorId, command.hostId, 'allowed');
    return {
      kind: 'assertion_issued',
      hostId: issued.hostId,
      assertion: issued.opaqueAssertion,
      expiresAt: issued.expiresAt,
      shownOnce: issued.shownOnce,
    };
  }

  public async completeEnrollment(command: { readonly hostId: string; readonly assertion: string; readonly hostPublicKey: string; readonly capabilityManifest: CapabilityManifest; readonly signedNonceResponse: string }): Promise<CompleteEnrollmentResult> {
    let consumed: EnrollmentAssertionRecord;
    try {
      consumed = await this.dependencies.assertions.consumeOnce({
        hostId: command.hostId,
        opaqueAssertion: command.assertion,
        presentedPublicKey: command.hostPublicKey,
        presentedAt: this.dependencies.clock.now(),
      });
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'kind' in error) {
        const kind = (error as { readonly kind?: string }).kind;
        if (kind === 'assertion_replayed' || kind === 'assertion_expired') return { kind };
      }
      return { kind: 'assertion_expired' };
    }

    const key = await this.dependencies.publicKeys.verifyPossession({
      hostId: command.hostId,
      assertion: command.assertion,
      hostPublicKey: command.hostPublicKey,
      signedNonceResponse: command.signedNonceResponse,
    });
    if (key.kind !== 'verified') return key;
    if (!hasCapability(command.capabilityManifest)) return { kind: 'capability_manifest_rejected' };

    await this.dependencies.registry.bindPublicKey({
      hostId: command.hostId,
      publicKey: command.hostPublicKey,
      fingerprint: key.fingerprint,
      ticketId: consumed.ticketId,
      at: this.dependencies.clock.now(),
    });
    await this.dependencies.registry.transition({
      hostId: command.hostId,
      nextState: 'verifying',
      at: this.dependencies.clock.now(),
    });
    await this.appendAudit('key_bound', undefined, command.hostId, 'allowed');
    return { kind: 'host_verifying', hostId: command.hostId, keyFingerprint: key.fingerprint };
  }

  public async requestVpnPeerPlan(command: { readonly hostId: string; readonly actorId: string; readonly freshAuthenticationId: string; readonly peerPublicKey: string; readonly tunnelAddress: string; readonly destination: string; readonly port: number }): Promise<RequestVpnPeerPlanResult> {
    const access = await this.dependencies.authorization.hasHostManagementAccess({ accountId: command.actorId, action: 'issue_enrollment' });
    if (isAccessDenied(access)) return access;
    const fresh = await this.dependencies.authorization.requireFreshAuthentication({ accountId: command.actorId, action: 'issue_enrollment' });
    if (isFreshDenied(fresh)) return fresh;

    const plan = await this.dependencies.vpnPeers.plan({
      hostId: command.hostId,
      actorId: command.actorId,
      peerPublicKey: command.peerPublicKey,
      tunnelAddress: command.tunnelAddress,
      destination: command.destination,
      port: command.port,
    });
    if (!isVpnPlan(plan)) return { kind: 'vpn_policy_denied', reason: plan.kind };
    await this.appendAudit('vpn_peer_plan_issued', command.actorId, command.hostId, 'allowed');
    return { kind: 'vpn_peer_plan_issued', plan };
  }

  public async requestRouteDecision(command: { readonly hostId: string; readonly ownerId: string; readonly operation: CoreOperation; readonly correlationId: string }): Promise<RouteDecisionResult | Exclude<AccessResult, { readonly kind: 'allowed' }>> {
    if (this.dependencies.deployment.kind === 'static') return { kind: 'static_host_unavailable' };
    const access = await this.dependencies.authorization.hasHostManagementAccess({ accountId: command.ownerId, action: 'request_route' });
    if (isAccessDenied(access)) return access;
    const result = await this.dependencies.routeDecisions.issue({ ...command, now: this.dependencies.clock.now() });
    await this.appendAudit('route_issued', command.ownerId, command.hostId, result.kind === 'issued' ? 'allowed' : 'denied');
    return result;
  }

  public async revokeHost(command: { readonly hostId: string; readonly actorId: string; readonly freshAuthenticationId: string; readonly reason: string }): Promise<RevokeHostResult> {
    const access = await this.dependencies.authorization.hasHostManagementAccess({ accountId: command.actorId, action: 'revoke' });
    if (isAccessDenied(access)) return access;
    const fresh = await this.dependencies.authorization.requireFreshAuthentication({ accountId: command.actorId, action: 'revoke' });
    if (isFreshDenied(fresh)) return fresh;

    const at = this.dependencies.clock.now();
    await this.dependencies.registry.revoke({ hostId: command.hostId, actorId: command.actorId, reason: command.reason, at });
    await this.dependencies.assertions.revokeForHost(command.hostId, at);
    await this.dependencies.vpnPeers.revoke(command.hostId, at);
    await this.dependencies.routeDecisions.invalidateHost(command.hostId, at);
    await this.appendAudit('host_revoked', command.actorId, command.hostId, 'allowed');
    return { kind: 'host_revoked', hostId: command.hostId };
  }

  public async resolveExecutionProvider(command: { readonly accountId: string; readonly operation: CoreOperation; readonly correlationId: string }): Promise<{ readonly kind: string; readonly routeDecision?: BoundedRouteDecision }> {
    if (this.dependencies.deployment.kind === 'static') return { kind: 'static_host_unavailable' };
    return this.dependencies.executionProviders.resolve(command);
  }

  private async appendAudit(type: string, actorId: string | undefined, hostId: string | undefined, outcome: 'allowed' | 'denied' | 'failed'): Promise<void> {
    await this.dependencies.audit.append({ type, actorId, hostId, outcome, at: this.dependencies.clock.now() });
  }
}
