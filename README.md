# RICIS Expansion Map — интерактивная карта сингулярностей, зависимостей и доказательных границ

**Версия: v0.4.31**

### v0.4.31 — Community Rewards foundation and status-line invitation

Добавлен изолированный bounded context `CommunityRewards`: SOLID/DDD contracts, server-authoritative append-only ledger application layer, typed referral/reward outcomes, in-memory QA adapters и protected `/api/community-rewards/v1` availability seam. В desktop status line появилась кнопка **«Пригласить · Tokens»**: она копирует только обычную ссылку приложения и честно сообщает, что реальные referral links, identity и durable ledger требуют production backend. Локальный browser balance, имитация наград, Core/Lean coupling и передача токенов не реализованы.

### v0.4.30 — Public product narrative and technical SEO

Полный рекламный документ объединён с README: добавлены проверяемое описание возможностей, user scenarios, trust boundary и практическое positioning. Публичная сборка получила canonical URL, Open Graph/Twitter social cards, JSON-LD, `robots.txt`, `sitemap.xml`, manifest и оригинальные preview assets для GitHub Pages; техническое SEO не объявляется гарантией ранжирования.

[![Demo](https://img.shields.io/badge/Live%20demo-GitHub%20Pages-0b78e3?logo=githubpages)](https://a1dmitry.github.io/Ricis3-Expansion-Map/)
[![License](https://img.shields.io/badge/License-MIT-2ea44f)](LICENSE)
[![Repository](https://img.shields.io/badge/GitHub-A1Dmitry%2FRicis3--Expansion--Map-181717?logo=github)](https://github.com/A1Dmitry/Ricis3-Expansion-Map)

![RICIS Expansion Map — светящаяся карта математических зависимостей](public/ricis-expansion-map-social-preview.png)

**RICIS Expansion Map** — открытая исследовательская среда для визуального изучения математических задач, выражений, сингулярностей и цепочек зависимостей RICIS-III. Приложение объединяет интерактивную **3D-карту**, доступный **режим списка**, структурную диагностику выражений, интеграцию с **C# Ricis.Core**, рабочие артефакты proof и явно видимую границу между гипотезой, вычислением Core и внешней Lean kernel verification.

> Карта не подменяет проверку эффектной визуализацией. Она помогает исследователю увидеть структуру задачи, происхождение результата, трассу преобразований и необходимый следующий шаг верификации.

**Демо:** [a1dmitry.github.io/Ricis3-Expansion-Map](https://a1dmitry.github.io/Ricis3-Expansion-Map/) · **Исходный код:** [GitHub repository](https://github.com/A1Dmitry/Ricis3-Expansion-Map)

## Что делает RICIS Expansion Map

RICIS Expansion Map превращает набор разрозненных формул и исследовательских задач в навигируемый граф. Пользователь может выбрать узел, увидеть его целевую функцию, зависимости, научную зону, рабочий статус, экономические параметры, журнал действий и связанные доказательные материалы. Для выражений с сингулярностями доступны Core-first расчёт, строгая recovery-диагностика и локальный структурный анализ; для каждого маршрута приложение показывает, **кто произвёл результат и какой уровень доверия он имеет**.

| Для кого | Первый полезный сценарий | Практический результат |
|---|---|---|
| **Исследователь RICIS-III** | Найти сингулярность, раскрыть связанные узлы и проследить преобразования | Карта зависимостей, semantic context, trace и следующие исследовательские действия |
| **Математик, преподаватель или студент** | Изучить задачу в 3D или переключиться в список без WebGL | Наглядная структура материала, фильтры, карточки и доступная навигация |
| **Рецензент / формализатор Lean** | Открыть proof-артефакт и проверить evidence boundary | Разделение черновика, external Lean source, trusted contract и kernel evidence |
| **Разработчик Ricis.Core / TypeScript** | Запустить проект, проверить Core endpoint и воспроизвести тесты | Строгий Core-first bridge, typed recovery, npm quality gate и CI-готовый репозиторий |
| **Куратор исследовательского каталога** | Добавить/редактировать узлы, экспортировать карту и проверить граф | Локальное хранение, JSON/TeX export, audit и повторяемая навигация по знаниям |

## Возможности

### Исследовательская 3D-карта и доступный каталог

Карта отображает проблемные узлы, связи, научные зоны и путь зависимости в интерактивной WebGL-сцене. Поиск, фильтрация, навигация к связанным задачам, раскрытие карточек и режим фокусировки позволяют переходить от общей области к конкретному выражению. Если WebGL недоступен или пользователь предпочитает линейную навигацию, доступен семантически эквивалентный **режим списка**.

Desktop использует правую task-panel с полноразмерным и компактным rail-состоянием, а touch-first интерфейс адаптируется к portrait и landscape. Мобильная оболочка включает menu-first навигацию, корректный Back flow, полноэкранный режим и явно включаемое управление орбитой через DeviceOrientation; ручные жесты остаются доступными.

### Работа с сингулярностями и RICIS-III

RICIS Expansion Map поддерживает визуальное исследование точек вида `0/0`, `∞/∞`, `∞ − ∞`, `0·∞`, полюсов, фактор-сокращений и связанных структурных форм. Нормативный порядок RICIS-III сохраняется как ориентир: `L0 → L1 → SP2 → локальная O(1)-редукция → A1/A4 → SP3 → SP4 → A5/A6/A7`.

Карта не заменяет структурный результат численной аппроксимацией, пределом Коши или `NaN`. Состояния передаются как типизированный результат, диагностика либо явно ограниченная гипотеза. Установленная `L1_IDENTITY` не должна повторно раскрываться без нового основания.

### Core-first вычисление и понятное восстановление

Успешное вычисление сингулярности производится через **Ricis.Core**: C# API либо C# WASM. `RicisWasmBridge` выполняет health check только при реальном запросе и возвращает результат C# Core или typed failure; он не создаёт скрытый TypeScript-инвариант при проблеме с runtime.

| Состояние Core | Что показывает продукт | Что продукт не делает |
|---|---|---|
| `ready_api` / `ready_wasm` | Фактический Core origin, invariant и trace | Не называет Core calculation Lean theorem |
| `CORE_UNAVAILABLE` | Recovery-инструкцию и доступный явно маркированный diagnostic workflow | Не маскирует отсутствие Core «успешным решением» |
| `CORE_INFRASTRUCTURE_ERROR` | Сетевой/инфраструктурный статус и retry context | Не превращает transport failure в математику |
| `CORE_INPUT_REJECTED` | Parser error и безопасные детали позиции | Не обходит Core grammar локальным вычислением |
| `CORE_INVALID_RESPONSE` | Ошибку контракта ответа и correlation context | Не выдумывает invariant из неполного payload |

Для remote Core поддерживается build-time `VITE_RICIS_CORE_API_BASE_URL` с абсолютным HTTPS URL без credentials, query и fragment. При пустом значении применяется current same-origin proxy `/api/ricis-core`. Raw public Core port не является рекомендуемой схемой: production deployment должен использовать HTTPS и точный CORS origin.

### Локальный структурный анализ — только диагностика

Опциональный **Local RICIS Analyzer** предназначен для непрерывного исследовательского workflow, когда Core временно недоступен или пользователь сознательно запускает локальный анализ. Он использует immutable source hash, ограниченную grammar без исполнения пользовательского текста, deterministic parse/normalization, L1/SP4 candidates, semantic index и resource-key trace.

Локальная диагностика не создаёт Core result, Lean evidence, `resolved` state, авторитетную axiom или скрытое graph expansion. Она маркируется как `LOCAL_DIAGNOSTIC` / `REQUIRES_CORE_VERIFICATION` и передаёт безопасный handoff в Ricis.Core. Это позволяет продолжить исследование без ложного повышения trust status.

### Proof workspace и честная граница Lean

В **RICIS Proof & Singularity Console** можно исследовать выражения, просматривать trace, работать с proof-related артефактами и открывать formal verification context из карточки узла. Внешний Lean source сохраняется неизменяемо вместе с hash, provenance и evidence; приложение отдельно отображает status external proof transport.

> **Состояние узла карты не равно Lean kernel verification.** Текст, локальная проверка, AI suggestion, workflow state и даже Core calculation сами по себе не создают `LEAN_VERIFIED`.

| Видимый статус | Что подтверждает | Что не подтверждает |
|---|---|---|
| `Lean kernel verified` | Воспроизводимые toolchain, команда, compiler output и axiom report для конкретного external Lean source | Другие узлы или более широкую гипотезу |
| `Trusted external axiom` | Неизменяемый внешний source принят как маркированный trusted contract | Автоматически синтезированную безаксиомную теорему |
| `Requires Core / Lean evidence` | Сохранён структурный артефакт, но kernel evidence отсутствует | Формальную Lean-проверку |
| `Resolved workflow state` | Узел завершён в рабочем процессе карты | Теорему в Lean |

Подробнее о trust boundary: [`AGENTS.md`](AGENTS.md) и [`Lean boundary audit`](docs/05-evidence/proofs/lean-boundary-audit-2026-08-18.md).

### Каталог, история и экспорт

Карта работает как исследовательский каталог: она хранит задачи, связи, proof notes, transformation history, audit context и agent logs в локальном браузерном хранилище. Доступны экспорт TeX и JSON, импорт JSON, сброс каталога к актуальному seed и графовые проверки. Эти функции упрощают обмен воспроизводимым состоянием, подготовку учебных материалов и audit исследовательской ветви.

Встроенный Telegram-интерфейс является безопасной симуляцией UX. Live Telegram transport намеренно отключён до отдельной production-интеграции. Серверные AI-возможности используют только server-side `GEMINI_API_KEY`; приложение не принимает, не хранит и не распространяет пользовательские API-ключи.

### Архитектура, качество и безопасность

Проект написан на строгом TypeScript, использует React, Vite, Zustand и Three.js/WebGL. Архитектурные изменения проходят последовательный pipeline: бизнес-анализ → DI-изолированный контракт → QA → implementation. Политики Core availability, evidence, presentation и graph effect не должны дублироваться между UI, store и сервисами.

| Область | Практика |
|---|---|
| **DRY и DI** | Повторяющиеся правила изолируются в application services и policy contracts, без скрытых singleton decisions |
| **Доверие** | Core result, local diagnostic, trusted external axiom и Lean verification имеют разные типизированные статусы |
| **Безопасность ввода** | Локальный analyzer не исполняет пользовательский текст, ограничивает грамматику и ресурсы |
| **Приватность** | Local browser state остаётся в IndexedDB; API keys не переносятся в клиентский bundle |
| **Качество** | `npm run lint`, `npm test`, `npm run build`, version/release checks и focused regression tests |
| **Доступность** | List fallback, responsive shells, keyboard/pointer/touch-aware UI и отсутствие зависимости от одного 3D пути |

## Как начать

1. Откройте [живую демонстрацию](https://a1dmitry.github.io/Ricis3-Expansion-Map/).
2. Выберите узел на 3D-карте либо перейдите в **режим списка**.
3. Изучите target expression, зависимости, научную зону и transformation history.
4. Откройте **«Формальная верификация»**, чтобы увидеть именно уровень evidence, а не только workflow state.
5. Используйте **RICIS Proof & Singularity Console** для исследования выражения; трактуйте локальный результат как diagnostic/proposal до подтверждения Core/Lean.

## Локальный запуск и quality gate

Требуются Node.js `22.22.2` или новее в ветке 22 и npm `12.0.2` или новее. `package.json` — единственный источник версии; `package-lock.json`, `src/version.ts`, README и release-артефакты синхронизируются release-check. Проект использует только npm lockfile; `--force` и `--legacy-peer-deps` запрещены.

```bash
npm ci
npm run dev
```

Полный quality gate:

```bash
npm audit --audit-level=moderate
npm run release:check
npm run lint
npm test
npm run build
```

`npm run build` формирует Vite production bundle и серверный bundle в `dist/`. После обновления source catalog можно выбрать **«Сброс карты»** в интерфейсе, чтобы восстановить актуальные начальные узлы.

## Документация, участие и цитирование

`README.md` — публичная точка входа. Полная knowledge base находится в [`docs/`](docs/), а навигация и приоритет источников описаны в [`docs/README.md`](docs/README.md). `AGENTS.md` — обязательный machine-readable development contract, а не рекламная декларация.

Код распространяется по [MIT License](LICENSE). Для ссылки на конкретную версию используйте [`CITATION.cff`](CITATION.cff) и GitHub release после публикации. Воспроизводимые дефекты и предложения принимаются через [GitHub Issues](https://github.com/A1Dmitry/Ricis3-Expansion-Map/issues). Issue с theorem claim должен содержать исходное выражение, версию приложения, ожидаемый trust status и, если применимо, Lean source с kernel evidence.

## SEO и discoverability

Сайт использует точные title/description, canonical GitHub Pages URL, Open Graph и Twitter/X preview, JSON-LD `SoftwareApplication`, `WebSite` и `BreadcrumbList`, `robots.txt`, `sitemap.xml` и web manifest. Это помогает поисковым системам и social previews понять назначение продукта, но не обещает автоматическое первое место в выдаче: индексирование и ранжирование зависят от качества контента, crawlability, реальных ссылок и времени обработки поисковиком. Технические решения следуют рекомендациям Google по полезному people-first content, canonical URL, JSON-LD и JavaScript SEO.[^seo-guide]

После публикации рекомендуется добавить GitHub Pages property в Google Search Console, отправить `sitemap.xml`, проверить canonical и rendered HTML через URL Inspection, а JSON-LD — через Rich Results Test. Анализировать эффект следует по фактическим impressions, CTR и indexed URLs, а не по непроверяемым обещаниям «быстрого продвижения».[^seo-structured]

[^seo-guide]: [Google Search Central — SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
[^seo-structured]: [Google Search Central — Introduction to structured data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
