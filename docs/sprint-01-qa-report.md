# RICIS Expansion Map — Sprint 1 QA Acceptance Report

**Release candidate:** `0.4.33`  
**Scope:** Roadmap, root-connected scientific-task filter, deep links and node-card CTA.  
**Verdict:** **PASS with non-blocking follow-up items**.

## Scope-to-evidence matrix

| Requirement | Implementation evidence | QA evidence | Status |
|---|---|---|---|
| A separate Roadmap lets a user choose a working path. | `src/ui/RoadmapPage.tsx` provides Explore, Verify, Challenge and Root Goal routes. | Visual desktop inspection at `/?view=roadmap` showed all four cards, question, outcome, example and CTA. | Pass |
| A user can see only tasks structurally connected to a selected root. | `src/model/rootTaskFilter.ts` exposes `getRootConnectedScientificTasks`. | Eight unit scenarios cover direct/reverse relation forms, cycles, disconnected tasks, unknown roots and display labels. | Pass |
| A task and its intermediate graph context remain distinct. | The filter returns only `scientific_task` cards, retaining intermediate nodes exclusively in the rendered path. | Browser check for `core-agi-target` showed `informatics-complexity → ai-authorship-provenance → core-agi-target`; the middle node was not promoted to a task card. | Pass |
| Links preserve Roadmap and root context. | `UrlShareService` supports `view=roadmap` and `root=<id>`; `App` resolves the route. | Seven URL tests pass; browser return cleared Roadmap mode and reopened the map. | Pass |
| The first interaction is explicit. | Desktop/mobile Map3D entry button and node-card `Explore`, `Verify`, `Challenge` actions. | Desktop UI showed the Roadmap action; node actions are type-checked and covered by full regression. | Pass |
| Functional change has a synchronized release identity. | `package.json`, lockfile, runtime version, citation, active evidence documents and JSON-LD updated to `0.4.33`. | `releaseConsistency.test.ts` and `seoAssets.test.ts` pass. | Pass |

## Automated quality gates

| Gate | Result | Notes |
|---|---:|---|
| TypeScript strict check | Pass | `npm run lint` completed without TypeScript errors. |
| Targeted Sprint 1 tests | Pass | 15 tests: root filter and URL navigation. |
| Full regression suite | Pass | 53 test files and 390 tests passed. |
| Release-consistency checks | Pass | Version-aligned documentation, package metadata, lockfile and JSON-LD. |
| Production build | Pass | Vite client build and bundled Node server completed. |
| Diff hygiene | Pass | `git diff --check` completed without whitespace errors. |

## UX and logical QA observations

The Roadmap does not impose a single workflow. It expresses each route as a user question, expected result, concrete example and visible action, which makes the first screen actionable without requiring prior familiarity with the graph. The Root Goal panel deliberately starts in an unfiltered state and asks for one root; it does not merge roots or infer intent silently.

The root traversal is guarded against cycles and supports all three representations already present in persisted map data: `dependencyIds`, `dependentIds` and visual `DependencyEdge`. The returned path is task-to-root, so users can inspect why each task is included. A missing root yields an empty safe result rather than an exception.

## Non-blocking follow-up items

| Item | Risk | Recommended next action |
|---|---|---|
| Runtime differs from declared engine floor. | The local environment uses Node `22.13.0` and npm `10.9.2`, while the project declares Node `>=22.22.2` and npm `>=12.0.2`. The checks passed, but CI/release should use the declared versions. | Run the same gates in the canonical Node 22.22+/npm 12 environment before public deployment. |
| Main client bundle warning. | The minified client chunk is about 1.9 MB (about 528 KB gzip); Vite emits a size warning. | Profile `Map3D`, Three.js and KaTeX, then split a high-cost route such as Roadmap or proof tooling in a later performance sprint. |
| Mobile Roadmap manual test. | Existing mobile map regression passes; this sprint added a responsive Roadmap layout but no device-lab manual sweep. | Validate portrait and landscape interaction on a physical iOS and Android device before broad public promotion. |

> The Sprint 1 implementation is suitable for a controlled BETA demonstration. The remaining items are release-hardening and performance follow-up work, not functional blockers for the implemented user journeys.
