# Инцидент 2026-09-17: «интерфейс периодически слетает» — три независимые причины в трёх разных слоях

**Дата:** 2026-09-17 · **Версия на момент разбора:** 0.4.201 · **Базовый коммит чекаута:** `97583b6`
**Ветка:** `arena/01a0af3a-ricis3-expansion-map`, перед открытием PR обновлена fast-forward до `main` = `5d6d23f`.
Измерения §2–§4 выполнены на `97583b6`; код сервера с тех пор **не менялся** — `git diff --name-only 97583b6 5d6d23f -- server.ts server/ricisCoreSupervisor.ts server/devHostPolicy.ts` пуст, поэтому находки A и B действуют и на текущем `main`. Состояние `main` на момент подготовки PR измерено отдельно — §11.
**Тип:** инцидент доступности интерфейса (транспорт dev-сервера + супервизор ядра + внешний AI-канал). **Не** научный и **не** proof-слой.
**Статус:** первопричины установлены и **измерены**; контрмеры **предложены, не применены** (требуется решение владельца, см. §8).
**AUDITOR: SELF (same-pipeline)** — разбор и измерения выполнены тем же агентом/пайплайном, что и поддерживаемый код. Для статуса `EXTERNAL` нужен независимый прогон Challenger-ролью. Формулировки вида «полностью верифицировано» намеренно не используются.

---

## 1. Симптом (как сформулирован владельцем)

> «Интерфейс работы с тобой периодически слетает. Разберись с причиной: это наше ядро, или внешние причины связи, или что-то ещё».

Ключевое слово — **периодически**: не «не работает всегда», а «то работает, то нет». Поэтому ниже разделяются три канала, каждый со своим характером отказа:

| Канал | Что это | Характер отказа |
| :-- | :-- | :-- |
| **A. Транспорт dev-сервера** | `npm run dev` → Express + Vite middleware → превью | бинарный: превью мёртво, но лог зелёный |
| **B. Супервизор ядра** | `server/ricisCoreSupervisor.ts` → `dotnet` → `Ricis.Core` Web API | периодические зависания всего сервера на ~10 с |
| **C. Внешний AI-канал** | `@google/genai` → `*.googleapis.com` | детерминированный отказ в песочнице + молчаливая подмена результата |

**Короткий ответ на вопрос владельца:** математическое **ядро Ricis.Core само по себе не является причиной** — в этой среде оно детерминированно недоступно и отказывает за 17 мс, не зависая. Причины: (A) молчаливый конфликт порта в нашем сервере старта, (B) **супервизор** ядра блокирует event loop синхронным подпроцессом, (C) внешняя сеть песочницы закрывает TLS к Google API, а наш клиент не показывает пользователю причину деградации.

---

## 2. Факт A — при занятом порте сервер рапортует успех и ничего не обслуживает

### 2.1 Дословный прогон (воспроизведён дважды, 2026-09-17)

Порт 3000 занят другим процессом (в эксперименте — HTTP-«holder», отвечающий `HOLDER-RESPONSE` с заголовком `x-holder: 1`):

```console
$ curl -s http://localhost:3000/
HOLDER-RESPONSE
$ ss -ltn | grep -c ':3000'
1                                     # порт действительно занят

$ npm run dev                         # старт приложения при занятом порте
Dev server allowed hosts: all hosts (proxied preview hosts allowed) (override with VITE_ALLOWED_HOSTS)
Server running on http://localhost:3000        # ← ЛОЖНЫЙ УСПЕХ
$ # stderr ПУСТ; процесс жив (проверено через 12 с); самостоятельно не завершается

$ curl -s -D- http://localhost:3000/api/health
HTTP/1.1 200 OK
x-holder: 1                           # ← отвечает ЧУЖОЙ процесс, не приложение
HOLDER-RESPONSE

$ ss -ltnp | grep -E ':3000|:24678'
LISTEN 0 511 0.0.0.0:3000  users:(("node",pid=2142,fd=24))   # holder
LISTEN 0 511       *:24678 users:(("node",pid=2180,fd=24))   # приложение: держит ТОЛЬКО HMR-порт
```

То есть: приложение **не владеет портом 3000**, не обслуживает ни одного запроса, не печатает ошибки и не завершается. Единственный наблюдаемый сигнал — строка `Server running on http://localhost:3000`, которая в этом состоянии лжёт.

### 2.2 Механизм (установлен по исходнику установленной версии, `express@5.2.1`)

`node_modules/express/lib/application.js`:

```js
app.listen = function listen() {
  var server = http.createServer(this)
  var args = slice.call(arguments)
  if (typeof args[args.length - 1] === 'function') {
    var done = args[args.length - 1] = once(args[args.length - 1])
    server.once('error', done)        // ← тот же callback становится обработчиком 'error'
  }
  return server.listen.apply(server, args)
}
```

Express 5 регистрирует listen-callback **и** на событие `listening`, **и** на событие `error` (через `once`). При `EADDRINUSE` callback вызывается **с объектом ошибки как первым аргументом**. Прямая проба:

```console
$ node /tmp/probe-cb-args.mjs          # app.listen(3000,'0.0.0.0', cb) при занятом 3000
[E] Express вызвал listen-callback. Аргумент = Error(code=EADDRINUSE)
```

Наш вызов (`server.ts`, конец `startServer()`) аргумент игнорирует:

