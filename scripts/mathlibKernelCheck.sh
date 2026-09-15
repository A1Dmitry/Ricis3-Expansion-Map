#!/usr/bin/env bash
# ============================================================================
# Ядровой прогон Mathlib-артефактов (job `mathlib-kernel-check`)
# ============================================================================
#
# Запускается ПОСЛЕ подготовки lake-проекта с закреплённой Mathlib
# (`lake update` + `lake exe cache get`), потому что проверка идёт командой
# `lake env lean <файл>` внутри этого проекта.
#
# Что проверяется для каждого артефакта (AGENTS.md §7, неизменяемый исходник):
#   1) САМ ИСХОДНИК как предоставлен владельцем (`lake env lean artifacts/proofs/<файл>`);
#   2) производная mathlib-check (`scripts/generateLeanMathlibChecks.ts`) — тело
#      байт-в-байт равно исходнику, добавлен только эпилог `#print axioms`.
# Исходник при этом не изменяется ни на байт: производная — новая версия
# доказательства в отдельном каталоге.
#
# ciPolicy (anti-tukhta, тот же закон, что и в core-check прогоне):
#   * единственный источник «ожидаемых отказов» — `ciPolicy.mathlibExpectedFailures`
#     в artifacts/proofs/core-checks/kernel-findings.json (workflow извлекает список
#     в файл и передаёт сюда как EXPECTED_FAIL_FILE);
#   * отказ зарегистрированной цели → EXPECTED_FAIL, прогон не рвётся, полный лог
#     компилятора всё равно публикуется;
#   * зарегистрированная цель, которая скомпилировалась → OK + NOTE об обновлении реестра;
#   * `sorryAx` в СКОМПИЛИРОВАННОМ файле рвёт прогон всегда (stop-the-line);
#   * отказ незарегистрированной цели рвёт прогон.
#
# Переменные окружения (обязательные помечены *):
#   MATHLIB_ARTIFACTS*  — список путей исходников (repo-relative, через пробел/перевод строки)
#   LEAN_PROJECT_DIR*   — каталог lake-проекта с Mathlib (cwd для `lake env lean`)
#   EVIDENCE_DIR        — каталог evidence (по умолчанию lean-kernel-evidence-mathlib)
#   MATHLIB_CHECK_DIR   — каталог производных (по умолчанию artifacts/proofs/mathlib-checks)
#   EXPECTED_FAIL_FILE  — файл со списком зарегистрированных ожидаемых отказов (по одному пути)
#   TOOLCHAIN_LABEL     — человекочитаемая метка тулчейна для evidence
# ============================================================================
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

EVIDENCE_DIR="${EVIDENCE_DIR:-lean-kernel-evidence-mathlib}"
MATHLIB_CHECK_DIR="${MATHLIB_CHECK_DIR:-artifacts/proofs/mathlib-checks}"
EXPECTED_FAIL_FILE="${EXPECTED_FAIL_FILE:-}"
TOOLCHAIN_LABEL="${TOOLCHAIN_LABEL:-leanprover/lean4 (mathlib lean-toolchain)}"

if [ -z "${MATHLIB_ARTIFACTS:-}" ]; then
  echo "MATHLIB_ARTIFACTS не задан — проверять нечего" >&2
  exit 2
fi
if [ -z "${LEAN_PROJECT_DIR:-}" ]; then
  echo "LEAN_PROJECT_DIR не задан — нет lake-проекта с Mathlib" >&2
  exit 2
fi

mkdir -p "$EVIDENCE_DIR"
: > "$EVIDENCE_DIR/summary.txt"

{
  echo "--- environment diagnostics ---"
  echo "pwd: $(pwd)"
  echo "MATHLIB_ARTIFACTS: ${MATHLIB_ARTIFACTS}"
  echo "LEAN_PROJECT_DIR: ${LEAN_PROJECT_DIR}"
  echo "MATHLIB_CHECK_DIR: ${MATHLIB_CHECK_DIR}"
  echo "which lean: $(command -v lean || echo '<lean NOT FOUND on PATH>')"
  lean --version 2>&1 || echo "lean --version failed"
  echo "disk: $(df -h . | tail -n 1)"
} | tee -a "$EVIDENCE_DIR/summary.txt"

