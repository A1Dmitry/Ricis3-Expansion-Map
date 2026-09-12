# 8-Hour QA Sprint — Findings So Far

## Baseline

The final Expansion Map gate passed 33 Vitest files and 184 tests, strict TypeScript lint, and production build. The full suite passed identically in three consecutive stress runs. Ricis.Core Release build passed, its regression harness passed 353/353, and `verify_lean_artifacts.py` passed all 6 mandatory artifacts.

## Recursive production tree

The new `tools/recursiveProductionAudit.ts` walks the actual `initialMap` recursively using edge links, declared `dependentIds`, and inverse `dependencyIds`. The current seed contains 31 nodes, 31 reachable nodes, 12 edges, 21 proof records, no orphan nodes and no cyclic groups.

The audit found zero missing node/zone/edge/axiom references, but only 21 of 31 nodes have proof records. All 21 seeded proof records are rejected by the existing `auditProofContent` policy, primarily because their generated LaTeX lacks the required Lean specification reference. One node, `ai-authorship-provenance`, is marked `resolved` without a proof record. The runtime sanitation boundary now demotes every source node lacking an accepted proof to `partial`; the sanitized tree remains 31/31 reachable and has 0 resolved nodes until accepted proof evidence exists. Therefore seeded `resolved` state is not equivalent to verified proof state and must not be presented as formal verification.

## Defect fixed

`DependencyGraphAuditor` previously derived reachability from outgoing edges and `dependentIds`, but ignored persisted inverse references in `dependencyIds`. It now uses recursive DFS with a cycle guard and includes all three representations. A regression test covers a dependency-only child without an edge snapshot.

## Proof verifier defect fixed

`RicisFallbackEngine.verifyProofChain` previously accepted any non-empty sequence of known axiom names, even if steps were malformed, out of order, method-incompatible, or the proof metadata was incomplete. It now checks claim/title/conclusion/steps, O(1) metadata, sequential step numbers, required fields, known axioms, method-specific required axioms, and `isVerified`. Mutation tests cover unknown axiom, method mismatch, and non-sequential steps.

## Trust boundary finding

`RicisWasmBridge.evaluate` correctly never returns a TypeScript mathematical fallback result. However, bridge methods `verifyIdentity`, `generateFormalProof`, `verifyProofChain`, `lambdaToString`, `stringToLambda`, `proveSystem`, and `validateBrackets` still delegate to `_legacyEngine` (`RicisFallbackEngine`). Ricis.Core WebAPI currently exposes health, simplify, derivative, and expression-system endpoints, but no authoritative proof endpoints. This is a remaining architectural gap: proof APIs are not C# Core-backed when called through the application bridge.

## Coverage

Vitest V8 coverage was enabled with `@vitest/coverage-v8@4.1.10`. Final aggregate coverage is 42.58% lines, 37.78% branches, 46.73% functions, and 43.97% statements. This is a measured aggregate, not a claim that every production path is covered. The build still reports a non-failing ineffective dynamic-import warning for `src/model/apiClient.ts` and a bundle-size warning for the main JavaScript chunk; both are recorded as release backlog rather than hidden.
