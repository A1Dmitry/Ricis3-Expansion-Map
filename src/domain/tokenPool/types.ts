/**
 * Domain Types for Shared Token Pool & AI Studio Key Pooling System
 * Adheres to Domain-Driven Design (DDD) & SOLID principles.
 */

export type KeyTier = 'free_tier' | 'paid_payg' | 'subscription_pass' | 'developer_seed';
export type KeyStatus = 'active' | 'cooldown' | 'exhausted' | 'invalid';

export interface PooledApiKey {
  id: string;
  keyHash: string; // Internal identifier
  rawKey: string;  // Encrypted / memory-only key
  maskedKey: string; // e.g., AIStudio_...4a9b
  contributorId: string;
  tier: KeyTier;
  status: KeyStatus;
  weight: number; // Priority weight for round-robin
  successCount: number;
  failCount: number;
  lastUsedTimestamp: number;
  cooldownUntil: number;
  addedAt: number;
  expiresAt?: number;
}

export interface UserUsageQuota {
  clientIdentifier: string; // chatId or API token or IP
  freeQueryUsed: boolean;
  totalQueriesCount: number;
  hasContributedKey: boolean;
  userKeyMasked?: string;
  subscriptionExpiresAt?: number;
  createdAt: number;
}

export interface TokenPoolStats {
  totalActiveKeys: number;
  totalCooldownKeys: number;
  totalQueriesProcessed: number;
  totalContributors: number;
  developerKeysCount: number;
  isPoolHealthy: boolean;
}

export interface ApiSolveRequest {
  targetFunction: string;
  title?: string;
  clientIdentifier: string;
  userProvidedKey?: string;
}

export interface ApiSolveResponse {
  success: boolean;
  nodeId?: string;
  title?: string;
  targetFunction?: string;
  proofLatex?: string;
  keyUsedMasked: string;
  quotaRemaining: number;
  poolHealthStatus: string;
  errorMessage?: string;
}
