# Граф зависимостей Telegram/token-pool багов

**Дата:** 2026-08-18
**Назначение:** порядок исправления определяется причинной зависимостью, а не порядком файлов в commit.

```mermaid
flowchart TD
  S0["B-01: секрет Telegram попал в Git history"] --> S1["Риск захвата бота и несанкционированных сообщений"]
  K0["B-02: /addkey и API принимают чужие AI-ключи"] --> K1["Ключ передаётся через Telegram/browser/API"]
  K1 --> K2["B-03: rawKey хранится в TokenPoolManager"]
  K2 --> K3["B-04: ключ пользователя расходуется чужими запросами"]
  K2 --> K4["B-05: in-memory состояние теряется и неаудируемо"]
  K0 --> K5["B-06: слабая идентификация clientId и quota bypass"]
  K3 --> K6["B-07: pool key выбирается, но не передаётся решателю"]
  K6 --> K7["Ложные usage/cooldown/round-robin метрики"]

  T0["B-08: Telegram handler создаёт глобальный singleton"] --> T1["Нарушение DI и затруднённое тестирование"]
  T0 --> T2["Команды и UI рекламируют небезопасный pool"]
  T3["B-09: polling offset/concurrency только в памяти"] --> T4["Повторы, параллельные обработки и ложный webhook status"]

  A0["B-10: RicisBotService импортирует Zustand store"] --> A1["Серверный transport зависит от UI state"]
  A1 --> A2["Cache read меняет proof и карту"]
  A1 --> A3["Новые economic values фабрикуются random"]
  A2 --> A4["Нет надёжной истории proof/provenance"]
  P0["B-11: RICIS/Lean статусы не выражены типом"] --> P1["LaTeX/шаблон объявляется Lean proof"]
  P1 --> P2["Пользователь получает завышенный статус доверия"]

  K0 --> T2
  T2 --> K1
  T0 --> K6
  A0 --> P1
```

## Слои исправления

| Слой | Корневые узлы | Правило завершения |
|---|---|---|
| L0. Внешний секрет | B-01 | token отозван владельцем; в коде нет fallback-token; секрет только в environment/secret store |
| L1. Запрет чужих ключей | B-02…B-07 | нет API/UI/Telegram входа для user API key; нет `rawKey` в доменных типах, памяти, логах и ответах |
| L2. Transport и quota | B-08…B-09 | handler получает зависимости через конструктор; transport mode отражает факт; polling имеет один управляемый цикл и await/backoff |
| L3. Application/DDD | B-10 и производные | Telegram service зависит от repository/application ports, а не Zustand; cache read не пишет; economic data не случайны |
| L4. Доверие доказательств | B-11 | RICIS reduction, Core result, Lean verified и hypothesis представлены раздельными статусами |

## Последовательность

Сначала L0 и L1. Пока система принимает или хранит чужие секреты, исправления в polling, статистике и UI не снижают главный риск. Далее исправляются L2 и L3, после чего вводятся типизированные статусы L4. После каждого слоя требуется lint, unit tests, build и повторная проверка отсутствия секретных/unsafe pattern-маркеров.
