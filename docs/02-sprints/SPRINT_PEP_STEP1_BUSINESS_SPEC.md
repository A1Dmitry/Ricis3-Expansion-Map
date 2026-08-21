# PEP-01 — Business Specification: authoritative C# Core-backed proof endpoints

**Статус:** Step 1 — ожидает явного подтверждения владельца проекта.

## 1. Проблема

В приложении `Ricis3-Expansion-Map` вычисление expression через `RicisWasmBridge.evaluate` уже обращается к C# Core и не использует математический TypeScript fallback. Однако proof методы bridge пока делегируются в `RicisFallbackEngine`. В результате generated proof, proof-chain verification и academic proof могут выглядеть как подтверждённые, хотя они не были получены из authoritative `Ricis.Core` run и не имеют требуемого Lean kernel evidence.

Это конфликтует с действующей границей доверия: generic C# expression tree не становится Lean theorem через текстовый export, local/static TypeScript validation не является Lean kernel run, а состояние `resolved` не должно присваиваться только по совпадению цели или presentation artifact.

## 2. User story

> Как пользователь RICIS Expansion Map, я хочу запускать proof только через C# Ricis.Core и видеть точный статус доверия, evidence, ограничения и шаги восстановления при недоступности Core, чтобы карта никогда не называла неподтверждённый fallback или текстовый шаблон доказанным математическим результатом.

## 3. Цель первого инкремента

Создать минимальный authoritative proof transport между `Ricis.WebApi` и `Ricis3-Expansion-Map`. Proof generation, verification и document export должны опираться на один canonical Core derivation и ordered typed trace. Production bridge не должен вызывать `RicisFallbackEngine` для proof-path.

Этот инкремент **не** обещает формальное восстановление всех 21 seeded proof records. Он создаёт правильный transport, статусы, error contract и тестовую основу, на которой reconstruction выполняется последующими пакетами.

## 4. In scope

| ID | Требование |
|---|---|
| PEP-01 | C# endpoints для bounded proof generation, proof verification и export из уже полученного proof snapshot. |
| PEP-02 | Versioned DTO contract с request ID, Core version, canonical claim, normalized representation, typed trace, proof status, evidence metadata, limitations и diagnostics. |
| PEP-03 | Controlled rejection для unsupported parser input, unsupported proof/Lean shape, malformed request, unavailable Core и malformed Core response. |
| PEP-04 | Migration `RicisWasmBridge` с запретом legacy fallback на production proof methods. |
| PEP-05 | Migration map state transition: local `goalMatched` сам по себе не устанавливает `resolved`. |
| PEP-06 | UI recovery state для Proof Console: точная причина, request ID, статус доверия и действия восстановления. |
| PEP-07 | Contract, mutation, integration и anti-fallback tests; обновление документации и release gates. |

## 5. Out of scope

| ID | Исключение | Причина |
|---|---|---|
| OOS-01 | Массовая реконструкция всех 21 seeded proof в одном пакете | Каждый proof требует индивидуальной классификации и, если заявляется Lean status, реального evidence. |
| OOS-02 | Создание Lean theorem из arbitrary C# expression text | Противоречит Core Lean policy и может создать ложный kernel status. |
| OOS-03 | Автоматическое повышение `REQUIRES_CORE_LEAN` до `LEAN_VERIFIED` | Для повышения нужен текущий воспроизводимый Lean run и evidence. |
| OOS-04 | Изменение аксиом, RICIS phase order или классическая подмена RICIS | Не является задачей transport sprint. |
| OOS-05 | Finance, payment, Telegram и UI performance backlog | Отдельные bounded contexts. |

## 6. Domain glossary

| Термин | Значение |
|---|---|
| **Canonical derivation** | Единственный Core proof run, из которого производятся результат, trace, verification и documents. |
| **Authoritative proof response** | Versioned C# API response с целостным proof status и diagnostics; не TypeScript template. |
| **Evidence** | Сохранённые проверяемые metadata: toolchain, command, compiler output, axiom output, content hash и source reference. |
| **Fallback** | Legacy TypeScript implementation для offline diagnostics/compatibility, не источник production truth. |
| **Controlled rejection** | Типизированный отказ с безопасным reason code и recovery instructions без фальшивого proof. |
| **Kernel verification** | Фактическая Lean compiler verification конкретного source с evidence. |

## 7. Нормативный статусный автомат

