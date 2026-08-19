# RICIS Expansion Map — 8-Hour QA Baseline

## Scope

The sprint covers the Expansion Map application, its Ricis.Core WebAssembly boundary, the singularity/dependency graph model, proof-trust and Lean validation paths, and the Ricis.Core source/regression suite.

## Baseline status

| Gate | Result |
|---|---:|
| Expansion Map Vitest | 32 test files, 177 tests passed |
| TypeScript strict lint | PASS |
| Expansion Map production build | PASS; release consistency sub-suite: 1 file, 12 tests |
| Ricis.Core Release build | PASS |
| Ricis.Core regression harness | 353/353 passed |

## Initial inventory

The application contains model tests for dependency graphs, logical rules, Lean verification, trace visualization, core rules, access/agent state, and proof-trust UI. It has a WebAssembly Ricis.Core bridge and a legacy fallback implementation in source, which must be checked for reachability and policy compliance. The Ricis.Core repository contains RICIS extension expression nodes, pipeline phases, proof/document generators, typed logs, Lean artifact verification, and the 353-test regression harness.

## QA risk areas

The primary risk areas are recursive graph traversal completeness, duplicate/cyclic dependency handling, singularity payload preservation across WASM/bridge/renderer boundaries, proof-chain node-to-root coverage, generated artifact validity, and accidental fallback execution when the authoritative Ricis.Core runtime is unavailable.
