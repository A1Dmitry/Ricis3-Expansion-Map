/**
 * CommunityRewards bounded context — architecture contracts only.
 *
 * This module intentionally has no side effects: no HTTP, React, database,
 * localStorage, crypto, process environment or singleton composition. Its only
 * responsibility is to freeze the language and dependency ports for a
 * server-authoritative, non-monetary token ledger and friend referrals.
 */

export type Brand<TValue, TName extends string> = TValue & { readonly __brand: TName };

export type AccountId = Brand<string, 'CommunityRewards.AccountId'>;
export type CampaignId = Brand<string, 'CommunityRewards.CampaignId'>;
export type ReferralLinkId = Brand<string, 'CommunityRewards.ReferralLinkId'>;
export type ReferralRelationshipId = Brand<string, 'CommunityRewards.ReferralRelationshipId'>;
export type LedgerEntryId = Brand<string, 'CommunityRewards.LedgerEntryId'>;
export type RewardReceiptId = Brand<string, 'CommunityRewards.RewardReceiptId'>;
export type EntitlementReservationId = Brand<string, 'CommunityRewards.EntitlementReservationId'>;
export type CorrelationId = Brand<string, 'CommunityRewards.CorrelationId'>;
export type IdempotencyKey = Brand<string, 'CommunityRewards.IdempotencyKey'>;
export type ReferralCode = Brand<string, 'CommunityRewards.ReferralCode'>;
export type ReferralCodeHash = Brand<string, 'CommunityRewards.ReferralCodeHash'>;
export type PendingAttributionHandle = Brand<string, 'CommunityRewards.PendingAttributionHandle'>;
export type TokenAmount = Brand<number, 'CommunityRewards.PositiveTokenAmount'>;

/** Public app credit, explicitly not currency, cryptoasset, payment or transferable value. */
export type CommunityTokenKind = 'RICIS_APP_TOKEN';

export type CampaignState = 'draft' | 'active' | 'paused' | 'ended' | 'archived';
export type ReferralLinkState = 'active' | 'revoked' | 'expired';
export type ReferralRelationshipState =
  | 'captured'
  | 'attributed'
  | 'qualification_pending'
  | 'qualified'
  | 'rewarded'
  | 'under_review'
  | 'rejected'
  | 'expired';
export type EntitlementReservationState = 'issued' | 'consumed' | 'released' | 'expired';

export type LedgerEntryKind =
  | 'referral_reward_inviter'
  | 'referral_reward_invitee'
  | 'feature_reservation'
  | 'feature_consumption'
  | 'reversal'
  | 'expiry'
  | 'operator_adjustment';

export type ReferralQualificationRule = 'verified_new_account_with_first_research_session';
export type RewardDecision = 'allow' | 'review' | 'deny';
export type AuditOutcome = 'allowed' | 'denied' | 'deferred' | 'failed';

export interface TokenFeatureScope {
  readonly featureKey: string;
  readonly unitsPerUse: TokenAmount;
}

/** Immutable, versioned rules disclosed before users share a friend link. */
export interface ReferralCampaign {
  readonly campaignId: CampaignId;
  readonly tokenKind: CommunityTokenKind;
  readonly state: CampaignState;
  readonly policyVersion: string;
  readonly qualificationRule: ReferralQualificationRule;
  readonly inviterReward: TokenAmount;
  readonly inviteeReward: TokenAmount;
  readonly maximumRewardedInviteesPerInviter: number;
  readonly featureScopes: readonly TokenFeatureScope[];
  readonly startsAt: number;
  readonly endsAt: number;
}

/** Durable record stores only the code hash; the raw code is a public URL value. */
export interface ReferralLink {
  readonly referralLinkId: ReferralLinkId;
  readonly campaignId: CampaignId;
  readonly inviterAccountId: AccountId;
  readonly codeHash: ReferralCodeHash;
  readonly state: ReferralLinkState;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly revokedAt?: number;
}

