# Agent Gateway Runtime Activation — Step 3: QA Specification

**Status:** `DRAFT — red-first baseline prepared; implementation intentionally absent.`

**Scope identifier:** `P1-AGENT-GATEWAY-RUNTIME-ACTIVATION-01`.

## 1. QA intent

The red baseline targets the Step 1 business contract and Step 2 architecture boundary. It must fail because the new runtime composition module does not yet exist. The baseline must not add a provider SDK, credentials, network call, browser route, persistence, UI control, map mutation or Core/Lean execution.

## 2. Focused red cases

| Case | Required assertion |
|---|---|
| Runtime composition | Factory returns a boundary with injected application, audit and pool dependencies. |
| Static host | A static-host request returns exactly `static_host_unavailable` and invokes no provider/application transport. |
| Unconfigured provider | Default server composition returns exactly `unconfigured`, with no network attempt. |
| Input boundary | `prompt`, `providerId`, `modelId`, `endpoint`, `apiKey`, `token`, `proof`, `state`, `type`, `formula` and `leanSource` are rejected. |
| Request limits | Empty, oversized and malformed identifiers are rejected before application execution. |
| DTO safety | Successful result exposes only provider-neutral external suggestion fields; no raw transport or Lean source appears. |
| Audit minimization | One redacted terminal event is recorded and contains no prompt, node content, key, token or raw response. |
| Non-mutation | The runtime exports no graph mutation command and does not import the map store or Core bridge. |
| Legacy containment | The new runtime module does not replace or alter the existing Gemini-specific server path. |

## 3. Red baseline command

```text
npx vitest run src/agentGateway/agentGatewayRuntime.test.ts
```

Expected red condition: Vitest cannot resolve the intentionally absent `./agentGatewayRuntime` module. This is the only expected initial defect; the test file itself must remain type-checkable once the planned module is supplied.

## 4. Green gate

After implementation, the focused suite must pass. The full gate remains strict TypeScript lint, all Vitest regression, production build, `git diff --check`, a source containment scan and a browser-bundle scan proving that provider credentials, direct provider transport and raw Lean export are absent.

## 5. Safety boundary

A provider response is never proof, state, type, formula, Core result or Lean verification. The tests must reject or quarantine any attempted promotion field and preserve `UNRESOLVED`/existing node identity. The bounded worker pool remains the sole execution scheduler; no unbounded promise, timer or background loop is admitted.

## References

[1]: `docs/02-sprints/SPRINT_AGENT_GATEWAY_RUNTIME_ACTIVATION_STEP1_BUSINESS_SPEC.md` — business requirements.

[2]: `docs/01-architecture/SPRINT_AGENT_GATEWAY_RUNTIME_ACTIVATION_STEP2_ARCHITECTURE.md` — runtime contracts and dependency rules.
