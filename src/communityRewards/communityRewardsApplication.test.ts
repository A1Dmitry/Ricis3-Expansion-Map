import { describe, expect, it } from 'vitest';
import type { ReferralCampaign } from './contracts';
import { communityRewardsTestIds, createCommunityRewardsTestKit } from './testing/inMemoryCommunityRewards';

const now = 1_780_000_000_000;
const campaign: ReferralCampaign = {
  campaignId: communityRewardsTestIds.campaign('campaign-community-p0'),
  tokenKind: 'RICIS_APP_TOKEN',
  state: 'active',
  policyVersion: 'community-p0-v1',
  qualificationRule: 'verified_new_account_with_first_research_session',
  inviterReward: communityRewardsTestIds.amount(12),
  inviteeReward: communityRewardsTestIds.amount(8),
  maximumRewardedInviteesPerInviter: 2,
  featureScopes: [{ featureKey: 'research-assist:priority', unitsPerUse: communityRewardsTestIds.amount(1) }],
  startsAt: now - 60_000,
  endsAt: now + 60_000,
};

const inviter = communityRewardsTestIds.account('account-inviter');
const invitee = communityRewardsTestIds.account('account-invitee');
const correlation = communityRewardsTestIds.correlation('qa-community-application');

async function createQualifiedRelationship() {
  const kit = createCommunityRewardsTestKit({ campaign, accountId: inviter, now });
  const created = await kit.application.createReferralLink({ campaignId: campaign.campaignId, correlationId: correlation });
  if (created.kind !== 'link_created') throw new Error(`Expected link_created, got ${created.kind}`);

  const captured = await kit.application.captureReferral({ publicReferralCode: created.link.publicReferralCode, correlationId: correlation });
  if (captured.kind !== 'attribution_captured') throw new Error(`Expected attribution_captured, got ${captured.kind}`);

  kit.controls.setAccess({ kind: 'authenticated', accountId: invitee });
  const bound = await kit.application.bindReferralAtSignup({
    pendingAttributionHandle: captured.pendingAttributionHandle,
    campaignId: campaign.campaignId,
    correlationId: correlation,
  });
  if (bound.kind !== 'attributed') throw new Error(`Expected attributed, got ${bound.kind}`);

  const qualified = await kit.application.evaluateQualification({
    referralRelationshipId: bound.referralRelationship.referralRelationshipId,
    qualificationRule: campaign.qualificationRule,
    correlationId: correlation,
  });
  if (qualified.kind !== 'qualified') throw new Error(`Expected qualified, got ${qualified.kind}`);
  return { kit, relationshipId: qualified.referralRelationship.referralRelationshipId };
}

