# Общая оркестрация доказательства RICIS-III (Два согласованных слоя)

> **Базис не перепроверяется.** Ядро RICIS-III и его законы редукции доказаны извне и приняты целиком: повторное доказательство, повторный прогон и оспаривание базиса запрещены как расход ресурса — [`AGENTS.md` §14](../../AGENTS.md), пункт 8 [манифеста неизменности](./RICIS_IMMUTABILITY_MANIFEST.md). Оркестрация ниже применяется к **новым** утверждениям.


**Статус:** Нормативное общепроектное правило и канонический шаблон создания доказательств в RICIS-III.  
**Связанные документы:** [`AGENTS.md`](../../AGENTS.md), [`WORK_PATTERNS.md`](WORK_PATTERNS.md) (паттерны P-02, P-04, P-12), [`RICIS_SEMANTIC_AUTHORITY.md`](RICIS_SEMANTIC_AUTHORITY.md).  
**Код и артефакты:** [`src/model/orchestrationPipeline.ts`](../../src/model/orchestrationPipeline.ts), [`artifacts/proofs/ricis-universal-orchestration-template.lean`](../../artifacts/proofs/ricis-universal-orchestration-template.lean).

---

## 1. Концепция: Два согласованных слоя любого доказательства

В проекте RICIS-III любое доказательство разрешения сингулярностей, редукции выражений или проверки узлов карты строится строго на **двух согласованных слоях**:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. RUNTIME-ПАЙПЛАЙН (TypeScript)                                            │
│    Файл: src/model/orchestrationPipeline.ts                                 │
│    Контракт: IRicisOrchestratorEngine.executePipeline(nodeId, expr, obs?)    │
│    5 канонических стадий: PARSING_AND_L1_CHECK → AXIOMATIC_REDUCTION →     │
│                           LEAN_CODEGEN → GATEWAY_DISPATCH → TRUST_VALIDATION│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ трансляция / кодогенерация
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. УНИВЕРСАЛЬНЫЙ ШАБЛОН РЕДУКЦИИ (Lean 4)                                   │
│    Файл: artifacts/proofs/ricis-universal-orchestration-template.lean       │
│    Алгоритм: fullResolve(e) = resolveRICIS(resolveRICIS(e))                 │
│              resolveRICIS(e) = geometricMeasure(ricisResolve(e))            │
│    Шаги: L1/SP2/A1–A5/A7/A10 → A6 → μ(rect) → F*G → 2nd pass → Vec4        │
└─────────────────────────────────────────────────────────────────────────────┘
```

> **Главный закон оркестрации:**
> Любое новое доказательство в RICIS-III — это **подстановка в универсальный шаблон и прохождение через 5-стадийный пайплайн**, а не изобретение нового порядка фаз или произвольной последовательности шагов.

---

## 2. Слой 1: Runtime-пайплайн (TypeScript)

**Файл:** `src/model/orchestrationPipeline.ts`  
(в структуре репозитория: `src/model/orchestrationPipeline.ts` / `ricis-map-latest/src/model/orchestrationPipeline.ts`)

### Контракт движка

```typescript
export interface IRicisOrchestratorEngine {
  executePipeline(
    nodeId: string,
    targetExpression: string,
    observer?: IOrchestrationPipelineObserver
  ): Promise<IOrchestrationStateDTO>;
  getCurrentState(pipelineId: string): IOrchestrationStateDTO | undefined;
}
```

### Стадии (общие для любого узла)

| StageId | Название | Смысл и зона ответственности |
|---|---|---|
| `PARSING_AND_L1_CHECK` | Разбор и L1-проверка | Синтаксический разбор выражения, проверка тождества $X=X$ (`L1_IDENTITY`), фиксация онтологического типа и исходного источника (`generatingOrigin`). |
| `AXIOMATIC_REDUCTION` | Аксиоматическая редукция | Пошаговое применение аксиом RICIS-III ($SP2, A1, A4, A5, A6, A7, A10$) с сохранением инварианта и семантического индекса $SP4$. |
| `LEAN_CODEGEN` | Генерация Lean-артефакта | Автоматическая генерация формального Lean 4 кода на базе универсального шаблона редукции. |
| `GATEWAY_DISPATCH` | Отправка в шлюз / ядро | Передача артефакта через `CoreProofHttpGateway` / WebAssembly bridge в ядро `Ricis.Core` для компиляции и проверки. |
| `TRUST_VALIDATION` | Валидация доверия | Проверка границ доверия (`No Self-Certification` по `AGENTS.md`): проверка статуса компиляции, `#print axioms`, отсутствие `sorryAx`, изоляция от подмены статуса. |

