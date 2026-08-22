import type {
  AccountId,
  BindReferralAtSignupCommand,
  BindReferralAtSignupOutcome,
  CaptureReferralCommand,
  CaptureReferralOutcome,
  CommunityRewardsDependencies,
  CreateReferralLinkCommand,
  CreateReferralLinkOutcome,
  EntitlementReservation,
  EvaluateQualificationCommand,
  EvaluateQualificationOutcome,
  GetRewardsDashboardOutcome,
  ICommunityRewardsUseCase,
  LedgerEntry,
  PostReferralRewardsCommand,
  PostReferralRewardsOutcome,
  ReferralCampaign,
  ReferralLink,
  ReferralRelationship,
  ReferralRelationshipStatusView,
  ReserveFeatureTokensCommand,
  ReserveFeatureTokensOutcome,
  ConsumeFeatureReservationCommand,
  ConsumeFeatureReservationOutcome,
  RevokeReferralLinkCommand,
  RevokeReferralLinkOutcome,
  RewardReceipt,
  TokenAmount,
} from './contracts';

const DEFAULT_FEATURE_KEY = 'research-assist:priority';

function isCampaignActive(campaign: ReferralCampaign, now: number): boolean {
  return campaign.state === 'active' && campaign.startsAt <= now && now < campaign.endsAt;
}

function asTokenAmount(value: number): TokenAmount {
  return value as TokenAmount;
}

function relationshipStatusView(relationship: ReferralRelationship): ReferralRelationshipStatusView {
  return {
    referralRelationshipId: relationship.referralRelationshipId,
    state: relationship.state,
    capturedAt: relationship.capturedAt,
    ...(relationship.rewardedAt === undefined ? {} : { rewardedAt: relationship.rewardedAt }),
  };
}

/**
 * The sole orchestrator for CommunityRewards commands.
 *
 * It deliberately depends on ports only. Adapters choose identity, storage,
 * secure code generation, risk review, audit delivery and notification delivery.
 */
export class CommunityRewardsApplication implements ICommunityRewardsUseCase {
  public constructor(private readonly dependencies: CommunityRewardsDependencies) {}

  public async createReferralLink(command: CreateReferralLinkCommand): Promise<CreateReferralLinkOutcome> {
    const access = await this.dependencies.identityAccess.currentAccess({ action: 'create_referral_link', correlationId: command.correlationId });
    if (access.kind !== 'authenticated') return { kind: 'requires_authentication' };

    const limit = await this.dependencies.rateLimit.decide({
      action: 'create_link',
      subjectKey: access.accountId,
      correlationId: command.correlationId,
    });
    if (limit.kind === 'rate_limited') return limit;

    const now = this.dependencies.time.now();
    const campaign = await this.dependencies.unitOfWork.run((repositories) => repositories.campaigns.findById(command.campaignId));
    if (campaign === null || !isCampaignActive(campaign, now)) {
      return { kind: 'campaign_inactive', state: campaign?.state ?? 'ended' };
    }

    const issued = await this.dependencies.referralCodes.issue({ campaignId: campaign.campaignId, inviterAccountId: access.accountId });
    const link: ReferralLink = {
      referralLinkId: this.dependencies.identifiers.referralLinkId(),
      campaignId: campaign.campaignId,
      inviterAccountId: access.accountId,
      codeHash: issued.codeHash,
      state: 'active',
      createdAt: now,
      expiresAt: campaign.endsAt,
    };

    await this.dependencies.unitOfWork.run(async (repositories) => {
      await repositories.referrals.revokeActiveLinksForInviter({
        campaignId: campaign.campaignId,
        inviterAccountId: access.accountId,
        at: now,
      });
      await repositories.referrals.createLink(link);
    });
    await this.audit({
      type: 'referral_link_created',
      actorAccountId: access.accountId,
      campaignId: campaign.campaignId,
      correlationId: command.correlationId,
      at: now,
      outcome: 'allowed',
    });

    return {
      kind: 'link_created',
      link: {
        referralLinkId: link.referralLinkId,
        publicReferralCode: issued.publicReferralCode,
        state: link.state,
        expiresAt: link.expiresAt,
      },
    };
  }