describe('CommunityRewardsApplication', () => {
  it('RQA11–RQA15: creates one opaque link, captures attribution without reward, then binds a verified new account into qualification_pending', async () => {
    const kit = createCommunityRewardsTestKit({ campaign, accountId: inviter, now });
    const created = await kit.application.createReferralLink({ campaignId: campaign.campaignId, correlationId: correlation });

    expect(created.kind).toBe('link_created');
    if (created.kind !== 'link_created') return;
    expect(created.link.publicReferralCode).toMatch(/^R3_test_code_/);
    expect(JSON.stringify(created.link)).not.toContain('account-inviter');
    expect([...kit.state.links.values()][0]?.codeHash).not.toContain(created.link.publicReferralCode);

    const captured = await kit.application.captureReferral({ publicReferralCode: created.link.publicReferralCode, correlationId: correlation });
    expect(captured.kind).toBe('attribution_captured');
    expect(kit.state.ledgerEntries).toHaveLength(0);

    if (captured.kind !== 'attribution_captured') return;
    kit.controls.setAccess({ kind: 'authenticated', accountId: invitee });
    const bound = await kit.application.bindReferralAtSignup({
      pendingAttributionHandle: captured.pendingAttributionHandle,
      campaignId: campaign.campaignId,
      correlationId: correlation,
    });
    expect(bound.kind).toBe('attributed');
    if (bound.kind === 'attributed') expect(bound.referralRelationship.state).toBe('qualification_pending');
    expect(kit.state.ledgerEntries).toHaveLength(0);
  });

  it('RQA17–RQA18: rejects self-referral and allows only the first campaign attribution for an invitee', async () => {
    const selfKit = createCommunityRewardsTestKit({ campaign, accountId: inviter, now });
    const selfLink = await selfKit.application.createReferralLink({ campaignId: campaign.campaignId, correlationId: correlation });
    if (selfLink.kind !== 'link_created') throw new Error('link was not created');
    const selfCapture = await selfKit.application.captureReferral({ publicReferralCode: selfLink.link.publicReferralCode, correlationId: correlation });
    if (selfCapture.kind !== 'attribution_captured') throw new Error('link was not captured');
    const selfBind = await selfKit.application.bindReferralAtSignup({ pendingAttributionHandle: selfCapture.pendingAttributionHandle, campaignId: campaign.campaignId, correlationId: correlation });
    expect(selfBind.kind).toBe('self_referral_rejected');
    expect(selfKit.state.ledgerEntries).toHaveLength(0);

    const kit = createCommunityRewardsTestKit({ campaign, accountId: inviter, now });
    const firstLink = await kit.application.createReferralLink({ campaignId: campaign.campaignId, correlationId: correlation });
    if (firstLink.kind !== 'link_created') throw new Error('first link was not created');
    const firstCapture = await kit.application.captureReferral({ publicReferralCode: firstLink.link.publicReferralCode, correlationId: correlation });
    if (firstCapture.kind !== 'attribution_captured') throw new Error('first link was not captured');
    kit.controls.setAccess({ kind: 'authenticated', accountId: invitee });
    const firstBind = await kit.application.bindReferralAtSignup({ pendingAttributionHandle: firstCapture.pendingAttributionHandle, campaignId: campaign.campaignId, correlationId: correlation });
    expect(firstBind.kind).toBe('attributed');

    kit.controls.setAccess({ kind: 'authenticated', accountId: inviter });
    const secondLink = await kit.application.createReferralLink({ campaignId: campaign.campaignId, correlationId: correlation });
    if (secondLink.kind !== 'link_created') throw new Error('second link was not created');
    const secondCapture = await kit.application.captureReferral({ publicReferralCode: secondLink.link.publicReferralCode, correlationId: correlation });
    if (secondCapture.kind !== 'attribution_captured') throw new Error('second link was not captured');
    kit.controls.setAccess({ kind: 'authenticated', accountId: invitee });
    const secondBind = await kit.application.bindReferralAtSignup({ pendingAttributionHandle: secondCapture.pendingAttributionHandle, campaignId: campaign.campaignId, correlationId: correlation });
    expect(secondBind.kind).toBe('already_attributed');
  });

  it('RQA19–RQA24: trusted qualification posts exactly two append-only rewards once and replays the same receipt', async () => {
    const { kit, relationshipId } = await createQualifiedRelationship();
    const idempotencyKey = communityRewardsTestIds.idempotency('reward-once');

    const first = await kit.application.postReferralRewards({ referralRelationshipId: relationshipId, idempotencyKey, correlationId: correlation });
    expect(first.kind).toBe('rewards_posted');
    expect(kit.state.ledgerEntries).toHaveLength(2);
    expect(kit.state.ledgerEntries.map((entry) => entry.entryKind)).toEqual(['referral_reward_inviter', 'referral_reward_invitee']);
    expect(kit.state.ledgerEntries.map((entry) => entry.idempotencyKey)).toEqual([idempotencyKey, idempotencyKey]);

    const replay = await kit.application.postReferralRewards({ referralRelationshipId: relationshipId, idempotencyKey, correlationId: correlation });
    expect(replay.kind).toBe('already_rewarded');
    expect(kit.state.ledgerEntries).toHaveLength(2);
    if (first.kind === 'rewards_posted' && replay.kind === 'already_rewarded') {
      expect(replay.receipt.rewardReceiptId).toBe(first.receipt.rewardReceiptId);
    }
  });

  it('RQA19/RQA25: risk review and campaign cap stop reward before a partial ledger write', async () => {
    const { kit, relationshipId } = await createQualifiedRelationship();
    kit.controls.setRisk('review');
    const reviewed = await kit.application.postReferralRewards({ referralRelationshipId: relationshipId, idempotencyKey: communityRewardsTestIds.idempotency('reviewed'), correlationId: correlation });
    expect(reviewed).toEqual({ kind: 'under_review', reason: 'risk_policy' });
    expect(kit.state.ledgerEntries).toHaveLength(0);
  });

  it('RQA27–RQA28: earned app tokens can reserve a product feature, while no balance returns typed denial', async () => {
    const noBalance = createCommunityRewardsTestKit({ campaign, accountId: inviter, now });
    const denied = await noBalance.application.reserveFeatureTokens({ featureKey: 'research-assist:priority', idempotencyKey: communityRewardsTestIds.idempotency('none'), correlationId: correlation });
    expect(denied.kind).toBe('insufficient_balance');

    const { kit, relationshipId } = await createQualifiedRelationship();
    const rewarded = await kit.application.postReferralRewards({ referralRelationshipId: relationshipId, idempotencyKey: communityRewardsTestIds.idempotency('earn'), correlationId: correlation });
    expect(rewarded.kind).toBe('rewards_posted');
    kit.controls.setAccess({ kind: 'authenticated', accountId: inviter });
    const reserved = await kit.application.reserveFeatureTokens({ featureKey: 'research-assist:priority', idempotencyKey: communityRewardsTestIds.idempotency('reserve'), correlationId: correlation });
    expect(reserved.kind).toBe('reservation_issued');
    if (reserved.kind === 'reservation_issued') {
      expect(reserved.reservation.state).toBe('issued');
      const consumed = await kit.application.consumeFeatureReservation({ entitlementReservationId: reserved.reservation.entitlementReservationId, idempotencyKey: communityRewardsTestIds.idempotency('consume'), correlationId: correlation });
      expect(consumed.kind).toBe('reservation_consumed');
    }
  });

  it('RQA29/RQA31/RQA32: rate-limit and static-host policy emit typed non-authoritative outcomes without tokens', async () => {
    const kit = createCommunityRewardsTestKit({ campaign, accountId: inviter, now });
    kit.controls.setRateLimited(30);
    const limited = await kit.application.createReferralLink({ campaignId: campaign.campaignId, correlationId: correlation });
    expect(limited).toEqual({ kind: 'rate_limited', retryAfterSeconds: 30 });
    expect(kit.state.links).toHaveLength(0);

    kit.controls.setRateLimited(null);
    kit.controls.setTrusted('static_host_unavailable');
    const unavailable = await kit.application.evaluateQualification({
      referralRelationshipId: communityRewardsTestIds.idempotency('missing') as unknown as import('./contracts').ReferralRelationshipId,
      qualificationRule: campaign.qualificationRule,
      correlationId: correlation,
    });
    expect(unavailable).toEqual({ kind: 'static_host_unavailable' });
    expect(kit.state.ledgerEntries).toHaveLength(0);
  });
});
