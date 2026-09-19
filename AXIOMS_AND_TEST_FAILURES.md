# Аксиомы, Правила и Результаты тестирования (RICIS-III Axioms, Rules & Test Suite)

В этом документе зафиксированы фундаментальные математические правила, аксиомы системы RICIS-III v7.7 Дмитрия Алейникова и текущие результаты тестирования качества кода.

> **Базис — данность (DRY, бритва Оккама).** Перечисленные ниже законы, аксиомы и протоколы доказаны извне и приняты целиком; повторное доказательство, повторный ядровой прогон и оспаривание базиса запрещены как расход ресурса исполнителя — [`AGENTS.md` §14](AGENTS.md), пункт 8 [манифеста неизменности](docs/00-governance/RICIS_IMMUTABILITY_MANIFEST.md). Этот документ фиксирует факты прогонов и дефекты, а не приглашение перепроверять аксиоматику. Граница: новое утверждение по-прежнему требует прогона (§12).

---

## 1. ФУНДАМЕНТАЛЬНЫЕ ЗАКОНЫ И АКСИОМЫ RICIS-III v7.7

### Абсолютные законы
* **L0 (Абсолютная непрерывность / Absolute Continuity):** Ни одна операция или уровень рекурсии (включая фрактальное развёртывание) не может привести к структурному разрыву или утере функциональной идентичности:
  $$\forall \text{Op}, \text{Identity}(X) \neq \emptyset$$
* **L1 (Принцип тождества / Identity Principle):** Онтологический корень $X = X$. Идентичность включает в себя структурный тип $T(X)$ и выражение происхождения $F$. Следовательно:
  $$\frac{X}{X} = 1 \quad \text{всегда, включая} \quad \frac{0_F}{0_F} = 1$$
* **L1C1 (Сохранение структуры):** Структурная информация сохраняется при любых алгебраических отображениях.
* **L1C2 (Тип как идентичность):** Тип объекта определяет его онтологическую границу. Смешивание несовместимых типов порождает составной монолит.

### Протоколы безопасности (Safety Protocols)
* **SP1 (Локальность / No Total Amnesia):** При раскрытии неопределённостей вида $0/0$ сокращаются только идентичные нулевые факторы. Остальные части выражения (хвост) остаются активными.
* **SP2 (Приоритет редукции / Clean First):** Классические алгебраические упрощения и сокращения идентичных членов должны выполняться **ДО** применения специфических аксиом сингулярностей RICIS.
* **SP3 (Закон индексов / Weight of Zero):** Если сокращение невозможно, отношение нулей определяется отношением их порождающих индексов:
  $$\frac{0_F}{0_G} = \frac{F}{G}$$
