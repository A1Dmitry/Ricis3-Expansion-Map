import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  AccountId,
  AuditOutcome,
  CampaignId,
  CaptureReferralOutcome,
  CommunityRewardsDependencies,
  CommunityTokenKind,
  CorrelationId,
  CreateReferralLinkOutcome,
  EntitlementReservation,
  EntitlementReservationId,
  ICommunityRewardsUnitOfWork,
  ICommunityRewardsUseCase,
  IRedactedAuditPort,
  IdempotencyKey,
  LedgerEntry,
  LedgerEntryId,
  PendingAttributionHandle,
  PostReferralRewardsOutcome,
  ReferralCampaign,
  ReferralCode,
  ReferralDashboard,
  ReferralLinkId,
  ReferralLinkView,
  ReferralRelationship,
  ReferralRelationshipId,
  ReferralRelationshipStatusView,
  RewardReceipt,
  RewardReceiptId,
  TokenAmount,
  TokenBalance,
} from './contracts';

const asAccountId = (value: string): AccountId => value as AccountId;
const asCampaignId = (value: string): CampaignId => value as CampaignId;
const asLinkId = (value: string): ReferralLinkId => value as ReferralLinkId;
const asRelationshipId = (value: string): ReferralRelationshipId => value as ReferralRelationshipId;
const asLedgerEntryId = (value: string): LedgerEntryId => value as LedgerEntryId;
const asReceiptId = (value: string): RewardReceiptId => value as RewardReceiptId;
const asReservationId = (value: string): EntitlementReservationId => value as EntitlementReservationId;
const asCorrelationId = (value: string): CorrelationId => value as CorrelationId;
const asIdempotencyKey = (value: string): IdempotencyKey => value as IdempotencyKey;
const asTokenAmount = (value: number): TokenAmount => value as TokenAmount;
const asReferralCode = (value: string): ReferralCode => value as ReferralCode;
const asPendingAttributionHandle = (value: string): PendingAttributionHandle => value as PendingAttributionHandle;

const now = 1_777_777_777_000;
const correlationId = asCorrelationId('qa-community-rewards-0001');
const inviterAccountId = asAccountId('account-inviter');
const inviteeAccountId = asAccountId('account-invitee');
const campaignId = asCampaignId('campaign-friends-p0');
const relationshipId = asRelationshipId('relationship-p0');
const tokenKind: CommunityTokenKind = 'RICIS_APP_TOKEN';

const campaign: ReferralCampaign = {
  campaignId,
  tokenKind,
  state: 'active',
  policyVersion: 'community-rewards-p0-v1',
  qualificationRule: 'verified_new_account_with_first_research_session',
  inviterReward: asTokenAmount(12),
  inviteeReward: asTokenAmount(8),
  maximumRewardedInviteesPerInviter: 10,
  featureScopes: [{ featureKey: 'research-assist:priority', unitsPerUse: asTokenAmount(1) }],
  startsAt: now - 60_000,
  endsAt: now + 60_000,
};

const linkView: ReferralLinkView = {
  referralLinkId: asLinkId('link-p0'),
  publicReferralCode: asReferralCode('R3_public_opaque_code'),
  state: 'active',
  expiresAt: campaign.endsAt,
};

const relationship: ReferralRelationship = {
  referralRelationshipId: relationshipId,
  campaignId,
  referralLinkId: linkView.referralLinkId,
  inviterAccountId,
  inviteeAccountId,
  state: 'qualified',
  capturedAt: now - 30_000,
  attributedAt: now - 25_000,
  qualifiedAt: now - 10_000,
};

const inviterLedgerEntry: LedgerEntry = {
  ledgerEntryId: asLedgerEntryId('ledger-inviter-reward'),
  accountId: inviterAccountId,
  tokenKind,
  entryKind: 'referral_reward_inviter',
  amount: campaign.inviterReward,
  campaignId,
  referralRelationshipId: relationshipId,
  idempotencyKey: asIdempotencyKey('reward-idempotency-key'),
  policyVersion: campaign.policyVersion,
  occurredAt: now,
  correlationId,
  reasonCode: 'referral_qualified',
};

