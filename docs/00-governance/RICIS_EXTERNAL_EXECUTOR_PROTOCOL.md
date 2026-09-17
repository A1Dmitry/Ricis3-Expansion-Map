# RICIS-III external executor protocol

This is an interaction protocol, not a mathematical axiom. An unknown external
LLM is an executor and is never a source of semantic authority.

## Flow

1. Identify that the task is RICIS-III work and use the canonical normative
   document (`docs/01-architecture/ricis-unified-complete-document-7.9-vector.json`).
2. Apply only the rules relevant to the task. A full repository read is not a
   prerequisite.
3. Submit the result to the existing agent response validation / solution gate.
4. If the gate rejects it, use `requiredRules` and `requiredDocuments` for a
   targeted read and retry. These fields contain only the missing dependencies.
5. A protected-rule redefinition is rejected; the normative state is not
   changed by the executor.

The executable boundary is `src/agentGateway/externalExecutorProtocol.ts`.
Its decision shape is deliberately compatible with the required failure
metadata: `accepted`, `stage`, `violation`, `requiredRules`,
`requiredDocuments`, and `recoveryAction`.

The protocol does not trust an executor's internal reasoning or compliance
claim. Acceptance still requires the existing deterministic response
validator and its established qualification/provenance controls.
