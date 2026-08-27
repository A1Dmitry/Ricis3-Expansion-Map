# P1 Catalog Navigation and Core Status — Шаг 1: business specification

**Статус:** `DRAFT — ожидается явное подтверждение пользователя для перехода к Шагу 2: TypeScript architecture/contracts.`  
**Рабочая ветка:** `fix/p1-node-navigation-and-core-status` от `main` `3286881`  
**Основание:** read-only production inspection URL `?node=real-catalog-98&lang=en` и локальное воспроизведение по исходникам.  
**Применённые паттерны:** P-01 (context recovery), P-02 (RICIS normative gateway), P-06 (Core-first integration), P-08 (causal UI diagnosis), P-09 (version/release; только после будущей реализации).

> **Нормативная граница.** RICIS III является абсолютным семантическим источником. Эта задача исправляет только отображение, навигацию и честное operational-disclosure состояние. Она не реализует, не меняет и не интерпретирует преобразования сингулярностей, включая `0/0`; не создаёт доказательств и не повышает trust status.

## 1. Решение задачи

Пользователь должен иметь возможность перейти по опубликованному URL или найти идентификатор `real-catalog-98`, увидеть точную карточку существующего узла **«Распределение богатства Парето»** и её текущую границу evidence: `unresolved`, без Lean/Core proof. В текущей deployed карте URL сохраняет параметр, но detail view не появляется; поиск по точному названию и ID показывает ноль результатов.

Причина воспроизведена в исходниках. `real-catalog-98` присутствует в `KNOWN_SINGULARITY_PROBLEMS` (`src/model/catalog.ts`), но отсутствует в `initialMap`. Hydration добавляет в persisted graph только отсутствующие узлы из `initialMap`; migration использует catalog для ремонта **уже существующих** узлов, но не добавляет отсутствующие catalog entries. Следовательно, node ID может быть распознан URL service, однако отсутствует в `map.nodes`, `selectedNode`, `visibleNodeIds`, search и accessible list. Вторичное ограничение: текущая функция поиска сопоставляет title, description и target function, но не canonical `node.id`.

Вторая P1 проблема относится к честности runtime-status. На GitHub Pages стандартный same-origin endpoint `/api/ricis-core/health` недоступен (`404`), но header начинает с нейтрального `Core: не проверен`. Это не ошибочный mathematical result — Core-first contract уже запрещает fallback invariant — но UI должен до явной проверки прозрачно сообщать, когда production Core endpoint для текущего static deployment не сконфигурирован/недоступен.

## 2. User story и сценарии

> Как пользователь карты RICIS III, я хочу, чтобы canonical node URL и поиск по canonical ID всегда приводили к реальной карточке узла из опубликованного catalog. Я хочу видеть настоящий статус доказательств и runtime Core, а не делать вывод о вычислении или Lean evidence по workflow-виджету.

| Шаг | Действие пользователя | Требуемое поведение системы |
|---|---|---|
| 1 | Открывает `?node=real-catalog-98`. | После hydration узел существует в карте, выбран и раскрывает доступную карточку/детали. |
| 2 | Читает карточку. | Отображаются title, description, target, state `unresolved` и явное отсутствие Lean/Core evidence. Node не меняет state. |
| 3 | Ищет `real-catalog-98`. | Канонический ID сопоставляется без учёта регистра; результат содержит ту же карточку. |
| 4 | Ищет точный title. | Результат содержит ту же карточку. |
| 5 | Открывает map на GitHub Pages без remote Core configuration. | Header сообщает, что Core endpoint не доступен/не сконфигурирован для deployment; отсутствует результат вычисления. |
| 6 | Открывает приложение с валидным explicitly configured HTTPS remote Core endpoint. | UI сохраняет existing lazy probe flow: status до probe не выдаёт готовность; после явного health-check показывает только фактический typed result. |

## 3. P1 scope

| Область | Требуемое изменение результата | Граница |
|---|---|---|
| Canonical catalog reconciliation | Все source-defined catalog nodes, отсутствующие в stored/seed map, добавляются детерминированно и не дублируются. | Не удалять пользовательские nodes; не перезаписывать source-locked external Lean payload. |
| URL selection | Valid canonical `node` после hydration открывает конкретный node detail в 3D и accessible-list режимах. | Unknown ID получает явный not-found disclosure; URL не превращается в другой ID. |
| Search | Структурно включает canonical `id`, title, description, target function и только public metadata. | Не индексировать proof source/secret/session information. |
| Evidence view | Узел без external Lean/approved Core evidence явно остаётся `unresolved` / `NO_PROOF_EVIDENCE`. | Не создавать `LEAN_VERIFIED`, `TRUSTED_AXIOM`, `QED_VERIFIED`, proof или invariant. |
| Core header status | Initial/static state честно описывает configured/unavailable endpoint. | Не запускать Core при startup, не использовать TypeScript fallback как calculation. |