/** Public-safe projection; it deliberately does not expose code hash or account identifiers. */
export interface ReferralLinkView {
  readonly referralLinkId: ReferralLinkId;
  readonly publicReferralCode: ReferralCode;
  readonly state: ReferralLinkState;
  readonly expiresAt: number;
}

/** The only owned relationship between an inviter and a prospective invitee. */
export interface ReferralRelationship {
  readonly referralRelationshipId: ReferralRelationshipId;
  readonly campaignId: CampaignId;
  readonly referralLinkId: ReferralLinkId;
  readonly inviterAccountId: AccountId;
  readonly inviteeAccountId?: AccountId;
  readonly state: ReferralRelationshipState;
  readonly capturedAt: number;
  readonly attributedAt?: number;
  readonly qualifiedAt?: number;
  readonly rewardedAt?: number;
  readonly rejectionReason?: ReferralRejectionReason;
  readonly reviewReason?: ReferralReviewReason;
}

export type ReferralRejectionReason =
  | 'campaign_inactive'
  | 'referral_invalid'
  | 'referral_expired'
  | 'self_referral'
  | 'already_attributed'
  | 'account_not_eligible'
  | 'campaign_cap_reached'
  | 'operator_rejected';

export type ReferralReviewReason = 'risk_policy' | 'qualification_conflict' | 'operator_review';

/** Immutable append-only balance fact. An amount is always positive; kind determines its semantics. */
export interface LedgerEntry {
  readonly ledgerEntryId: LedgerEntryId;
  readonly accountId: AccountId;
  readonly tokenKind: CommunityTokenKind;
  readonly entryKind: LedgerEntryKind;
  readonly amount: TokenAmount;
  readonly campaignId?: CampaignId;
  readonly referralRelationshipId?: ReferralRelationshipId;
  readonly entitlementReservationId?: EntitlementReservationId;
  readonly reversalOfLedgerEntryId?: LedgerEntryId;
  readonly idempotencyKey: IdempotencyKey;
  readonly policyVersion: string;
  readonly occurredAt: number;
  readonly correlationId: CorrelationId;
  readonly reasonCode: string;
}

export interface TokenBalance {
  readonly accountId: AccountId;
  readonly tokenKind: CommunityTokenKind;
  readonly available: TokenAmount;
  readonly reserved: TokenAmount;
  readonly updatedAt: number;
}

export interface RewardReceipt {
  readonly rewardReceiptId: RewardReceiptId;
  readonly campaignId: CampaignId;
  readonly referralRelationshipId: ReferralRelationshipId;
  readonly inviterLedgerEntryId: LedgerEntryId;
  readonly inviteeLedgerEntryId: LedgerEntryId;
  readonly issuedAt: number;
  readonly policyVersion: string;
}

export interface EntitlementReservation {
  readonly entitlementReservationId: EntitlementReservationId;
  readonly accountId: AccountId;
  readonly featureKey: string;
  readonly tokenKind: CommunityTokenKind;
  readonly amount: TokenAmount;
  readonly state: EntitlementReservationState;
  readonly idempotencyKey: IdempotencyKey;
  readonly issuedAt: number;
  readonly expiresAt: number;
  readonly consumedAt?: number;
  readonly releasedAt?: number;
}

export interface ReferralDashboard {
  readonly balance: TokenBalance;
  readonly activeLinks: readonly ReferralLinkView[];
  readonly invitedRelationshipStatuses: readonly ReferralRelationshipStatusView[];
  readonly receipts: readonly RewardReceipt[];
}

/** Privacy-minimised inviter view: no invitee email, name or account identifier. */
export interface ReferralRelationshipStatusView {
  readonly referralRelationshipId: ReferralRelationshipId;
  readonly state: ReferralRelationshipState;
  readonly capturedAt: number;
  readonly rewardedAt?: number;
}

export interface CreateReferralLinkCommand {
  readonly campaignId: CampaignId;
  readonly correlationId: CorrelationId;
}

export interface CaptureReferralCommand {
  readonly publicReferralCode: ReferralCode;
  readonly correlationId: CorrelationId;
}

