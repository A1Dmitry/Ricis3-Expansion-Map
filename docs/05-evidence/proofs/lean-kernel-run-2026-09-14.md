# Lean kernel run — фиксированный прогон ядра Lean 4.33.1 по артефактам `artifacts/proofs`

**Дата:** 2026-09-14
**Версия приложения:** 0.4.182
**Workflow:** [`lean-artifact-kernel-check.yml`](../../../.github/workflows/lean-artifact-kernel-check.yml) (Lean Artifact Kernel Check)
**Run (первый зелёный с полным evidence):** [run 34851801990](https://github.com/A1Dmitry/Ricis3-Expansion-Map/actions/runs/34851801990), commit `2e8353f`, PR #36
**Ядро:** Lean 4.33.1, x86_64-unknown-linux-gnu, commit `819816b2e0a3bf405af45ae5c7af2491d8f5bee6`, Release (установлен через elan, `--default-toolchain 4.33.1`)

---

## 1. Что проверено и как

Самодостаточный артефакт (без `import Mathlib`) проверяется ядром Lean командой
`lean +4.33.1 <файл>` в окружении GitHub Actions (ubuntu-latest). Для каждого файла
фиксируются: sha256 исходника, полный вывод компилятора и вывод `#print axioms`.
Артефакты workflow не модифицирует — он только записывает evidence (AGENTS.md §7, E-04).

**Почему прогон выполняется в CI, а не локально в песочнице:** среда агента не имеет
доступа к CDN релизов Lean (`releases.githubusercontent.com`, `elan-init` с
`raw.githubusercontent.com`, asset-CDN) — доступен только `github.com`/API. Пин-инструменты
и запуск ядра в этом окружении невозможны; воспроизводимое исполнение с зафиксированным
toolchain выполняется на GitHub-раннерах, где сеть полная, и evidence публикуется в run
(step summary + artifact + комментарий PR).

## 2. Evidence прогона (дословно из run 34851801990)

```text
Lean kernel run — 2026-09-14T13:51:16Z
Lean (version 4.33.1, x86_64-unknown-linux-gnu, commit 819816b2e0a3bf405af45ae5c7af2491d8f5bee6, Release)
toolchain: lean 4.33.1 (pinned via elan, default-toolchain)
host: ubuntu-latest (GitHub Actions)
```

### Вывод компилятора (полный лог `database-a6-minimal-core-check.lean`)

```text
'RICIS3.MinimalA6Check.Regression.database_a6_bridge' does not depend on any axioms
```

* Компилятор завершился с кодом 0 (без ошибок и без `sorryAx`);
* `#print axioms` подтверждает: теорема **не зависит ни от одной аксиомы** —
  чистая конструкторная цепочка (`Derivation.single` → `Rewrite.a6`), без `sorry`/`admit`.

### sha256 исходников (all 16 files, `artifacts/proofs/*.lean`)

```text
4002d1c900271d7526f8b455c277f32a91ac99a613e55d8d25f09edcd7860073  RicisAgiTarget.lean
cc4097efd4aca8aea0061738fd02078ea87d91af0a59726e03baaf7612245e62  database-a6-0_5-inf_3.generated.lean
963f701f3c87f7994f3784944250b46df5026e71be4ae8279bf41cf4d4e99d2c  database-a6-0_5_inf_3.standalone.lean
502e8a3852dae2e7aa78a92157be031f120c7f22fc4a01daf87ca83fe9f2d5c2  database-a6-minimal-core-check.lean
adde2c29a7ac44592a611678f1e1a9630fc73f131ac3663b5e7eb219bd64bbde  database-registry-120-jacobian.generated.lean
4d974e643b4480169897685d21254e10ca607416912e43275491c6dd3cdd1617  database-registry-120-jacobian.standalone.lean
e6ab1b1db54ff04cdc3fb5a647cb6beedd7daba84bcd1272b51123519244339a  jacobian-counterexample-full.lean
7607fe7bb27a55c68c9120fe9c5a8c2f693eb5a83c57b0c2ce9a8e5897947c2d  ricis-backend-exact-reduction.standalone.lean
f48f78a3021e94314b5e73729b92721ac10d38b867fca6a18d01aa3dac3c1c2a  ricis-chatbot-monetization.lean
2e043f2738df8d8b02754aebb5fa93580fb87e6cc71733557c620c463c4de56b  ricis-jacobian-conjecture.standalone.lean
6ee144b7e438a112b1590c65625da5b88baf615cb53315f52b6935d91cacda57  ricis-kernel-ast-sp5.standalone.lean
85edafc2dd5fdcd3fc694cd246f8faf9337e9b036fe05f9fcd105b95cc6cc77a  ricis-navier-stokes-ast-bridge.standalone.lean
85fd84aca47bf193245a65617c64a5d5b47c101863e868d3260b1e71e4c9798b  ricis-riemann-zeta-ast-bridge.standalone.lean
368dc0359e3f37391e3e830fc1abf9107b8e3f1f37d0a7f3ac6d2b3bc36839f2  ricis-seed-expansion-a11.lean
cebe44f3e058d6d68b9b6df267300162aa53d4ce5730e3e98d623991a4363849  ricis-universal-orchestration-template.lean
fbd99bbdefd05aaff83fe4325377681f7e3b7099a3c9f5234b3ff4def86077e2  ricis-v79-monolith.standalone.lean
```

## 3. Классификация артефактов после прогона

| Статус | Файлы | Основание |
| :--- | :--- | :--- |
| `LEAN_VERIFIED` | `database-a6-minimal-core-check.lean` | Ядерный прогон Lean 4.33.1: exit 0, без `sorryAx`, `#print axioms` = «does not depend on any axioms» |
| `REQUIRES_CORE_LEAN` | 14 файлов с `import Mathlib` (в т.ч. `ricis-seed-expansion-a11.lean`, `jacobian-counterexample-full.lean`, `ricis-v79-monolith.standalone.lean`) | Сборка Mathlib с нуля не помещается на стандартный runner (диск), зафиксированного prebuilt-артефакта Mathlib не существует; статут не повышается |
| Фрагменты (не standalone-артефакты) | `database-a6-0_5-inf_3.generated.lean`, `database-registry-120-jacobian.generated.lean` | 3-строчные фрагменты без namespace/imports, ссылаются на символы из соответствующих `.standalone.lean`; ядром не проверяются отдельно |

Статус записывается **снаружи** исходника (metadata); байты артефактов не изменяются
(AGENTS.md §7 — неизменяемый исходник).

## 4. Граница доверия (строго)

* Доказано: нормативная структурная перепись A6-моста для типизированного ядра
  (`0_5 × ∞_3 → 5 × 3` как `Derivation`) проверяется ядром Lean 4.33.1 без всяких аксиом.
* Не утверждается: что 14 Mathlib-артефактов верифицированы (их статус не менялся);
  что Lean-модель семени (`ricis-seed-expansion-a11.lean`) проверена ядром
  (`REQUIRES_CORE_LEAN`); эмпирические утверждения о Clay/AGI — вне домена Lean-прогона.
* `jacobian-counterexample-full.lean` содержит явное доверенное соглашение
  `axiom trusted_full_jacobian_contract` — по design (trusted-contract mode, видимость
  через `#print axioms`); до ядрового прогона с Mathlib его аксиоматическая зависимость
  не зафиксирована.

## 5. Воспроизводимость

* Повторный прогон: push в `artifacts/proofs/**` или workflow-файл (триггеры `pull_request`/`push`/`workflow_dispatch`), либо `gh workflow run lean-artifact-kernel-check.yml`.
* Каждый прогон публикует evidence: step summary run, артефакт `lean-kernel-evidence` (retention 90 дней) и комментарий PR с полным логом.
* Добавление файла в ядровую проверку — одна строка в `NO_MATHLIB_ARTIFACTS` (явный allowlist).
