import type { ProblemNode } from '../model/types';
import type {
  GraphHandoffUrl,
  IGraphHandoffUrlBuilder,
  INodeEntryRouteBuilder,
  NodeEntryBuildOutcome,
  NodeEntryCanonicalUrl,
  NodeEntryCatalogProjection,
  NodeEntryManifest,
  NodeEntryNodeId,
  NodeEntrySafetyNotice,
  NodeEntrySlug,
  NodeEntryViewModel,
} from './contracts';

export const NODE_ENTRY_SITE_ORIGIN = 'https://a1dmitry.github.io';
export const NODE_ENTRY_SITE_BASE = '/Ricis3-Expansion-Map';

const asCanonicalUrl = (value: string) => value as NodeEntryCanonicalUrl;
const asHandoffUrl = (value: string) => value as GraphHandoffUrl;
const asNodeId = (value: string) => value as NodeEntryNodeId;

export const nodeEntryRouteBuilder: INodeEntryRouteBuilder = {
  canonicalUrl: ({ slug }) => asCanonicalUrl(`${NODE_ENTRY_SITE_ORIGIN}${NODE_ENTRY_SITE_BASE}/nodes/${encodeURIComponent(slug)}/`),
};

export const graphHandoffUrlBuilder: IGraphHandoffUrlBuilder = {
  build: ({ nodeId }) => asHandoffUrl(`${NODE_ENTRY_SITE_ORIGIN}${NODE_ENTRY_SITE_BASE}/?node=${encodeURIComponent(nodeId)}&from=node-entry`),
};

export function toCatalogProjection(node: ProblemNode): NodeEntryCatalogProjection {
  return {
    nodeId: asNodeId(node.id),
    title: node.title,
    description: node.description,
    state: node.state,
    type: node.type,
    targetFunction: node.targetFunction,
    ...(node.singularityHint ? { singularityHint: node.singularityHint } : {}),
    dependencyIds: node.dependencyIds.map(asNodeId),
    dependentIds: node.dependentIds.map(asNodeId),
    zoneIds: node.zoneIds,
  };
}

function hasRequiredSafetyNotice(manifest: NodeEntryManifest, notice: NodeEntrySafetyNotice): boolean {
  return manifest.safetyNotices.includes(notice);
}

export function validateNodeEntryManifest(
  manifest: NodeEntryManifest,
  catalogNode: ProblemNode | undefined,
  canonicalUrls: ReadonlySet<string>,
): NodeEntryBuildOutcome {
  if (!catalogNode) return { kind: 'node_not_found', nodeId: manifest.nodeId };
  if (manifest.publicationState !== 'published' || !manifest.review) return { kind: 'entry_not_reviewed' };
  if (manifest.sourceReferences.length === 0) return { kind: 'source_provenance_required' };
  if (manifest.trustFraming === 'research_node_unresolved' && catalogNode.state !== 'unresolved') return { kind: 'trust_framing_conflict' };
  if (manifest.discipline === 'pharmacy' && !hasRequiredSafetyNotice(manifest, 'not_medical_advice')) {
    return { kind: 'medical_safety_notice_required' };
  }

  const canonicalUrl = nodeEntryRouteBuilder.canonicalUrl(manifest);
  if (canonicalUrls.has(canonicalUrl)) return { kind: 'duplicate_canonical' };
  return { kind: 'rendered', entry: mapNodeEntryView(manifest, catalogNode, []) };
}

export function mapNodeEntryView(
  manifest: NodeEntryManifest,
  catalogNode: ProblemNode,
  neighbours: readonly ProblemNode[],
): NodeEntryViewModel {
  return {
    slug: manifest.slug,
    locale: manifest.locale,
    canonicalUrl: nodeEntryRouteBuilder.canonicalUrl(manifest),
    graphHandoffUrl: graphHandoffUrlBuilder.build({ nodeId: manifest.nodeId, source: 'node_entry' }),
    manifest,
    catalogNode: toCatalogProjection(catalogNode),
    neighbours: neighbours.map(toCatalogProjection),
  };
}

