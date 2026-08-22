import { describe, expect, it, vi } from 'vitest';
import { getCommunityRewardsClientStatus } from './communityRewardsClient';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('communityRewardsClient', () => {
  it('recognizes only the explicit non-authoritative backend-unconfigured contract', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(503, {
      apiVersion: 'v1',
      kind: 'backend_unconfigured',
      authoritative: false,
      reasonCode: 'MANAGED_IDENTITY_AND_DURABLE_LEDGER_REQUIRED',
      messageKey: 'communityRewards.backend.unconfigured',
    }));

    await expect(getCommunityRewardsClientStatus(fetchImpl)).resolves.toEqual({ kind: 'backend_unconfigured' });
    expect(fetchImpl).toHaveBeenCalledWith('/api/community-rewards/v1/status', expect.objectContaining({
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    }));
  });

  it('treats network failures as unavailable rather than a local referral/token fallback', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new Error('network unavailable'));

    await expect(getCommunityRewardsClientStatus(fetchImpl)).resolves.toEqual({ kind: 'backend_unreachable' });
  });

  it('rejects any malformed or unexpected payload instead of inferring a balance or reward', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(200, { balance: 999_999, awarded: true }));

    await expect(getCommunityRewardsClientStatus(fetchImpl)).resolves.toEqual({ kind: 'invalid_response' });
  });
});
