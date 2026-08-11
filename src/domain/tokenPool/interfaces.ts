/**
 * Domain Interfaces for Token Pool & Key Rotation Engine
 * Follows Dependency Inversion Principle (DIP in SOLID).
 */

import type {
  PooledApiKey,
  UserUsageQuota,
  TokenPoolStats,
  KeyTier,
} from './types';

export interface ITokenPoolService {
  /** Check if client is eligible for execution (1st free query or valid key/pool pass) */
  checkUserQuota(clientIdentifier: string): {
    canExecute: boolean;
    reason?: string;
    isFreeTier: boolean;
    quotaRemaining: number;
  };

  /** Consume a query quota for client */
  recordUserQuery(clientIdentifier: string): UserUsageQuota;

  /** Contribute a user's AI Studio API key to the collective pool ("вскладчину") */
  contributeKey(
    rawKey: string,
    contributorId: string,
    tier?: KeyTier
  ): Promise<{ success: boolean; maskedKey: string; message: string }>;

  /** Get next optimal API key from pool using Weighted Round-Robin + Circuit Breaker */
  getNextActiveKey(): { rawKey: string; maskedKey: string; isDeveloperKey: boolean };

  /** Report success/failure for rate limit fallback and cooldown handling */
  reportKeyExecutionResult(maskedKey: string, success: boolean, isQuotaError?: boolean): void;

  /** Get overall pool statistics */
  getPoolStats(): TokenPoolStats;

  /** List public masked keys summary */
  listMaskedKeys(): Array<{
    maskedKey: string;
    tier: KeyTier;
    successCount: number;
    status: string;
    contributorId: string;
  }>;
}
