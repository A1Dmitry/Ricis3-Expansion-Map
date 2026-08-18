import { describe, expect, it } from 'vitest';
import { ricisCoreApiUrl, resolveRicisCoreApiEndpoint } from './coreEndpoint';

describe('production Ricis.Core API endpoint resolver', () => {
  it('keeps the established same-origin proxy when no remote endpoint is configured', () => {
    const endpoint = resolveRicisCoreApiEndpoint(undefined);

    expect(endpoint).toEqual({ baseUrl: '/api/ricis-core', source: 'same_origin' });
    expect(ricisCoreApiUrl(endpoint, 'health')).toBe('/api/ricis-core/health');
  });

  it('normalizes an explicitly configured remote HTTPS Core API endpoint', () => {
    const endpoint = resolveRicisCoreApiEndpoint('https://core.example.test/api/ricis-core///');

    expect(endpoint).toEqual({
      baseUrl: 'https://core.example.test/api/ricis-core',
      source: 'remote',
    });
    expect(ricisCoreApiUrl(endpoint, '/expressions/simplify')).toBe(
      'https://core.example.test/api/ricis-core/expressions/simplify',
    );
  });

  it.each([
    'http://core.example.test/api/ricis-core',
    'https://user:password@core.example.test/api/ricis-core',
    'https://core.example.test/api/ricis-core?token=secret',
    'https://core.example.test/api/ricis-core#fragment',
    'not a URL',
  ])('rejects unsafe or invalid remote configuration: %s', (configuredBase) => {
    const endpoint = resolveRicisCoreApiEndpoint(configuredBase);

    expect(endpoint.source).toBe('invalid_remote');
    expect(endpoint.baseUrl).toBe('');
    expect(endpoint.safeDetail).toContain('absolute HTTPS URL');
    expect(ricisCoreApiUrl(endpoint, 'health')).toBeNull();
  });
});