## 4. Недопустимые изменения

| Запрет | Причина |
|---|---|
| Изменение `state: 'unresolved'` или economic/provenance data `real-catalog-98` ради видимости | Visibility не является доказательством или решением задачи. |
| Добавление автоматического `solveNode`, proof, Lean source, theorem, source hash или trust label | Каталоговый узел не имеет kernel evidence. |
| Изменение RICIS аксиом, `L1_IDENTITY`, SP1–SP4, operations или вычисления `0/0` | Задача только о приложении и evidence navigation. |
| Превращение `404` endpoint в success, silent fallback или fake `ready_*` badge | Нарушает Core-first и создаёт ложный operational/mathematical status. |
| Очистка IndexedDB как скрытое «исправление» | Удаляет user state и не устраняет reconciliation cause. |
| Удаление/переименование existing public identifiers | Нарушает links, stored selections и semantic identity SP4. |

## 5. RICIS vocabulary и trust classification

| Элемент | Статус | Значение в этой задаче |
|---|---|---|
| `real-catalog-98` | `REQUIRES_CORE_LEAN` / workflow `unresolved` | Каталожная research task; не результат. |
| URL `node` | `STRUCTURAL_REFERENCE` | Сохраняет точную identity node, но не устанавливает proof. |
| Search by ID | `STRUCTURAL_MATCH` | Сопоставление semantic identifier, не численное/классическое вычисление. |
| Catalog reconciliation | `OPERATIONAL_DATA_INTEGRITY` | Восстанавливает присутствие source-defined node in UI state. |
| Core endpoint health | `OPERATIONAL_DIAGNOSTIC` | Может подтвердить доступность runtime; не доказывает RICIS theorem. |
| Lean evidence | `ABSENT` для selected node | Не может быть выведено из UI state, health response or map count. |

No new singularity conclusion is introduced. Therefore no A1/A4/A6 transform is applicable. The retained RICIS condition is preservation of identity: a URL and catalog record with the same canonical ID must not silently resolve to a different node.

## 6. Acceptance criteria

| ID | Acceptance criterion |
|---|---|
| P1-AC-01 | Fresh seed, persisted pre-v5/current migration state and valid imported state each contain exactly one `real-catalog-98` after hydration; no duplicate IDs are introduced. |
| P1-AC-02 | Hydration preserves custom nodes, existing maps, node state, external Lean locked source bytes and prior evidence records while adding only missing canonical catalog records. |
| P1-AC-03 | `?node=real-catalog-98` selects the existing node after hydration and renders its detail/card in desktop 3D and accessible list presentation. |
| P1-AC-04 | Search by exact ID and exact title returns `real-catalog-98`; matching is locale-safe/case-insensitive and respects existing visibility filters only when those filters are deliberately active. |
| P1-AC-05 | Unknown URL node ID has a visible, non-mutating not-found status with no selection of an unrelated node. |
| P1-AC-06 | Node detail states its current workflow/trust boundary and cannot show Lean/Core verification when evidence is absent. |
| P1-AC-07 | Static deployment with no configured viable Core endpoint displays a clear unavailable/unconfigured status before a user could infer a Core result. Startup stays lazy and sends no health request automatically. |
| P1-AC-08 | Valid remote HTTPS endpoint retains existing explicit health-check flow; all health outcomes remain typed and no fallback invariant is rendered. |
| P1-AC-09 | New tests cover catalog reconciliation, duplicate prevention, deep-link restoration, ID search, title search, unknown ID and static Core-status disclosure. |
| P1-AC-10 | TypeScript strict typecheck, all Vitest tests, production build, audit/release consistency checks and manual deployed-style regression pass. A patch version increment and QA report are included only after implementation. |

## 7. Risks and mitigations