| Proof status | Источник | Состояние узла | UI label |
|---|---|---|---|
| `LEAN_VERIFIED` | Current reproducible Lean kernel evidence | `resolved` | Lean kernel verified |
| `TRUSTED_AXIOM` | Immutable external source плюс named trust dependency и evidence | `partial` по умолчанию; `resolved` только после отдельной domain policy | Trusted external contract |
| `REQUIRES_CORE_LEAN` | C# Core derivation без текущего Lean evidence | `partial` | Core derivation; kernel verification required |
| `STATIC_CHECK_PASSED` | Static/text validation | `partial` | Static check only |
| `HYPOTHESIS` | Research/assumption | `partial` или `unresolved` | Hypothesis |
| `REJECTED` | Invalid/malformed/unsupported proof | `unresolved` | Rejected |
| `CORE_UNAVAILABLE` | Infrastructure failure | Состояние узла не меняется | Core unavailable |

**Правило:** `goalMatched`, LaTeX compilation, JSON validity, local RICIS reduction или fallback trace не являются достаточным основанием для `resolved`.

## 8. RICIS and Core constraints

1. Core сохраняет порядок `L1 → SP4 → SP2 → O(1) → A1/A4 → type consistency → standard operations`, как определено нормативными документами.
2. Conditions, constraints, claim и deferred expressions остаются data/expression trees. Endpoint и renderer не имеют права компилировать пользовательский delegate для proof.
3. JSON/LaTeX/Log получают один existing derivation. Generic Lean export performs controlled rejection; structured Lean is restricted to supported typed rows.
4. HTTP input ограничивается grammar `LambdaTextParser`, size limits и безопасными diagnostics; endpoint не принимает C# code, reflection dispatch или arbitrary theorem source.
5. Каждый новый public Core endpoint/DTO method получает прямой regression test согласно `PUBLIC_API_TEST_POLICY.md`.

## 9. Затронутые компоненты

| Слой | Компоненты | Изменение |
|---|---|---|
| Core | `Ricis.WebApi`, `RicisAcademicProofExtensions`, typed proof/document types | Ввести API adapter поверх существующего canonical proof run; не дублировать solver. |
| API contract | Request/response DTO и error mapping | Добавить versioning, bounded payload, correlation и evidence fields. |
| Frontend infrastructure | `RicisWasmBridge`, `IRicisCoreEngine`, endpoint resolver | Перевести proof calls на C# transport; fallback запретить на production path. |
| Application | `mapStore.ts`, `logic.ts`, proof consumers | Привязать state transition к authoritative status, а не к goal match/placeholder. |
| UI | `RicisProofConsoleModal`, trust badge/recovery view | Отобразить status, limitation, request ID и recovery action. |
| QA | Core regressions, API smoke, Vitest contracts, mutation/stress gates | Проверить semantic status, malformed payload, anti-fallback, no false resolved. |

## 10. Риски и mitigating controls

| Риск | Последствие | Контроль |
|---|---|---|
| Generic expression ошибочно маркируется Lean-verified | Ложная формальная гарантия | Controlled rejection вне structured Lean bridge; evidence mandatory. |
| Bridge тайно использует fallback | Разные результаты Core и UI | Explicit anti-fallback tests/spies на все proof methods. |
| Map state всё ещё зависит от `goalMatched` | Ложный `resolved` | Central state policy с status-to-state mapping и regression tests. |
| DTO потеряет trace/evidence | Невоспроизводимый proof | Required fields; malformed successful response rejected. |
| Два независимых proof runs для export/verify | Несогласованные документы | Export consumes proof snapshot/correlation ID only. |
| Минорное API изменение без version discipline | Broken consumers | API version marker, OpenAPI regression, SemVer review. |
| Legacy proof records массово повышаются формально | Ложный historical evidence | Classification/reconstruction backlog, no automatic promotion. |

## 11. Acceptance criteria Step 1

Следующий этап можно начать, если владелец подтверждает, что:

1. C# Ricis.Core является единственным production authority для proof APIs.
2. `resolved` требует `LEAN_VERIFIED`; `TRUSTED_AXIOM` отображается честно и требует отдельной policy для resolved transition.
3. Legacy fallback удаляется из production proof path, а недоступность Core является typed recovery state.
4. Endpoint использует один existing Core derivation и не создаёт второй proof engine.
5. Unsupported generic Lean shape возвращает controlled rejection.
6. Seeded proofs не получают массового повышения без individual evidence.
7. После Step 1 будет подготовлен только architecture/DTO contract, затем QA test specification, и лишь после второго подтверждения начнётся код.

## 12. Следующий шаг после подтверждения

После ответа владельца **«ОК»** будет подготовлена **Step 2: System Architecture / DTO Contract**. Она будет содержать только интерфейсы, route shapes, versioned DTO, state transition policy и migration sequence — без реализации.