### Сопровождающие структуры данных

- `TransformationLog<T>` — строгий аудит каждого шага трансформации с хэшем обоснования (`rationaleHash`), исходным и конечным выражением, флагом сохранения инварианта `l1IdentityVerified`.
- `RicisNumber<T>` — структурное число / монада с семантическим индексом (`semanticIndex` по $SP4$, например `0_f` или `0_g`), типом границы (`typeBoundary`), исходным выражением (`generatingOrigin`) и флагом сингулярности (`isSingularity`).
- `IOrchestrationPipelineObserver` — реактивный наблюдатель за изменениями стадий (`onStageUpdate`, `onStageError`), обеспечивающий прозрачность процесса для UI и runtime-логов.

Это **оркестрация процесса** на карте и в приложении: один и тот же детерминированный pipeline обслуживает любой `nodeId` и любое входное математическое выражение.

---

## 3. Слой 2: Универсальный шаблон редукции (Lean 4)

**Файл:** `artifacts/proofs/ricis-universal-orchestration-template.lean`  
(тот же канонический математический каркас, что и в `ricis-v79-monolith.standalone.lean`)

### Общий алгоритм на любом выражении

Математическое ядро редукции в Lean 4 строится на двухшаговой суперпозиции:

```lean
def fullResolve (e : RExpr) : RExpr :=
  resolveRICIS (resolveRICIS e)

def resolveRICIS (e : RExpr) : RExpr :=
  geometricMeasure (ricisResolve e)
```

### Таблица шагов редукции

| Шаг | Функция | Роль и применяемые правила |
|---|---|---|
| **1** | `ricisResolve` | Базовые правила $L1$, $SP2$, $A1$–$A5$, $A7$, $A10$: `divSelf(e) → 1`, `subSelf(e) → 0_e`, `div(0_F, 0_G) → F/G`, `div(inf_F, inf_G) → F/G`, `sub(inf_F, inf_G) → inf_(F-G)`, `mul(F, 0) → 0_F`. |
| **2** | $A6$ (внутри `ricisResolveMul`) | Формирование прямоугольной меры: `0_F * ∞_G → μ(rect F G)`. |
| **3** | `geometricMeasure` | Геометрическая реализация меры: `μ(rect F G) → F * G`. |
| **4** | `fullResolve` | Второй проход суперпозиции для каскадных сингулярностей (например, $0/0 \to \infty_0 \to 1$). |
| **5** | `semanticIndex` / $SP4$ | Сохранение индекса родителя: `semanticIndex F = 0_F`. |
| **6** | `resolveVec4` | Поэлементное параллельное вычисление для векторных систем и тензоров: `resolveRICIS` для каждой компоненты. |

### Теоремы-шаблоны

