# PEP-01 — Step 3 QA: authoritative C# Core-backed proof endpoints

**Статус:** `APPROVED — владелец проекта отдельно подтвердил Step 3 после утверждения PEP-01 Step 1 и Step 2. Документ определяет deterministic QA fixtures, direct regression suites и release gates; он не добавляет production-код.`

**Approved inputs:** [PEP-01 Step 1 business specification](../02-sprints/SPRINT_PEP_STEP1_BUSINESS_SPEC.md) and [PEP-01 Step 2 architecture](../01-architecture/SPRINT_PEP_STEP2_ARCHITECTURE.md).

## 1. QA objective and non-negotiable oracle

The QA suite must prove the **transport and trust boundary**, not claim a new mathematical theorem. Deterministic Core fixtures provide controlled representations of a valid derivation, a structurally verified but non-Lean run, a current Lean-evidence run, an unsupported Lean shape, and typed failures. They do not execute arbitrary C#, invoke an external provider, call a network host, access secrets, or manufacture Lean evidence.

> **Primary oracle:** only the approved C# Core fixture/production service may produce a canonical proof snapshot. TypeScript, HTTP status, a renderer, `goalMatched`, fallback output or a test fake may test transport handling, but none can cause a test to assert that a new result is `LEAN_VERIFIED` without supplied evidence metadata representing an already verified artifact.

| QA goal | Required outcome | Prohibited shortcut |
|---|---|---|
| Single canonical derivation | One successful create-run request invokes the Core derivation port once. | Re-deriving during get/verify/export or testing a copied browser trace. |
| Immutable snapshot | Stored response/documents retain correlation, content hashes and status. | A mutable static dictionary accepted as production persistence. |
| Core-first proof transport | Production proof gateway has zero calls to `RicisFallbackEngine`. | Treating an old local proof as the successful fallback. |
| Honest node status | Only fixture-backed `LEAN_VERIFIED` maps to `resolved`. | `goalMatched`, `QED_VERIFIED`, structural verification or document validity as resolution evidence. |
| Safe recovery | Failure preserves map state and gives resource keys/safe parameters. | Raw exception, stack trace, token, file path or unredacted input in DTO/UI assertion. |

## 2. Deterministic fixtures

### 2.1 C# fixture set

| Fixture | Controlled response | Trust/status purpose |
|---|---|---|
| `VerifiedCanonicalRunFixture` | Immutable run, ordered Core trace, matching document hashes and existing Lean evidence metadata. | Positive `LEAN_VERIFIED → resolved` mapping only. |
| `StructuralOnlyRunFixture` | Core derivation and structural verification; evidence status `REQUIRES_CORE_LEAN`. | Verifies that Core success remains `partial`. |
| `TrustedAxiomRunFixture` | Named trusted external input with explicit limitation/evidence reference. | Ensures `TRUSTED_AXIOM → partial` by default. |
| `UnsupportedLeanShapeFixture` | Valid derivation where generic Lean export is unsupported. | Ensures controlled `422`/typed rejection without theorem scaffold. |
| `CoreUnavailableFixture` | Timeout/unavailable before accepted snapshot creation. | Ensures typed recovery and no map mutation. |
| `MalformedCoreResponseFixture` | Missing mandatory snapshot/status/evidence/limitation field. | Ensures `CORE_PROOF_INVALID_RESPONSE`, not success. |
| `SnapshotTamperFixture` | Stored response/document hash mutation attempt. | Ensures mutation is detected/rejected. |

Fixtures hold no actual provider credential, OAuth token, host ticket, private key, browser cookie or remote address. Any synthetic ID uses fixed test-only values and has no production secret meaning.

### 2.2 TypeScript fixture set

| Fixture | Purpose |
|---|---|
| `FakeAuthoritativeProofTransport` | Returns exact v1 success/failure payloads, records fixed method/path/body and exposes no general fetch forwarding. |
| `FallbackEngineSpy` | Counts every legacy proof method call and fails a production-path test on any invocation. |
| `FixedClockAndIdFactory` | Makes correlation/snapshot expiry assertions deterministic. |
| `FrozenMapState` | Provides nodes in `resolved`, `partial` and `unresolved` states to prove policy mapping and failure preservation. |
| `ResourceKeyAssertion` | Validates error/recovery DTOs contain message resource keys and safe parameters, not rendered hardcoded prose. |

