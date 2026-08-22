# Node-Led Marketing and Readable Node Focus

**Release:** 0.4.32
**Status:** implemented static-entry and presentation feature.
**Scope:** subject-specific research entry pages for existing catalog nodes and a camera focus policy that keeps a selected node readable and centered for orbiting.

## Product model

RICIS Expansion Map can be discovered through a concrete peripheral problem rather than only through the graph home page. A reviewed static entry page explains one existing catalog node, displays its actual research status and sources, and offers an accessible link into the shared interactive graph with that node selected. The page is not an automatic redirect and is not a claim that the underlying question has been solved.

| Wave 1 entry | Catalog node | URL | Required framing |
|---|---|---|---|
| Hydrodynamic singularities | `real-catalog-38` | `/nodes/physics-hydrodynamic-singularities/` | Research node; not a new physical prediction or formal proof |
| Riemann hypothesis | `real-catalog-3` | `/nodes/number-theory-riemann-hypothesis/` | Open research question; not a proof |
| AI singularity | `real-catalog-57` | `/nodes/agi-intelligence-singularity/` | Hypothesis/research context; not an AGI prediction |
| Blood–brain barrier | `real-catalog-79` | `/nodes/pharmacy-blood-brain-barrier-delivery/` | Research navigation only; not medical advice |

## One source of truth

`src/nodeEntry/nodeEntryManifests.ts` contains reviewed editorial framing, source references and safety notices. `src/model/catalog.ts` remains the authority for node identity, graph state, type, singularity hint and dependencies. `nodeEntryApplication.ts` validates their join and fails closed for missing nodes, draft/review gaps, absent provenance, incompatible trust framing, missing pharmacy notice or duplicate canonicals.

The build script `npm run generate:node-entries` produces reviewed HTML pages under `public/nodes/<slug>/index.html` and a sitemap that contains the root plus self-canonical static pages. `npm run build` always runs this generator before Vite, so generated assets cannot be manually updated out of sync with the manifest.

## SEO and trust boundary

Every published entry contains visible topic content, a self-canonical URL, unique title/description, normal HTML graph CTA, visible sources and `WebPage`/`BreadcrumbList` JSON-LD matching that visible content. The graph handoff uses the existing selected-node URL:

```text
https://a1dmitry.github.io/Ricis3-Expansion-Map/?node=<catalog-node-id>&from=node-entry
```

The page does not mutate the graph, node state, proof state, Core result, Lean evidence, referral relationship or token ledger. It never converts an unresolved node to a solved/proven/verified claim. Pharmacy pages never process patient data or make diagnostic, treatment, dosage, efficacy or safety claims.

## Readable focus behavior

`ReadableNodeFocusPolicy` is a pure TypeScript policy. `Map3D` supplies current geometry and executes only the returned plan through the existing `CameraFlightRig` and `OrbitControls` adapter. The policy derives a focus distance from desktop/mobile floor, node visual radius and context padding. It removes the former hard-coded close-focus distance.

> The selected node is the exact `OrbitControls.target` after the flight. It becomes the center of rotation, while the camera retains enough distance to read the label and see nearby graph context.

If the camera is already too close, the policy moves it outward. Invalid coordinates or radius yield a typed `invalid_focus_geometry` result instead of `NaN`. A zero-length current direction uses a deterministic finite fallback. User wheel, drag and touch retain precedence over an active camera flight.

## Validation

The project tests reviewed manifests, static HTML and sitemap output, safe handoff links, medical/AGI/proof wording boundaries, radius-aware focus distance, exact orbit center, degenerate geometry and removal of the legacy close-focus calculation. Run:

```bash
npm run generate:node-entries
npm test
npm run lint
npm run build
```

## References

[1]: https://developers.google.com/search/docs/fundamentals/creating-helpful-content "Google Search Central: people-first helpful content"
[2]: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics "Google Search Central: JavaScript SEO basics"
[3]: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data "Google Search Central: structured data introduction"
