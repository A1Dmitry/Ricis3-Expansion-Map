import { CommunityRewardsApplication } from '../communityRewardsApplication';
import type {
  AccountEligibilityDecision,
  AccountId,
  CampaignId,
  CommunityRewardsDependencies,
  CorrelationId,
  EntitlementReservation,
  EntitlementReservationId,
  IdentityAccessDecision,
  IdempotencyKey,
  LedgerEntry,
  ReferralCampaign,
  ReferralCode,
  ReferralCodeHash,
  ReferralLink,
  ReferralLinkId,
  ReferralRelationship,
  ReferralRelationshipId,
  ReferralRelationshipState,
  RewardReceipt,
  RewardReceiptId,
  TokenAmount,
  TokenBalance,
} from '../contracts';

const asAccountId = (value: string): AccountId => value as AccountId;
const asReferralCode = (value: string): ReferralCode => value as ReferralCode;
const asReferralCodeHash = (value: string): ReferralCodeHash => value as ReferralCodeHash;
const asReferralLinkId = (value: string): ReferralLinkId => value as ReferralLinkId;
const asRelationshipId = (value: string): ReferralRelationshipId => value as ReferralRelationshipId;
const asReservationId = (value: string): EntitlementReservationId => value as EntitlementReservationId;
const asReceiptId = (value: string): RewardReceiptId => value as RewardReceiptId;
const asTokenAmount = (value: number): TokenAmount => value as TokenAmount;

function testCodeHash(value: ReferralCode): ReferralCodeHash {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16_777_619);
  }
  return asReferralCodeHash(`test-hash-${(hash >>> 0).toString(36)}-${value.length}`);
}

export interface CommunityRewardsTestKit {
  readonly application: CommunityRewardsApplication;
  readonly state: {
    readonly links: Map<ReferralLinkId, ReferralLink>;
    readonly relationships: Map<ReferralRelationshipId, ReferralRelationship>;
    readonly ledgerEntries: LedgerEntry[];
    readonly receipts: Map<RewardReceiptId, RewardReceipt>;
    readonly reservations: Map<EntitlementReservationId, EntitlementReservation>;
    readonly audits: Array<Parameters<CommunityRewardsDependencies['audit']['append']>[0]>;
    readonly notifications: Array<Parameters<CommunityRewardsDependencies['notificationOutbox']['enqueue']>[0]>;
  };
  readonly controls: {
    setNow(value: number): void;
    setAccess(value: IdentityAccessDecision): void;
    setEligibility(value: AccountEligibilityDecision): void;
    setRateLimited(seconds: number | null): void;
    setRisk(value: 'allow' | 'review' | 'deny'): void;
    setTrusted(value: 'allowed' | 'access_denied' | 'static_host_unavailable'): void;
    setFeatureAllowed(value: boolean): void;
  };
}

/**
 * A test-only implementation. It is intentionally deterministic and has no
 * crypto, persistence, network, browser storage, environment or global state.
 */