  public async captureReferral(command: CaptureReferralCommand): Promise<CaptureReferralOutcome> {
    const limit = await this.dependencies.rateLimit.decide({
      action: 'capture_referral',
      subjectKey: `code:${command.publicReferralCode}`,
      correlationId: command.correlationId,
    });
    if (limit.kind === 'rate_limited') return limit;

    const now = this.dependencies.time.now();
    const codeHash = await this.dependencies.referralCodes.hash({ publicReferralCode: command.publicReferralCode });
    const found = await this.dependencies.unitOfWork.run((repositories) => repositories.referrals.findLinkByCodeHash(codeHash));
    if (found === null || !await this.dependencies.referralCodes.verify({ publicReferralCode: command.publicReferralCode, codeHash: found.codeHash })) {
      return { kind: 'referral_invalid' };
    }
    if (found.state !== 'active' || found.expiresAt <= now) return { kind: 'referral_expired' };

    const campaign = await this.dependencies.unitOfWork.run((repositories) => repositories.campaigns.findById(found.campaignId));
    if (campaign === null || !isCampaignActive(campaign, now)) {
      return { kind: 'campaign_inactive', state: campaign?.state ?? 'ended' };
    }

    const relationship: ReferralRelationship = {
      referralRelationshipId: this.dependencies.identifiers.referralRelationshipId(),
      campaignId: campaign.campaignId,
      referralLinkId: found.referralLinkId,
      inviterAccountId: found.inviterAccountId,
      state: 'captured',
      capturedAt: now,
    };
    const pendingAttributionHandle = await this.dependencies.unitOfWork.run((repositories) => repositories.referrals.createCapturedRelationship(relationship));
    await this.audit({
      type: 'referral_captured',
      campaignId: campaign.campaignId,
      referralRelationshipId: relationship.referralRelationshipId,
      correlationId: command.correlationId,
      at: now,
      outcome: 'allowed',
    });

    return { kind: 'attribution_captured', pendingAttributionHandle, campaignId: campaign.campaignId, expiresAt: found.expiresAt };
  }

  public async bindReferralAtSignup(command: BindReferralAtSignupCommand): Promise<BindReferralAtSignupOutcome> {
    const access = await this.dependencies.identityAccess.currentAccess({ action: 'bind_referral_at_signup', correlationId: command.correlationId });
    if (access.kind !== 'authenticated') return { kind: 'requires_authentication' };

    const limit = await this.dependencies.rateLimit.decide({
      action: 'bind_referral',
      subjectKey: access.accountId,
      correlationId: command.correlationId,
    });
    if (limit.kind === 'rate_limited') return limit;

    const now = this.dependencies.time.now();
    const result = await this.dependencies.unitOfWork.run(async (repositories) => {
      const existing = await repositories.referrals.findRelationshipForInvitee({ campaignId: command.campaignId, inviteeAccountId: access.accountId });
      if (existing !== null) return { kind: 'already_attributed' } as const;

      const consumed = await repositories.referrals.consumePendingAttribution({
        pendingAttributionHandle: command.pendingAttributionHandle,
        inviteeAccountId: access.accountId,
        at: now,
      });
      if (consumed.kind !== 'captured' || consumed.relationship.campaignId !== command.campaignId) return { kind: 'referral_invalid' } as const;

      const campaign = await repositories.campaigns.findById(command.campaignId);
      if (campaign === null || !isCampaignActive(campaign, now)) return { kind: 'campaign_inactive', state: campaign?.state ?? 'ended' } as const;

      if (consumed.relationship.inviterAccountId === access.accountId) {
        await repositories.referrals.transitionRelationship({
          referralRelationshipId: consumed.relationship.referralRelationshipId,
          expectedState: 'captured',
          nextState: 'rejected',
          rejectionReason: 'self_referral',
          at: now,
        });
        return { kind: 'self_referral_rejected' } as const;
      }

      const eligibility = await this.dependencies.identityAccess.accountEligibility({ accountId: access.accountId, campaignId: command.campaignId });
      if (eligibility.kind !== 'eligible_new_account') return { kind: 'account_not_eligible' } as const;

      const risk = await this.dependencies.riskReview.decide({
        action: 'bind_referral',
        campaignId: command.campaignId,
        inviterAccountId: consumed.relationship.inviterAccountId,
        inviteeAccountId: access.accountId,
        correlationId: command.correlationId,
      });
      if (risk.kind !== 'allow') {
        await repositories.referrals.transitionRelationship({
          referralRelationshipId: consumed.relationship.referralRelationshipId,
          expectedState: 'captured',
          nextState: 'under_review',
          reviewReason: risk.kind === 'review' ? risk.reason : 'risk_policy',
          at: now,
        });
        return { kind: 'under_review', reason: risk.kind === 'review' ? risk.reason : 'risk_policy' } as const;
      }

      const attributed = await repositories.referrals.transitionRelationship({
        referralRelationshipId: consumed.relationship.referralRelationshipId,
        expectedState: 'captured',
        nextState: 'attributed',
        at: now,
      });
      if (attributed === null) return { kind: 'referral_invalid' } as const;
      const pending = await repositories.referrals.transitionRelationship({
        referralRelationshipId: attributed.referralRelationshipId,
        expectedState: 'attributed',
        nextState: 'qualification_pending',
        at: now,
      });
      return pending === null ? { kind: 'referral_invalid' } as const : { kind: 'attributed', referralRelationship: pending } as const;
    });

    await this.audit({
      type: result.kind === 'attributed' ? 'referral_attributed' : 'community_rewards_denied',
      actorAccountId: access.accountId,
      campaignId: command.campaignId,
      correlationId: command.correlationId,
      at: now,
      outcome: result.kind === 'attributed' ? 'allowed' : 'denied',
      ...(result.kind === 'attributed' ? { referralRelationshipId: result.referralRelationship.referralRelationshipId } : { reasonCode: result.kind }),
    });
    return result;
  }