```ts
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

Поскольку обработчик `error` теперь существует (это сам callback), Node **не** выбрасывает неперехваченное исключение: процесс продолжает жить. Ошибка приходит в callback и молча выбрасывается вместе с неиспользуемым аргументом.

Контрольные пробы, подтверждающие, что это именно поведение Express 5, а не Node:

```console
# http.createServer(...) БЕЗ обработчика 'error' (то, что делал Express 4) → громкий краш
$ node /tmp/probe-plain.mjs
Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
    at Server.setupListenHandle [as _listen2] (node:net:1940:16)
  code: 'EADDRINUSE', errno: -98, syscall: 'listen', port: 3000

# express@4.22.3 (скачан отдельно для сравнения): никакого server.once('error', done) нет
app.listen = function listen() {
  var server = http.createServer(this);
  return server.listen.apply(server, arguments);
};
```

Вывод: на Express 4 та же ситуация давала **немедленный краш с понятным стеком**; на Express 5 она даёт **молчаливый «успех»**. Дефект стал невидимым именно из-за мажорного апгрейда Express (`package.json`: `"express": "^5.2.1"`).

> **Граница исторической трассировки:** датировать коммит апгрейда Express в этом чекауте нельзя — клон **неспособен** показать историю: `git log --oneline | wc -l` = **1** (`.git/shallow` присутствует). В отличие от инцидента 2026-09-16, где апгрейд Vite был датирован коммитом `e5bd034`, здесь дата перехода на Express 5 остаётся неустановленной. Это зафиксировано как пробел, а не додумано.

### 2.3 Почему это даёт именно «периодически»

Порт в `server.ts` **жёстко зашит**: `const PORT = 3000;` (без `process.env.PORT`). В рабочем цикле платформы процессы живут дольше одного обращения: если предыдущий экземпляр dev-сервера (или любой другой процесс) удерживает 3000, новый старт:

1. печатает `Server running on http://localhost:3000`;
2. не падает и не логирует ошибку;
3. ничего не обслуживает — превью пустое/чужое.

Тот же запуск **после** освобождения порта работает нормально. Отсюда «то работает, то слетает» без изменения кода.

### 2.4 Побочный факт: второй публичный порт

Несмотря на `hmr: false` и в `server.ts`, и в `vite.config.ts`, процесс открывает **второй** listening-порт на всех интерфейсах:

```console
$ ss -ltnp | grep ':24678'
LISTEN 0 511 *:24678 users:(("node",pid=2180,fd=24))
$ curl -s -o /dev/null -w '%{http_code}\n' http://localhost:24678/
426                                  # Upgrade Required (это WebSocket-сервер Vite)
```

Платформа превью регистрирует **оба** порта (3000 и 24678) как новые listening-порты процесса. Если привязка превью выберет 24678, пользователь получит `426 Upgrade Required` вместо интерфейса. При уже занятом 24678 второй экземпляр печатает `WebSocket server error: Port 24678 is already in use` и продолжает работу — этот случай, в отличие от порта 3000, хотя бы виден в логе.

---

## 3. Факт B — одна проба ядра замораживает весь интерфейс на ~10 с (и рвёт соединение с документом)

### 3.1 Условия эксперимента

В песочнице `dotnet` отсутствует (`which dotnet` → пусто), поэтому реальная проба возвращается мгновенно с `ENOENT`:

```console
$ curl -s -w '\ncode=%{http_code} t=%{time_total}s\n' http://localhost:3000/api/ricis-core/health
{"status":"unavailable","url":"http://127.0.0.1:5044","mode":"bundled-dll","dotnetHost":"dotnet","running":false,
 "error":"dotnet host \"dotnet\" is not available: spawnSync dotnet ENOENT. …"}
code=503 t=0.016683s                  # 17 мс — отказа без зависания здесь нет
```

Чтобы измерить класс дефекта, а не конкретную машину, `dotnet` заменён подставным медленным host'ом через штатную переменную окружения (`RICIS_CORE_DOTNET_BIN=/tmp/fake-dotnet`, где `fake-dotnet` = `sleep 60`). Bundled-рантайм `runtime/ricis-core/Ricis.WebApi.dll` в репозитории присутствует, поэтому `assertCoreRuntime()` проходит и выполнение доходит до `assertDotnetHost()`.

### 3.2 Дословные измерения

```text
=== BASELINE: интерфейс без пробы ядра ===
  /api/health      200  40 ms
  /                200  15 ms
  /src/main.tsx    200   3 ms
  /src/App.tsx     200   3 ms

=== ЭКСПЕРИМЕНТ: одна проба /api/ricis-core/health в полёте ===
  Запросы интерфейса, отправленные ВО ВРЕМЯ пробы ядра:
  GET /            ERR ECONNRESET 9733 ms     ← документ интерфейса: СБРОС соединения
  /src/main.tsx    200  9732 ms
  /src/App.tsx     200  9743 ms
  /api/health      200  9744 ms               ← baseline 40 ms → в 244 раза медленнее
  CORE probe       503 10025 ms
```

Пользовательский путь (вычисление выражения — то, что реально нажимает человек):

```text
=== POST /api/ricis-core/expressions/simplify при недоступном ядре ===
  simplify #1    503 10078 ms
  GET /          200  9746 ms   <- интерфейс во время этого запроса
  /src/main.tsx  200  9737 ms
  /api/health    200  9741 ms

=== Повторное нажатие (2-й запрос) — повторяется? ===
  simplify #2    503 10017 ms
  GET /          ERR ECONNRESET 9716 ms       ← да, повторяется на каждое обращение
```