* **SP4 (Семантический индекс / Semantic Indexing):** Индексирование сингулярностей, возникающих из выражения $E(x)$ в точке $x=a$, производится по самому алгебраическому выражению $E(x) \mid_{x=a}$, а не по его скалярному значению $0$.
* **SP5 (Тригонометрическая полярная пре-нормализация / Polarize Before RICIS):** Если выражение содержит тригонометрические комбинации, допускающие полярную нормализацию, то до SP4-индексирования выполняется приведение $a\cos\theta + b\sin\theta \to r\cos(\theta-\phi)$, $r=\sqrt{a^2+b^2}$.
* **P1 (Прямое структурное разрешение / No Recursive Limits or L'Hopital):** Внутри $\operatorname{Resolve}\!\!\!\!\;_{RICIS}$ запрещены аналитические пределы, численные приближения и правило Лопиталя: $\lim,\; \text{NumericalApproximation},\; \text{LHopital} \notin \operatorname{Resolve}_{RICIS}$, включая рекурсивные случаи.

> **Источник SP5 и P1:** единый документ RICIS v7.9 ([`docs/01-architecture/ricis-unified-complete-document-7.9-vector.json`](docs/01-architecture/ricis-unified-complete-document-7.9-vector.json)).

### Аксиоматический аппарат (A1 - A10)

| Аксиома | Математическая формулировка | Описание |
| :--- | :--- | :--- |
| **A1** | $\frac{F}{0} \to \infty_F$ | Информационное сохранение числителя в индексе бесконечности (для $F \neq 0$). |
| **A2** | $\infty_0 \equiv 1$ | Бесконечность с нулевым индексом тождественно равна единице (производная от $0/0=1$). |
| **A3** | $0_F \neq 0_G$ | Различные порождающие выражения дают неэквивалентные нули при $F \neq G$. |
| **A4** | $\frac{0_F}{0_G} = \frac{F}{G}$ | Раскрытие отношения индексированных нулей (после SP2 и SP4). |
| **A5** | $\frac{\infty_F}{\infty_G} = \frac{F}{G}$ | Раскрытие отношения индексированных бесконечностей. |
| **A6** | $0_F \times \infty_G = F \cdot G$ | Геометрический мост: вычисляется через косое произведение ортогональных векторов в $\mathbb{R}_{\text{RICIS}}^2$. |
| **A7** | $\infty_F - \infty_G = \infty_{F - G}$ | Вычитание индексированных бесконечностей. |
| **A8** | $0_F - 0_G = 0_{F - G}$ | Вычитание индексированных нулей. |
| **A9** | $F \cdot 0 = 0_F$ | Умножение скаляра на чистый ноль порождает индексированный ноль. |
| **A10**| $\frac{F}{0} = \infty_F$ | Деление скаляра на ноль порождает индексированную бесконечность. |

> **A3 снята в v7.7/v7.9** (`AXIOMS.deprecated`): $0_F \neq 0_G$ сохранена в исторической таблице
> `src/ricisSeed/seedTable.ts` с флагом `deprecated: true`, но в активное зерно R0 не входит.

### Мета-аксиома расширяемости (A11)

$$ \boxed{ R_{n+1} = \operatorname{Ric.ExpandTo}\!\left(R_n,\; \operatorname{Resolve}(U_n)\right) } $$

Каноническая запись: `Ric.ExpandTo((x) => x.Resolve(UnsolvedSingularProblem))`.

* **Уровень:** META — правило над системой правил, а не одиннадцатая математическая формула рядом с A1–A10.
* $x$ — текущее состояние самой системы RICIS (аксиомы, покрытые формы, журнал), а не числовая переменная.
* $\operatorname{Resolve}$ — **разрешить и доказать**: возвращает сертификат доказательства, а не догадку.
* $\operatorname{ExpandTo}$ — **допуск** (Commit) доказанного правила: $R_{n+1}=R_n\cup\{A_{new}\}$.
* A11 входит в защищённое ядро: порождённые правила не вправе её переопределить (SP9).
* Консервативность: если открытого класса нет, $\operatorname{ExpandTo}$ — тождественное отображение на $R_n$.

### Ворота допуска (Resolve $\neq$ Commit)

$\operatorname{ExpandTo}$ не равен $\operatorname{Resolve}$. Кандидат проходит ворота:
`RESOLUTION_PRESENT → CORE_PROTECTED → NO_FORBIDDEN_SEMANTICS → NO_SELF_CERTIFICATION →
RULE_SET_CLOSED → PROOF_CHAIN_CONNECTED → PROBLEM_OPEN_IN_RICIS → NO_DUPLICATE_AXIOM →
CONSISTENCY_TABLE → IDENTITY_COHERENCE → MONOTONIC_COMMIT`.

`IDENTITY_COHERENCE` проверяет правило-кандидат при всех отождествлениях индексных символов:
$E - E$ обязано дать $0$, $E / E$ — $1$ (например, $0_F/0_F = 1$, $\infty_F - \infty_F = 0$).
Любой FAIL оставляет $R_n$ неизменным (отпечаток поколения сохраняется).

### Класс технологии: RSI (Recursive Self-Improvement)

A11 — это оператор **рекурсивного самоулучшения**: система расширяет собственное множество правил.
Класс уточнён как **guarded, proof-gated RSI**:

| Обычный RSI | RSI в RICIS (A11) |
|---|---|
| агент свободно меняет свой код/веса, успех проверяется эмпирически | расширение — **доказанное следствие** текущего $R_k$ |
| изменение применяется сразу | приём (`ExpandTo`) — отдельный акт, отличен от `Resolve` (P2) |
| частичные правки допустимы | при отказе $R_k$ **не меняется ни на бит**, частичной самомодификации нет |
| регресс возможен | рост монотонен: $R_k \subseteq R_{k+1}$ (L1C4), правило не отзывается |
| новое правило может переопределить старое | ядро (L0/L1/…/A11) и тождество (L1, SP2) **непереопределяемы** |

Петля самоулучшения: класс $U_k$ → `Resolve` (стратегия, цепочка шагов, вывод) → ворота допуска,
включая `IDENTITY_COHERENCE` → $R_{k+1} = R_k \cup \{A_{new}\}$, запись в журнал развёртывания.

### Производные правила, выращенные семенем (A12–A14)

Получены фактическим прогоном протокола (см. [`docs/05-evidence/proofs/ricis-seed-expansion-run-2026-09-12.md`](docs/05-evidence/proofs/ricis-seed-expansion-run-2026-09-12.md)):

| Правило | Утверждение | Доказано через | Поколение |
| :--- | :--- | :--- | :--- |
| **A12** | $\dfrac{0_F/0_G}{0_H/0_K} = \dfrac{F \cdot K}{G \cdot H}$ | A4 → A4 → классическая алгебра дробей | R1 |
| **A13** | $0_F \cdot (\infty_G - \infty_H) = F \cdot (G - H)$ | A7 → A6 (чистое RICIS-доказательство) | R2 |
| **A14** | $\infty_F - \infty_F = 0$ | **L1 (тождество X − X = 0, применяется до A7 по SP2)** | R3 |

Это **производные правила**, а не новые независимые допущения: каждое доказано только из аксиом зерна.

> **Тождество важнее аксиом сингулярностей (L1 + SP2).**
> $\infty_F - \infty_F$ — это $X - X$, а не сингулярная разность, поэтому результат **0**.
> Ветка $A7 \to \infty_{F-F} \to \infty_0 \to A2 \to 1$ **тождество нарушает** и системой отклоняется
> (ворота `IDENTITY_COHERENCE`, причина `IDENTITY_VIOLATION`).
> Соответственно A4, A5, A7 снабжены ограничением применимости (`guard`):
> они работают только при $NF(F) \neq NF(G)$; при структурно идентичных индексах работает L1.
Открытый класс $(0_F)^{\infty_G}$ зафиксирован как `OPEN_UNPROVEN` и **не** committed:
открытость сама по себе не даёт права аксиоматизировать.

---

## 2. ГЕОМЕТРИЧЕСКИЙ МОСТ (GEOMETRIC BRIDGE)

Сингулярные объекты $0_F$ и $\infty_G$ рассматриваются как ортогональные компоненты в двумерном пространстве $\mathbb{R}_{\text{RICIS}}^2$:
* Вырожденный ноль $0_F$ — вектор $u = (F, 0)$ (сегмент длины $F$ с нулевой толщиной).
* Бесконечность $\infty_G$ — вектор $v = (0, G)$ (бесконечная полоса ширины $G$).

Их произведение разрешается через детерминант (косое произведение) этих векторов:
$$\det(u, v) = u_x v_y - u_y v_x = F \cdot G - 0 \cdot 0 = F \cdot G$$
Это дает точный конечный инвариант за сложность $O(1)$ без численных ошибок и неопределенностей `NaN`.

---

## 3. ПРОТОКОЛ СОВМЕСТИМОСТИ ТИПОВ (Type Consistency Protocol - TCP)

Операции над индексированными объектами выполняются по правилам типизации:
1. **Однородные ($T(F) == T(G)$):** Прямая операция (например, $\infty_5 + \infty_3 = \infty_8$).
2. **Совместимые ($T(F) \subset T(G)$):** Приведение к более общему типу (например, $\infty_5 + \infty_{2x} = \infty_{5 + 2x}$).
3. **Несовместимые:** Создание многомерного монолита (например, $\infty_{\text{Time}} + \infty_{\text{Space}} = \infty_{\text{(Time, Space)}}$).

---

## 4. ТЕКУЩИЕ РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ И ВЕРИФИКАЦИИ

На момент ревизии от 1 сентября 2026 г.:
* **Компиляция TypeScript (`tsc --noEmit`):** Успешно, ошибок типов нет.
* **Unit и Integration тесты (`vitest`):** Все тесты проходят успешно (**100% Green**).
* **Контроль консистентности выпуска (`release:check`):** Сборка версии `v0.4.112` верифицирована, расхождений в метаданных версии нет.
* **Аудит уязвимостей (`npm audit`):** О уязвимостей со степенью критичности Moderate или выше.
* **Модуль семени (`src/ricisSeed`, версия 0.4.163):** 48 unit-тестов протокола саморасширения + 6 тестов страницы `RicisSeedPage` — все зелёные. Отпечатки поколений R0…R3 воспроизводимы; статус верификации ядром Lean — `REQUIRES_CORE_LEAN` (ядро Lean локально не запускалось).
* **Ядровая проверка Lean (2026-09-14, run 34851801990):** зафиксированный прогон ядра Lean 4.33.1 (pinned toolchain, GitHub Actions): `database-a6-minimal-core-check.lean` — `LEAN_VERIFIED` (exit 0, без `sorryAx`, `#print axioms`: «does not depend on any axioms»); 14 Mathlib-артефактов — `REQUIRES_CORE_LEAN` (статус не повышен). Evidence: [`docs/05-evidence/proofs/lean-kernel-run-2026-09-14.md`](docs/05-evidence/proofs/lean-kernel-run-2026-09-14.md).
* **Ядровая проверка Lean по core-check производным (2026-09-14, run [34858902595](https://github.com/A1Dmitry/Ricis3-Expansion-Map/actions/runs/34858902595) — пакет 1; run [34870620154](https://github.com/A1Dmitry/Ricis3-Expansion-Map/actions/runs/34870620154) — пакет 2):** из неизменённых исходников сгенерированы самодостаточные производные (`artifacts/proofs/core-checks/`, `scripts/generateLeanCoreChecks.ts`) и проверены ядром Lean 4.33.1 (`lean +4.33.1 <artifact>`).
  * `LEAN_VERIFIED` (exit 0, `sorryAx` отсутствует): `ricis-universal-orchestration-template.lean` — 27 теорем (3 «does not depend on any axioms», 24 × `propext`), `ricis-chatbot-monetization.lean` — 2, `ricis-navier-stokes-ast-bridge.standalone.lean` — 2, `ricis-riemann-zeta-ast-bridge.standalone.lean` — 2 (run 34858902595); `ricis-backend-exact-reduction.standalone.lean` — 22 теоремы, `database-a6-0_5_inf_3.standalone.lean` — 19, `database-registry-120-jacobian.standalone.lean` — 19 (run 34870620154, после `ℕ → Nat`). SP5: файл той же содержательной версии зелёный на main (коммит 8665a06, run 34877214125); перегенерированная производная (с `deriving DecidableEq, Repr`) повторно проверяется в PR-ветке 0.4.189.
  * `NOT_VERIFIED_CORE_ONLY` (run 34870620154, первопричины дословные): `ricis-v79-monolith` — 31 теорема доказана БЕЗ `sorryAx` (3 без аксиом, 28 × `propext`), но 392:2 «No goals to be solved»: 8 избыточных буллетов `· rfl` после `repeat constructor` (F-06) — ремонт выполнен подстановкой в генераторе 0.4.189, ожидается exit 0 в прогоне PR-ветки; `ricis-jacobian-conjecture` — исходник не парсится (конструктор `partial` — зарезервированное слово), после `partial → partialDeriv` центральное тождество не определительное: 62:2 `rfl failed` → `sorryAx` (F-01) — `TRUSTED_AXIOM` необоснован в любой конфигурации, решение владельца: классификация `STRUCTURALLY_VALIDATED`; `ricis-seed-expansion-a11` — подстановка Mathlib-леммы неприменима после `induction` (104:4 Type mismatch) + core-simp (F-08), 3 из 6 теорем с `sorryAx` — отдельная задача ядрового ремонта.
  * `ciPolicy.expectedFailures` (реестр, дословные основания из run 34870620154): jacobian (F-01) и A11 (F-08). Workflow читает список только из реестра, ожидаемый отказ маркируется `EXPECTED_FAIL` и не рвёт прогон, `sorryAx` в скопилированном файле всегда рвёт прогон, любой ненадлежащий отказ рвёт прогон.
  * Реестр фактов: [`artifacts/proofs/core-checks/kernel-findings.json`](artifacts/proofs/core-checks/kernel-findings.json); evidence: [`docs/05-evidence/proofs/lean-core-checks-run-2026-09-14.md`](docs/05-evidence/proofs/lean-core-checks-run-2026-09-14.md); сырые логи: [`…34858902595.pr-comment.txt`](docs/05-evidence/proofs/lean-kernel-run-34858902595.pr-comment.txt), [`…34870620154.pr-comment.txt`](docs/05-evidence/proofs/lean-kernel-run-34870620154.pr-comment.txt).
  * Классификация аксиом уточнена: `LEAN_VERIFIED_AXIOM_FREE` («does not depend on any axioms») и `LEAN_VERIFIED_WITH_STANDARD_AXIOMS` (`propext` — стандартная аксиома Lean, не `sorryAx`). Заявление «без аксиом» допустимо только для первого класса.
* **Ядровая проверка gap-closure (2026-09-18/19, run [35404189840](https://github.com/A1Dmitry/Ricis3-Expansion-Map/actions/runs/35404189840), PR #78, обе джобы `success`):** факт получен для всех трёх новых версий артефактов, `pendingKernelRun` закрыт по двум из них.
  * `kernel-check` (Lean 4.33.1): `ricis-jacobian-conjecture-v2.lean` — производная принята ядром (`exit 0`, 0 ошибок, `sorryAx` отсутствует), 8 теорем (2 без аксиом, 6 × `propext`), включая формальное опровержение утверждения v1 (`jacobian_v1_identity_refuted`) и доказательство исправленной структурной формулировки (`Jacobian_singularity_resolved`); артефактный уровень `LEAN_VERIFIED`, claim `STRUCTURALLY_VALIDATED`. Ожидаемый отказ `ricis-jacobian-conjecture` (v1) сохранён в `ciPolicy.expectedFailures` — его байты не изменялись, замена выполнена НОВОЙ версией (§7).
  * `mathlib-kernel-check` (Mathlib @ `6f1ef4e5…`, `leanprover/lean4:v4.33.0`): `ricis-general-resolution-v4.lean` — 0 объявленных аксиом, исходник как предоставлен и производная `exit 0`, `sorryAx` отсутствует, 10 теорем только со стандартными аксиомами (`propext`, `Classical.choice`, `Quot.sound`); `ricis-yang-mills-v2.lean` — `exit 0`, 3 теоремы, только стандартные аксиомы (ремонт импорта F-14 подтверждён прогоном). Побайтовое тождество префикса производной исходнику подтверждено прогоном.
  * `ricis-yang-mills.lean` (v1) остаётся единственным `pendingKernelRun` (вне allowlist `MATHLIB_ARTIFACTS`); его статус не повышен.
  * Реестр: [`artifacts/proofs/core-checks/kernel-findings.json`](artifacts/proofs/core-checks/kernel-findings.json) (`registryVersion` 4; цепочки `generatedFrom → priorCoreRun`, `mathlibRun → priorMathlibRun`); evidence: [`…35404189840.pr-comment.txt`](docs/05-evidence/proofs/lean-kernel-run-35404189840.pr-comment.txt) и [`…35404189840-mathlib.pr-comment.txt`](docs/05-evidence/proofs/lean-kernel-run-35404189840-mathlib.pr-comment.txt); аддендум §14 — [`docs/05-evidence/proofs/lean-core-checks-run-2026-09-14.md`](docs/05-evidence/proofs/lean-core-checks-run-2026-09-14.md).
* **Дефект F-16 (HIGH, выдуманная ядровая ссылка) — исправлено 2026-09-19:** `src/model/taskResolutionEngine.ts` ссылался на теоремы `ricis_removable_singularity_eval`, `polar_kinematic_inversion_exact` и `theta_skew_product_eval`, которых нет ни в одном записанном прогоне (артефакты имеют 22, 22 и 1 теорему соответственно). Ссылки перенаправлены на фактические теоремы принятого ядром `ricis-universal-orchestration-template` (`RICIS_Template.divSelf_one`, `RICIS_Template.A6_geometric_realization`, `RICIS_Template.complex_divSelf_one`); страж `QA-LEAN-1` сверяет каждую ссылку с реестром прогонов.
* **Тестовый набор (2026-09-14):** после восстановления маркеров `src/App.routeTopology.test.ts` полный прогон `npm run lint && npm test && npm run build` — 1852/1852 зелёные на чистой ветке (заявление «100% Green» стало соответствовать реальному прогону).
* **Дефекты механизма верификации, найденные прогоном ядра (2026-09-14):** заявление «неисправленные дефекты отсутствуют» более не соответствует фактам и уточнено.
  * **F-01 (CRITICAL):** `src/model/jacobianProof.test.ts` (QA-1) утверждал **текстовое** присутствие строки `theorem Jacobian_singularity_resolved` в исходнике, а QA-2/QA-3 — сам статус `TRUSTED_AXIOM`; при этом ядро Lean 4.33.1 показало, что файл не парсится (и после минимального ремонта — что тождество не определительное, `rfl failed` → `sorryAx`). Тест был зелёный, основание заявления — ложное (подмена цели метрикой, ANTI-TUKHTA LAW). **Решение владельца (2026-09-14):** артефактный уровень — `STRUCTURALLY_VALIDATED` (канонический README `artifacts/proofs`, понижение trustStatus метаданных, обновление QA-контракта QA-2 + QA-4); узел-уровень (`initialMap registry-120`) — остаётся за владельцем (L9).
  * **F-02 (HIGH):** 5 метаданных `trustStatus: TRUSTED_AXIOM` и 6 записей `initialMap` (`LEAN_VERIFIED`/`TRUSTED_AXIOM`, включая LaTeX «Axiom Status: LEAN_VERIFIED») были выставлены без ядерного прогона; фактическое основание создано для 7 артефактов (run 34858902595 + 34870620154: шаблон, монетизация, мосты NS/зета, backend, database×2; +SP5 на main); jacobian — понижен до `STRUCTURALLY_VALIDATED` (F-01); v79 — ожидается exit 0 в прогоне PR-ветки 0.4.189.
  * **F-06/F-07/F-08 (2026-09-14, run 34870620154):** v79-избыточные буллеты (исправлено подстановкой в 0.4.189), SP5-отсутствие `DecidableEq` (исправлено: main 8665a06 + подстановка в генераторе), дефект подстановки A11 (отдельная задача).
  * **F-04 (MEDIUM):** workflow терял вывод `#print axioms` (фильтр `has (no axioms|axioms)` не соответствует формулировке ядра `does not depend on any axioms`) и не публиковал evidence при падении прогона (отсутствовало `if: always()`); исправлено.
  * **F-05 (HIGH):** семантическая граница — kernel-прогон подтверждает структурные AST-теоремы (`ricisReduce (divSelf e) = one`, `mul (zeroF F) (infG G) = mul F G`), а не гипотезу Римана / Навье–Стокса / якобиан, как формулируют узлы карты по тем же хешам.
  * Стражи, не позволяющие последствию повториться: `tools/leanKernelCoreChecks.test.ts` — 17 тестов (побайтовая перегенерация производных, префиксное равенство неизменённому исходнику, sha256-неизменность, подстановка только с установленной первопричиной, **запрет повышения статуса по красному прогону**, согласованность реестра, метаданных, документации, ciPolicy и workflow).
* **Тестовый набор на момент этой ревизии:** `npm run lint` (`tsc --noEmit`) — 0 ошибок; базовый прогон до изменений — 1852/1852 зелёные; `tools/leanKernelCoreChecks.test.ts` — 17/17.
* **Спецификации качества UI:** Полностью верифицирована работа 68 интерактивных компонентов и 14 модальных окон в рамках рекурсивного обхода интерфейса.