const inviteeLedgerEntry: LedgerEntry = {
  ledgerEntryId: asLedgerEntryId('ledger-invitee-reward'),
  accountId: inviteeAccountId,
  tokenKind,
  entryKind: 'referral_reward_invitee',
  amount: campaign.inviteeReward,
  campaignId,
  referralRelationshipId: relationshipId,
  idempotencyKey: inviterLedgerEntry.idempotencyKey,
  policyVersion: campaign.policyVersion,
  occurredAt: now,
  correlationId,
  reasonCode: 'referral_qualified',
};

const receipt: RewardReceipt = {
  rewardReceiptId: asReceiptId('receipt-p0'),
  campaignId,
  referralRelationshipId: relationshipId,
  inviterLedgerEntryId: inviterLedgerEntry.ledgerEntryId,
  inviteeLedgerEntryId: inviteeLedgerEntry.ledgerEntryId,
  issuedAt: now,
  policyVersion: campaign.policyVersion,
};

const balance: TokenBalance = {
  accountId: inviterAccountId,
  tokenKind,
  available: campaign.inviterReward,
  reserved: asTokenAmount(0),
  updatedAt: now,
};

const pendingHandle = asPendingAttributionHandle('pending-attribution-p0');
const pendingCapture: CaptureReferralOutcome = {
  kind: 'attribution_captured',
  pendingAttributionHandle: pendingHandle,
  campaignId,
  expiresAt: now + 900_000,
};

const rewardsPosted: PostReferralRewardsOutcome = { kind: 'rewards_posted', receipt };
const rewardsAlreadyPosted: PostReferralRewardsOutcome = { kind: 'already_rewarded', receipt };
const staticHostLinkOutcome: CreateReferralLinkOutcome = { kind: 'static_host_unavailable' };

function describeRewardOutcome(outcome: PostReferralRewardsOutcome): string {
  switch (outcome.kind) {
    case 'rewards_posted':
    case 'already_rewarded':
      return outcome.receipt.rewardReceiptId;
    case 'qualification_pending':
      return 'pending';
    case 'under_review':
      return outcome.reason;
    case 'campaign_cap_reached':
      return 'campaign_cap_reached';
    case 'relationship_not_found':
      return 'relationship_not_found';
    case 'static_host_unavailable':
      return 'static_host_unavailable';
  }
}