### 3.3 Механизм

`server/ricisCoreSupervisor.ts`:

```ts
function assertDotnetHost(): void {
  const probe = spawnSync(DOTNET_BIN, ['--version'], { stdio: 'ignore', timeout: 10_000 });
  //            ^^^^^^^^^ синхронный подпроцесс: блокирует ВЕСЬ event loop до 10 с
```

Вызов цепочкой: HTTP-обработчик → `ensureRicisCoreApi()` → `launchCoreProcess()` → `assertCoreRuntime()` → `assertDotnetHost()`. Пока `spawnSync` не вернётся, Node не обрабатывает **ничего**, включая Vite-мидлварь, которая отдаёт документ и ESM-модули интерфейса. Отсюда `ECONNRESET` на `GET /`: запрос интерфейса стоит в очереди, а reverse proxy/браузер не дожидается ответа.

**Почему это повторяется на каждый запрос (а не один раз):**

```ts
export async function ensureRicisCoreApi(): Promise<void> {
  if (await isHealthy()) return;
  if (!startPromise) {
    startPromise = (async () => { launchCoreProcess(); /* … */ })()
      .finally(() => { startPromise = null; });      // ← обнуляется после каждой неудачи
  }
  await startPromise;
}
```

плюс в `launchCoreProcess()`:

```ts
if (coreProcess && coreProcess.exitCode === null) return;   // early-return только пока процесс жив
```

а обработчики `coreProcess.once('error'|'exit')` ставят `coreProcess = null`. Итог: при недоступном ядре **каждое** обращение к любому `/api/ricis-core/*` заново выполняет `spawnSync`-пробу → новый 10-секундный freeze всего сервера. Это и есть «периодически»: частота совпадает с частотой действий пользователя, трогающих ядро (терминал, калькулятор, страница восстановления).

**Усугубляющий фактор на клиенте — отсутствие таймаутов.** Оба места, которые ходят в health-эндпоинт, вызывают `fetch` без `AbortSignal`:

```ts
// src/services/coreRecovery.ts:159
const response = await fetch(healthUrl, { headers: { accept: 'application/json' } });

// src/services/ricisCore/RicisWasmBridge.ts:112
const response = await fetch(healthUrl, { headers: { accept: 'application/json' } });
```

При замороженном сервере (или при штатном 30-секундном ожидании старта ядра: `RICIS_CORE_START_TIMEOUT_MS || 30_000`) браузер ждёт indefinitely: спиннер страницы восстановления не завершается никогда.

### 3.4 Граница этого факта

Измерено: **механизм** (синхронная блокировка event loop, повторяемость, сброс соединения с документом) и его цена при 10-секундной пробе. **Не измерено:** фактическое время ответа `dotnet --version` на машине владельца (в песочнице `dotnet` нет). Если на целевой машине host отвечает быстро, freeze короче; если .NET-рантайм повреждён, SDK несколько, или диск/антивирус тормозят холодный старт — воспроизводится ровно измеренная картина. Класс дефекта от этого не зависит: синхронный подпроцесс в async-обработчике недопустим независимо от скорости host'а.

---

## 4. Факт C — внешний AI-канал: TLS к `*.googleapis.com` закрыт, а деградация невидима пользователю

### 4.1 Сеть (измерено)

```console
$ curl -sv --max-time 10 https://generativelanguage.googleapis.com/
*   Trying 172.217.117.4:443...
* Connected to generativelanguage.googleapis.com (172.217.117.4) port 443
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
* OpenSSL SSL_connect: SSL_ERROR_SYSCALL in connection to generativelanguage.googleapis.com:443

$ for h in www.googleapis.com aiplatform.googleapis.com storage.googleapis.com fonts.googleapis.com
www.googleapis.com          000  t=0.039 s  rc=35
aiplatform.googleapis.com   000  t=0.038 s  rc=35
storage.googleapis.com      000  t=0.033 s  rc=35
fonts.googleapis.com        000  t=0.038 s  rc=35

$ curl -s -o /dev/null -w '%{http_code} %{time_total}\n' https://registry.npmjs.org/   → 200 0.064
$ curl -s -o /dev/null -w '%{http_code} %{time_total}\n' https://github.com            → 200 0.314
```

DNS резолвится, TCP-соединение устанавливается, обрыв происходит **на ClientHello**. Общий egress при этом работает (npm, GitHub — 200). Значит это **политика сети песочницы в отношении `*.googleapis.com`**, а не дефект кода, не «ядро» и не квота Gemini. Никакой вызов `@google/genai` из этой среды успешным быть не может.

### 4.2 Что видит пользователь без ключа (измерено)

```console
$ curl -s -o /tmp/gp.json -w 'code=%{http_code} t=%{time_total}s\n' -X POST \
    http://localhost:3000/api/generateProof -H 'Content-Type: application/json' \
    -d '{"id":"n1","title":"Тест 0/0","targetFunction":"0/0"}'
code=200 t=0.018849s
$ head -c 200 /tmp/gp.json
{"proof":"**RICIS-III структурный черновик**\n\n**Целевая функция:** $f(x) = 0/0$ …
```

HTTP 200 за 19 мс: сервер отдаёт канонический локальный шаблон с `"model":"canonical-ricis-engine","degraded":"local_draft"`.

