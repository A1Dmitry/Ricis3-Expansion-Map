import { describe, expect, it, vi } from 'vitest';

import { createSqliteFirstWorkspaceRepositoryTemplate } from './sqliteFirstWorkspaceRepositoryTemplate';

type TrustedSqliteStorageConfig = Readonly<{
  kind: 'sqlite';
  durableVolumeRef: string;
  databaseFileRef: string;
  commandTimeoutMs: number;
}>;

type WorkspaceRepository = Readonly<{
  identity: 'injected-workspace-repository';
}>;

type TemplateOutcome =
  | Readonly<{ kind: 'ready'; repository: WorkspaceRepository }>
  | Readonly<{ kind: 'invalid_configuration' | 'server_unavailable' }>;

const safeConfig: TrustedSqliteStorageConfig = {
  kind: 'sqlite',
  durableVolumeRef: 'volume:workspace-durable',
  databaseFileRef: 'file:workspace.sqlite',
  commandTimeoutMs: 1_000,
};

function createHarness() {
  const connection = { identity: 'injected-sqlite-connection' as const };
  const repository: WorkspaceRepository = { identity: 'injected-workspace-repository' };
  const open = vi.fn(async (_config: TrustedSqliteStorageConfig) => connection);
  const bindRepository = vi.fn(async (_connection: typeof connection) => repository);

  const template = createSqliteFirstWorkspaceRepositoryTemplate({
    connectionAdapterFactory: { open },
    repositoryAdapterFactory: { bindRepository },
  });

  return { template, connection, repository, open, bindRepository };
}

describe('G3 — SQLite-first workspace repository template contract', () => {
  it('rejects malformed, unsupported or contaminated storage configuration before a connection is opened', async () => {
    const harness = createHarness();

    for (const unsafeConfiguration of [
      null,
      {},
      { ...safeConfig, kind: 'postgres' },
      { ...safeConfig, kind: 'memory' },
      { ...safeConfig, connectionString: 'sqlite:///private/workspace.sqlite' },
      { ...safeConfig, accountId: 'client-forged-account' },
      { ...safeConfig, databaseFileRef: '' },
      { ...safeConfig, commandTimeoutMs: 0 },
    ]) {
      await expect(harness.template.create(unsafeConfiguration)).resolves.toEqual({ kind: 'invalid_configuration' });
    }

    expect(harness.open).not.toHaveBeenCalled();
    expect(harness.bindRepository).not.toHaveBeenCalled();
  });

  it('accepts only the exact trusted SQLite configuration and passes its identity once to the injected connection adapter', async () => {
    const harness = createHarness();

    const outcome = await harness.template.create(safeConfig) as TemplateOutcome;

    expect(outcome).toEqual({ kind: 'ready', repository: harness.repository });
    expect(harness.open).toHaveBeenCalledTimes(1);
    expect(harness.open).toHaveBeenCalledWith(safeConfig);
    expect(harness.open.mock.calls[0]?.[0]).toBe(safeConfig);
    expect(harness.bindRepository).toHaveBeenCalledTimes(1);
    expect(harness.bindRepository).toHaveBeenCalledWith(harness.connection);
    expect(harness.bindRepository.mock.calls[0]?.[0]).toBe(harness.connection);
  });

  it('keeps the injected repository identity unchanged and does not perform a workspace operation during template initialization', async () => {
    const harness = createHarness();

    const outcome = await harness.template.create(safeConfig) as TemplateOutcome;

    expect(outcome).toMatchObject({ kind: 'ready', repository: harness.repository });
    if (outcome.kind === 'ready') expect(outcome.repository).toBe(harness.repository);
    expect(harness.open).toHaveBeenCalledTimes(1);
    expect(harness.bindRepository).toHaveBeenCalledTimes(1);
  });

  it('returns one terminal unavailable outcome when the injected connection adapter fails', async () => {
    const harness = createHarness();
    harness.open.mockRejectedValueOnce(new Error('private SQLite connection unavailable'));

    await expect(harness.template.create(safeConfig)).resolves.toEqual({ kind: 'server_unavailable' });
    expect(harness.open).toHaveBeenCalledTimes(1);
    expect(harness.bindRepository).not.toHaveBeenCalled();
  });

  it('returns one terminal unavailable outcome when repository binding fails and never opens a second connection', async () => {
    const harness = createHarness();
    harness.bindRepository.mockRejectedValueOnce(new Error('private adapter binding unavailable'));

    await expect(harness.template.create(safeConfig)).resolves.toEqual({ kind: 'server_unavailable' });
    expect(harness.open).toHaveBeenCalledTimes(1);
    expect(harness.bindRepository).toHaveBeenCalledTimes(1);
  });

  it('does not expose browser, network, account, proof or connection material in the readiness outcome', async () => {
    const harness = createHarness();

    const outcome = await harness.template.create(safeConfig) as TemplateOutcome;

    expect(JSON.stringify(outcome)).not.toContain('workspace-durable');
    expect(JSON.stringify(outcome)).not.toContain('workspace.sqlite');
    expect(JSON.stringify(outcome)).not.toContain('injected-sqlite-connection');
    expect(JSON.stringify(outcome)).not.toContain('client-forged-account');
  });
});