describe('CommunityRewards — Step 3 contract QA', () => {
  it('RQA01: public friend-link view contains only opaque referral data and no account identity, code hash, balance or credential', () => {
    const serialized = JSON.stringify(linkView);

    expect(linkView.publicReferralCode).toBe('R3_public_opaque_code');
    expect(serialized).not.toContain('account-inviter');
    expect(serialized).not.toContain('codeHash');
    expect(serialized).not.toContain('available');
    expect(serialized).not.toMatch(/session|access[_-]?token|oauth|password/i);
  });

  it('RQA02: captured attribution is a pending handle, not an authenticated claim and never a reward', () => {
    expect(pendingCapture.kind).toBe('attribution_captured');
    if (pendingCapture.kind === 'attribution_captured') {
      expect(pendingCapture.pendingAttributionHandle).toBe(pendingHandle);
      expect(pendingCapture.campaignId).toBe(campaignId);
      expect(pendingCapture).not.toHaveProperty('receipt');
      expect(pendingCapture).not.toHaveProperty('balance');
    }
  });

  it('RQA03: a qualified referral models two distinct ledger facts and one receipt bound to the same relationship and idempotency key', () => {
    expect(inviterLedgerEntry.entryKind).toBe('referral_reward_inviter');
    expect(inviteeLedgerEntry.entryKind).toBe('referral_reward_invitee');
    expect(inviterLedgerEntry.referralRelationshipId).toBe(relationshipId);
    expect(inviteeLedgerEntry.referralRelationshipId).toBe(relationshipId);
    expect(inviterLedgerEntry.idempotencyKey).toBe(inviteeLedgerEntry.idempotencyKey);
    expect(receipt.inviterLedgerEntryId).toBe(inviterLedgerEntry.ledgerEntryId);
    expect(receipt.inviteeLedgerEntryId).toBe(inviteeLedgerEntry.ledgerEntryId);
  });

  it('RQA04: post-reward outcome is closed and represents exact-once replay by the existing receipt rather than another credit', () => {
    expect(describeRewardOutcome(rewardsPosted)).toBe(receipt.rewardReceiptId);
    expect(describeRewardOutcome(rewardsAlreadyPosted)).toBe(receipt.rewardReceiptId);
    expect(rewardsPosted.kind).toBe('rewards_posted');
    expect(rewardsAlreadyPosted.kind).toBe('already_rewarded');
    expect(rewardsAlreadyPosted).not.toHaveProperty('newAmount');
    expect(rewardsAlreadyPosted).not.toHaveProperty('newBalance');
  });

  it('RQA05: self-referral, duplicate attribution and campaign eligibility failures remain typed denial outcomes', () => {
    const outcomes = [
      { kind: 'self_referral_rejected' },
      { kind: 'already_attributed' },
      { kind: 'account_not_eligible' },
      { kind: 'under_review', reason: 'risk_policy' },
    ] as const;

    expect(outcomes.map((outcome) => outcome.kind)).toEqual([
      'self_referral_rejected',
      'already_attributed',
      'account_not_eligible',
      'under_review',
    ]);
    expect(outcomes).not.toContainEqual(expect.objectContaining({ kind: 'attributed', reward: expect.anything() }));
  });

  it('RQA06: server-unavailable state explicitly prevents an authoritative local token-link fallback', () => {
    expect(staticHostLinkOutcome.kind).toBe('static_host_unavailable');
    expect(staticHostLinkOutcome).not.toHaveProperty('link');
    expect(staticHostLinkOutcome).not.toHaveProperty('offlineBalance');
  });

  it('RQA07: dashboard is owner projection; inviter relationship status intentionally excludes invitee identity and PII', () => {
    const status: ReferralRelationshipStatusView = {
      referralRelationshipId: relationshipId,
      state: 'rewarded',
      capturedAt: relationship.capturedAt,
      rewardedAt: now,
    };
    const dashboard: ReferralDashboard = {
      balance,
      activeLinks: [linkView],
      invitedRelationshipStatuses: [status],
      receipts: [receipt],
    };
    const serialized = JSON.stringify(dashboard.invitedRelationshipStatuses);

    expect(serialized).not.toContain('account-invitee');
    expect(serialized).not.toMatch(/email|name|phone|address/i);
    expect(status).not.toHaveProperty('inviteeAccountId');
  });

  it('RQA08: reservation is a feature-scoped product credit, not a proof/Core/Lean operation', () => {
    const reservation: EntitlementReservation = {
      entitlementReservationId: asReservationId('reservation-p0'),
      accountId: inviterAccountId,
      featureKey: 'research-assist:priority',
      tokenKind,
      amount: asTokenAmount(1),
      state: 'issued',
      idempotencyKey: asIdempotencyKey('reservation-idempotency-key'),
      issuedAt: now,
      expiresAt: now + 300_000,
    };
    const fields = Object.keys(reservation);

    expect(reservation.featureKey).toBe('research-assist:priority');
    expect(fields).not.toEqual(expect.arrayContaining([
      'coreResult',
      'proofRunId',
      'leanArtifactId',
      'nodeId',
      'axiomId',
    ]));
  });

  it('RQA09: ledger and audit contracts expose append/audit semantics without a mutable balance writer or unsafe raw-code field', () => {
    expectTypeOf<ICommunityRewardsUnitOfWork>().toHaveProperty('run');
    expectTypeOf<CommunityRewardsDependencies>().toHaveProperty('unitOfWork');
    expectTypeOf<IRedactedAuditPort>().toHaveProperty('append');
    expectTypeOf<LedgerEntry['entryKind']>().toEqualTypeOf<
      | 'referral_reward_inviter'
      | 'referral_reward_invitee'
      | 'feature_reservation'
      | 'feature_consumption'
      | 'reversal'
      | 'expiry'
      | 'operator_adjustment'
    >();
    expectTypeOf<AuditOutcome>().toEqualTypeOf<'allowed' | 'denied' | 'deferred' | 'failed'>();
  });

  it('RQA10: application facade preserves the closed typed boundary for every future adapter implementation', () => {
    expectTypeOf<ICommunityRewardsUseCase['captureReferral']>().returns.toEqualTypeOf<Promise<CaptureReferralOutcome>>();
    expectTypeOf<ICommunityRewardsUseCase['postReferralRewards']>().returns.toEqualTypeOf<Promise<PostReferralRewardsOutcome>>();
    expectTypeOf<ICommunityRewardsUseCase['createReferralLink']>().returns.toEqualTypeOf<Promise<CreateReferralLinkOutcome>>();
    expectTypeOf<PendingAttributionHandle>().not.toEqualTypeOf<ReferralCode>();
  });
});