**Контракт деградации на клиенте не реализован.** `server/aiDegradation.ts` (BUG-06) введён ровно затем, «чтобы фронтенд всегда мог сказать, ПОЧЕМУ получен пустой/локальный результат», но потребителя флага в клиентском коде нет:

```console
$ grep -rn "degraded" src --include=*.ts --include=*.tsx | grep -v '\.test\.'
src/hostControl/hostControlApplication.ts:18:      # HostState — другая семантика
src/model/kinematicEngine.contracts.ts:29:         # кинематика — другая семантика
src/services/kinematic/*.ts, src/ui/KinematicEnginePage.tsx:1146   # кинематика
$ grep -rn "local_draft\|no_api_key\|ai_unavailable" src --include=*.ts --include=*.tsx | grep -v '\.test\.'
(пусто)
```

Следствие: интерфейс **показывает локальный шаблон как ответ агента**, без признака «AI недоступен». Для пользователя это выглядит как «агент иногда отвечает невпопад/пусто» — то есть как ещё одна грань «слетает», хотя транспорт при этом полностью исправен.

### 4.3 Retry-шторм без отмены (посчитано по коду, не прогнано — ключа и egress нет)

`callAIWithFallback` (`server.ts`): пул `SERVER_GEMINI_MODEL_POOL` = 9 моделей (`src/model/modelPool.types.ts`), на каждую до 2 попыток → **до 18 внешних вызовов** на один HTTP-запрос пользователя. При `429` добавляется `delay(1000 * attempt)` → 1 с + 2 с на модель = **≥27 с** только backoff'а, плюс латентность самих вызовов (промпт `generateProof` — несколько КБ).

При этом:

* функция **не принимает `AbortSignal`** — её сигнатура исчерпывается четырьмя параметрами:

  ```ts
  async function callAIWithFallback(
    prompt: string,
    responseMimeType = "text/plain",
    preferredModel?: string,
    enableSearch = false
  ) { … }
  ```

* обработчики не слушают закрытие соединения (проверено экранированным grep, чтобы `.` не работал как wildcard):

  ```console
  $ grep -nE "\bAbortSignal|\.abort\(|req\.on\(|res\.on\(|'close'|\"close\"" server.ts
  (пусто)
  ```

  > Урок инструмента (зафиксирован, чтобы не повторить): первичная проверка `grep -n "req.on|res.on|signal"` дала **ложные** совпадения на `responseMimeType` — неэкранированная точка совпала с «respon». Вывод тот же, но команда в отчёте обязана быть воспроизводимой без артефактов регулярки.
* клиент (`src/model/apiClient.ts`) ждёт `timeoutMs = 60_000` и abort'ит, показывая «Таймаут запроса к агенту API».

Итог в среде с работающим egress'ом и живой квотой под нагрузкой: клиент **гарантированно** отрывается раньше, чем сервер закончит свои 18 попыток, а сервер продолжает выжигать квоту уже для мёртвого запроса. Повторный клик пользователя накладывает второй шторм поверх первого (ограничения параллелизма на эндпоинтах нет). Это классический источник «иногда висит минуту и отваливается».

---

## 5. Сводная причинно-следственная картина

| # | Первопричина | Слой | Чей это дефект | Что видит пользователь | Воспроизведено |
| :-- | :-- | :-- | :-- | :-- | :-- |
| **A** | `app.listen`-callback игнорирует `EADDRINUSE`; порт зашит в 3000; self-check после старта отсутствует | транспорт dev-сервера | **наш код** (+ поведение Express 5) | превью пустое/чужое, лог «Server running», ошибок нет | **да**, 2 раза + 3 контрольные пробы |
| **B** | `spawnSync(dotnet, --version, {timeout:10_000})` внутри async-обработчика, повторно на каждый запрос при недоступном ядре | супервизор ядра | **наш код** | интерфейс виснет ~10 с, документ может получить `ECONNRESET` | **да**, на подставном медленном host'е (механизм); на реальном .NET — не измерялось |
| **C1** | TLS к `*.googleapis.com` обрывается на ClientHello | внешняя сеть | **внешняя причина связи** (политика среды) | агент не отвечает вообще | **да** (4 хоста, rc=35) |
| **C2** | Флаг `degraded` не читается клиентом; HTTP 200 с локальным шаблоном неотличим от ответа агента | клиент/контракт | **наш код** | «агент отвечает невпопад» без причины | **да** (200/19 мс + grep) |
| **C3** | До 18 внешних вызовов без `AbortSignal`, без отмены по `req.close`, дедлайн сервера > таймаута клиента | серверный AI-путь | **наш код** | висит до минуты, потом таймаут; повтор усугубляет | **посчитано по коду**, не прогнано (нет ключа/egress) |
| **D** | Второй listening-порт `*:24678` (Vite WS) при `hmr: false` | транспорт dev-сервера | **наш код** (требует уточнения, почему WS поднимается) | `426 Upgrade Required`, если превью привяжется не к 3000 | **да** (426 измерен) |

**Ответ на вопрос владельца дословно:** «наше ядро» — **нет** (математическое ядро в симптоме не участвует: оно либо детерминированно недоступно за 17 мс, либо вообще не стартует). «Внешние причины связи» — **да, но одна конкретная и не сетевая вообще**: egress-политика песочницы закрывает TLS к Google API. «Что-то ещё» — **да, и это главное**: два дефекта нашего серверного транспорта (A и B) и три дефекта обработки внешнего AI-канала (C2, C3, D). Именно A и B дают «периодичность», потому что зависят от состояния среды (занят ли порт, отвечает ли `dotnet` быстро), а не от кода.