All TypeScript endpoint tests use a local deterministic mock server or injected transport stub. They never use a real Core deployment, Browser WebSocket, cross-origin bypass, third-party AI provider or a user account.

## 3. Direct public-contract test inventory

Every planned public method/route has a named direct regression suite. Orchestration coverage does not replace these direct tests.

| Public surface | Test file target | Direct positive case | Direct adversarial cases |
|---|---|---|---|
| `ICanonicalProofDerivationService.DeriveAsync` | `Ricis.WebApi.Tests/ProofDerivationServiceTests.cs` | One bounded supported scenario returns an ordered canonical derivation. | Arbitrary C#/Lean/delegate input rejected; parser failure; scenario mismatch; Core failure creates no accepted run; invocation count exactly one. |
| `IProofRunSnapshotStore.SaveAsync` | `Ricis.WebApi.Tests/ProofRunSnapshotStoreTests.cs` | Valid immutable snapshot stores once with hashes/expiry. | Duplicate ID overwrite; altered trace/status/document hash; invalid expiry; secret-bearing field rejection. |
| `IProofRunSnapshotStore.FindAsync` | `Ricis.WebApi.Tests/ProofRunSnapshotStoreTests.cs` | Owner-scoped active snapshot is returned unchanged. | Missing/expired/foreign-owner request; no re-derivation; redacted access denial. |
| `POST /api/proofs/v1/runs` | `Ricis.WebApi.Tests/ProofEndpointsContractTests.cs` | Valid v1 request returns all mandatory fields and one snapshot. | Wrong API version/content type/body size/format/claim parser; unsupported scenario; Core timeout; malformed Core result; response limit. |
| `GET /api/proofs/v1/runs/{id}` | `Ricis.WebApi.Tests/ProofEndpointsContractTests.cs` | Reads identical stored run without Core invocation. | Missing/expired/foreign run; wrong ID syntax; no mutable response fields. |
| `GET /api/proofs/v1/runs/{id}/documents/{format}` | `Ricis.WebApi.Tests/ProofEndpointsContractTests.cs` | JSON/Academic/Log/LaTeX descriptor and content match snapshot hash/status. | Unsupported format; generic Lean shape; expired run; hash mismatch; export invokes no Core derivation. |
| `GET /api/proofs/v1/capabilities` | `Ricis.WebApi.Tests/ProofEndpointsContractTests.cs` | Publishes fixed supported scenario/format/limit/Lean boundary contract. | No unbounded theorem/compiler capability; version mismatch cannot silently pass. |
| `IRicisProofGateway.createRun` | `src/services/ricisCore/CoreProofHttpGateway.test.ts` | Sends fixed POST v1 route and accepts complete validated response. | No arbitrary origin/path/method; 2xx malformed payload; fallback spy; timeout; raw error redaction. |
| `IRicisProofGateway.getRun` | `src/services/ricisCore/CoreProofHttpGateway.test.ts` | Sends fixed GET run route and validates immutable response. | Invalid ID; missing run; dynamic path injection; no fallback. |
| `IRicisProofGateway.getDocument` | `src/services/ricisCore/CoreProofHttpGateway.test.ts` | Requests fixed allowlisted document format. | Format/path escape; generic Lean controlled rejection; content/status mismatch; no renderer-side computation. |
| `IRicisProofGateway.getCapabilities` | `src/services/ricisCore/CoreProofHttpGateway.test.ts` | Parses bounded capabilities payload. | Malformed/unknown capability values; no assumption from HTTP 200 alone. |
| `AuthoritativeProofStatePolicy.apply` | `src/model/authoritativeProofStatePolicy.test.ts` | Existing Lean-evidence fixture resolves node. | `TRUSTED_AXIOM`, `REQUIRES_CORE_LEAN`, `STATIC_CHECK_PASSED`, `HYPOTHESIS`, `REJECTED`, `goalMatched`, `QED_VERIFIED`, valid LaTeX/JSON, fallback output and Core failure mappings. |
| `RicisWasmBridge` production proof adapter methods | `src/services/ricisCore/RicisWasmBridge.proof.test.ts` | Delegates to injected authoritative gateway. | Every failure branch proves zero `_legacyEngine` proof invocation; `evaluate()` unchanged Core-first. |

