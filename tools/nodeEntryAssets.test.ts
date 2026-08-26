// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const site = 'https://a1dmitry.github.io/Ricis3-Expansion-Map';

const entries = [
  ['physics-hydrodynamic-singularities', 'real-catalog-38'],
  ['number-theory-riemann-hypothesis', 'real-catalog-3'],
  ['agi-intelligence-singularity', 'real-catalog-57'],
  ['pharmacy-blood-brain-barrier-delivery', 'real-catalog-79'],
] as const;

describe('node-entry generated public assets', () => {
  it('publishes exactly four reviewed static topic pages with self canonicals, visible graph CTAs and matching schema', async () => {
    for (const [slug, nodeId] of entries) {
      const html = await readFile(resolve(root, 'public', 'nodes', slug, 'index.html'), 'utf8');
      const canonical = `${site}/nodes/${slug}/`;
      expect(html).toContain(`<link rel="canonical" href="${canonical}" />`);
      expect(html).toContain(`href="${site}/?node=${nodeId}&amp;from=node-entry"`);
      expect(html).toContain('application/ld+json');
      expect(html).toContain('BreadcrumbList');
      expect(html).toContain('<h1>');
      expect(html).toContain('Источники');
      expect(html).not.toContain('RICIS solves');
      expect(html).not.toContain('proof verified');
    }
  });

  it('keeps pharmacy entry visibly research-only and without patient-specific medical claims', async () => {
    const html = await readFile(resolve(root, 'public', 'nodes', 'pharmacy-blood-brain-barrier-delivery', 'index.html'), 'utf8');
    expect(html).toContain('Не является медицинской консультацией');
    expect(html).toContain('не диагностика');
    expect(html).toContain('не рекомендация лечения');
    expect(html).not.toContain('назначение пациенту');
  });

  it('lists root plus only self-canonical static entry URLs in sitemap, never graph query handoff URLs', async () => {
    const sitemap = await readFile(resolve(root, 'public', 'sitemap.xml'), 'utf8');
    expect((sitemap.match(/<url>/g) ?? [])).toHaveLength(5);
    expect(sitemap).toContain(`${site}/`);
    for (const [slug] of entries) expect(sitemap).toContain(`${site}/nodes/${slug}/`);
    expect(sitemap).not.toContain('?node=');
  });

  it('keeps Map3D on the unified readable focus policy and removes the legacy fixed close-focus distance', async () => {
    const source = await readFile(resolve(root, 'src', 'ui', 'Map3D.tsx'), 'utf8');
    expect(source).toContain('ReadableNodeFocusPolicy');
    expect(source).toContain('nodeFocusPolicy.plan(focusRequest)');
    expect(source).toContain("triggerFlight(pendingNodeId, 'url_restore')");
    expect(source).toContain("controls.addEventListener('start', cancelFlightForManualInteraction)");
    expect(source).toContain('cancelFlightForManualInteraction();');
    expect(source).not.toContain('const distance = 15');
    expect(source).not.toContain('// Closer zoom');
  });
});