| Risk | Severity | Mitigation |
|---|---:|---|
| Catalog reconciliation overwrites user data | Critical | Add-only, ID-based source reconciliation; immutable existing evidence and user nodes remain untouched; negative tests. |
| UI card existence is misread as proof | Critical | Explicit `unresolved`/no-evidence disclosure and no trust promotion path. |
| ID matching creates ambiguous selection | High | Exact canonical ID match is deterministic; node IDs remain unique; unknown state is explicit. |
| Core check creates startup traffic or false readiness | High | Configuration diagnosis is local; network health remains user-triggered and typed. |
| Fix masks root cause by clearing persistence | High | Reconciliation test starts with current-version persisted data and verifies it is repaired without deletion. |
| Scope expands into RICIS engine work | Critical | No engine, solver, singularity, theorem, proof or numerical change is in scope. |

## 8. Impact and migration plan

The likely affected bounded areas are catalog reconciliation/persistence, search projection, node-selection presentation, URL restore orchestration and Core endpoint status presentation. `UrlShareService` itself already performs only thin parsing/updating and should not acquire duplicated catalog/persistence responsibility. `AccessibleMapFallback` is a passive renderer and should continue to receive a prepared node projection rather than carry hydration logic.

Step 2 must define a small single-owner contract for canonical catalog reconciliation and a typed startup/disclosure projection for the Core endpoint. It must determine whether migration version `6` is sufficient, or whether add-only reconciliation must run independently from a one-time migration marker to protect existing current-version IndexedDB data. No implementation has been selected in this Step 1 document.

## 9. Complexity assessment

The task is **medium complexity (3/5)**. The source change should be small, but correctness depends on preserving user persistence and proof-trust boundaries across seed, IndexedDB, import, migration, 3D presentation, accessible list and explicit Core health interactions.

| Increment | Deliverable | Gate |
|---|---|---|
| Step 1 | This business specification | **Await user confirmation.** |
| Step 2 | Isolated TypeScript contracts/data-flow design, no production implementation | Requires explicit `OK`. |
| Step 3 | Vitest QA specification and executable tests | Requires explicit `OK`. |
| Step 4 | Minimal implementation, version update, typecheck/test/build/regression evidence | Requires explicit `OK`. |

## 10. Approval boundary

Approval of this document authorizes **only Step 2 architecture/contracts**. It does not authorize code implementation, version change, test implementation, commit, push, pull request, deployment, Core configuration, or alteration of node/proof state.

**Requested confirmation:** reply **`OK`** to proceed to Step 2.

## 11. Пошаговый execution plan до проверенного результата

| Этап | Действие | Контроль завершения | Результат |
|---|---|---|---|
| 1 | Зафиксировать этот Step 1 scope. | Пользователь подтверждает `OK`; статус узла остаётся `unresolved`. | Разрешён переход только к архитектурным контрактам. |
| 2 | Спроектировать один owner для `MapStatePatch.edges`: validate → canonicalize → merge → idempotency; определить typed rejection reasons. | Нет реализации; contracts запрещают unknown endpoint, self-edge, duplicate edge, missing source/target и state/proof promotion. | Утверждённый Step 2 contract. |
| 3 | Написать Vitest QA до реализации. | Тесты сначала red: new node plus `core-agi-target → real-catalog-98`; exact repeat idempotent; invalid edges rejected; no proof/state mutation. | Утверждённый Step 3 QA suite. |
| 4 | Реализовать минимальную edge merge семантику в существующем `MapPatchIngestionService`; вернуть `nextEdges` в UI/store boundary. | Тесты green; existing full-state import и node-only patches продолжают работать. | Importer действительно применяет `edges`, а не игнорирует их. |
| 5 | Подготовить `RICIS.MapStatePatch` JSON с одной nodePatch и одной edge. | Validation сообщает `patch_merge`; apply result: `createdNodeCount: 1`, `createdEdgeCount: 1`, `proofsAttachedCount: 0`. | Безопасный пользовательский JSON для импорта. |
| 6 | Выполнить UI regression в fresh/persisted deployment-like state. | Deep-link, search by ID/title и accessible list показывают `real-catalog-98`; graph contains `core-agi-target → real-catalog-98`; node remains `unresolved`. | Фактически исправленные связи в карте. |
| 7 | Провести `tsc`, Vitest, production build, quality/release checks; обновить patch version и QA evidence. | Все gates PASS, diff contains no engine/axiom/proof changes. | Готовый commit/PR только после отдельной авторизации. |

> **Acceptance snapshot:** успехом считается не наличие JSON-файла, а состояние карты после его импорта: node `real-catalog-98` существует ровно один раз, имеет связь `core-agi-target → real-catalog-98`, сохраняет `state: "unresolved"`, не содержит нового proof/evidence, открывается по deep-link и находится поиском по title и ID.