Any new public DTO parser/constructor introduced during Step 4 must be added to this inventory before its code is merged, with at least one direct positive and one direct negative regression test.

## 4. Route contract cases

### 4.1 Generate route

| ID | Stimulus | Expected result |
|---|---|---|
| G-01 | Valid `ExpressionEquivalence` claim/expected input and requested stored formats. | `200`; v1 version, correlation/run ID, Core version, bounded parsed/normalized values, ordered trace, verification, Lean evidence, limits/diagnostics; exactly one derivation call. |
| G-02 | Missing/unknown API version. | Typed `400` resource-key error; no Core/snapshot call. |
| G-03 | Claim/expected exceeds policy or parser rejects text. | Typed parse/input rejection and safe position; no arbitrary evaluation. |
| G-04 | Generic request asks for `Lean`. | `422 UNSUPPORTED_LEAN_SHAPE`; no fake Lean scaffold, no `LEAN_VERIFIED`. |
| G-05 | Scenario and request shape conflict. | `409 PROOF_SCENARIO_MISMATCH`; no silent conversion. |
| G-06 | Core timeout/unavailable. | `503 CORE_PROOF_UNAVAILABLE`; no snapshot and no node transition. |
| G-07 | Core returns 2xx-shaped partial object. | `502 CORE_PROOF_INVALID_RESPONSE`; no acceptance. |
| G-08 | Repeated client request ID after accepted immutable run. | Deterministic documented idempotency/outcome; never a second derivation unless the separately defined idempotency policy permits a new correlation. |

### 4.2 Read/export routes

| ID | Stimulus | Expected result |
|---|---|---|
| R-01 | Existing active proof run/read. | Stored immutable response; Core derivation invocation count unchanged. |
| R-02 | Missing/expired run. | Typed `404 PROOF_RUN_NOT_FOUND`; no rerun. |
| R-03 | Foreign/unauthorised run ID. | Non-enumerating typed denial; no response content leak. |
| R-04 | JSON/Log/Academic/LaTeX export. | Status, limitation, correlation/run ID and content hash match original snapshot. |
| R-05 | Generic Lean export. | Controlled unsupported response; no compile service or comment-only theorem output. |
| R-06 | Tampered snapshot/document hash. | Reject/mark invalid; renderer does not repair by recomputation. |

## 5. Trust-state and map migration cases

| ID | Input evidence/status | Expected map state | Mandatory assertion |
|---|---|---|---|
| T-01 | Current Core response with valid `LEAN_VERIFIED` evidence fixture. | `resolved` | State policy—not UI/goal match—made the decision. |
| T-02 | `TRUSTED_AXIOM`. | `partial` | Visible trusted limitation; no default exception. |
| T-03 | `REQUIRES_CORE_LEAN` + structural verification. | `partial` | Core structural success is not kernel status. |
| T-04 | `STATIC_CHECK_PASSED`. | `partial` | Static check cannot resolve. |
| T-05 | `HYPOTHESIS`. | `partial`/`unresolved` as explicit policy fixture. | Never resolves. |
| T-06 | `REJECTED`. | `unresolved`. | Existing output not accepted as proof. |
| T-07 | `goalMatched: true` / `academicStatus: QED_VERIFIED` with no Lean evidence. | `partial`. | Old local transition is absent. |
| T-08 | JSON/LaTeX valid or fallback `isVerified: true`. | `partial`. | Presentation/fallback does not promote status. |
| T-09 | Core timeout/malformed response for an already partial/resolved node. | Unchanged. | Recovery diagnostic logged; no fallback/reclassification. |

## 6. Anti-fallback and Core-first cases

