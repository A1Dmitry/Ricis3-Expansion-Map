export type SqliteStorageConfig = Readonly<{
  kind: 'sqlite';
  durableVolumeRef: string;
  databaseFileRef: string;
  commandTimeoutMs: number;
}>;

export type SqliteConnectionAdapter = object;

export type WorkspacePersistenceRepository = object;

export interface SqliteConnectionAdapterFactory {
  open(config: SqliteStorageConfig): Promise<SqliteConnectionAdapter>;
}

export interface WorkspacePersistenceRepositoryAdapterFactory {
  bindRepository(connection: SqliteConnectionAdapter): Promise<WorkspacePersistenceRepository>;
}

export type SqliteFirstWorkspaceRepositoryTemplateDependencies = Readonly<{
  connectionAdapterFactory: SqliteConnectionAdapterFactory;
  repositoryAdapterFactory: WorkspacePersistenceRepositoryAdapterFactory;
}>;

export type SqliteFirstWorkspaceRepositoryTemplateOutcome =
  | Readonly<{ kind: 'ready'; repository: WorkspacePersistenceRepository }>
  | Readonly<{ kind: 'invalid_configuration' | 'server_unavailable' }>;

export type SqliteFirstWorkspaceRepositoryTemplate = Readonly<{
  create(input: unknown): Promise<SqliteFirstWorkspaceRepositoryTemplateOutcome>;
}>;

const CONFIGURATION_KEYS = [
  'kind',
  'durableVolumeRef',
  'databaseFileRef',
  'commandTimeoutMs',
] as const;

function readOwnDataField(input: object, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(input, key);
  return descriptor !== undefined && descriptor.enumerable && 'value' in descriptor
    ? descriptor.value
    : undefined;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isExactSqliteStorageConfig(input: unknown): input is SqliteStorageConfig {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return false;

  try {
    const ownKeys = Object.getOwnPropertyNames(input);
    if (ownKeys.length !== CONFIGURATION_KEYS.length) return false;
    if (Object.getOwnPropertySymbols(input).length > 0) return false;
    if (!CONFIGURATION_KEYS.every(key => ownKeys.includes(key))) return false;

    const kind = readOwnDataField(input, 'kind');
    const durableVolumeRef = readOwnDataField(input, 'durableVolumeRef');
    const databaseFileRef = readOwnDataField(input, 'databaseFileRef');
    const commandTimeoutMs = readOwnDataField(input, 'commandTimeoutMs');

    return (
      kind === 'sqlite'
      && isNonEmptyString(durableVolumeRef)
      && isNonEmptyString(databaseFileRef)
      && typeof commandTimeoutMs === 'number'
      && Number.isFinite(commandTimeoutMs)
      && commandTimeoutMs > 0
    );
  } catch {
    return false;
  }
}

export function createSqliteFirstWorkspaceRepositoryTemplate(
  dependencies: SqliteFirstWorkspaceRepositoryTemplateDependencies,
): SqliteFirstWorkspaceRepositoryTemplate {
  return {
    async create(input: unknown): Promise<SqliteFirstWorkspaceRepositoryTemplateOutcome> {
      if (!isExactSqliteStorageConfig(input)) return { kind: 'invalid_configuration' };

      try {
        const connection = await dependencies.connectionAdapterFactory.open(input);
        const repository = await dependencies.repositoryAdapterFactory.bindRepository(connection);
        return { kind: 'ready', repository };
      } catch {
        return { kind: 'server_unavailable' };
      }
    },
  };
}