{
  echo "Lean kernel run with Mathlib — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "toolchain: ${TOOLCHAIN_LABEL}"
  echo "command: (cd ${LEAN_PROJECT_DIR} && lake env lean <file>)"
  echo "host: ubuntu-latest (GitHub Actions)"
} > "$EVIDENCE_DIR/toolchain.txt"

# Целевой список материализуется, чтобы evidence публиковало ровно тот же набор,
# который проверялся (никакого расхождения между шагами).
: > "$EVIDENCE_DIR/targets.txt"
for artifact in $MATHLIB_ARTIFACTS; do
  [ -e "$artifact" ] || continue
  echo "$artifact" >> "$EVIDENCE_DIR/targets.txt"
done
sort -u -o "$EVIDENCE_DIR/targets.txt" "$EVIDENCE_DIR/targets.txt"

sha256sum $(cat "$EVIDENCE_DIR/targets.txt") > "$EVIDENCE_DIR/sha256.txt" 2>/dev/null || true
for derivative in "$MATHLIB_CHECK_DIR"/*.lean; do
  [ -e "$derivative" ] || continue
  sha256sum "$derivative" >> "$EVIDENCE_DIR/sha256.txt"
done

overall=0
while IFS= read -r source; do
  name=$(basename "$source" .lean)
  log="$EVIDENCE_DIR/${name}.log"
  : > "$log"
  echo "=== ${name}: source as provided + generated mathlib-check derivative" | tee -a "$EVIDENCE_DIR/summary.txt"
  echo "--- source (as provided, immutable): ${source}" >> "$log"
  echo "\$ (cd ${LEAN_PROJECT_DIR} && lake env lean ${source})" >> "$log"
  # Список аксиом, объявленных в исходнике: это доверенные контракты, а не доказательства.
  declared_axioms=$(grep -nE '^[[:space:]]*axiom[[:space:]]' "$source" | sed 's/[[:space:]]*$//' || true)
  {
    echo "--- declared axiom contracts in the source (trusted, NOT proven by this run) ---"
    if [ -n "$declared_axioms" ]; then echo "$declared_axioms"; else echo "  (none)"; fi
  } >> "$log"

  source_rc=0
  ( cd "$LEAN_PROJECT_DIR" && lake env lean "$REPO_ROOT/$source" ) >> "$log" 2>&1 || source_rc=$?

  derivative="$MATHLIB_CHECK_DIR/${name}.mathlib-check.lean"
  derivative_rc=0
  if [ -e "$derivative" ]; then
    echo "--- generated derivative (source + #print axioms epilogue): ${derivative}" >> "$log"
    # Целостность: производная обязана быть произведена ИМЕННО из этих байтов исходника.
    # Проверяются два независимых признака: (1) побайтовый префикс, (2) зафиксированный
    # в эпилоге sha256 исходника. Расхождение — не «красный прогон», а невалидное evidence.
    {
      echo "--- integrity: derivative prefix vs immutable source ---"
      source_hash=$(sha256sum "$source" | awk '{print $1}')
      recorded_hash=$(grep -o 'Source hash : sha256 [0-9a-f]\{64\}' "$derivative" | awk '{print $NF}' | head -n 1)
      echo "source sha256            : ${source_hash}"
      echo "sha256 recorded in epilogue: ${recorded_hash:-<missing>}"
      ssize=$(wc -c < "$source")
      head -c $((ssize - 1)) "$source" > "$EVIDENCE_DIR/.source_prefix"
      head -c $((ssize - 1)) "$derivative" > "$EVIDENCE_DIR/.derivative_prefix"
      if cmp -s "$EVIDENCE_DIR/.source_prefix" "$EVIDENCE_DIR/.derivative_prefix"; then
        echo "byte-for-byte prefix: OK (тело производной = исходник без изменений)"
      else
        echo "byte-for-byte prefix: MISMATCH — производная не является копией исходника"
      fi
    } >> "$log"
    integrity_ok=1
    if [ "$source_hash" != "$recorded_hash" ]; then integrity_ok=0; fi
    if ! cmp -s "$EVIDENCE_DIR/.source_prefix" "$EVIDENCE_DIR/.derivative_prefix"; then integrity_ok=0; fi
    rm -f "$EVIDENCE_DIR/.source_prefix" "$EVIDENCE_DIR/.derivative_prefix"
    if [ "$integrity_ok" -eq 0 ]; then
      echo "    integrity: FAILED (производная не соответствует неизменяемому исходнику) — evidence недействительно" | tee -a "$EVIDENCE_DIR/summary.txt"
      overall=1
      continue
    fi
    echo "    integrity: OK (производная побайтово выведена из этого исходника)" | tee -a "$EVIDENCE_DIR/summary.txt"
    echo "\$ (cd ${LEAN_PROJECT_DIR} && lake env lean ${derivative})" >> "$log"
    ( cd "$LEAN_PROJECT_DIR" && lake env lean "$REPO_ROOT/$derivative" ) >> "$log" 2>&1 || derivative_rc=$?
  else
    echo "--- derivative ${derivative} отсутствует: запускайте scripts/generateLeanMathlibChecks.ts" >> "$log"
    derivative_rc=1
  fi

  sorry_hits=$(grep -c "sorryAx" "$log" || true)
  is_expected=0
  if [ -n "$EXPECTED_FAIL_FILE" ] && [ -e "$EXPECTED_FAIL_FILE" ] && grep -Fxq "$source" "$EXPECTED_FAIL_FILE"; then
    is_expected=1
  fi

  overall_fail=0
  if [ "$source_rc" -eq 0 ] && [ "$derivative_rc" -eq 0 ] && [ "$sorry_hits" -gt 0 ]; then
    # Недосказанное доказательство не является evidence — независимо от регистрации.
    result="OK (compiler exit 0) — SORRY_DETECTED (${sorry_hits} hit(s)): файл, собранный с sorry, никогда не является evidence"
    overall_fail=1
  elif [ "$source_rc" -ne 0 ] || [ "$derivative_rc" -ne 0 ]; then
    if [ "$is_expected" -eq 1 ]; then
      result="EXPECTED_FAIL (source exit ${source_rc}, derivative exit ${derivative_rc}; первопричина/основание прогноза зафиксированы в core-checks/kernel-findings.json ciPolicy.mathlibExpectedFailures)"
    else
      result="FAILED (source exit ${source_rc}, derivative exit ${derivative_rc})"
      overall_fail=1
    fi
  else
    result="OK (source exit 0, derivative exit 0, no compiler errors)"
    if [ "$is_expected" -eq 1 ]; then
      result="${result} — NOTE: ожидаемый отказ не воспроизведён — обновить реестр (ciPolicy) и рассмотреть повышение статуса"
    fi
  fi

  echo "    result: ${result}" | tee -a "$EVIDENCE_DIR/summary.txt"
  {
    echo "--- #print axioms output (${name}) ---"
    grep -E "does not depend on any axioms|depends on axioms" "$log" \
      || echo "  (no #print axioms output captured)"
    echo "--- compiler output tail (${name}) ---"
    tail -n 25 "$log"
    echo
  } >> "$EVIDENCE_DIR/summary.txt"
  overall=$(( overall | overall_fail ))
done < "$EVIDENCE_DIR/targets.txt"

{
  echo "--- Mathlib artifacts NOT checked by this job (not in the explicit allowlist) ---"
  for f in artifacts/proofs/*.lean; do
    if grep -q '^import' "$f" 2>/dev/null && ! grep -Fxq "$f" "$EVIDENCE_DIR/targets.txt"; then
      echo "  $(basename "$f"): вне allowlist — статус не повышается по факту существования механизма"
    fi
  done
} >> "$EVIDENCE_DIR/summary.txt"

cat "$EVIDENCE_DIR/summary.txt"

if [ "$overall" -eq 0 ]; then
  printf 'outcome=OK (no unexpected failures; sorryAx-free)\n' >> "${GITHUB_OUTPUT:-/dev/null}"
else
  printf 'outcome=FAILED (exit %s; see results summary)\n' "$overall" >> "${GITHUB_OUTPUT:-/dev/null}"
  echo "Kernel run failed for at least one Mathlib artifact. Evidence uploaded for inspection."
  exit 1
fi
