export type CommunityRewardsClientStatus =
  | { readonly kind: 'backend_unconfigured' }
  | { readonly kind: 'backend_unreachable' }
  | { readonly kind: 'invalid_response' };

interface BackendUnconfiguredPayload {
  readonly apiVersion: 'v1';
  readonly kind: 'backend_unconfigured';
  readonly authoritative: false;
  readonly reasonCode: 'MANAGED_IDENTITY_AND_DURABLE_LEDGER_REQUIRED';
  readonly messageKey: 'communityRewards.backend.unconfigured';
}

function isBackendUnconfiguredPayload(value: unknown): value is BackendUnconfiguredPayload {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return candidate.apiVersion === 'v1' &&
    candidate.kind === 'backend_unconfigured' &&
    candidate.authoritative === false &&
    candidate.reasonCode === 'MANAGED_IDENTITY_AND_DURABLE_LEDGER_REQUIRED' &&
    candidate.messageKey === 'communityRewards.backend.unconfigured';
}

/**
 * Queries only the server availability contract. No endpoint response may be
 * interpreted as a token balance or an invitation reward by this client.
 */
export async function getCommunityRewardsClientStatus(fetchImpl: typeof fetch = fetch): Promise<CommunityRewardsClientStatus> {
  try {
    const response = await fetchImpl('/api/community-rewards/v1/status', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    });
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return { kind: 'invalid_response' };
    }
    if (response.status === 503 && isBackendUnconfiguredPayload(payload)) return { kind: 'backend_unconfigured' };
    return { kind: 'invalid_response' };
  } catch {
    return { kind: 'backend_unreachable' };
  }
}
