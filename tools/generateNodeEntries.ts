import { rm, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KNOWN_SINGULARITY_PROBLEMS } from '../src/model/catalog';
import {
  NODE_ENTRY_SITE_BASE,
  NODE_ENTRY_SITE_ORIGIN,
  renderNodeEntryHtml,
  resolvePublishedNodeEntries,
  staticEntryOutputPath,
} from '../src/nodeEntry/nodeEntryApplication';
import { NODE_ENTRY_MANIFESTS } from '../src/nodeEntry/nodeEntryManifests';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = resolve(projectRoot, 'public');
const nodeOutputRoot = resolve(publicRoot, 'nodes');

async function writeStaticNodeEntries(): Promise<void> {
  const outcomes = resolvePublishedNodeEntries(NODE_ENTRY_MANIFESTS, KNOWN_SINGULARITY_PROBLEMS);
  const invalid = outcomes.filter((outcome) => outcome.kind !== 'rendered');
  if (invalid.length > 0) {
    throw new Error(`Node-entry generation rejected invalid manifest outcomes: ${invalid.map((outcome) => outcome.kind).join(', ')}`);
  }

  await rm(nodeOutputRoot, { recursive: true, force: true });
  await mkdir(nodeOutputRoot, { recursive: true });

  const rendered = outcomes.filter((outcome) => outcome.kind === 'rendered');
  for (const outcome of rendered) {
    const relativePath = staticEntryOutputPath(outcome.entry.slug);
    const outputPath = resolve(publicRoot, relativePath);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, renderNodeEntryHtml(outcome.entry), 'utf8');
  }

  const sitemapUrls = [
    `${NODE_ENTRY_SITE_ORIGIN}${NODE_ENTRY_SITE_BASE}/`,
    ...rendered.map((outcome) => outcome.entry.canonicalUrl),
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}\n</urlset>\n`;
  await writeFile(resolve(publicRoot, 'sitemap.xml'), sitemap, 'utf8');

  console.log(`Generated ${rendered.length} reviewed node entry pages and sitemap.xml.`);
}

await writeStaticNodeEntries();
