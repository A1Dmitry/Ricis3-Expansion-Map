import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

type FutureModules = Readonly<{
  domain: unknown;
  application: unknown;
}>;

const futureDomainPath = './passportAccountOwnership.domain';
const futureApplicationPath = './passportAccountOwnership.application';

const loadFutureModules = async (): Promise<FutureModules> => {
  const [domain, application] = await Promise.all([
    import(/* @vite-ignore */ futureDomainPath),
    import(/* @vite-ignore */ futureApplicationPath),
  ]);
  return { domain, application };
};

const readFutureSource = (name: 'domain' | 'application') =>
  readFileSync(resolve(process.cwd(), 'src/passportAccountOwnership', `passportAccountOwnership.${name}.ts`), 'utf8');

const forbiddenFragments = [
  'react',
  'zustand',
  'mapstore',
  'persistence',
  'indexeddb',
  'localstorage',
  'sessionstorage',
  'fetch(',
  'xmlhttprequest',
  'websocket',
  'navigator',
  'window.',
  'document.',
  'clipboard',
  'download',
  'oauth',
  'provider',
  'lean',
  'riciscore',
  'authoritativeproofstatepolicy',
  'savemaptodb',
  'updatenode',
  'updateproof',
  'submitexternalleanproof',
  'acceptverifiedexternalleanproof',
  'prooflatex',
  'currentproof',
  'sourcebytes',
  'leantex',
  'process.env',
  'database',
];

describe('RICIS-PASSPORT-ACCOUNT-OWNERSHIP-01 G3 — topology and no-I/O', () => {
  it.each([
    ['T01', 'domain'],
    ['T02', 'application'],
  ])('%s loads the future local %s module dynamically', async (_id) => {
    const modules = await loadFutureModules();
    expect(modules).toBeDefined();
  });

  it.each(forbiddenFragments.slice(0, 10).map((fragment, index) => [`T${String(index + 3).padStart(2, '0')}`, fragment]))(
    '%s rejects forbidden runtime fragment %s from both future modules',
    async (_id, fragment) => {
      await loadFutureModules();
      expect(readFutureSource('domain').toLowerCase()).not.toContain(fragment);
      expect(readFutureSource('application').toLowerCase()).not.toContain(fragment);
    },
  );
});
