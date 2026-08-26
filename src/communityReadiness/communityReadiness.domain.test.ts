import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { CommunityRewardsClientStatus } from '../services/communityRewardsClient';

type CommunityReadinessKind = 'programme_unconfigured' | 'availability_unreachable' | 'availability_invalid';

type CommunityReadinessProjection = Readonly<{
  kind: CommunityReadinessKind;
  title: string;
  statusLabel: string;
  detail: string;
  invitationStatement: string;
  rewardStatement: string;
  botStatement: string;
  authorityStatement: string;
}>;

interface FutureDomain {
  projectCommunityReadiness(status: CommunityRewardsClientStatus): CommunityReadinessProjection;
}

const futureDomainPath = './communityReadiness.domain';
const future = () => import(/* @vite-ignore */ futureDomainPath) as Promise<FutureDomain>;
const source = () => readFileSync(resolve(process.cwd(), 'src/communityReadiness/communityReadiness.domain.ts'), 'utf8');

async function project(status: CommunityRewardsClientStatus) {
  return (await future()).projectCommunityReadiness(status);
}

describe('COMMUNITY-READINESS-01 G3 — pure readiness projection', () => {
  it('CR01-QA-01: backend_unconfigured отображается как programme_unconfigured', async () => {
    await expect(project({ kind: 'backend_unconfigured' })).resolves.toMatchObject({ kind: 'programme_unconfigured', title: 'Готовность сообщества' });
  });

  it('CR01-QA-02: backend_unconfigured сообщает о защищённой identity', async () => {
    await expect(project({ kind: 'backend_unconfigured' })).resolves.toMatchObject({ detail: expect.stringContaining('защищённая identity') });
  });

  it('CR01-QA-03: backend_unconfigured сообщает о долговечном server ledger', async () => {
    await expect(project({ kind: 'backend_unconfigured' })).resolves.toMatchObject({ detail: expect.stringContaining('долговечный server ledger') });
  });

  it('CR01-QA-04: backend_unconfigured не обещает награду или токены', async () => {
    const result = await project({ kind: 'backend_unconfigured' });
    expect(result.detail).toContain('никаких наград');
    expect(result).toEqual(expect.not.objectContaining({ balance: expect.anything(), tokenAmount: expect.anything() }));
  });

  it('CR01-QA-05: backend_unreachable отображается как availability_unreachable', async () => {
    await expect(project({ kind: 'backend_unreachable' })).resolves.toMatchObject({ kind: 'availability_unreachable' });
  });

  it('CR01-QA-06: transport failure не становится account state', async () => {
    const result = await project({ kind: 'backend_unreachable' });
    expect(result.detail).toContain('не означает наличие');
    expect(result).not.toHaveProperty('accountId');
  });

  it('CR01-QA-07: transport failure не становится reward state', async () => {
    const result = await project({ kind: 'backend_unreachable' });
    expect(result.detail).toContain('наград');
    expect(result).not.toHaveProperty('reward');
  });

  it('CR01-QA-08: transport failure не создаёт positive fallback', async () => {
    await expect(project({ kind: 'backend_unreachable' })).resolves.toMatchObject({ statusLabel: 'Статус программы временно недоступен' });
  });

  it('CR01-QA-09: invalid_response отображается как availability_invalid', async () => {
    await expect(project({ kind: 'invalid_response' })).resolves.toMatchObject({ kind: 'availability_invalid' });
  });

  it('CR01-QA-10: invalid response не интерпретируется как balance', async () => {
    const result = await project({ kind: 'invalid_response' });
    expect(result.detail).toContain('баланс');
    expect(result).not.toHaveProperty('balance');
  });

  it('CR01-QA-11: invalid response не интерпретируется как referral', async () => {
    const result = await project({ kind: 'invalid_response' });
    expect(result.detail).toContain('реферальные данные');
    expect(result).not.toHaveProperty('referralCode');
  });

  it('CR01-QA-12: invalid response не интерпретируется как reward', async () => {
    const result = await project({ kind: 'invalid_response' });
    expect(result.detail).toContain('Никакие награды');
    expect(result).not.toHaveProperty('reward');
  });

  it('CR01-QA-13: каждая проекция раскрывает правила копирования ссылки', async () => {
    for (const status of [{ kind: 'backend_unconfigured' }, { kind: 'backend_unreachable' }, { kind: 'invalid_response' }] as const) {
      expect((await project(status)).invitationStatement).toContain('явному действию');
    }
  });

  it('CR01-QA-14: каждая проекция раскрывает отсутствие reward programme', async () => {
    for (const status of [{ kind: 'backend_unconfigured' }, { kind: 'backend_unreachable' }, { kind: 'invalid_response' }] as const) {
      expect((await project(status)).rewardStatement).toContain('не создаются и не подтверждаются');
    }
  });

  it('CR01-QA-15: каждая проекция раскрывает отсутствие внешнего Telegram-бота', async () => {
    for (const status of [{ kind: 'backend_unconfigured' }, { kind: 'backend_unreachable' }, { kind: 'invalid_response' }] as const) {
      expect((await project(status)).botStatement).toContain('Внешний Telegram-бот не подключён');
    }
  });

  it('CR01-QA-16: каждая проекция раскрывает отсутствие authority effect', async () => {
    for (const status of [{ kind: 'backend_unconfigured' }, { kind: 'backend_unreachable' }, { kind: 'invalid_response' }] as const) {
      expect((await project(status)).authorityStatement).toContain('не изменяет RICIS III v7.7');
    }
  });

  it('CR01-QA-17: pure projector не имеет transport or service dependency', () => {
    const importLines = source().split('\n').filter(line => line.startsWith('import')).join('\n');
    expect(importLines).toBe("import type { CommunityRewardsClientStatus } from '../services/communityRewardsClient';");
    expect(importLines).not.toMatch(/UrlShareService|server\//);
    expect(importLines).not.toMatch(/telegramBot|communityRewardsApplication|ricisCore|Lean/i);
  });

  it('CR01-QA-18: pure projector не содержит reward/account/referral semantics', async () => {
    const result = await project({ kind: 'backend_unconfigured' });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.keys(result).sort()).toEqual([
      'authorityStatement', 'botStatement', 'detail', 'invitationStatement',
      'kind', 'rewardStatement', 'statusLabel', 'title',
    ]);
  });
});
