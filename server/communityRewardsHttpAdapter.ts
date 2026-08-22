import type express from 'express';

/**
 * Transport boundary for CommunityRewards.
 *
 * The current repository has no managed identity and no durable transactional
 * ledger adapter configured. Therefore this adapter deliberately exposes an
 * honest availability contract rather than accepting browser claims or storing
 * a mutable token balance in process memory/localStorage.
 */
export interface CommunityRewardsRuntimeStatus {
  readonly apiVersion: 'v1';
  readonly kind: 'backend_unconfigured';
  readonly authoritative: false;
  readonly reasonCode: 'MANAGED_IDENTITY_AND_DURABLE_LEDGER_REQUIRED';
  readonly messageKey: 'communityRewards.backend.unconfigured';
}

const unavailableStatus = (): CommunityRewardsRuntimeStatus => ({
  apiVersion: 'v1',
  kind: 'backend_unconfigured',
  authoritative: false,
  reasonCode: 'MANAGED_IDENTITY_AND_DURABLE_LEDGER_REQUIRED',
  messageKey: 'communityRewards.backend.unconfigured',
});

/**
 * Registers the stable route namespace before a production composition is
 * provisioned. Callers receive a typed 503; they never receive demo credits.
 */
export function registerCommunityRewardsUnavailableRoutes(app: express.Express): void {
  app.get('/api/community-rewards/v1/status', (_request, response) => {
    response.status(503).json(unavailableStatus());
  });

  app.use('/api/community-rewards/v1', (_request, response) => {
    response.status(503).json(unavailableStatus());
  });
}
