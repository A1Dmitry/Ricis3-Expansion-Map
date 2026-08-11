/**
 * Service Layer: Shared Token Pool Manager (Collaborative Key Pool Engine)
 * Implements SOLID, DDD, and DRY principles.
 *
 * Core Logic:
 * 1. Freemium Gatekeeper: Allows 1 free query per clientIdentifier (ChatID / IP / API Token).
 * 2. Key Pooling ("Вскладчину"): Users submit AI Studio keys to unlock shared pool access.
 * 3. Developer Protection: System seed key is isolated and used as final failover.
 * 4. Circuit Breaker & Round-Robin: Automatically rotates keys and puts exhausted keys on cooldown.
 */

import type { ITokenPoolService } from '../../domain/tokenPool/interfaces';
import type {
  PooledApiKey,
  UserUsageQuota,
  TokenPoolStats,
  KeyTier,
} from '../../domain/tokenPool/types';

export class TokenPoolManager implements ITokenPoolService {
  private static instance: TokenPoolManager;

  private keysPool: Map<string, PooledApiKey> = new Map();
  private userQuotas: Map<string, UserUsageQuota> = new Map();
  private developerMasterKey: string = '';
  private currentKeyIndex: number = 0;
  private totalQueriesProcessedCount: number = 0;

  constructor(devMasterKey?: string) {
    this.developerMasterKey = devMasterKey || process.env.GEMINI_API_KEY || '';
    this.initializeSeedKeys();
  }

  public static getInstance(devKey?: string): TokenPoolManager {
    if (!TokenPoolManager.instance) {
      TokenPoolManager.instance = new TokenPoolManager(devKey);
    }
    return TokenPoolManager.instance;
  }

  private initializeSeedKeys(): void {
    if (this.developerMasterKey) {
      const masked = this.maskRawKey(this.developerMasterKey);
      const seedKey: PooledApiKey = {
        id: 'dev-master-key-01',
        keyHash: 'dev-master',
        rawKey: this.developerMasterKey,
        maskedKey: `[DEV_VAULT] ${masked}`,
        contributorId: 'system_developer',
        tier: 'developer_seed',
        status: 'active',
        weight: 10,
        successCount: 0,
        failCount: 0,
        lastUsedTimestamp: 0,
        cooldownUntil: 0,
        addedAt: Date.now(),
      };
      this.keysPool.set(seedKey.maskedKey, seedKey);
    }
  }

  public checkUserQuota(clientIdentifier: string): {
    canExecute: boolean;
    reason?: string;
    isFreeTier: boolean;
    quotaRemaining: number;
  } {
    let quota = this.userQuotas.get(clientIdentifier);

    if (!quota) {
      // New user: grant 1000 free queries
      return {
        canExecute: true,
        isFreeTier: true,
        quotaRemaining: 1000,
      };
    }

    // If user hasn't used their free queries yet
    if (quota.totalQueriesCount < 1000) {
      return {
        canExecute: true,
        isFreeTier: true,
        quotaRemaining: 1000 - quota.totalQueriesCount,
      };
    }

    // Check if user has active pass or contributed key
    if (quota.hasContributedKey) {
      return {
        canExecute: true,
        isFreeTier: false,
        quotaRemaining: 999999, // Unlimited pool access
      };
    }

    if (quota.subscriptionExpiresAt && quota.subscriptionExpiresAt > Date.now()) {
      return {
        canExecute: true,
        isFreeTier: false,
        quotaRemaining: 999999,
      };
    }

    // Free query spent and no key provided
    return {
      canExecute: false,
      reason:
        'Ваш бесплатный лимит (1 запрос) исчерпан. Пополните общий пул "вскладчину" ключом AI Studio (/addkey) или купите подписку для доступа ко всем ключам!',
      isFreeTier: false,
      quotaRemaining: 0,
    };
  }

  public recordUserQuery(clientIdentifier: string): UserUsageQuota {
    let quota = this.userQuotas.get(clientIdentifier);

    if (!quota) {
      quota = {
        clientIdentifier,
        freeQueryUsed: true,
        totalQueriesCount: 1,
        hasContributedKey: false,
        createdAt: Date.now(),
      };
    } else {
      if (!quota.freeQueryUsed) {
        quota.freeQueryUsed = true;
      }
      quota.totalQueriesCount += 1;
    }

    this.userQuotas.set(clientIdentifier, quota);
    this.totalQueriesProcessedCount += 1;
    return quota;
  }