1. Spy every `RicisFallbackEngine` proof method (`generateFormalProof`, `verifyProofChain`, `proveSystem`) in every production proof gateway/map/UI test. Expected count is zero for success, parser rejection, 404, 409, 422, timeout, malformed response and abort paths.
2. Preserve an isolated diagnostic test proving legacy public members remain reachable only through explicit offline/legacy composition. That test does not assert production trust or map resolution.
3. Run a static import/call-path check that rejects `RicisFallbackEngine` proof output in `mapStore`, Proof Console, production `logic.ts` document output and authoritative gateway files.
4. Add a regression assertion that PEP changes do not alter `RicisWasmBridge.evaluate()` success/failure Core-first behaviour. An unavailable Core result remains typed `CoreExecutionFailure`; no TypeScript invariant appears.

## 7. Security, privacy and resource tests

| Boundary | Test |
|---|---|
| Error DTO | Resource key and bounded safe parameters are present; raw exception/message/stack path is absent. |
| Request/response logs | No OAuth token, host credential, private key, ticket, cookie, provider secret or full unredacted request body. |
| Parser | Rejects code-looking/delegate/Lean-source/reflection strings; conditions remain restricted data only. |
| Endpoint targeting | Frontend gateway uses configured safe Core endpoint and fixed route segments; it cannot receive browser-provided base URL/path/method. |
| Response limits | Oversize request and response produce typed failure; no memory-unsafe buffering or partial success. |
| Locale | Browser maps code to external `proof.core.*` resources; test rejects hardcoded user-facing recovery prose in new domain/transport functions. |

## 8. Quality gates and release evidence

| Gate | Mandatory evidence |
|---|---|
| C# unit/contract | `dotnet test` covering deterministic proof ports, WebAPI contracts, mutation/adversarial boundary cases and existing Core regression suite. |
| TypeScript unit | `npm run lint`, focused Vitest gateway/state/anti-fallback suites and full `npm test` in Expansion Map. |
| Build | `dotnet build` for `Ricis.WebApi`/Core plus `npm run build` for Expansion Map. |
| Static audit | No production fallback proof path, no unsafe `goalMatched → resolved`, no secret-bearing DTO/log, no arbitrary URL/route/code/Lean forwarding. |
| Repeatability | Three sequential focused proof contract runs pass with fixed fixtures; failures include current test name/correlation fixture. |
| Release evidence | Changed public members, test counts, build commands, trust boundary, deferred migration/seeded-record inventory and known limits are recorded. |

## 9. Step 3 acceptance criteria

Step 3 may be accepted only if the owner confirms that QA will enforce these decisions before implementation:

1. Every planned public C#/TypeScript proof surface has an individually named direct deterministic regression suite.
2. Test doubles validate transport behaviour only; they do not manufacture a new Lean claim or bypass evidence policy.
3. All success/failure routes have anti-fallback assertions, including errors and malformed successful payloads.
4. The state-policy table strictly prevents `goalMatched`, `QED_VERIFIED`, `TRUSTED_AXIOM`, structural verification and document validity from resolving a node.
5. QA permits no live provider/network host/account/token in unit/contract runs.
6. Static tests enforce external resource keys and secret redaction.
7. Implementation begins with red tests/skeleton first and cannot alter existing `RicisWasmBridge.evaluate()` Core-first semantics.

## References

[1]: [PEP-01 Step 1 business specification](../02-sprints/SPRINT_PEP_STEP1_BUSINESS_SPEC.md).
[2]: [PEP-01 Step 2 architecture](../01-architecture/SPRINT_PEP_STEP2_ARCHITECTURE.md).
[3]: [`RicisWasmBridge`](../../src/services/ricisCore/RicisWasmBridge.ts) — current strict evaluation / legacy proof seam.
[4]: [`IRicisCoreEngine`](../../src/services/ricisCore/IRicisCoreEngine.ts) — current public engine contracts.
[5]: [`Ricis.WebApi`](../../../Ricis.Core/Ricis.WebApi/Program.cs) — current bounded minimal API conventions.
