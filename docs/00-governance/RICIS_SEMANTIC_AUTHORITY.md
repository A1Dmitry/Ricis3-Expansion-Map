# RICIS Semantic Authority

This document defines the strict hierarchy of semantic authority and trust within the RICIS-III project.

## The 4 Pillars of Authority

1. **JSON Specification = Semantic Contract**: The JSON files (e.g., `RICIS-III_axioms.json`) declare the formal specification, domain boundaries, and ontological definitions. They are the single source of truth for *what* RICIS is.
2. **Logic / Tests = Independent Validation**: The TypeScript test suites (`*.test.ts`) serve as independent validators of the execution paths. They prove that the implementation adheres to the semantic contract and doesn't introduce regressions or garbage duplicates (Anti-Tukhta).
3. **TypeScript = Executable Implementation**: The TypeScript codebase (e.g., `localRicisReducer`) is the operational engine. It must faithfully execute the specification and produce observable derivation journals that match the theoretical graph.
4. **Lean = Formal Verification of the Encoded Subset**: Lean 4 is used strictly to formally verify specific, localized subsets of the logic. It does not dictate the rules; it proves that the rules, as specified in the JSON and implemented in TS, are mathematically sound within a strictly defined domain.

## Axiom Admission Protocol (A11)

A candidate rule or structural profile (e.g., A15) is **NOT** an axiom merely because:
- Its file exists in the repository.
- Its unit tests pass.
- It produces a mathematically interesting or correct result in specific cases.
- Lean can formalize it.

A candidate becomes a formal part of the RICIS framework **ONLY** after successfully passing the **A11 admission protocol**. Until then, it remains a "candidate structural profile" and must not override established rules like SP5 without explicit theoretical elevation.

## Immutability of the Accepted Core

The authority hierarchy above governs *what may be claimed*. The binding constraint on *what may be changed* is the **Манифест неизменности RICIS-III** ([`RICIS_IMMUTABILITY_MANIFEST.md`](RICIS_IMMUTABILITY_MANIFEST.md)), which is normative for this project:

- An accepted axiom is part of the system identity and is never rewritten retroactively (neither weakened, strengthened, nor redefined) inside an existing version.
- `Resolve ≠ Commit`: `Candidate → Analysis → Proof → Audit → Admission → Commit`. Passing tests, a useful result, or Lean formalisability do not perform Admission.
- A rule incompatible with the existing Core is either rejected or moved into a new semantic branch/version with its own identity (`CoreVersion`, `CoreHash`, `AxiomSet`, `RuleSet`, `ProofEnvironment`, `History`). The same name with a different Core is prohibited.
- Lean (Pillar 4) verifies that a conclusion follows from the given definitions, axioms and assumptions. It never certifies that the chosen axioms are correct or that they belong to the original RICIS-III Core; every proof record binds to a specific Core version.
- Classical mathematics is a comparison instrument, not a repair mechanism: a divergence is recorded as a *difference between models*, never as a licence to rewrite RICIS-III.
- `Proposal ≠ Verification ≠ Admission`: the agent that authored a rule cannot be the sole source of its certification.