  public async contributeKey(
    rawKey: string,
    contributorId: string,
    tier: KeyTier = 'paid_payg'
  ): Promise<{ success: boolean; maskedKey: string; message: string }> {
    const trimmed = rawKey.trim();
    if (!trimmed || trimmed.length < 15) {
      return {
        success: false,
        maskedKey: '',
        message: 'Некорректный формат API ключа AI Studio. Минимальная длина — 15 символов.',
      };
    }

    const maskedKey = `AIStudio_${this.maskRawKey(trimmed)}`;

    // Check if key already contributed
    if (this.keysPool.has(maskedKey)) {
      // Mark contributor as pool member
      this.grantPoolAccessToUser(contributorId, maskedKey);
      return {
        success: true,
        maskedKey,
        message: 'Ключ уже присутствует в пуле! Доступ к общему пулу активирован.',
      };
    }

    const newKey: PooledApiKey = {
      id: `key-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      keyHash: `hash-${trimmed.slice(-6)}`,
      rawKey: trimmed,
      maskedKey,
      contributorId,
      tier,
      status: 'active',
      weight: tier === 'paid_payg' ? 5 : 2,
      successCount: 0,
      failCount: 0,
      lastUsedTimestamp: Date.now(),
      cooldownUntil: 0,
      addedAt: Date.now(),
    };

    this.keysPool.set(maskedKey, newKey);
    this.grantPoolAccessToUser(contributorId, maskedKey);

    return {
      success: true,
      maskedKey,
      message: `Ключ ${maskedKey} успешно добавлен в общий пул! Вам открыт безлимитный доступ ко всем ключам пула ("вскладчину").`,
    };
  }

  private grantPoolAccessToUser(contributorId: string, userKeyMasked: string): void {
    let quota = this.userQuotas.get(contributorId);
    if (!quota) {
      quota = {
        clientIdentifier: contributorId,
        freeQueryUsed: false,
        totalQueriesCount: 0,
        hasContributedKey: true,
        userKeyMasked,
        createdAt: Date.now(),
      };
    } else {
      quota.hasContributedKey = true;
      quota.userKeyMasked = userKeyMasked;
    }
    this.userQuotas.set(contributorId, quota);
  }

  public getNextActiveKey(): { rawKey: string; maskedKey: string; isDeveloperKey: boolean } {
    const now = Date.now();
    const activeUserKeys: PooledApiKey[] = [];
    let devKey: PooledApiKey | null = null;

    for (const keyObj of this.keysPool.values()) {
      if (keyObj.tier === 'developer_seed') {
        devKey = keyObj;
        continue;
      }
      if (keyObj.status === 'active' && keyObj.cooldownUntil <= now) {
        activeUserKeys.push(keyObj);
      }
    }

    // 1. Prefer active pooled user keys (Round-Robin)
    if (activeUserKeys.length > 0) {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % activeUserKeys.length;
      const selected = activeUserKeys[this.currentKeyIndex];
      selected.lastUsedTimestamp = now;
      return {
        rawKey: selected.rawKey,
        maskedKey: selected.maskedKey,
        isDeveloperKey: false,
      };
    }

    // 2. Fallback to developer master seed key if pool keys are exhausted/empty
    if (devKey && devKey.rawKey) {
      devKey.lastUsedTimestamp = now;
      return {
        rawKey: devKey.rawKey,
        maskedKey: devKey.maskedKey,
        isDeveloperKey: true,
      };
    }

    // 3. Fallback to system environment variable
    const envKey = process.env.GEMINI_API_KEY || '';
    return {
      rawKey: envKey,
      maskedKey: envKey ? `AIStudio_${this.maskRawKey(envKey)}` : 'UNKNOWN_KEY',
      isDeveloperKey: true,
    };
  }

  public reportKeyExecutionResult(
    maskedKey: string,
    success: boolean,
    isQuotaError: boolean = false
  ): void {
    const keyObj = this.keysPool.get(maskedKey);
    if (!keyObj) return;

    if (success) {
      keyObj.successCount += 1;
      keyObj.status = 'active';
    } else {
      keyObj.failCount += 1;
      if (isQuotaError) {
        // Set 60-second cooldown on 429 quota errors
        keyObj.cooldownUntil = Date.now() + 60000;
        keyObj.status = 'cooldown';
      } else if (keyObj.failCount >= 5) {
        keyObj.status = 'exhausted';
      }
    }
  }

  public getPoolStats(): TokenPoolStats {
    const now = Date.now();
    let totalActive = 0;
    let totalCooldown = 0;
    let totalDev = 0;
    const contributorSet = new Set<string>();

    for (const k of this.keysPool.values()) {
      if (k.tier === 'developer_seed') {
        totalDev++;
      } else {
        contributorSet.add(k.contributorId);
        if (k.status === 'active' && k.cooldownUntil <= now) {
          totalActive++;
        } else if (k.cooldownUntil > now) {
          totalCooldown++;
        }
      }
    }

    return {
      totalActiveKeys: totalActive,
      totalCooldownKeys: totalCooldown,
      totalQueriesProcessed: this.totalQueriesProcessedCount,
      totalContributors: contributorSet.size,
      developerKeysCount: totalDev,
      isPoolHealthy: totalActive > 0 || totalDev > 0,
    };
  }

  public listMaskedKeys(): Array<{
    maskedKey: string;
    tier: KeyTier;
    successCount: number;
    status: string;
    contributorId: string;
  }> {
    const list: Array<{
      maskedKey: string;
      tier: KeyTier;
      successCount: number;
      status: string;
      contributorId: string;
    }> = [];

    const now = Date.now();
    for (const k of this.keysPool.values()) {
      // Exclude developer seed key from public list for security & privacy
      if (k.tier === 'developer_seed') continue;

      const currentStatus = k.cooldownUntil > now ? 'cooldown (60s)' : k.status;
      list.push({
        maskedKey: k.maskedKey,
        tier: k.tier,
        successCount: k.successCount,
        status: currentStatus,
        contributorId: k.contributorId.slice(0, 10),
      });
    }

    return list;
  }

  private maskRawKey(key: string): string {
    if (!key || key.length < 8) return '****';
    return `...${key.slice(-6)}`;
  }
}
