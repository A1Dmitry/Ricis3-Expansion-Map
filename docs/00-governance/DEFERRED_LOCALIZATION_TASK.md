# Deferred localization task: legacy Russian resource migration

## Status

**Queued — resource inventory created, translation intentionally deferred.**

## Goal

Localize every user-visible runtime, UI, diagnostic, academic-report and generated-document phrase currently identified in Russian. The implementation must read translated values from the generated resource catalogs rather than reintroducing hardcoded language-specific literals.

The mandatory target cultures are `en-US`, `fr-CA`, `de-DE`, `hi-IN` and `ms-MY`. `ru-RU` remains the source culture for the currently identified legacy phrases until each phrase receives an approved translation. A non-Russian culture must never fall back to the Russian source value.

## Generated inventory

The complete scanner output is stored at [`russian-resource-manifest.json`](russian-resource-manifest.json). It contains repository, source file, line, category, original literal and a stable generated resource key for every match.

The current eligible inventory contains **1,775 unique resource candidates**: 1,132 Expansion candidates and 643 Core candidates. Test fixtures and formal source data are recorded by the scanner but are excluded from the resource candidate catalogs because they are verification inputs, not user-facing copy.

## Catalogs

| Repository | Catalog | Purpose |
|---|---|---|
| Ricis.Core | `Resources/RicisLegacyTextStrings.resx` | Base resource catalog with explicit pending-localization markers. |
| Ricis.Core | `Resources/RicisLegacyTextStrings.ru-RU.resx` | Current Russian source values for the generated keys. |
| Ricis.Core | `Resources/RicisLegacyTextResources.cs` | Stable accessor for future runtime/report wiring. |
| Ricis3-Expansion-Map | `src/model/i18n.legacy-resources.ts` | Typed generated inventory with `pending-translation` status and Russian source values. |

The existing translated resource contracts remain unchanged. The generated legacy catalogs are additive and are not silently used as translations until a caller is deliberately migrated and the target culture values are complete.

## Work packages

1. Translate the Core catalog into `en-US`, `fr-CA`, `de-DE`, `hi-IN` and `ms-MY`, preserving placeholders, LaTeX commands, RICIS identifiers, Lean identifiers, mathematical expressions and protocol literals.
2. Translate the Expansion catalog into the same cultures and extend the typed resolver so that a foreign culture cannot receive `ru-RU` source text.
3. Migrate callers in batches: UI, runtime diagnostics, academic report builders, LaTeX/Markdown renderers, console output and provider-facing user messages.
4. Add regression tests that render every migrated key in every mandatory culture and fail on Russian leakage outside `ru-RU` source fixtures.
5. Remove only the migrated literals after replacement tests are green. Public members and existing overloads must remain compatible.

## Exclusions

Russian comments, test names, golden fixtures, Lean/LaTeX/Markdown source documents used as evidence, mathematical expressions, theorem statements intentionally used as source data, serialized identifiers and provider protocol values are not UI copy. They must not be translated or altered by this task unless a separate report-content requirement explicitly makes them user-facing output.

## Acceptance criteria

A future completion commit must provide complete values for all generated keys in every mandatory culture, no Russian leakage in rendered foreign-culture UI or reports, tests for every new public accessor and migrated output path, and green Core and Expansion quality gates. The resource inventory must remain reproducible by rerunning the project scanner.