export interface BindReferralAtSignupCommand {
  readonly pendingAttributionHandle: PendingAttributionHandle;
  readonly campaignId: CampaignId;
  readonly correlationId: CorrelationId;
}

/** Trusted server-side qualification event, not a browser-controlled button action. */
export interface EvaluateQualificationCommand {
  readonly referralRelationshipId: ReferralRelationshipId;
  readonly qualificationRule: ReferralQualificationRule;
  readonly correlationId: CorrelationId;
}

/** Trusted orchestration command. The browser cannot select reward amount or account IDs. */
export interface PostReferralRewardsCommand {
  readonly referralRelationshipId: ReferralRelationshipId;
  readonly idempotencyKey: IdempotencyKey;
  readonly correlationId: CorrelationId;
}

export interface ReserveFeatureTokensCommand {
  readonly featureKey: string;
  readonly idempotencyKey: IdempotencyKey;
  readonly correlationId: CorrelationId;
}

export interface ConsumeFeatureReservationCommand {
  readonly entitlementReservationId: EntitlementReservationId;
  readonly idempotencyKey: IdempotencyKey;
  readonly correlationId: CorrelationId;
}

export interface RevokeReferralLinkCommand {
  readonly referralLinkId: ReferralLinkId;
  readonly correlationId: CorrelationId;
}

export type CreateReferralLinkOutcome =
  | { readonly kind: 'link_created'; readonly link: ReferralLinkView }
  | { readonly kind: 'requires_authentication' }
  | { readonly kind: 'campaign_inactive'; readonly state: CampaignState }
  | { readonly kind: 'rate_limited'; readonly retryAfterSeconds: number }
  | { readonly kind: 'static_host_unavailable' };

export type CaptureReferralOutcome =
  | { readonly kind: 'attribution_captured'; readonly pendingAttributionHandle: PendingAttributionHandle; readonly campaignId: CampaignId; readonly expiresAt: number }
  | { readonly kind: 'referral_invalid' }
  | { readonly kind: 'referral_expired' }
  | { readonly kind: 'campaign_inactive'; readonly state: CampaignState }
  | { readonly kind: 'rate_limited'; readonly retryAfterSeconds: number }
  | { readonly kind: 'static_host_unavailable' };

export type BindReferralAtSignupOutcome =
  | { readonly kind: 'attributed'; readonly referralRelationship: ReferralRelationship }
  | { readonly kind: 'self_referral_rejected' }
  | { readonly kind: 'already_attributed' }
  | { readonly kind: 'account_not_eligible' }
  | { readonly kind: 'under_review'; readonly reason: ReferralReviewReason }
  | { readonly kind: 'referral_invalid' }
  | { readonly kind: 'campaign_inactive'; readonly state: CampaignState }
  | { readonly kind: 'requires_authentication' }
  | { readonly kind: 'rate_limited'; readonly retryAfterSeconds: number }
  | { readonly kind: 'static_host_unavailable' };

export type EvaluateQualificationOutcome =
  | { readonly kind: 'qualified'; readonly referralRelationship: ReferralRelationship }
  | { readonly kind: 'qualification_pending'; readonly referralRelationship: ReferralRelationship }
  | { readonly kind: 'under_review'; readonly reason: ReferralReviewReason }
  | { readonly kind: 'relationship_not_found' }
  | { readonly kind: 'static_host_unavailable' };

export type PostReferralRewardsOutcome =
  | { readonly kind: 'rewards_posted'; readonly receipt: RewardReceipt }
  | { readonly kind: 'already_rewarded'; readonly receipt: RewardReceipt }
  | { readonly kind: 'qualification_pending' }
  | { readonly kind: 'under_review'; readonly reason: ReferralReviewReason }
  | { readonly kind: 'campaign_cap_reached' }
  | { readonly kind: 'relationship_not_found' }
  | { readonly kind: 'static_host_unavailable' };

export type ReserveFeatureTokensOutcome =
  | { readonly kind: 'reservation_issued'; readonly reservation: EntitlementReservation }
  | { readonly kind: 'insufficient_balance' }
  | { readonly kind: 'feature_not_eligible' }
  | { readonly kind: 'requires_authentication' }
  | { readonly kind: 'static_host_unavailable' };

