# RICIS-III Formalization of the AGI Target Function (SP4 / L1 / A6)

Technical-note package for Zenodo deposit.

## Role on the map

Unlocks research-map root **`core-agi-target`**, which is the dependency parent of:

- `med-diagnostics`
- `pharm-design`
- `econ-value`
- `ethic-alignment`
- `ricis-chatbot-monetization`

Mathematical root `math-singularity` is already covered by the geometric bridge  
DOI `10.5281/zenodo.22124493`. This package addresses the **AGI root**.

## Files

| File | Description |
|------|-------------|
| `ricis_agi_target_sp4.tex` | Technical note (LaTeX) |
| `RicisAgiTarget.lean` | Computable Lean 4 prototype (Mathlib) |
| `README.md` | This boundary note |

## Claims / non-claims

**Claimed**

- Path-indexed objective `Goal_P` under SP4 + L1
- Use of published local geometric bridge $\det((A,0),(0,B))=A\cdot B$
- Structural unlock of child nodes on the RICIS Expansion Map at **workflow** trust level

**Not claimed**

- Empirical industrial AGI alignment
- Clay Institute acceptance
- Full Lean-kernel verification of all RICIS reducers (Lean file is a **prototype**, same class as the geometric-bridge example)

## Suggested Zenodo metadata

- **Title:** RICIS-III Formalization of the AGI Target Function: Path-Indexed Objective via SP4 and L1 Identity
- **Creators:** Aleinikov, Dmitry (ORCID 0009-0004-3226-7700)
- **Keywords:** RICIS-III, SP4, L1, AGI target, geometric bridge, singularity, formal methods
- **Related identifiers:**  
  - `10.5281/zenodo.22124493` (Geometric Bridge A6)  
  - `10.5281/zenodo.21517353` (Master Registry)  
  - `10.5281/zenodo.21309650` (AI authorship provenance)

## After you obtain a DOI

1. Replace `PENDING_DOI` in the map patch  
   `../ricis-map-patch-core-agi-target-PENDING.json`
2. Import the patch into RICIS Expansion Map (`patch_merge`)
3. Document generators that expand to root will pick up the chain automatically
