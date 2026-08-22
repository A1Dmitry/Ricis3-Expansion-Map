# A6 Multi-evidence Contract

**Release:** `0.4.35`
**Status:** implemented pure contract/application layer; runtime adapters and proof artifact migration remain unavailable by design.

## Purpose

The module preserves the RICIS III distinction between an exact typed A6 reduction, a geometric representation of that reduction, and independent evidence from Agent, Ricis.Core and Lean.

> `F` and `G` are deferred typed expressions. They are not scalar placeholders. Their type, structural identity and certified singularity keys remain part of the RICIS payload.

The canonical A6 operation remains:

```text
0_F × ∞_G → F·G
```

For an already valid typed witness, the geometric RICIS representation may be recorded as:

```text
det((F, 0_RICIS), (0_RICIS, G))
= F·G − 0_RICIS·0_RICIS
= F·G
```

The determinant is not a generic parser fallback and does not construct a witness for arbitrary function text. Coordinate zero is explicitly distinct from indexed `0_F`.

## Boundary

`src/a6Evidence/contracts.ts` defines the pure DTOs and ports. `a6EvidenceApplication.ts` validates a candidate typed witness and performs a deterministic merge of independent records. Neither module imports an Agent provider, Ricis.Core singleton, Lean process, HTTP client, React, browser storage, environment variable, secret or graph/proof-state policy.

| Element | Responsibility | Explicitly absent |
|---|---|---|
| `A6BridgeWitness` | Immutable typed `F/G`, `0_F`, `∞_G`, L0/L1/SP2/SP4 facts and geometric representation. | Free-form determinant parsing, scalar payload replacement. |
| `assessA6BridgeWitness` | Returns `a6_applicable` only for an exact A6 witness or a typed non-applicable reason. | Core/agent/Lean invocation, arbitrary default `F/G`. |
| `AgentA6Evidence` | Records a qualified Agent structural assessment for the witness. | Core/Lean provenance or trust promotion. |
| `CoreA6Evidence` | Records independently supplied Core execution evidence for the witness. | Agent/Lean provenance or node resolution. |
| `LeanA6Evidence` | Requires immutable source, compiler and axiom evidence hashes. | Creation from `isVerified`, text or Agent/Core agreement. |
| `A6EvidenceMerger` | Retains all evidence/unavailability records and returns concordant, single-source, unavailable or conflict status. | Winner selection, retry, adapter call, trust mutation. |

## Deployment-aware availability

Agent and Core are independent capability ports. Publication topology determines availability; a missing capability cannot cancel evidence already produced by the other.

| Agent | Core | Required envelope behaviour |
|---|---|---|
| Available | Available | Retain both records; compare witness/product/type identity. |
| Available | Unavailable | Retain Agent record plus `core_confirmation_unavailable`. |
| Unavailable | Available | Retain Core record plus `agent_assessment_unavailable`. |
| Unavailable | Unavailable | Retain immutable witness and typed `all_unavailable`; never fabricate `F·G`. |

Lean is a third independent layer. An Agent/Core agreement is structural/execution concordance only and cannot set `LEAN_VERIFIED`, `TrustedAxiom`, `resolved` or another proof-state field.

## Conflict policy

A differing witness hash, reduced-product hash or product type tag returns `evidence_conflict`. The merger preserves every received record and does not select a preferred result. Recovery, retry and presentation belong to future injected adapters/UI layers.

## Verification

`contracts.test.ts` covers typed witness, four deployment topologies, availability preservation, evidence scope and source isolation. `a6EvidenceApplication.test.ts` covers pure exact-witness validation, L0/L1/SP2/SP4 refusal, geometric identity validation and deterministic conflict/concordance merge. Both test suites run offline and require no Agent, Core, Lean, secret, network or deployment.

## Non-goals

This release does not call an Agent, Ricis.Core or Lean; change `IRicisCoreEngine.evaluate()`; modify proof artifacts; alter `RicisFallbackEngine`; render UI; migrate the legacy Jacobian artifact; or alter the authoritative node proof-state policy. Each requires a separately approved adapter or migration scope.