export type ConsumeFeatureReservationOutcome =
  | { readonly kind: 'reservation_consumed'; readonly reservation: EntitlementReservation }
  | { readonly kind: 'reservation_already_consumed'; readonly reservation: EntitlementReservation }
  | { readonly kind: 'reservation_expired' }
  | { readonly kind: 'reservation_not_found' }
  | { readonly kind: 'static_host_unavailable' };

export type RevokeReferralLinkOutcome =
  | { readonly kind: 'link_revoked'; readonly referralLinkId: ReferralLinkId }
  | { readonly kind: 'link_not_owned' }
  | { readonly kind: 'fresh_auth_required' }
  | { readonly kind: 'requires_authentication' }
  | { readonly kind: 'static_host_unavailable' };

export type GetRewardsDashboardOutcome =
  | { readonly kind: 'dashboard'; readonly dashboard: ReferralDashboard }
  | { readonly kind: 'requires_authentication' }
  | { readonly kind: 'static_host_unavailable' };

/** The only application-level entry point used by HTTP/UI adapters. */
export interface ICommunityRewardsUseCase {
  createReferralLink(command: CreateReferralLinkCommand): Promise<CreateReferralLinkOutcome>;
  captureReferral(command: CaptureReferralCommand): Promise<CaptureReferralOutcome>;
  bindReferralAtSignup(command: BindReferralAtSignupCommand): Promise<BindReferralAtSignupOutcome>;
  evaluateQualification(command: EvaluateQualificationCommand): Promise<EvaluateQualificationOutcome>;
  postReferralRewards(command: PostReferralRewardsCommand): Promise<PostReferralRewardsOutcome>;
  getRewardsDashboard(correlationId: CorrelationId): Promise<GetRewardsDashboardOutcome>;
  reserveFeatureTokens(command: ReserveFeatureTokensCommand): Promise<ReserveFeatureTokensOutcome>;
  consumeFeatureReservation(command: ConsumeFeatureReservationCommand): Promise<ConsumeFeatureReservationOutcome>;
  revokeReferralLink(command: RevokeReferralLinkCommand): Promise<RevokeReferralLinkOutcome>;
}

export type IdentityAccessDecision =
  | { readonly kind: 'authenticated'; readonly accountId: AccountId }
  | { readonly kind: 'requires_authentication' }
  | { readonly kind: 'fresh_auth_required' }
  | { readonly kind: 'access_denied' };

export type AccountEligibilityDecision =
  | { readonly kind: 'eligible_new_account' }
  | { readonly kind: 'not_new_account' }
  | { readonly kind: 'account_not_verified' }
  | { readonly kind: 'account_suspended' };

export interface IIdentityAccessPort {
  currentAccess(input: { readonly action: string; readonly correlationId: CorrelationId }): Promise<IdentityAccessDecision>;
  accountEligibility(input: { readonly accountId: AccountId; readonly campaignId: CampaignId }): Promise<AccountEligibilityDecision>;
  requireFreshAuthentication(input: { readonly accountId: AccountId; readonly action: 'revoke_referral_link' | 'operator_adjustment'; readonly correlationId: CorrelationId }): Promise<IdentityAccessDecision>;
}

export interface IReferralCodePort {
  issue(input: { readonly campaignId: CampaignId; readonly inviterAccountId: AccountId }): Promise<{ readonly publicReferralCode: ReferralCode; readonly codeHash: ReferralCodeHash }>;
  hash(input: { readonly publicReferralCode: ReferralCode }): Promise<ReferralCodeHash>;
  verify(input: { readonly publicReferralCode: ReferralCode; readonly codeHash: ReferralCodeHash }): Promise<boolean>;
}

/** IDs are injected so the domain never relies on Math.random, Date or a specific UUID provider. */
export interface ICommunityRewardsIdPort {
  referralLinkId(): ReferralLinkId;
  referralRelationshipId(): ReferralRelationshipId;
  ledgerEntryId(): LedgerEntryId;
  rewardReceiptId(): RewardReceiptId;
  entitlementReservationId(): EntitlementReservationId;
}

