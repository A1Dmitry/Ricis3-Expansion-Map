# RICIS-LEAN-PASSPORT-01 — новый текущий G1 после инцидента

**Статус:** `G1_COMPLETE_DECISION_REQUIRED`
**Дата:** 2026-08-26
**Published baseline:** `e4a721cf629efe828ae57a921e9a2bcedb5ebb7d` (`main`, application version `v0.4.55`)
**Legacy candidate:** permanently `SUPERSEDED_QUARANTINED`; он не является входом в эту работу.

## 1. Incident baseline

Инцидент установлен: браузерная локальная проверка Lean не равна запуску Lean Kernel и не вправе ни разрешать задачу, ни демотировать существующую задачу. Публикуемая архитектура уже содержит важные защитные основания: внешний Lean source фиксируется без замены и сохраняет текущий state; browser-side acceptance evidence отключён; единственным state-decision owner является `AuthoritativeProofStatePolicy`; pure Passport projection имеет `canMutate: false`, `canVerify: false`, `canUpload: false`.[1] [2] [3]

> Ни UI, ни TypeScript/Vitest, ни hosted advisory, ни человеко-читаемый AI-анализ не являются Lean Kernel verification и не могут создать `LeanVerified` state.

| Published surface | Current safe property | Gap relevant to this G1 |
|---|---|---|
| `leanEvidenceConsent.domain.ts` | Exact source fingerprinting; non-authoritative evidence preserves state; provider defaults to unavailable; manual handoff is diagnostic only. | Its records are pure/domain-level and intentionally not an application authority or Passport UI workflow. |
| `leanPassportProjection.domain.ts` | Read-only projection validates correlation/fingerprints, redacts display, returns no mutation/verification/upload capabilities. | It is not composed into user-facing application UI; current references are its own tests/domain only. |
| `mapStore.acceptVerifiedExternalLeanProof` | Explicitly throws; browser payload cannot become trusted authority. | This must remain an immutable rejection boundary. |
| `AuthoritativeProofStatePolicy` | Only Core response trust axes decide `resolved`; transport failure preserves state. | Passport must never import, instantiate or bypass it. |

## 2. Current protected incident boundary

The following are prohibited in every route under this task unless a later, separately approved scope changes them:

| Prohibited action | Reason |
|---|---|
| Reuse or publish the legacy Passport candidate/branch. | It predates the current incident boundary and consent/authority model. |
| Run Lean, lake, elan, Core/WASM, browser-provided compiler, hosted provider or external API. | G1 is static planning only; no execution/evidence is authorized. |
| Mutate user Lean/TeX bytes, source fingerprints, proof fields, node state, trust status, axiom basis, agent competence or consent/persistence records. | Type/source identity and authoritative state separation must be preserved. |
| Enable a connector, webhook, popup prefill, cross-origin result channel, external upload or stored credential. | These are separate external/provider routes requiring explicit consent and architecture choice. |
| Treat `RICIS_III_SOLVED`, P=NP or a Passport view as a classic hypothesis, Lean verification or state-transition shortcut. | RICIS III v7.7 and owner-authorized P=NP are immutable; view evidence does not alter authority. |

## 3. Two viable next routes

| Route | Пользовательский результат | Benefits | Trade-offs and strict boundary |
|---|---|---|---|
| **A. Read-only Passport disclosure** | A local panel explains the exact current verification posture, status taxonomy and why no state/action occurs. It can use only `createUnavailablePassportReadModel()` and fixed disclosures. | Improves transparency immediately; zero provider, source upload, persistence, mutation or authority expansion. | Cannot display or process a user’s actual Lean source; it is not a verifier, challenge or state tool. G2 would be UI architecture only. |
| **B. Source-bound Passport session** | A future bounded flow could present already user-supplied, fingerprinted source with explicit consent records and manual review context. | More useful evidence trace for a deliberately supplied source. | Touches user-source/capture/consent/persistence and potentially disclosure risk. It requires a **different new G1** with data-ownership, retention and explicit-human-decision design; it may not start from this G1. |

No route is selected automatically by this document. Route A is the lighter, zero-external alternative; Route B is deliberately isolated because it changes the ownership/data boundary.

## 4. G2 entry conditions

Only an explicit selection of **Route A** may open `RICIS-LEAN-PASSPORT-01 G2A`. That G2 may describe at most: one local presentational component, a pure fixed disclosure model or the existing unavailable read model, and one narrow existing UI composition seam. No source editor, source capture, fingerprint calculation, state proposal, consent write, provider adapter, API, popup, Core/Lean/authority import or router/store/persistence modification is permitted.

Route B requires a separate task identifier and a fresh evidence-complete G1; it cannot be folded into A.

## References

[1]: `src/leanConsent/leanEvidenceConsent.domain.ts` — published pure evidence/consent boundaries.

[2]: `src/leanPassportProjection/leanPassportProjection.domain.ts` — published read-only Passport projection and zero capabilities.

[3]: `src/model/authoritativeProofStatePolicy.ts` and `src/store/mapStore.ts` — sole authoritative state owner and disabled browser evidence acceptance.