  public async evaluateQualification(command: EvaluateQualificationCommand): Promise<EvaluateQualificationOutcome> {
    const trusted = await this.dependencies.trustedAutomation.authorize({ operation: 'evaluate_qualification', correlationId: command.correlationId });
    if (trusted.kind === 'static_host_unavailable') return { kind: 'static_host_unavailable' };
    if (trusted.kind !== 'allowed') return { kind: 'relationship_not_found' };

    const now = this.dependencies.time.now();
    const result = await this.dependencies.unitOfWork.run(async (repositories) => {
      const relationship = await repositories.referrals.findRelationshipById(command.referralRelationshipId);
      if (relationship === null || relationship.inviteeAccountId === undefined) return { kind: 'relationship_not_found' } as const;
      if (relationship.state === 'qualified' || relationship.state === 'rewarded') return { kind: 'qualified', referralRelationship: relationship } as const;
      if (relationship.state !== 'qualification_pending') return { kind: 'qualification_pending', referralRelationship: relationship } as const;

      const campaign = await repositories.campaigns.findById(relationship.campaignId);
      if (campaign === null || campaign.qualificationRule !== command.qualificationRule) return { kind: 'qualification_pending', referralRelationship: relationship } as const;
      const risk = await this.dependencies.riskReview.decide({
        action: 'qualify_referral',
        campaignId: relationship.campaignId,
        inviterAccountId: relationship.inviterAccountId,
        inviteeAccountId: relationship.inviteeAccountId,
        correlationId: command.correlationId,
      });
      if (risk.kind !== 'allow') {
        await repositories.referrals.transitionRelationship({
          referralRelationshipId: relationship.referralRelationshipId,
          expectedState: 'qualification_pending',
          nextState: 'under_review',
          reviewReason: risk.kind === 'review' ? risk.reason : 'risk_policy',
          at: now,
        });
        return { kind: 'under_review', reason: risk.kind === 'review' ? risk.reason : 'risk_policy' } as const;
      }
      const qualified = await repositories.referrals.transitionRelationship({
        referralRelationshipId: relationship.referralRelationshipId,
        expectedState: 'qualification_pending',
        nextState: 'qualified',
        at: now,
      });
      return qualified === null ? { kind: 'qualification_pending', referralRelationship: relationship } as const : { kind: 'qualified', referralRelationship: qualified } as const;
    });

    await this.audit({
      type: 'referral_qualification_changed',
      referralRelationshipId: command.referralRelationshipId,
      correlationId: command.correlationId,
      at: now,
      outcome: result.kind === 'qualified' ? 'allowed' : result.kind === 'under_review' ? 'deferred' : 'denied',
      ...(result.kind === 'under_review' ? { reasonCode: result.reason } : {}),
    });
    return result;
  }