export interface IRateLimitPort {
  decide(input: { readonly action: 'create_link' | 'capture_referral' | 'bind_referral'; readonly subjectKey: string; readonly correlationId: CorrelationId }): Promise<
    | { readonly kind: 'allowed' }
    | { readonly kind: 'rate_limited'; readonly retryAfterSeconds: number }
  >;
}

export interface IRiskReviewPort {
  decide(input: { readonly action: 'bind_referral' | 'qualify_referral' | 'post_rewards'; readonly campaignId: CampaignId; readonly inviterAccountId: AccountId; readonly inviteeAccountId?: AccountId; readonly correlationId: CorrelationId }): Promise<
    | { readonly kind: 'allow' }
    | { readonly kind: 'review'; readonly reason: ReferralReviewReason }
    | { readonly kind: 'deny'; readonly reason: ReferralRejectionReason }
  >;
}

/** Prevents public browser requests from directly qualifying or rewarding a referral. */
export interface ITrustedAutomationAccessPort {
  authorize(input: { readonly operation: 'evaluate_qualification' | 'post_referral_rewards'; readonly correlationId: CorrelationId }): Promise<
    | { readonly kind: 'allowed' }
    | { readonly kind: 'access_denied' }
    | { readonly kind: 'static_host_unavailable' }
  >;
}

export interface ITimePort {
  now(): number;
}

/** Audit adapters must enforce redaction; raw credentials/codes/PII are not accepted by this schema. */
export interface IRedactedAuditPort {
  append(event: {
    readonly type:
      | 'referral_link_created'
      | 'referral_captured'
      | 'referral_attributed'
      | 'referral_qualification_changed'
      | 'referral_rewards_posted'
      | 'referral_link_revoked'
      | 'token_reservation_changed'
      | 'community_rewards_denied';
    readonly actorAccountId?: AccountId;
    readonly campaignId?: CampaignId;
    readonly referralRelationshipId?: ReferralRelationshipId;
    readonly correlationId: CorrelationId;
    readonly at: number;
    readonly outcome: AuditOutcome;
    readonly reasonCode?: string;
  }): Promise<void>;
}

/** Product entitlement only. It has no proof, Core or Lean authority. */
export interface IFeatureEntitlementPort {
  canUseFeature(input: { readonly accountId: AccountId; readonly featureKey: string; readonly correlationId: CorrelationId }): Promise<
    | { readonly kind: 'allowed' }
    | { readonly kind: 'feature_not_eligible' }
  >;
}

export interface INotificationOutboxPort {
  enqueue(event:
    | { readonly kind: 'reward_receipt_issued'; readonly accountId: AccountId; readonly rewardReceiptId: RewardReceiptId; readonly correlationId: CorrelationId }
    | { readonly kind: 'referral_under_review'; readonly accountId: AccountId; readonly referralRelationshipId: ReferralRelationshipId; readonly correlationId: CorrelationId }
  ): Promise<void>;
}

export interface ICampaignRepository {
  findById(campaignId: CampaignId): Promise<ReferralCampaign | null>;
  findActiveForFeature(featureKey: string, at: number): Promise<ReferralCampaign | null>;
}

