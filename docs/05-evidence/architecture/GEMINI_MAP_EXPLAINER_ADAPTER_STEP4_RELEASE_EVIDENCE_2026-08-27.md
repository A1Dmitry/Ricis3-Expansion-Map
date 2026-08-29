# Gemini Map Explainer Adapter — Step 4 Release Evidence

**Date:** 2026-08-27  
**Branch:** `p1/gemini-map-explainer-adapter`  
**Base:** `main` at merge `2223f4b`

## Scope

This increment adds the first real Gemini transport adapter behind the existing `AbstractMapNodeExplainerProvider` contract. The adapter is server-runtime-only and disabled by configuration when `GEMINI_API_KEY` is absent. It does not replace the legacy proof-generation route, alter graph state, promote proof status, call Lean/Core, or reinterpret external output as an authoritative RICIS result.

The shared base remains responsible for request validation, deadline and cancellation checks, bounded worker-pool submission, finite retry policy, output-size validation, typed availability mapping, read-only classification and non-proof provenance. The concrete Gemini class owns only configuration availability and provider transport. The transport uses JSON-only output and rejects malformed, out-of-scope or non-object responses with redacted typed reasons.

## Boundary guarantees

The provider receives only a read-only node snapshot, locale and correlation/request metadata needed for the transport call. No durable logging is added, and the API key is not interpolated into prompts or error messages. Provider errors are normalized to typed quota, payment, timeout or redacted-unavailable outcomes. External explanations are labeled `external_ai_suggestion` with `not_a_proof_or_state_change`.

The adapter is not automatically enabled in the browser or static-host path. Registration remains an explicit server-side composition concern through the existing provider registry and bounded pool. This keeps credentials and provider activation outside the client bundle and preserves the existing disabled catalog semantics.

## QA evidence

| Gate | Result |
|---|---|
| Focused red baseline before implementation | Import resolution failed because adapter was intentionally absent |
| Focused Gemini adapter suite after implementation | 4/4 PASS |
| Full Vitest regression | 144 test files / 1,262 tests PASS |
| Strict TypeScript | PASS |
| Production build | PASS |
| `git diff --check` | PASS |
| Bounded worker pool submission | Exactly one application submission in focused test |
| Missing key behavior | `unconfigured`; no transport call |
| Provider failure behavior | Typed, redacted; no fallback provider |
| Proof/authority boundary | Non-proof read-only classification preserved |

## Known next integration gate

A subsequent separate increment may add explicit server composition and endpoint wiring after the provider-selection, consent, rate/cost, and deployment contracts are approved. This commit intentionally does not expose credentials, add a browser route, or enable Gemini by default.