  public async postReferralRewards(command: PostReferralRewardsCommand): Promise<PostReferralRewardsOutcome> {
    const trusted = await this.dependencies.trustedAutomation.authorize({ operation: 'post_referral_rewards', correlationId: command.correlationId });
    if (trusted.kind === 'static_host_unavailable') return { kind: 'static_host_unavailable' };
    if (trusted.kind !== 'allowed') return { kind: 'relationship_not_found' };

    const now = this.dependencies.time.now();
    const outcome = await this.dependencies.unitOfWork.run(async (repositories) => {
      const replay = await repositories.idempotency.findReceipt(command.idempotencyKey);
      if (replay !== null) return { kind: 'already_rewarded', receipt: replay } as const;
      const relationship = await repositories.referrals.findRelationshipById(command.referralRelationshipId);
      if (relationship === null || relationship.inviteeAccountId === undefined) return { kind: 'relationship_not_found' } as const;
      const existingReceipt = await repositories.receipts.findByRelationshipId(relationship.referralRelationshipId);
      if (existingReceipt !== null) return { kind: 'already_rewarded', receipt: existingReceipt } as const;
      if (relationship.state !== 'qualified') {
        return relationship.state === 'under_review'
          ? { kind: 'under_review', reason: relationship.reviewReason ?? 'risk_policy' } as const
          : { kind: 'qualification_pending' } as const;
      }

      const campaign = await repositories.campaigns.findById(relationship.campaignId);
      if (campaign === null || !isCampaignActive(campaign, now)) return { kind: 'campaign_cap_reached' } as const;
      const rewardedCount = await repositories.referrals.countRewardedInvitees({ campaignId: campaign.campaignId, inviterAccountId: relationship.inviterAccountId });
      if (rewardedCount >= campaign.maximumRewardedInviteesPerInviter) return { kind: 'campaign_cap_reached' } as const;

      const risk = await this.dependencies.riskReview.decide({
        action: 'post_rewards',
        campaignId: campaign.campaignId,
        inviterAccountId: relationship.inviterAccountId,
        inviteeAccountId: relationship.inviteeAccountId,
        correlationId: command.correlationId,
      });
      if (risk.kind !== 'allow') return { kind: 'under_review', reason: risk.kind === 'review' ? risk.reason : 'risk_policy' } as const;

      const inviterEntry: LedgerEntry = {
        ledgerEntryId: this.dependencies.identifiers.ledgerEntryId(),
        accountId: relationship.inviterAccountId,
        tokenKind: campaign.tokenKind,
        entryKind: 'referral_reward_inviter',
        amount: campaign.inviterReward,
        campaignId: campaign.campaignId,
        referralRelationshipId: relationship.referralRelationshipId,
        idempotencyKey: command.idempotencyKey,
        policyVersion: campaign.policyVersion,
        occurredAt: now,
        correlationId: command.correlationId,
        reasonCode: 'referral_qualified',
      };
      const inviteeEntry: LedgerEntry = {
        ledgerEntryId: this.dependencies.identifiers.ledgerEntryId(),
        accountId: relationship.inviteeAccountId,
        tokenKind: campaign.tokenKind,
        entryKind: 'referral_reward_invitee',
        amount: campaign.inviteeReward,
        campaignId: campaign.campaignId,
        referralRelationshipId: relationship.referralRelationshipId,
        idempotencyKey: command.idempotencyKey,
        policyVersion: campaign.policyVersion,
        occurredAt: now,
        correlationId: command.correlationId,
        reasonCode: 'referral_qualified',
      };
      const receipt: RewardReceipt = {
        rewardReceiptId: this.dependencies.identifiers.rewardReceiptId(),
        campaignId: campaign.campaignId,
        referralRelationshipId: relationship.referralRelationshipId,
        inviterLedgerEntryId: inviterEntry.ledgerEntryId,
        inviteeLedgerEntryId: inviteeEntry.ledgerEntryId,
        issuedAt: now,
        policyVersion: campaign.policyVersion,
      };
      const rewarded = await repositories.referrals.transitionRelationship({
        referralRelationshipId: relationship.referralRelationshipId,
        expectedState: 'qualified',
        nextState: 'rewarded',
        at: now,
      });
      if (rewarded === null) return { kind: 'qualification_pending' } as const;
      await repositories.ledger.append([inviterEntry, inviteeEntry]);
      await repositories.receipts.create(receipt);
      await repositories.idempotency.record({ idempotencyKey: command.idempotencyKey, operation: 'post_referral_rewards', correlationId: command.correlationId, recordedAt: now });
      return { kind: 'rewards_posted', receipt } as const;
    });

    if (outcome.kind === 'rewards_posted') {
      const inviteeAccountId = await this.findInvitee(outcome.receipt.referralRelationshipId);
      if (inviteeAccountId !== null) {
        await this.dependencies.notificationOutbox.enqueue({
          kind: 'reward_receipt_issued',
          accountId: inviteeAccountId,
          rewardReceiptId: outcome.receipt.rewardReceiptId,
          correlationId: command.correlationId,
        });
      }
    }
    await this.audit({
      type: outcome.kind === 'rewards_posted' ? 'referral_rewards_posted' : 'community_rewards_denied',
      referralRelationshipId: command.referralRelationshipId,
      correlationId: command.correlationId,
      at: now,
      outcome: outcome.kind === 'rewards_posted' || outcome.kind === 'already_rewarded' ? 'allowed' : outcome.kind === 'under_review' ? 'deferred' : 'denied',
      ...(outcome.kind === 'under_review' ? { reasonCode: outcome.reason } : {}),
    });
    return outcome;
  }