---

## 6. Отброшенные гипотезы (и чем именно)

| Гипотеза | Проверка | Результат |
| :-- | :-- | :-- |
| Регресс политики хостов Vite (инцидент 2026-09-16, A-0010) | `curl -H 'Host: 3000-test.e2b.app' http://localhost:3000/` → **200** за 11 мс; в логе `Dev server allowed hosts: all hosts` | **отклонена** — контрмера A-0010 держится |
| «Ядро Ricis.Core периодически падает/висит» | `/api/ricis-core/health` → 503 за **17 мс**, `running:false`, `spawnSync dotnet ENOENT`; дочерний процесс не стартует вовсе | **отклонена** в формулировке «ядро»; **подтверждена** в формулировке «супервизор ядра» (факт B) |
| Сломаны зависимости/сборка | `npm ci` → 264 пакета за 8 с; старт сервера 2.3 с; `/` 200 за 15 мс, `/src/main.tsx` 200 за 3 мс | **отклонена** |
| Клиентский краш рендера как источник пустого экрана | `ECONNRESET` на `GET /` происходит **до** всякого React; в коде есть три ErrorBoundary (`Map3D`, `RouteSurfaceBoundary`, `WidgetCapabilityBoundary`) и guard гидратации | **отклонена** как первопричина; краш рендера не объясняет сброс соединения на документе |
| «Внешний интернет недоступен вообще» | `registry.npmjs.org` → 200, `github.com` → 200 | **отклонена**: закрыт именно `*.googleapis.com` |
| Поллинг ядра клиентом как источник периодичности | `grep -rn "setInterval" src/services/ricisCore src/services/coreRecovery.ts src/adminCoreConnection src/hostControl` → пусто; `probeRicisCoreHealth` вызывается только из `CoreRecoveryPage` по действию пользователя | **отклонена**: периодичность задаёт не поллинг, а действия пользователя (факт B) |
| `postJson`/`apiClient` — мёртвый код | `grep -rn "postJson(" src` → 6 потребителей (`model/logic.ts`, `model/agent.ts`, `model/audit.ts`, `model/derivativeSearch.ts`, `store/mapStore.ts`, `ui/AddNodeModal.tsx`) | **отклонена** (первичный grep без учёта дженериков дал ложный пустой результат — зафиксировано как урок инструмента) |

---

## 7. Что НЕ измерялось (граница честности)

1. **Фронтенд платформы (интерфейс чата Arena)** — вне этого репозитория; из песочницы его транспорт не наблюдается и не измерялся. Если «слетает» именно окно чата, а не превью приложения, настоящая причина лежит вне кода проекта; из измеренного здесь к этому каналу относится только факт A (конфликт порта/мёртвый dev-сервер делает бесполезным любое превью) и C1 (egress-политика среды).
2. **Поведение на машине владельца с установленным .NET** — факт B воспроизведён на подставном медленном host'е через штатную переменную окружения. Фактическое время `dotnet --version` на целевой машине не измерялось.
3. **Реальная латентность и квоты Gemini** — факт C3 выведен чтением кода и арифметикой пула; прогнать его нельзя (нет ключа, egress закрыт).
4. **Браузерная сторона `ECONNRESET`** — измерено на уровне HTTP-клиента (`fetch` в Node). Как именно это отрисуется в конкретном браузере за reverse proxy (пустой экран, ошибка proxy 502/504, бесконечный спиннер), не снималось.

---

## 8. Контрмеры (предложены; НЕ применены — требуется решение владельца)

Приоритеты — по способности устранить «периодичность», а не по размеру правки.

| # | Приоритет | Мера | Где | Почему именно так |
| :-- | :-- | :-- | :-- | :-- |
| 1 | **P0** | Проверять аргумент listen-callback'а и/или вешать `server.on('error')`; после старта — self-probe (`GET /api/health` самому себе) и проверка `server.address() !== null`; при неудаче громкий `process.exit(1)` с текстом «порт 3000 занят» | `server.ts` | Устраняет ложный «Server running»: единственный сигнал, на который смотрят и человек, и платформа, обязан быть правдивым |
| 2 | **P0** | `PORT` из `process.env.PORT \|\| 3000` (+ документировать в `.env.example`) | `server.ts`, `.env.example` | Жёстко зашитый порт — условие, при котором конфликт вообще возможен; в песочнице процессы живут между итерациями |
| 3 | **P0** | Убрать `spawnSync` из пути запроса: кэш результата пробы dotnet на процесс (или `spawn` + async-ожидание), таймаут пробы ≤ 2 с, cooldown/флаг «ядро недоступно», чтобы не повторять пробу на каждый запрос | `server/ricisCoreSupervisor.ts` | Синхронный подпроцесс в async-обработчике блокирует выдачу интерфейса — это измеренные 9.7 с и `ECONNRESET` на документе |
| 4 | **P0** | `AbortSignal.timeout(...)` в `probeRicisCoreHealth` и `RicisWasmBridge.loadRuntime` | `src/services/coreRecovery.ts`, `src/services/ricisCore/RicisWasmBridge.ts` | Без клиентского таймаута зависший сервер превращается в вечный спиннер |
| 5 | **P1** | Проброс `AbortSignal` из `req` в `callAIWithFallback` + отмена по `req.on('close')`; единый дедлайн серверного вызова **меньше** клиентских 60 с; сократить пул/попытки | `server.ts`, `src/model/apiClient.ts` | Сейчас сервер продолжает 18 попыток для уже мёртвого запроса и выжигает квоту |
| 6 | **P1** | Реализовать контракт `degraded` на клиенте: показывать причину (`no_api_key` / `ai_unavailable` / `local_draft`) рядом с результатом | `src/model/*`, UI-потребители | BUG-06 закрыт на сервере и не закрыт на клиенте: локальный шаблон неотличим от ответа агента |
| 7 | **P1** | Разобраться, почему WS-порт 24678 поднимается при `hmr: false`, и не публиковать его на `0.0.0.0` | `server.ts`, `vite.config.ts` | Лишний публичный порт, который платформа превью видит как кандидата на привязку |
| 8 | **P2** | Смоук-проверка транспорта dev-сервера (`npm run dev:smoke`): **поднять** сервер и проверить `GET /`, `GET /src/main.tsx`, `/api/health` с чужим `Host` и при занятом порте | новый скрипт + CI | Прямой yokoten вывода инцидента 2026-09-16: гейты `lint`/`test`/`build` не проходят через транспорт, поэтому оба дефекта (A и B) для них невидимы. **На `main` уже появился `tools/previewHealthCheck.test.ts`, но он не закрывает этот пробел** — см. §11.3 |
| 9 | **P2** | Зарегистрировать андон и карточку по конвенции (`A-0012`, `TPS-00xx` в `board.json` → `npm run tps:board`) | `docs/00-governance/tps/` | Доска генерируется из `board.json` и охраняется `tps:gate`; правка вручную = дрейф, поэтому регистрация должна быть явным шагом, а не частью этого документа |