export function resolvePublishedNodeEntries(
  manifests: readonly NodeEntryManifest[],
  catalog: readonly ProblemNode[],
): readonly NodeEntryBuildOutcome[] {
  const nodesById = new Map(catalog.map((node) => [node.id, node]));
  const canonicalUrls = new Set<string>();

  return manifests.map((manifest) => {
    const outcome = validateNodeEntryManifest(manifest, nodesById.get(manifest.nodeId), canonicalUrls);
    if (outcome.kind !== 'rendered') return outcome;
    canonicalUrls.add(outcome.entry.canonicalUrl);

    const neighbourIds = new Set([
      ...outcome.entry.catalogNode.dependencyIds,
      ...outcome.entry.catalogNode.dependentIds,
    ]);
    const neighbours = [...neighbourIds]
      .map((nodeId) => nodesById.get(nodeId))
      .filter((node): node is ProblemNode => node !== undefined);
    return { kind: 'rendered' as const, entry: mapNodeEntryView(manifest, nodesById.get(manifest.nodeId)!, neighbours) };
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safetyNoticeText(notice: NodeEntrySafetyNotice): string {
  switch (notice) {
    case 'research_only':
      return 'Исследовательская навигация: страница не является новым научным результатом.';
    case 'not_medical_advice':
      return 'Не является медицинской консультацией, диагностикой, рекомендацией лечения, дозировки, препарата или оценкой безопасности.';
    case 'not_a_formal_proof':
      return 'Не является формальным доказательством и не меняет статус доказательства в RICIS или Lean.';
    case 'hypothesis_not_prediction':
      return 'Гипотеза и исследовательский контекст, а не прогноз появления AGI или подтверждение его достижения.';
  }
}

function stateLabel(state: NodeEntryCatalogProjection['state']): string {
  switch (state) {
    case 'unresolved':
      return 'Не решено в каталоге';
    case 'partial':
      return 'Частичный исследовательский статус';
    case 'resolved':
      return 'Разрешено в каталоге';
  }
}

function htmlList(values: readonly string[], className: string): string {
  if (values.length === 0) return '<p class="muted">Прямые связи в опубликованном каталоге отсутствуют.</p>';
  return `<ul class="${className}">${values.map((value) => `<li>${escapeHtml(value)}</li>`).join('')}</ul>`;
}

export function buildNodeEntryJsonLd(entry: NodeEntryViewModel): Readonly<Record<string, unknown>> {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': entry.canonicalUrl,
        url: entry.canonicalUrl,
        name: entry.manifest.publicTitle,
        description: entry.manifest.searchDescription,
        inLanguage: entry.locale,
        isPartOf: {
          '@type': 'WebSite',
          name: 'RICIS Expansion Map',
          url: `${NODE_ENTRY_SITE_ORIGIN}${NODE_ENTRY_SITE_BASE}/`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'RICIS Expansion Map',
            item: `${NODE_ENTRY_SITE_ORIGIN}${NODE_ENTRY_SITE_BASE}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: entry.manifest.publicTitle,
            item: entry.canonicalUrl,
          },
        ],
      },
    ],
  };
}

/** Static, dependency-free renderer for GitHub Pages node entries. */
export function renderNodeEntryHtml(entry: NodeEntryViewModel): string {
  const jsonLd = JSON.stringify(buildNodeEntryJsonLd(entry)).replaceAll('<', '\\u003c');
  const sources = entry.manifest.sourceReferences
    .map((source) => `<li><a href="${escapeHtml(source.url)}" rel="noopener noreferrer">${escapeHtml(source.title)}</a></li>`)
    .join('');
  const notices = entry.manifest.safetyNotices
    .map((notice) => `<li>${escapeHtml(safetyNoticeText(notice))}</li>`)
    .join('');
  const neighbours = entry.neighbours.map((node) => node.title);
  const dependencies = entry.catalogNode.dependencyIds.map((nodeId) => nodeId.toString());
  const dependents = entry.catalogNode.dependentIds.map((nodeId) => nodeId.toString());

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(entry.manifest.publicTitle)}</title>
  <meta name="description" content="${escapeHtml(entry.manifest.searchDescription)}" />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${escapeHtml(entry.canonicalUrl)}" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="ru_RU" />
  <meta property="og:title" content="${escapeHtml(entry.manifest.publicTitle)}" />
  <meta property="og:description" content="${escapeHtml(entry.manifest.searchDescription)}" />
  <meta property="og:url" content="${escapeHtml(entry.canonicalUrl)}" />
  <meta property="og:image" content="${NODE_ENTRY_SITE_ORIGIN}${NODE_ENTRY_SITE_BASE}/ricis-expansion-map-social-preview.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(entry.manifest.publicTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(entry.manifest.searchDescription)}" />
  <script type="application/ld+json">${jsonLd}</script>
  <style>
    :root { color-scheme: dark; font-family: Inter, system-ui, sans-serif; background: #071019; color: #e6edf8; }
    body { margin: 0; line-height: 1.65; } main { max-width: 880px; margin: 0 auto; padding: 48px 24px 72px; }
    a { color: #7dd3fc; } .eyebrow { color: #67e8f9; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    h1 { line-height: 1.15; font-size: clamp(2rem, 6vw, 3.6rem); margin: .35rem 0 1rem; }
    h2 { margin-top: 2.5rem; } .card { background: #0d1b2a; border: 1px solid #1e3a5f; border-radius: 16px; padding: 20px; margin: 20px 0; }
    .status { color: #fde68a; font-weight: 700; } .muted { color: #a7b8d1; } .cta { display: inline-block; margin-top: 18px; padding: 13px 18px; border-radius: 10px; background: #0e7490; color: white; font-weight: 800; text-decoration: none; }
    .cta:hover { background: #0891b2; } ul { padding-left: 1.25rem; } code { color: #c4b5fd; overflow-wrap: anywhere; }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">RICIS Expansion Map · ${escapeHtml(entry.manifest.discipline)}</p>
    <h1>${escapeHtml(entry.manifest.publicTitle)}</h1>
    <p>${escapeHtml(entry.manifest.searchDescription)}</p>
    <section class="card" aria-labelledby="research-question"><h2 id="research-question">Исследовательский вопрос</h2><p>${escapeHtml(entry.manifest.readerQuestion)}</p></section>
    <section><h2>Контекст узла</h2><p>${escapeHtml(entry.manifest.editorialSummary)}</p><p class="status">Статус: ${escapeHtml(stateLabel(entry.catalogNode.state))}</p><p><strong>Каталожное имя:</strong> ${escapeHtml(entry.catalogNode.title)}</p><p><strong>Сингулярный ориентир:</strong> ${escapeHtml(entry.catalogNode.singularityHint ?? 'Не указан в каталоге.')}</p></section>
    <section class="card"><h2>Границы доверия</h2><ul>${notices}</ul></section>
    <section><h2>Связи в общем графе</h2><div><h3>Прямые зависимости</h3>${htmlList(dependencies, 'connections')}</div><div><h3>Прямые продолжения</h3>${htmlList(dependents, 'connections')}</div><div><h3>Доступные соседние узлы</h3>${htmlList(neighbours, 'connections')}</div><a class="cta" href="${escapeHtml(entry.graphHandoffUrl)}">Открыть этот узел в RICIS graph</a></section>
    <section><h2>Источники</h2><ul>${sources}</ul><p class="muted">Редакционная проверка: ${escapeHtml(entry.manifest.review!.reviewerRole)} · policy ${escapeHtml(entry.manifest.review!.editorialPolicyVersion)}</p></section>
  </main>
</body>
</html>`;
}

export function staticEntryOutputPath(slug: NodeEntrySlug): string {
  return `nodes/${slug}/index.html`;
}