  public async getRewardsDashboard(correlationId: Parameters<ICommunityRewardsUseCase['getRewardsDashboard']>[0]): Promise<GetRewardsDashboardOutcome> {
    const access = await this.dependencies.identityAccess.currentAccess({ action: 'get_rewards_dashboard', correlationId });
    if (access.kind !== 'authenticated') return { kind: 'requires_authentication' };
    const now = this.dependencies.time.now();
    const dashboard = await this.dependencies.unitOfWork.run(async (repositories) => {
      const balance = await repositories.ledger.getBalance(access.accountId, 'RICIS_APP_TOKEN');
      const campaign = await repositories.campaigns.findActiveForFeature(DEFAULT_FEATURE_KEY, now);
      if (campaign === null) return { balance, activeLinks: [], invitedRelationshipStatuses: [], receipts: [] };
      const active = await repositories.referrals.findActiveLinkForInviter({ campaignId: campaign.campaignId, inviterAccountId: access.accountId, at: now });
      const relationships = await repositories.referrals.listRelationshipsForInviter({ campaignId: campaign.campaignId, inviterAccountId: access.accountId });
      return {
        balance,
        activeLinks: active === null ? [] : [{ referralLinkId: active.referralLinkId, publicReferralCode: '' as never, state: active.state, expiresAt: active.expiresAt }],
        invitedRelationshipStatuses: relationships.map(relationshipStatusView),
        receipts: await repositories.receipts.listForAccount(access.accountId),
      };
    });
    return { kind: 'dashboard', dashboard };
  }

