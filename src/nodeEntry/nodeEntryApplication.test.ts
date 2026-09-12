import { describe, expect, it } from 'vitest';
import { KNOWN_SINGULARITY_PROBLEMS } from '../model/catalog';
import {
  buildNodeEntryJsonLd,
  mapNodeEntryView,
  renderNodeEntryHtml,
  resolvePublishedNodeEntries,
  validateNodeEntryManifest,
} from './nodeEntryApplication';
import { NODE_ENTRY_MANIFESTS } from './nodeEntryManifests';

const renderedOutcomes = resolvePublishedNodeEntries(NODE_ENTRY_MANIFESTS, KNOWN_SINGULARITY_PROBLEMS);

function renderedEntries() {
  return renderedOutcomes.filter((outcome) => outcome.kind === 'rendered').map((outcome) => outcome.entry);
}

describe('NodeEntry application and static renderer', () => {
  it('renders exactly the four reviewed Wave 1 entries from real catalog nodes', () => {
    const entries = renderedEntries();
    expect(entries).toHaveLength(4);
    expect(entries.map((entry) => entry.catalogNode.nodeId)).toEqual([
      'real-catalog-38',
      'real-catalog-3',
      'real-catalog-57',
      'real-catalog-79',
    ]);
    expect(entries.every((entry) => entry.catalogNode.state === 'unresolved')).toBe(true);
  });

  it('renders a self-canonical document with visible source content and safe selected-node graph CTA', () => {
    const physics = renderedEntries()[0]!;
    const html = renderNodeEntryHtml(physics);
    expect(html).toContain(`<link rel="canonical" href="${physics.canonicalUrl}" />`);
    expect(html).toContain(`<a class="cta" href="${physics.graphHandoffUrl.replace('&', '&amp;')}">Открыть этот узел в RICIS graph</a>`);
    expect(html).toContain('Clay Mathematics Institute');
    expect(html).toContain('Не является формальным доказательством');
    expect(html).not.toContain('RICIS solves');
    expect(html).not.toContain('proof verified');
  });

  it('uses semantic headings instead of nesting connection lists or fallback paragraphs inside paragraphs', () => {
    const html = renderNodeEntryHtml(renderedEntries()[0]!);
    expect(html).toContain('<h3>Прямые зависимости</h3>');
    expect(html).toContain('<h3>Прямые продолжения</h3>');
    expect(html).toContain('<h3>Доступные соседние узлы</h3>');
    expect(html).not.toContain('<p>Прямые зависимости: <ul');
    expect(html).not.toContain('<p>Прямые продолжения: <ul');
    expect(html).not.toContain('<p>Доступные соседние узлы: <ul');
  });

  it('keeps pharmacy entry research-only and visibly rejects medical advice, diagnosis and treatment claims', () => {
    const pharmacy = renderedEntries().find((entry) => entry.manifest.discipline === 'pharmacy');
    expect(pharmacy).toBeDefined();
    const html = renderNodeEntryHtml(pharmacy!);
    expect(html).toContain('Не является медицинской консультацией');
    expect(html).toContain('не рекомендация лечения');
    expect(html).toContain('не диагностика');
  });

  it('serializes schema only for visible WebPage and BreadcrumbList content on the same canonical route', () => {
    const entry = renderedEntries()[1]!;
    const jsonLd = buildNodeEntryJsonLd(entry);
    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@graph']).toEqual(expect.arrayContaining([
      expect.objectContaining({ '@type': 'WebPage', url: entry.canonicalUrl, name: entry.manifest.publicTitle }),
      expect.objectContaining({ '@type': 'BreadcrumbList' }),
    ]));
    expect(JSON.stringify(jsonLd)).not.toContain('ScholarlyArticle');
    expect(JSON.stringify(jsonLd)).not.toContain('MedicalWebPage');
  });

  it('fails closed for an unreviewed manifest rather than rendering an indexable topic page', () => {
    const manifest = { ...NODE_ENTRY_MANIFESTS[0]!, publicationState: 'draft' as const, review: undefined };
    const catalogNode = KNOWN_SINGULARITY_PROBLEMS.find((node) => node.id === manifest.nodeId);
    expect(validateNodeEntryManifest(manifest, catalogNode, new Set())).toEqual({ kind: 'entry_not_reviewed' });
  });

  it('fails closed when pharmacy editorial framing omits its no-medical-advice notice', () => {
    const manifest = { ...NODE_ENTRY_MANIFESTS[3]!, safetyNotices: ['research_only', 'not_a_formal_proof'] as const };
    const catalogNode = KNOWN_SINGULARITY_PROBLEMS.find((node) => node.id === manifest.nodeId);
    expect(validateNodeEntryManifest(manifest, catalogNode, new Set())).toEqual({ kind: 'medical_safety_notice_required' });
  });

  it('detects duplicate canonical output before static generation', () => {
    const manifest = NODE_ENTRY_MANIFESTS[0]!;
    const catalogNode = KNOWN_SINGULARITY_PROBLEMS.find((node) => node.id === manifest.nodeId)!;
    const first = mapNodeEntryView(manifest, catalogNode, []);
    expect(validateNodeEntryManifest(manifest, catalogNode, new Set([first.canonicalUrl]))).toEqual({ kind: 'duplicate_canonical' });
  });
});
