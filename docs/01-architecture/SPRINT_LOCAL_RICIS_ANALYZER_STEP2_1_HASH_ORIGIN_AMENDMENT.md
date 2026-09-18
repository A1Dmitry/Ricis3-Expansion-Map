# Local RICIS Analyzer — Step 2.1: QA amendment for `SourceExpression` origin

**Статус:** `APPROVED — владелец проекта явно утвердил QA-HA-01 вместе с Step 3 QA gate. Реализация остаётся отдельным Step 4 scope и выполняется только по red-first contract.`

## Finding QA-HA-01

Approved Step 2 declares a versioned SHA-256 `SourceExpression.sourceHash`, but does not assign construction of that value to a dedicated injected contract. Если UI/consumer может передать готовый `SourceExpression`, он может присвоить произвольный hash, а тест не имеет публичной поверхности, на которой проверить точную UTF-8 input-to-hash связь, limit-before-hash и отсутствие скрытого browser/runtime access.

Это **не** позволяет повысить trust status и не создаёт Core/proof risk само по себе, но ослабляет integrity/correlation boundary между raw source, local analysis result и user-mediated suggestion provenance. Исправление должно быть минимальным и аддитивным: отдельная factory port; не изменение `IRicisCoreEngine`, `RicisWasmBridge`, `Proof`, `MapState`, UI или parser implementation.

## Proposed additive contract

```ts
export interface ISourceExpressionFactory {
  create(
    rawText: string,
    limits: Pick<LocalAnalyzerLimits, 'maxInputCharacters'>,
  ): SourceExpressionCreationOutcome;
}

export type SourceExpressionCreationOutcome =
  | SourceExpressionCreated
  | SourceExpressionCreationRejected;

export interface SourceExpressionCreated {
  readonly kind: 'CREATED';
  readonly source: SourceExpression;
}

export interface SourceExpressionCreationRejected {
  readonly kind: 'REJECTED';
  readonly diagnostic: LocalInputDiagnostic;
}

export interface LocalInputDiagnostic {
  readonly code: 'INPUT_EMPTY' | 'INPUT_LIMIT_EXCEEDED' | 'INPUT_INVALID_ENCODING';
  readonly messageResourceKey: string;
  readonly safeParameters: Readonly<Record<string, string>>;
}
```

`ISourceExpressionFactory.create()` is the only Step 4 production boundary allowed to form a `SourceExpression` from raw user text. It must produce `sourceHash = "sha256-base64url-v1:" + base64url(SHA-256(UTF-8(rawText)))`, with length measured in the agreed JavaScript-string input contract before parser/token work. It rejects empty/whitespace-only and over-limit input before hashing/parser invocation. It does not normalize text, parse, classify, access `window`, generate a `correlationId`, persist source, call Core, call an AI provider or expose a proof/trust field.

`SourceExpression` remains an immutable value object. Later domain ports receive it only from this factory at the application composition boundary. Test-only fixtures may instantiate a literal only through a named builder that checks the same known vector; they do not bypass the factory in public-contract tests.

## Required QA additions

| Test ID | Direct surface | Obligation |
|---|---|---|
| `LQA00` | `ISourceExpressionFactory.create` | Exact ASCII UTF-8 SHA-256 vector and `sha256-base64url-v1:` prefix; returned raw text/length preserved. |
| `LQA00A` | `ISourceExpressionFactory.create` | Non-ASCII UTF-8 vector; result proves UTF-8—not locale/browser encoding—semantics. |
| `LQA00B` | `ISourceExpressionFactory.create` | Empty/whitespace input returns typed resource-key diagnostic and parser is not called. |
| `LQA00C` | `ISourceExpressionFactory.create` | At limit succeeds; one char above limit rejects before hash/parser; no throw. |
| `LQA00D` | `ISourceExpressionFactory.create` | Output immutable; no `correlationId`, Core/proof/Lean/AI field or browser side effect. |
| `LQA00E` | app composition | Raw UI string reaches parser only through factory-created source; forged literal source is rejected by composition boundary. |
| `LQA00F` | suggestion validator | Local provenance uses factory-created active source hash; pasted JSON cannot supply/replace it. |

## Gate condition

This amendment is narrow: it only supplies an explicit testable ownership point for source hash construction. It does not alter any approved rule that Local Analyzer is explicit, non-authoritative, non-promoting and Core-first. QA Gate 3 should not be approved until the owner explicitly accepts this additive contract and `LQA00`–`LQA00F` are incorporated into the final test matrix.

## References

[1]: [Approved Step 2 architecture](SPRINT_LOCAL_RICIS_ANALYZER_STEP2_ARCHITECTURE.md)
[2]: [Draft Step 3 QA specification](../03-quality/SPRINT_LOCAL_RICIS_ANALYZER_STEP3_QA_SPEC.md)