  public async reserveFeatureTokens(command: ReserveFeatureTokensCommand): Promise<ReserveFeatureTokensOutcome> {
    const access = await this.dependencies.identityAccess.currentAccess({ action: 'reserve_feature_tokens', correlationId: command.correlationId });
    if (access.kind !== 'authenticated') return { kind: 'requires_authentication' };
    const feature = await this.dependencies.featureEntitlement.canUseFeature({ accountId: access.accountId, featureKey: command.featureKey, correlationId: command.correlationId });
    if (feature.kind !== 'allowed') return feature;

    const now = this.dependencies.time.now();
    return this.dependencies.unitOfWork.run(async (repositories) => {
      const existing = await repositories.idempotency.findReceipt(command.idempotencyKey);
      if (existing !== null) return { kind: 'feature_not_eligible' } as const;
      const campaign = await repositories.campaigns.findActiveForFeature(command.featureKey, now);
      if (campaign === null) return { kind: 'feature_not_eligible' } as const;
      const scope = campaign.featureScopes.find((candidate) => candidate.featureKey === command.featureKey);
      if (scope === undefined) return { kind: 'feature_not_eligible' } as const;
      const balance = await repositories.ledger.getBalance(access.accountId, campaign.tokenKind);
      if (Number(balance.available) < Number(scope.unitsPerUse)) return { kind: 'insufficient_balance' } as const;
      const reservation: EntitlementReservation = {
        entitlementReservationId: this.dependencies.identifiers.entitlementReservationId(),
        accountId: access.accountId,
        featureKey: command.featureKey,
        tokenKind: campaign.tokenKind,
        amount: scope.unitsPerUse,
        state: 'issued',
        idempotencyKey: command.idempotencyKey,
        issuedAt: now,
        expiresAt: now + 300_000,
      };
      await repositories.reservations.create(reservation);
      await repositories.ledger.append([{
        ledgerEntryId: this.dependencies.identifiers.ledgerEntryId(),
        accountId: access.accountId,
        tokenKind: campaign.tokenKind,
        entryKind: 'feature_reservation',
        amount: reservation.amount,
        campaignId: campaign.campaignId,
        entitlementReservationId: reservation.entitlementReservationId,
        idempotencyKey: command.idempotencyKey,
        policyVersion: campaign.policyVersion,
        occurredAt: now,
        correlationId: command.correlationId,
        reasonCode: 'feature_reservation',
      }]);
      return { kind: 'reservation_issued', reservation } as const;
    });
  }

  public async consumeFeatureReservation(command: ConsumeFeatureReservationCommand): Promise<ConsumeFeatureReservationOutcome> {
    const now = this.dependencies.time.now();
    return this.dependencies.unitOfWork.run(async (repositories) => {
      const reservation = await repositories.reservations.findById(command.entitlementReservationId);
      if (reservation === null) return { kind: 'reservation_not_found' } as const;
      if (reservation.state === 'consumed') return { kind: 'reservation_already_consumed', reservation } as const;
      if (reservation.expiresAt <= now || reservation.state === 'expired') return { kind: 'reservation_expired' } as const;
      if (reservation.state !== 'issued') return { kind: 'reservation_not_found' } as const;
      const consumed = await repositories.reservations.transition({
        entitlementReservationId: reservation.entitlementReservationId,
        expectedState: 'issued',
        nextState: 'consumed',
        at: now,
      });
      return consumed === null ? { kind: 'reservation_not_found' } as const : { kind: 'reservation_consumed', reservation: consumed } as const;
    });
  }

  public async revokeReferralLink(command: RevokeReferralLinkCommand): Promise<RevokeReferralLinkOutcome> {
    const access = await this.dependencies.identityAccess.currentAccess({ action: 'revoke_referral_link', correlationId: command.correlationId });
    if (access.kind !== 'authenticated') return { kind: 'requires_authentication' };
    const fresh = await this.dependencies.identityAccess.requireFreshAuthentication({ accountId: access.accountId, action: 'revoke_referral_link', correlationId: command.correlationId });
    if (fresh.kind !== 'authenticated') return fresh.kind === 'fresh_auth_required' ? { kind: 'fresh_auth_required' } : { kind: 'requires_authentication' };
    const now = this.dependencies.time.now();
    const result = await this.dependencies.unitOfWork.run((repositories) => repositories.referrals.revokeLink({ referralLinkId: command.referralLinkId, actorAccountId: access.accountId, at: now }));
    if (result !== 'revoked') return { kind: 'link_not_owned' };
    await this.audit({ type: 'referral_link_revoked', actorAccountId: access.accountId, correlationId: command.correlationId, at: now, outcome: 'allowed' });
    return { kind: 'link_revoked', referralLinkId: command.referralLinkId };
  }

  private async findInvitee(referralRelationshipId: ReferralRelationship['referralRelationshipId']): Promise<AccountId | null> {
    return this.dependencies.unitOfWork.run(async (repositories) => {
      const relationship = await repositories.referrals.findRelationshipById(referralRelationshipId);
      return relationship?.inviteeAccountId ?? null;
    });
  }

  private async audit(event: Parameters<CommunityRewardsDependencies['audit']['append']>[0]): Promise<void> {
    await this.dependencies.audit.append(event);
  }
}