export function createCommunityRewardsTestKit(input: {
  readonly campaign: ReferralCampaign;
  readonly accountId?: AccountId;
  readonly now?: number;
}): CommunityRewardsTestKit {
  let now = input.now ?? 1_780_000_000_000;
  let access: IdentityAccessDecision = { kind: 'authenticated', accountId: input.accountId ?? asAccountId('account-inviter') };
  let eligibility: AccountEligibilityDecision = { kind: 'eligible_new_account' };
  let rateLimitedSeconds: number | null = null;
  let risk: 'allow' | 'review' | 'deny' = 'allow';
  let trusted: 'allowed' | 'access_denied' | 'static_host_unavailable' = 'allowed';
  let featureAllowed = true;
  let sequence = 0;

  const links = new Map<ReferralLinkId, ReferralLink>();
  const relationships = new Map<ReferralRelationshipId, ReferralRelationship>();
  const pending = new Map<string, ReferralRelationshipId>();
  const ledgerEntries: LedgerEntry[] = [];
  const receipts = new Map<RewardReceiptId, RewardReceipt>();
  const reservations = new Map<EntitlementReservationId, EntitlementReservation>();
  const audits: Array<Parameters<CommunityRewardsDependencies['audit']['append']>[0]> = [];
  const notifications: Array<Parameters<CommunityRewardsDependencies['notificationOutbox']['enqueue']>[0]> = [];

  const next = (prefix: string): string => `${prefix}-${++sequence}`;
  const campaignById = (campaignId: CampaignId): ReferralCampaign | null => campaignId === input.campaign.campaignId ? input.campaign : null;

  const transition = (relationship: ReferralRelationship, nextState: ReferralRelationshipState, at: number, extras: { rejectionReason?: ReferralRelationship['rejectionReason']; reviewReason?: ReferralRelationship['reviewReason'] }): ReferralRelationship => {
    const updated: ReferralRelationship = {
      ...relationship,
      state: nextState,
      ...(nextState === 'attributed' ? { attributedAt: at } : {}),
      ...(nextState === 'qualified' ? { qualifiedAt: at } : {}),
      ...(nextState === 'rewarded' ? { rewardedAt: at } : {}),
      ...(extras.rejectionReason === undefined ? {} : { rejectionReason: extras.rejectionReason }),
      ...(extras.reviewReason === undefined ? {} : { reviewReason: extras.reviewReason }),
    };
    relationships.set(updated.referralRelationshipId, updated);
    return updated;
  };

  const dependencies: CommunityRewardsDependencies = {
    identityAccess: {
      async currentAccess() { return access; },
      async accountEligibility() { return eligibility; },
      async requireFreshAuthentication() { return access; },
    },
    referralCodes: {
      async issue() {
        const value = asReferralCode(`R3_test_code_${next('code')}`);
        return { publicReferralCode: value, codeHash: testCodeHash(value) };
      },
      async hash({ publicReferralCode }) { return testCodeHash(publicReferralCode); },
      async verify({ publicReferralCode, codeHash }) { return codeHash === testCodeHash(publicReferralCode); },
    },
    identifiers: {
      referralLinkId: () => asReferralLinkId(next('link')),
      referralRelationshipId: () => asRelationshipId(next('relationship')),
      ledgerEntryId: () => next('ledger') as LedgerEntry['ledgerEntryId'],
      rewardReceiptId: () => asReceiptId(next('receipt')),
      entitlementReservationId: () => asReservationId(next('reservation')),
    },
    rateLimit: {
      async decide() {
        return rateLimitedSeconds === null ? { kind: 'allowed' as const } : { kind: 'rate_limited' as const, retryAfterSeconds: rateLimitedSeconds };
      },
    },
    riskReview: {
      async decide() {
        if (risk === 'allow') return { kind: 'allow' as const };
        if (risk === 'review') return { kind: 'review' as const, reason: 'risk_policy' as const };
        return { kind: 'deny' as const, reason: 'operator_rejected' as const };
      },
    },
    trustedAutomation: {
      async authorize() {
        return trusted === 'allowed' ? { kind: 'allowed' as const } : { kind: trusted };
      },
    },
    time: { now: () => now },
    audit: { async append(event) { audits.push(event); } },
    featureEntitlement: {
      async canUseFeature() { return featureAllowed ? { kind: 'allowed' as const } : { kind: 'feature_not_eligible' as const }; },
    },
    notificationOutbox: { async enqueue(event) { notifications.push(event); } },
    unitOfWork: {
      async run(operation) {
        return operation({
          campaigns: {
            async findById(campaignId) { return campaignById(campaignId); },
            async findActiveForFeature(featureKey, at) {
              const active = input.campaign.state === 'active' && input.campaign.startsAt <= at && at < input.campaign.endsAt;
              return active && input.campaign.featureScopes.some((scope) => scope.featureKey === featureKey) ? input.campaign : null;
            },
          },
          referrals: {
            async createLink(link) { links.set(link.referralLinkId, link); },
            async findLinkById(referralLinkId) { return links.get(referralLinkId) ?? null; },
            async findLinkByCodeHash(codeHash) { return [...links.values()].find((link) => link.codeHash === codeHash) ?? null; },
            async findActiveLinkForInviter(query) {
              return [...links.values()].find((link) => link.campaignId === query.campaignId && link.inviterAccountId === query.inviterAccountId && link.state === 'active' && link.expiresAt > query.at) ?? null;
            },
            async revokeActiveLinksForInviter(query) {
              for (const link of links.values()) {
                if (link.campaignId === query.campaignId && link.inviterAccountId === query.inviterAccountId && link.state === 'active') {
                  links.set(link.referralLinkId, { ...link, state: 'revoked', revokedAt: query.at });
                }
              }
            },
            async revokeLink(query) {
              const link = links.get(query.referralLinkId);
              if (link === undefined || link.inviterAccountId !== query.actorAccountId) return 'not_owned' as const;
              if (link.state !== 'active') return 'not_active' as const;
              links.set(link.referralLinkId, { ...link, state: 'revoked', revokedAt: query.at });
              return 'revoked' as const;
            },
            async createCapturedRelationship(relationship) {
              relationships.set(relationship.referralRelationshipId, relationship);
              const handle = `pending:${relationship.referralRelationshipId}`;
              pending.set(handle, relationship.referralRelationshipId);
              return handle as unknown as import('../contracts').PendingAttributionHandle;
            },
            async consumePendingAttribution(query) {
              const relationshipId = pending.get(query.pendingAttributionHandle as unknown as string);
              if (relationshipId === undefined) return { kind: 'not_found_or_expired' as const };
              pending.delete(query.pendingAttributionHandle as unknown as string);
              const relation = relationships.get(relationshipId);
              if (relation === undefined || relation.state !== 'captured') return { kind: 'not_found_or_expired' as const };
              const bound = { ...relation, inviteeAccountId: query.inviteeAccountId };
              relationships.set(bound.referralRelationshipId, bound);
              return { kind: 'captured' as const, relationship: bound };
            },
            async findRelationshipById(referralRelationshipId) { return relationships.get(referralRelationshipId) ?? null; },
            async findRelationshipForInvitee(query) {
              return [...relationships.values()].find((relationship) => relationship.campaignId === query.campaignId && relationship.inviteeAccountId === query.inviteeAccountId) ?? null;
            },
            async listRelationshipsForInviter(query) {
              return [...relationships.values()].filter((relationship) => relationship.campaignId === query.campaignId && relationship.inviterAccountId === query.inviterAccountId);
            },
            async countRewardedInvitees(query) {
              return [...relationships.values()].filter((relationship) => relationship.campaignId === query.campaignId && relationship.inviterAccountId === query.inviterAccountId && relationship.state === 'rewarded').length;
            },
            async transitionRelationship(query) {
              const current = relationships.get(query.referralRelationshipId);
              if (current === undefined || current.state !== query.expectedState) return null;
              return transition(current, query.nextState, query.at, { rejectionReason: query.rejectionReason, reviewReason: query.reviewReason });
            },
          },
          ledger: {
            async append(entries) { ledgerEntries.push(...entries); },
            async getBalance(accountId, tokenKind) {
              let available = 0;
              let reserved = 0;
              for (const entry of ledgerEntries.filter((candidate) => candidate.accountId === accountId && candidate.tokenKind === tokenKind)) {
                if (entry.entryKind === 'referral_reward_inviter' || entry.entryKind === 'referral_reward_invitee') available += Number(entry.amount);
                if (entry.entryKind === 'feature_reservation') {
                  available -= Number(entry.amount);
                  reserved += Number(entry.amount);
                }
                if (entry.entryKind === 'reversal' || entry.entryKind === 'expiry') available -= Number(entry.amount);
              }
              return { accountId, tokenKind, available: asTokenAmount(available), reserved: asTokenAmount(reserved), updatedAt: now } as TokenBalance;
            },
            async findEntriesByIdempotencyKey(idempotencyKey) { return ledgerEntries.filter((entry) => entry.idempotencyKey === idempotencyKey); },
          },
          receipts: {
            async create(receipt) { receipts.set(receipt.rewardReceiptId, receipt); },
            async findByRelationshipId(referralRelationshipId) { return [...receipts.values()].find((receipt) => receipt.referralRelationshipId === referralRelationshipId) ?? null; },
            async listForAccount(accountId) {
              const accountRelationships = new Set([...relationships.values()].filter((relationship) => relationship.inviterAccountId === accountId || relationship.inviteeAccountId === accountId).map((relationship) => relationship.referralRelationshipId));
              return [...receipts.values()].filter((receipt) => accountRelationships.has(receipt.referralRelationshipId));
            },
          },
          reservations: {
            async create(reservation) { reservations.set(reservation.entitlementReservationId, reservation); },
            async findById(entitlementReservationId) { return reservations.get(entitlementReservationId) ?? null; },
            async transition(query) {
              const reservation = reservations.get(query.entitlementReservationId);
              if (reservation === undefined || reservation.state !== query.expectedState) return null;
              const updated: EntitlementReservation = {
                ...reservation,
                state: query.nextState,
                ...(query.nextState === 'consumed' ? { consumedAt: query.at } : {}),
                ...(query.nextState === 'released' ? { releasedAt: query.at } : {}),
              };
              reservations.set(updated.entitlementReservationId, updated);
              return updated;
            },
          },
          idempotency: {
            async findReceipt(idempotencyKey) {
              const entry = ledgerEntries.find((candidate) => candidate.idempotencyKey === idempotencyKey);
              return entry?.referralRelationshipId === undefined ? null : [...receipts.values()].find((receipt) => receipt.referralRelationshipId === entry.referralRelationshipId) ?? null;
            },
            async record() {},
          },
        });
      },
    },
  };

  return {
    application: new CommunityRewardsApplication(dependencies),
    state: { links, relationships, ledgerEntries, receipts, reservations, audits, notifications },
    controls: {
      setNow(value) { now = value; },
      setAccess(value) { access = value; },
      setEligibility(value) { eligibility = value; },
      setRateLimited(seconds) { rateLimitedSeconds = seconds; },
      setRisk(value) { risk = value; },
      setTrusted(value) { trusted = value; },
      setFeatureAllowed(value) { featureAllowed = value; },
    },
  };
}

export const communityRewardsTestIds = {
  account: asAccountId,
  campaign: (value: string): CampaignId => value as CampaignId,
  correlation: (value: string): CorrelationId => value as CorrelationId,
  idempotency: (value: string): IdempotencyKey => value as IdempotencyKey,
  amount: asTokenAmount,
};
