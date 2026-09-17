# BA TASK: RICIS-III — Independent Lean Verification and Zenodo Evidence Pipeline

## Objective

Design and implement a reproducible evidence pipeline for RICIS-III in which a completed formal proof can be:

```text
RICIS task
    ↓
Lean source / proof
    ↓
Independent Lean verification
    ↓
PASS
    ↓
Git commit
    ↓
Zenodo archival record
    ↓
DOI
```

The resulting DOI must identify the exact archived evidence corresponding to the verified proof.

---

# 1. First: inspect the existing repository

Before modifying anything, inspect the current RICIS-III repository and determine:

* existing Lean structure;
* Lean version;
* Mathlib version / revision;
* existing build commands;
* existing CI;
* existing proof/test infrastructure;
* existing proof metadata;
* existing DOI references;
* existing Zenodo references;
* existing scripts for release/version generation;
* existing Gate implementation;
* existing documentation describing proof status.

Do not recreate mechanisms that already exist.
Do not modify completed functionality unless required for integration.

---

# 2. Research external Lean verification services

Research currently available services/tools capable of independently checking an already-written Lean proof.

The research must consider at minimum:

* exact Lean version support;
* exact Mathlib version support;
* whether verification is actual Lean compilation/kernel checking rather than LLM-based evaluation;
* API availability;
* automation capability;
* reproducibility;
* source availability;
* authentication requirements;
* usage limits;
* stability;
* whether the service can be invoked automatically from CI;
* whether submitted source is retained;
* whether the verification result can be independently reproduced;
* suitability for public RICIS evidence.

Do not select a service merely because it is popular or AI-oriented.

The primary requirement is:
> The service must actually verify the Lean artifact in a specified Lean environment.

If no suitable external service satisfies the requirements, document that fact and propose the most reliable alternative.
Do not invent API endpoints, capabilities, or guarantees.

---

# 3. Verification architecture

The architecture must distinguish three verification levels.

## Level 1 — Local verification
The RICIS repository verifies the Lean artifact using its canonical local Lean/Mathlib environment.
Required result: `PASS / FAIL`

## Level 2 — Independent verification
An external verifier independently checks the same Lean artifact.
Required result: `PASS / FAIL`
The external verifier must receive the exact artifact and declared environment.

## Level 3 — Archived evidence
Only after successful verification should the evidence package be eligible for Zenodo publication.

---

# 4. Verification artifact

Define a canonical machine-readable evidence manifest.
Use the existing repository format if one already exists.
If no suitable format exists, introduce the smallest necessary format.

The manifest should identify at minimum:
```json
{
  "project": "RICIS-III",
  "proof": "...",
  "lean_version": "...",
  "mathlib_version": "...",
  "git_commit": "...",
  "source_hash": "...",
  "verification": {
    "local": "...",
    "external": "..."
  }
}
```

---

# 5. Cryptographic identity

The evidence must be bound to the exact source that was verified:
```text
verified source = hashed source = archived source
```

---

# 6. Verification result

The pipeline must distinguish:
```text
LLM CLAIM vs LEAN VERIFIED vs INDEPENDENTLY VERIFIED
```

---

# 7. Gate integration

Integrate the verification result with the existing RICIS Gate architecture (`UNVERIFIED`, `LOCAL_VERIFIED`, `INDEPENDENTLY_VERIFIED`, `ARCHIVED`).

---

# 8. Zenodo integration

Official Zenodo REST API for depositions, file upload, metadata, DOI handling, sandbox testing.

---

# 9. Zenodo publication policy

Strict deterministic rule for archival eligibility.

---

# 10. DOI relationship

Reconstructible evidence chain linking DOI to Lean source, environment, and verification logs.

---

# 11. RICIS semantic protection

Strict preservation of L0, L1, SP1–SP5, P1, A1–A10, Geometric A6, A15, and Immutability Manifest invariants.

---

# 12. Unknown LLM compatibility

Authoritative boundary and protocol support for external executors.

---

# 13. Token-efficiency

Selective discovery and dependency-guided recovery.

---

# 14. Reproducibility

Third-party verification reproduction capabilities.

---

# 15. Failure handling

Explicit enum error states and failure guards.

---

# 16. Security

Protected credentials and sanitized public evidence manifests.

---

# 17. Tests (A through H)

Local pass/fail, independent verifier, environment mismatch, hash mismatch, archival eligibility, failed verification handling, and credential safety.

---

# 18. Documentation

Clear operational guides and evidence chain explanation.

---

# 19. Acceptance criteria

Full end-to-end verification and integration pass.

---

# 20. Final report

Comprehensive implementation and audit report.