**Намеренно НЕ предлагается:** «перезапускать dev-сервер по расписанию», «поднять таймаут клиента до 5 минут», «отключить маршруты ядра флагом по умолчанию». Первое маскирует симптом A, второе удлиняет зависание B, третье меняет продукт без решения владельца и не устраняет ни одну первопричину.

---

## 9. Проверка (что фактически прогнано, а не заявлено)

```console
# среда
$ node -v ; npm -v                      → v22.22.3 ; 10.9.8
$ npm ci --no-audit --no-fund           → added 264 packages in 8s
$ which dotnet                          → (пусто: не установлен)
$ ls runtime/ricis-core/Ricis.WebApi.dll→ присутствует (mode: bundled-dll)
$ node -p "require('express/package.json').version" → 5.2.1

# старт и транспорт
$ npm run dev                           → «Dev server allowed hosts: all hosts…», «Server running on http://localhost:3000»
$ curl /api/health                      → 200, 4 ms
$ curl -H 'Host: 3000-test.e2b.app' /   → 200, 11 ms   (регресс A-0010 отсутствует)
$ curl :24678/                          → 426 Upgrade Required

# факт A
holder на 3000 + npm run dev            → «Server running», stderr пуст, процесс жив, 3000 не держит, отвечает holder
проба аргумента callback                → Error(code=EADDRINUSE)
контроль (plain http, без обработчика)  → краш EADDRINUSE
контроль (express@4.22.3 из npm)        → server.once('error', done) отсутствует

# факт B
RICIS_CORE_DOTNET_BIN=/tmp/fake-dotnet  → baseline 3–40 ms vs 9732–9744 ms во время пробы; GET / → ECONNRESET (2 раза из 3)
повторный POST /expressions/simplify    → freeze повторяется (10078 ms, затем 10017 ms)

# факт C
curl -sv *.googleapis.com               → SSL_ERROR_SYSCALL на ClientHello, rc=35, 0.03–0.09 s (4 хоста)
curl registry.npmjs.org / github.com    → 200 / 200
POST /api/generateProof без ключа       → 200 за 19 ms, тело = «RICIS-III структурный черновик»
grep "degraded" / "local_draft" в src   → потребителя контракта нет

# перепроверки (экранированные grep — без wildcard-артефактов) и гейт
$ grep -nE "\bAbortSignal|\.abort\(|req\.on\(|res\.on\(|'close'|\"close\"" server.ts   → пусто (отмены запроса нет)
$ grep -rn "componentDidCatch" src --include=*.tsx | grep -v '\.test\.'                 → 3 boundary (Map3D, RouteSurfaceBoundary, WidgetCapabilityBoundary)
$ grep -rn "setInterval" src --include=*.ts --include=*.tsx | grep -v '\.test\.'        → пусто (поллинга нет вообще, не только в core-модулях)
$ npm run lint   # tsc --noEmit                                                         → exit 0 (добавление этого документа гейт не ломает)
```

Все экспериментальные артефакты (`/tmp/fake-dotnet`, `/tmp/holder*.mjs`, `/tmp/probe-*.mjs`, `/tmp/freeze-test*.mjs`) — временные, вне репозитория; в дерево проекта не добавлено ничего, кроме этого документа. Подставной `dotnet`-host создавался **только** через штатную переменную окружения `RICIS_CORE_DOTNET_BIN`; исходники не модифицировались. Экспериментальные процессы остановлены, превью возвращено к штатному `npm run dev` без подмены переменных.

---

## 10. Остаточные риски