export interface IReferralRepository {
  createLink(link: ReferralLink): Promise<void>;
  findLinkById(referralLinkId: ReferralLinkId): Promise<ReferralLink | null>;
  findLinkByCodeHash(codeHash: ReferralCodeHash): Promise<ReferralLink | null>;
  findActiveLinkForInviter(input: { readonly campaignId: CampaignId; readonly inviterAccountId: AccountId; readonly at: number }): Promise<ReferralLink | null>;
  revokeActiveLinksForInviter(input: { readonly campaignId: CampaignId; readonly inviterAccountId: AccountId; readonly at: number }): Promise<void>;
  revokeLink(input: { readonly referralLinkId: ReferralLinkId; readonly actorAccountId: AccountId; readonly at: number }): Promise<'revoked' | 'not_owned' | 'not_active'>;
  createCapturedRelationship(relationship: ReferralRelationship): Promise<PendingAttributionHandle>;
  consumePendingAttribution(input: { readonly pendingAttributionHandle: PendingAttributionHandle; readonly inviteeAccountId: AccountId; readonly at: number }): Promise<
    | { readonly kind: 'captured'; readonly relationship: ReferralRelationship }
    | { readonly kind: 'not_found_or_expired' }
  >;
  findRelationshipById(referralRelationshipId: ReferralRelationshipId): Promise<ReferralRelationship | null>;
  findRelationshipForInvitee(input: { readonly campaignId: CampaignId; readonly inviteeAccountId: AccountId }): Promise<ReferralRelationship | null>;
  listRelationshipsForInviter(input: { readonly campaignId: CampaignId; readonly inviterAccountId: AccountId }): Promise<readonly ReferralRelationship[]>;
  countRewardedInvitees(input: { readonly campaignId: CampaignId; readonly inviterAccountId: AccountId }): Promise<number>;
  transitionRelationship(input: { readonly referralRelationshipId: ReferralRelationshipId; readonly expectedState: ReferralRelationshipState; readonly nextState: ReferralRelationshipState; readonly at: number; readonly rejectionReason?: ReferralRejectionReason; readonly reviewReason?: ReferralReviewReason }): Promise<ReferralRelationship | null>;
}

export interface ILedgerRepository {
  append(entries: readonly LedgerEntry[]): Promise<void>;
  getBalance(accountId: AccountId, tokenKind: CommunityTokenKind): Promise<TokenBalance>;
  findEntriesByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<readonly LedgerEntry[]>;
}

export interface IReceiptRepository {
  create(receipt: RewardReceipt): Promise<void>;
  findByRelationshipId(referralRelationshipId: ReferralRelationshipId): Promise<RewardReceipt | null>;
  listForAccount(accountId: AccountId): Promise<readonly RewardReceipt[]>;
}

export interface IReservationRepository {
  create(reservation: EntitlementReservation): Promise<void>;
  findById(entitlementReservationId: EntitlementReservationId): Promise<EntitlementReservation | null>;
  transition(input: { readonly entitlementReservationId: EntitlementReservationId; readonly expectedState: EntitlementReservationState; readonly nextState: EntitlementReservationState; readonly at: number }): Promise<EntitlementReservation | null>;
}

export interface IIdempotencyRepository {
  findReceipt(idempotencyKey: IdempotencyKey): Promise<RewardReceipt | null>;
  record(input: { readonly idempotencyKey: IdempotencyKey; readonly operation: 'post_referral_rewards' | 'reserve_feature_tokens' | 'consume_feature_reservation'; readonly correlationId: CorrelationId; readonly recordedAt: number }): Promise<void>;
}

/** All aggregate mutation happens through this scoped transaction boundary. */
export interface ICommunityRewardsUnitOfWork {
  run<T>(operation: (repositories: {
    readonly campaigns: ICampaignRepository;
    readonly referrals: IReferralRepository;
    readonly ledger: ILedgerRepository;
    readonly receipts: IReceiptRepository;
    readonly reservations: IReservationRepository;
    readonly idempotency: IIdempotencyRepository;
  }) => Promise<T>): Promise<T>;
}

/** Production composition root injects adapters; the domain/application never imports vendor SDKs. */
export interface CommunityRewardsDependencies {
  readonly identityAccess: IIdentityAccessPort;
  readonly unitOfWork: ICommunityRewardsUnitOfWork;
  readonly referralCodes: IReferralCodePort;
  readonly identifiers: ICommunityRewardsIdPort;
  readonly rateLimit: IRateLimitPort;
  readonly riskReview: IRiskReviewPort;
  readonly trustedAutomation: ITrustedAutomationAccessPort;
  readonly time: ITimePort;
  readonly audit: IRedactedAuditPort;
  readonly featureEntitlement: IFeatureEntitlementPort;
  readonly notificationOutbox: INotificationOutboxPort;
}