Каждое доказательство использует **один и тот же каркас лемм и теорем**, куда подставляются конкретные $F, G$ или уравнения системы:
- `theorem divSelf_one (e : RExpr) : resolveRICIS (RExpr.divSelf e) = RExpr.one := rfl`
- `theorem SP2_subSelf_zero (e : RExpr) : resolveRICIS (RExpr.subSelf e) = RExpr.zeroF e := rfl`
- `theorem A1_div_zero (F : RExpr) : resolveRICIS (RExpr.div F RExpr.zero) = RExpr.infF F := rfl`
- `theorem A4_indexed_zero_div (F G : RExpr) : resolveRICIS (RExpr.div (RExpr.zeroF F) (RExpr.zeroF G)) = RExpr.div F G := rfl`
- `theorem A5_inf_div (F G : RExpr) : resolveRICIS (RExpr.div (RExpr.infF F) (RExpr.infF G)) = RExpr.div F G := rfl`
- `theorem A6_geometric_realization (F G : RExpr) : resolveRICIS (RExpr.mul (RExpr.zeroF F) (RExpr.infF G)) = RExpr.mul F G := rfl`
- `theorem A7_inf_sub (F G : RExpr) : resolveRICIS (RExpr.sub (RExpr.infF F) (RExpr.infF G)) = RExpr.infF (RExpr.sub F G) := rfl`
- `theorem L0_continuity_*` — теоремы непрерывности и сохранения $L0$.

---

## 4. Склейка: Сквозной поток «Любое доказательство»

Сквозная схема исполнения для любого узла, сингулярности или системы:

```text
       Выражение / Узел карты (nodeId)
                     │
                     ▼
       ┌───────────────────────────┐
       │   PARSING_AND_L1_CHECK    │  ← orchestrationPipeline.ts
       └─────────────┬─────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │    AXIOMATIC_REDUCTION    │  ← ricisResolve + geometricMeasure (Lean template)
       └─────────────┬─────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │       LEAN_CODEGEN        │  ← генерация экземпляра файла по шаблону
       └─────────────┬─────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │     GATEWAY_DISPATCH      │  ← отправка в ядро / Lean kernel runner
       └─────────────┬─────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │     TRUST_VALIDATION      │  ← WORKFLOW_ONLY / policy / No Self-Certification
       └─────────────┬─────────────┘
                     │
                     ▼
       (Опционально) Обновление узла карты:
       Residual / Inherited Invariants / Provenance / Scope Boundary
```

### Человекочитаемый Proof-Trace

В патчах карты и логах интерфейса доказательство представляется как упорядоченный слепок той же оркестрации:
$$\text{Phase } -1 \ (L1\_IDENTITY) \longrightarrow \text{Phase } 0 \ (SP4) \longrightarrow \text{Phase } 1..4 \ (A6 \text{ / Reduction}) \longrightarrow \text{Provenance} \longrightarrow \text{Scope}$$

---

## 5. Практический справочник разработчика

| Что нужно сделать / проверить | Где смотреть и что использовать |
|---|---|
| **Общий процесс** для любого узла | `IRicisOrchestratorEngine` + 5 стадий `OrchestrationStageId` в `src/model/orchestrationPipeline.ts` |
| **Общая математика редукции** | `fullResolve` / `resolveRICIS` в `artifacts/proofs/ricis-universal-orchestration-template.lean` |
| **Path-gated instance** (Schwarzschild, UF, AGI, Navier-Stokes, Riemann Zeta) | Тот же каркас $A6 + SP4$, с подстановкой специализированных `path-label` и операторов |
| **Trust-валидация** | Отдельная стадия `TRUST_VALIDATION`, изоляция от `ring`/`rfl` (статус задаётся внешним воспроизводимым kernel-прогоном, а не самосертификацией) |

---

## 6. Итоговый норматив

1. **Единая оркестрация** = **5-стадийный TypeScript-пайплайн** + **универсальный Lean-алгоритм fullResolve ($\text{resolve} \to \mu \to \text{повтор}$)**.
2. Новые математические доказательства и модули не создают свои фазы: они параметризуют универсальный шаблон и регистрируют шаги в `TransformationLog`.
3. Запрещено объявлять результат доказанным без прохождения всех 5 стадий и проверки независимым Lean-раннером.