1. **A остаётся в силе до ремонта:** любой процесс, занявший 3000 (в том числе предыдущая сессия), делает превью мёртвым при зелёном логе. До контрмеры №1 отличить это состояние от рабочего можно только внешней пробой (`ss -ltnp` + `curl` с ожиданием тела приложения).
2. **B масштабируется хуже, чем измерено:** 10 с — цена одной пробы. Параллельные запросы в момент freeze встают в очередь; при нескольких одновременных действиях пользователя суммарное время может превышать таймауты reverse proxy (тогда вместо `ECONNRESET` будет 502/504).
3. **C2 — риск доверия, а не только UX:** пользователь может принять локальный канонический шаблон за результат внешнего агента. Для проекта с протоколом TUKHTA это отдельный класс риска: неотличимая подмена результата.
4. **Историческая трассировка ограничена:** shallow-клон (1 коммит) не позволяет датировать переход на Express 5 и, следовательно, установить, с какой версии дефект A присутствует в поставке.
5. **Статус этого документа:** `AUDITOR: SELF (same-pipeline)`. Независимого подтверждения нет; контрмеры не применены и не покрыты regression-тестами, поэтому ни один из дефектов нельзя считать закрытым.

---

## 11. Состояние `main` на момент подготовки PR (измерено 2026-09-17, `5d6d23f`)

Раздел добавлен, чтобы документ не устарел в момент открытия PR: `main` ушёл вперёд на один коммит (`5d6d23f docs: implement RICIS-III core immutability manifest`, +2130/−301 в 18 файлах), и ветка разбора была обновлена до него fast-forward. Всё ниже — **результат фактических прогонов**, а не чтения diff'а.

### 11.1 Находки A и B на `main` не устранены

```console
$ git diff --name-only 97583b6 5d6d23f -- server.ts server/ricisCoreSupervisor.ts server/devHostPolicy.ts
(пусто)
$ git show 5d6d23f:server.ts | grep -n "const PORT\|app.listen"
141:  const PORT = 3000;                                  # порт по-прежнему зашит
747:  app.listen(PORT, "0.0.0.0", () => {                  # callback по-прежнему игнорирует аргумент
```

Супервизор ядра (`spawnSync`-проба) не менялся. Контрмеры A-0010 (политика хостов) на месте: `server/devHostPolicy.ts` и его тесты присутствуют, `resolveDevAllowedHosts(...)` по-прежнему применяется.

### 11.2 `main` не устанавливается: `npm ci` падает, CI останавливается на шаге установки

```console
$ npm ci
npm error code EUSAGE
npm error `npm ci` can only install packages when your package.json and package-lock.json … are in sync.
npm error Invalid: lock file's vitest@4.1.10 does not satisfy vitest@5.0.1
npm error Invalid: lock file's @vitest/coverage-v8@4.1.10 does not satisfy @vitest/coverage-v8@5.0.1
npm error Invalid: lock file's @vitest/mocker@4.1.10 does not satisfy @vitest/mocker@5.0.1
npm error Invalid: lock file's @vitest/spy@4.1.10 … tinybench@2.9.0 … picomatch@4.0.5 … obug@2.1.4
npm error Missing: magic-string@1.4.1, @vitest/istanbul-lib-coverage@1.0.1, @vitest/istanbul-lib-report@1.0.1
```

Причина именно в lockfile, а не в манифесте:

```console
$ git diff --name-only 97583b6 5d6d23f -- package.json      → (пусто: package.json НЕ менялся)
$ git show 97583b6:package-lock.json | grep -A1 '"node_modules/vitest"'  → "version": "5.0.1"
$ git show 5d6d23f:package-lock.json | grep -A1 '"node_modules/vitest"'  → "version": "4.1.10"
```

Обходной путь тоже закрыт: установка без lockfile упирается в peer-конфликт, то есть «просто `npm install`» не лечит:

```console
$ npm install --no-package-lock
npm error code ERESOLVE
npm error Found: react@19.3.0
npm error Could not resolve dependency: peer react@">=19 <19.3" from @react-three/fiber@9.7.0
```

**Следствие для симптома владельца:** `pr-verify.yml` начинает с `npm ci`, поэтому весь CI на `main` красный **до** запуска тестов; а в свежей песочнице (где `node_modules` не сохраняется между итерациями) превью невозможно поднять штатной командой. Для локальных прогонов этого разбора зависимости ставились из рабочего lockfile базы `97583b6` (`npm ci` → 264 пакета), после чего lockfile `main` был возвращён на место — дерево коммита не изменялось.

### 11.3 Новый «preview health check» на `main` — проверка текстом, и она красная

Коммит добавил `tools/previewHealthCheck.test.ts` («Верификация работоспособности Превью»). Прогон в отдельном worktree на `5d6d23f`:

```console
$ npx vitest run tools/previewHealthCheck.test.ts        # worktree на 5d6d23f
× проверяет, что сервер разрешает внешние хосты (allowedHosts: true) для стабильного отображения в iframe
  → tools/previewHealthCheck.test.ts:45  expect(serverCode).toContain('allowedHosts: true')
Test Files  1 failed (1) · Tests  1 failed | 3 passed (4)
```

Две независимые проблемы:

1. **Тест красный на собственном коммите.** Он требует литерал `allowedHosts: true` в `server.ts`, тогда как там — `const allowedHosts = resolveDevAllowedHosts(process.env[DEV_ALLOWED_HOSTS_ENV])` и сокращённая запись `allowedHosts,` в `createViteServer({...})`. `git show 5d6d23f:server.ts | grep -c "allowedHosts: true"` → **0**. То есть тест противоречит контрмере №1 инцидента 2026-09-16 (единая политика в `devHostPolicy.ts` вместо литерала).
2. **Даже зелёным он не обнаружил бы ни A, ни B.** Все четыре проверки читают файлы (`existsSync`/`readFileSync` + `toContain`): сервер не поднимается, HTTP-запрос не делается, занятый порт не моделируется, блокировка event loop не измеряется. Это тот же класс, что F-01/QA-1 из `ACTIVE_TASKS.md` («проверяет лишь **текстовое** присутствие строки … — подмена основания метрикой») и вывод §4.4 инцидента 2026-09-16 («работа, требующая внешнего действия, которое не выполняется, — это не контрмера, а её описание»).

### 11.4 Полный прогон гейтов на коде `main` (зависимости — из рабочего lockfile базы)

| Гейт (шаг `pr-verify.yml`) | Команда | Результат |
| :-- | :-- | :-- |
| Install locked dependencies | `npm ci` | **FAIL** — EUSAGE, рассинхрон lockfile (§11.2) |
| Reject moderate+ vulnerabilities | `npm run security:check` | **FAIL** — 4 moderate: `@vitest/mocker` 2.1.0–4.1.10 (GHSA-82fw-gwwq-j7x9, path traversal) через `vitest`/`@vitest/coverage-v8`; `qs` (GHSA-x5fp-wj9c-mxmx, GHSA-4mjr-xmp4-gh2g). На lockfile базы `97583b6` тот же гейт давал `found 0 vulnerabilities` |
| Release alignment + TypeScript | `npm run release:check && npm run lint` | **PASS** — 14/14, `tsc --noEmit` rc=0 |
| TPS poka-yoke | `npm run tps:gate` | **PASS** |
| Board drift | `npm run tps:board:check` | **FAIL** — «дрейф витрины: `BOARD.md` не совпадает с `board.json`», ремонт `npm run tps:board`. Предсуществующее: воспроизводится и на базе `97583b6` |
| Findings digest drift | `npm run tps:digest:check` | **PASS** |
| Test suite | `npx vitest run` | **FAIL** — 3 failed / 2102 passed (2105) |
| Static build | `GITHUB_PAGES=true npx vite build` | **PASS** — built in ~1.2 s, чанков >500 кБ нет |

Три красных теста:

| Тест | Происхождение |
| :-- | :-- |
| `src/App.routeTopology.test.ts` → «declares literal dynamic imports for every route-level surface…» | **новое, внесено `5d6d23f`**: `src/App.tsx` заменён `const Map3D = lazyNamedComponent(() => import('./ui/Map3D'), 'Map3D')` на `import { Map3D } from './ui/Map3D'` |
| `tools/previewHealthCheck.test.ts` → `allowedHosts: true` | **новое, внесено `5d6d23f`** (§11.3) |
| `tools/tpsStandardWork.test.ts` → «keeps the generated showcase in sync with the board» | **предсуществующее**: воспроизведено на пристинном дереве базы `97583b6` (файл этого разбора был временно удалён, `git status` пуст) |

### 11.5 A/B-сборка: во что реально обошёлся статический импорт `Map3D`

Чтобы не приписывать коммиту следствие, которого нет, стартовый payload измерен двумя сборками (второй — в отдельном worktree на `97583b6`); payload считался как сумма JS-ассетов, на которые ссылается собранный `dist/index.html`:

| Сборка | JS-ассетов в стартовом payload | Итого стартовый JS | Всего JS в `dist/assets` |
| :-- | :-- | :-- | :-- |
| `97583b6` (`Map3D` ленивый) | 25 | **2525.13 kB** | 4005 kB |
| `5d6d23f` (`Map3D` статический) | 25 | **2550.10 kB** | 4029 kB |
| Δ | 0 | **+24.97 kB (~+1 %)** | +24 kB |

Выводы, которые из этого следуют (и которые не следуют):

* Заметного утяжеления первой загрузки этот коммит **не** дал — заявлять «интерфейс стал медленным из-за Map3D» было бы подменой. Реальная цена коммита — сломанное собственное правило ленивой топологии и красный тест.
* Самостоятельный фактор, не связанный с коммитом: стартовый payload уже сейчас **~2.5 МБ JS в 25 запросах** (в dev-режиме через Vite-мидлварь — 200+ модульных запросов, см. инцидент 2026-09-16 §6: «208/208 запросов → 200»). В проксированном превью это существенная часть времени до первой отрисовки и дополнительная причина «интерфейс долго не появляется».
* Совместно с находкой B это даёт наблюдаемый симптом: тяжёлая первая загрузка + 10-секундные заморозки сервера с `ECONNRESET` на документе = «периодически слетает».

### 11.6 Что намеренно НЕ сделано в этом PR

* **Не** перегенерированы `package-lock.json`, `BOARD.md` и `FINDINGS_DIGEST.md`, **не** правились `src/App.tsx` и `tools/previewHealthCheck.test.ts`, **не** повышалась версия. Это чужие артефакты и чужие решения (реестры охраняются `tps:gate`, lockfile — вопрос политики зависимостей, `Map3D` — вопрос топологии маршрутов), а ORIGINAL_GOAL этого разбора — установить причину, а не переписать `main`.
* Отдельно: контрмера №9 (андон `A-0012` + карточка в `board.json`) тоже **не** выполнена — доска сейчас в состоянии дрейфа, и правка `board.json` поверх чужого незафиксированного состояния смешала бы два несвязанных ремонта в одном PR.

