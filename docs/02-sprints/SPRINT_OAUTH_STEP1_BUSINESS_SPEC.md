# OAuth 2.0 / OIDC и Face ID-capable passkeys для Ricis3-Expansion-Map — шаг 1: бизнес-спецификация

**Статус:** `APPROVED — user approval получен; отдельная Ricis.Auth library implementation начата. Production provider credentials, deployment, persistence and Ricis3 integration не заявляются завершёнными.`
**Класс изменения:** новый security-sensitive web capability; исходный код, providers, secrets и существующие public contracts на этом шаге не меняются.
**Связанные инкременты:** client-culture report generation; external academic identity linking; future Zenodo publishing workflow.

> Эта спецификация задаёт только продуктовые и security-границы. Она **не** включает OAuth client IDs, client secrets, access tokens, BotFather secrets, personal access tokens, redirect URLs production-домена или автоматическую публикацию в Zenodo.

## 1. Бизнес-цель и граница результата

Web-проект должен позволить пользователю аутентифицироваться либо связать уже существующую локальную сессию с внешним исследовательским или рабочим аккаунтом. Поддерживаемые providers имеют разную семантику: Google, Telegram и ORCID документируют OIDC-compatible authentication; Manus Open App предназначен для delegated access к Manus API от имени пользователя команды; Zenodo официально документирует OAuth 2.0 access tokens для API, но текущая публичная developer documentation не задаёт OIDC sign-in contract. Face ID добавляется не как network OAuth provider, а как локальная device user-verification для WebAuthn passkey: сервер получает и проверяет public-key credential assertion, но не получает biometric image/template/result. Поэтому нельзя реализовывать все шесть кнопок как ложные эквиваленты «входа».[1] [2] [3] [4] [5] [7]

Первый релиз должен отделить **вход в приложение**, **явное связывание исследовательского идентификатора**, **отдельное согласие на получение данных для предзаполнения документа**, **соединение с делегированным API** и **согласие на публикационное действие**. OAuth sign-in подтверждает только identity flow: он сам по себе не разрешает читать или переносить в отчёт provider profile fields. Это исключает ситуацию, в которой email, Telegram username, ORCID iD или Zenodo credential ошибочно становятся универсальным primary key, доказательным утверждением, авторским SEO-полем или необратимым разрешением на публикацию.

| Возможность | P0 outcome | Не является частью P0 |
|---|---|---|
| Sign-in | Вход через Google, Telegram OIDC или ORCID OIDC с проверенным provider subject. | Использование email или отображаемого имени как unique identity. |
| Account linking | Пользователь в уже защищённой сессии может привязать или отвязать одну identity для каждого provider subject. | Автоматическое merging разных account records только по совпадению email, имени или ORCID text field. |
| Manus | Отдельное «Connect Manus» для delegated API access только после регистрации Open App и проверки Team eligibility. | Universal public Manus sign-in или неограниченный access к задачам/коннекторам. |
| Zenodo | Отдельный будущий «Connect Zenodo for deposit actions» после подтверждения authorization-code/client-registration contract. | Zenodo login button, хранение personal access token или автоматическая публикация. |
| Face ID-capable passkey | Passwordless sign-in или step-up authentication через device platform authenticator и WebAuthn user verification. | Прямой доступ к Face ID, biometrics, device passcode, private key, Apple account или их хранение сервером. |
| Отчётность | Выбранная на клиенте culture используется только для формирования текущего report request. | Серверное сохранение country/culture preference без отдельного consented product requirement. |

## 2. User story

> **Как** исследователь, автор или пользователь RICIS, **я хочу** безопасно войти через доступного identity provider либо явно связать ORCID/Manus/Zenodo с уже существующей сессией, **чтобы** создавать отчёты в выбранной культуре и по собственному согласию использовать внешние research workflows, не раскрывая password или token приложению в браузере.

### 2.1. Критерии бизнес-приёмки

| ID | Критерий | Проверяемый итог |
|---|---|---|
| BA-OAUTH-01 | Экран предоставляет только тех providers, для которых deployment содержит зарегистрированный client configuration. | Отсутствующий provider не отображается как working sign-in option и не создаёт ошибочную кнопку. |
| BA-OAUTH-02 | Пользователь понимает различие между **Sign in**, **Link research identity** и **Connect service access** до consent redirect. | Тексты и provider labels различают authentication, ORCID linking, Manus delegation и Zenodo actions. |
| BA-OAUTH-03 | Initial consent запрашивает минимальные права. | Google: `openid email profile`; Telegram: `openid profile`; ORCID: `openid`; `phone`, Google API access, ORCID write/read-limited, Manus broad scopes и Zenodo deposit actions выключены по умолчанию.[1] [2] [3] [4] |
| BA-OAUTH-04 | Callback принимается только на заранее зарегистрированном HTTPS URL production environment; request correlation защищён. | Проверяются exact redirect URI, `state`; для OIDC также `nonce`; для code flows используется S256 PKCE.[1] [2] [3] [4] |
| BA-OAUTH-05 | После callback backend валидирует token cryptographically и проверяет issuer, audience, lifetime и nonce при наличии. | Данные из browser query/popup сами по себе не создают authenticated session. |
| BA-OAUTH-06 | Provider subject является ключом внешней identity. | Google `sub`, Telegram OIDC `sub`, ORCID authenticated iD; email/name/username только mutable profile attributes и не применяются для automatic account merge.[1] [2] [3] |
| BA-OAUTH-07 | Connecting ORCID не становится академическим доказательством и не вносит автора в Lean/LaTeX автоматически. | Публичная author metadata продолжает формироваться только по существующему privacy-safe attribution contract и по отдельному user consent. |
| BA-OAUTH-08 | Пользователь может отключить provider. | Local link уничтожается; при наличии delegated token выполняется provider-side revocation, где она документирована, а локальная сессия продолжает работать через другие identities. |
| BA-OAUTH-09 | Culture reports не зависит от provider profile locale, country, email, phone или OAuth claims. | UI передаёт только явную culture либо временно определяет fallback по country manifest; preference не сохраняется server-side. |
| BA-OAUTH-10 | Ни client secret, ни access/refresh token, ни Telegram bot token, ни Zenodo PAT не попадает в frontend bundle, Git history, report, audit event, exception body или telemetry. | Secret scanning, redaction tests и review подтверждают отсутствие leaks. |
| BA-OAUTH-11 | После первого sign-in, до любого provider profile retrieval для отчёта, UI показывает самостоятельный consent dialog. | Dialog в явном виде называет provider, конкретные поля, цель «предзаполнение черновика отчётного документа», срок действия и кнопку отказа. Закрытие/отказ означает manual form entry без hidden provider request. |
| BA-OAUTH-12 | Consent гранулируется по полям и не делает profile data academic evidence. | В P0 разрешается запросить только заранее утверждённые document fields: display name и ORCID iD, если provider действительно предоставляет соответствующее поле. Email, phone, username, avatar, country, locale, contacts, Google APIs, ORCID record data и Manus/Zenodo access не предвыбраны и требуют отдельной поздней story. |
| BA-OAUTH-13 | Принятие consent формирует только draft-prefill и всегда требует human review до вставки в документ. | UI показывает source label у каждого предзаполненного значения; пользователь может изменить, очистить или не использовать поле. Значения не становятся author SEO, Lean metadata, proof fact или publication action без существующего отдельного contract. |
| BA-OAUTH-14 | Consent отзывен и scope-bounded. | Отзыв немедленно прекращает последующие provider reads для document prefill, удаляет локальную record согласия и при необходимости требует re-consent для следующего document request. |
| BA-PASSKEY-01 | «Войти с Face ID» означает WebAuthn/passkey и доступен только при platform user-verifying authenticator. | UI корректно предлагает системный Face ID/Touch ID/Windows Hello/PIN/other device-supported verification; не обещает Face ID на несовместимом browser/device. |
| BA-PASSKEY-02 | Backend не принимает и не хранит biometric data. | Он хранит только credential ID, public key, sign counter/metadata, immutable local account ID и lifecycle state; registration/authentication assertion проходит server verification against one-time challenge, RP ID and expected origin.[7] |
| BA-PASSKEY-03 | Passkey добавляется к уже authenticated account или через explicit account-recovery verified enrollment. | Нельзя создать или переопределить passkey только по email/name/provider profile data, а credential registration требует fresh authenticated session и user verification. |
| BA-PASSKEY-04 | Passkey не предоставляет provider profile data и не даёт consent на report prefill. | После passkey sign-in document-data consent flow остаётся отдельным и работа с provider data невозможна без linked provider и explicit user confirmation. |

## 3. Поставщики: подтверждённые границы

| Provider | Подтверждённая функция | Режим P0 | Явный запрет/ограничение |
|---|---|---|---|
| **Google** | OIDC поверх OAuth 2.0, authorization code flow, server-side code exchange и ID token validation. Google указывает exact registered redirect URI и рекомендует anti-forgery `state`.[1] | Primary sign-in provider с `openid email profile`. | Никаких Drive/Calendar/API scopes и persistent Google refresh tokens без отдельного approval. |
| **Telegram** | Telegram документирует OIDC Authorization Code Flow с PKCE, discovery/JWKS и server-side ID-token validation; `phone` scope выдаёт verified phone number только по согласию.[2] | Primary sign-in provider с `openid profile`. | `phone` и `telegram:bot_access` не запрашиваются initial flow; legacy hash widget не используется, пока OIDC доступен. |
| **ORCID** | ORCID supports OAuth 2.0 and Basic OpenID Provider profile. Public client может получить authenticated ORCID iD, зарегистрировав credentials и redirect URI; production URI требуют HTTPS.[3] [4] | Primary sign-in **или** link-research-identity с `openid`; default UX должен явно показать ORCID purpose. | Без `/read-limited`, member/write scopes, data harvesting, auto-public profile enrichment и auto-merge по typed ORCID. |
| **Manus** | Open App OAuth 2.0 code grant + PKCE делегирует scoped Manus API access; создание Open App и authorization доступны только Team users.[5] | `Connect Manus` — отдельное интеграционное capability после Team/Open App readiness. | Не считать Manus access token доказательством public login identity; не запрашивать `manage_all_tasks`, `use_connectors` или trusted app access без отдельной accepted story. |
| **Zenodo** | Zenodo developer API документирует OAuth 2.0, HTTPS Bearer access token и deposit scopes `deposit:write`, `deposit:actions`; для testing существует отдельный sandbox account/token.[6] | Backlog discovery gate для явного publication connection. | Не показывать Zenodo как validated OIDC sign-in provider; не собирать/просить Personal Access Token в UI; не создавать, не загружать и не публиковать records автоматически. |
| **Face ID-capable passkey** | WebAuthn использует asymmetric public-key cryptography; platform authenticator может выполнять local user verification, например Face ID. Device generates private key, server stores public key, and Face ID authorizes use of the passkey on compatible Apple devices.[7] [8] | Passwordless sign-in и later step-up authentication; discoverable passkey with `userVerification: required`. | Не называть это отдельным Apple/Face ID OAuth provider; не собирать face scan, biometric template, device passcode, private key или Apple account data. Не блокировать пользователя без Face ID: предложить supported passkey authenticator либо ранее approved OAuth path. |

## 4. Security и privacy invariants

### 4.1. Сессия и browser boundary

После успешного callback сервер создаёт свой собственный short-lived authenticated session. Browser получает только secure `HttpOnly`, `Secure`, `SameSite=Lax` session cookie. OAuth authorization code, access token, refresh token, PKCE verifier и provider client secret не могут храниться в `localStorage`, `sessionStorage`, URL fragment, client-side state store, screenshot, report template или console log.

Для каждого authorization attempt создаётся одноразовая server-side correlation record, содержащая случайные `state`, provider, intended action, requested minimal scopes, PKCE verifier и OIDC nonce при применимости. Correlation record имеет короткий TTL, потребляется атомарно после callback и не становится частью user profile. Несовпадение provider, state, nonce, redirect URI, issuer, audience, expiry или signature завершает flow generic error response без утечки token/claim.

### 4.2. Данные, отдельное согласие и academic boundary

Сущность account хранит локальный immutable identifier. Внешняя identity хранится в виде `provider + subject`, где subject является provider-stable ID, а не email, full name, username, telephone, profile image URL или client culture. Профильные поля минимизируются: display label может быть кратковременно показан пользователю, но author SEO, ORCID publication data, Google/Telegram profile и payout/payment data не смешиваются с proof graph, Lean artifact, academic report или LaTeX template.

**Document-data consent** запрашивается только после successful local session и только перед первым действием «предзаполнить отчёт из provider». Он не включён по умолчанию, не объединяется с OAuth consent screen и не может быть подразумеваемым следствием sign-in. Dialog должен показать понятную таблицу `поле → provider → назначение → куда будет помещено`, а acceptance обязано записывать source как `UserConfirmedProviderPrefill`, а не как proof/academic evidence. В initial P0 catalog разрешены только `display name` и уже authenticated `ORCID iD`; они создают редактируемый document draft. Если provider не даёт поле, поле остаётся пустым и предлагается ручной ввод. Никакой скрытый background enrichment после sign-in не допускается.

Consent record хранит только provider key, минимальный набор разрешённых prefill fields, document-purpose/version и timestamp; не хранит значение access token, raw claims или выбранную culture. Consent прекращается при manual revocation, provider unlink и logout/session invalidation, а новый provider read после отзыва требует повторного explicit confirmation. Отказ либо закрытие dialog не ухудшает basic sign-in, а отправляет пользователя к ручному заполнению.

Locale is not an OAuth claim. В form report generation порядок выбора только такой: **explicitly selected supported UI culture → client-provided country manifest default → `en-US` fallback**. Запись server-side culture preference не входит в данный инкремент. Приложение не выводит provider-derived country, language, phone или email в academic report.

### 4.3. Passkey / Face ID boundary

Passkey registration и authentication используют server-generated cryptographically random one-time challenge. Browser вызывает standard WebAuthn API, а device authenticator выполняет локальное user verification; на iPhone/iPad/macOS это может быть Face ID или Touch ID. Устройство создаёт и сохраняет private key, сервер хранит только public key и credential metadata. Server-side verification обязана проверить challenge consumption, signature, RP ID, origin, user-verification flag и credential lifecycle before local session creation.[7] [8]

Registration разрешена только для текущей authenticated local account при fresh session; authentication создаёт ту же short-lived application session, что и OAuth callback. Credential removal возможен из authenticated security settings и немедленно блокирует её дальнейшее использование. Passkey sync/recovery является функцией platform credential provider, а не нашего сервера; приложение не выдаёт и не восстанавливает biometric factor. `Face ID` label может быть показан только там, где browser capability подтверждает user-verifying platform authenticator; иначе user experience использует neutral label **«Войти с passkey»**.

### 4.4. Delegated service tokens

Когда отдельная одобренная история действительно требует continuing provider access, token encryption at rest выполняется server-side с envelope/key-management mechanism платформы и scoped token record привязывается к `provider + subject + intended capability`. Token невозможно вернуть через public API, UI, export, report, log или error. `Disconnect` удаляет encrypted local token record и инициирует documented revocation where available. Отказ refresh/revocation не отменяет local unlink и фиксируется только redacted security audit event.

> **Специальная граница Zenodo:** до получения официально подтверждённого authorization-code/client application flow, Zenodo не получает token persistence path. Personal Access Token — не credential для вставки в UI; он не является приемлемой заменой consented user OAuth connection.

## 5. RICIS-III relevance, non-goals и риски

OAuth не участвует в математическом reduction/proof path. Он не создаёт и не валидирует `L1_IDENTITY`, SP2/SP4, A1/A4/A6, Lean kernel status или semantic proof node. Любой proof/report endpoint должен принимать уже authenticated local principal, но статус authentication должен быть отделён от статусов **доказано по RICIS**, **унаследовано из классики**, **гипотеза** и **требует проверки Core/Lean**.

| Категория | Решение |
|---|---|
| Вне P0 | MFA enforcement, enterprise SSO, passkeys, RBAC administration, social graph, contact import, background token refresh, Google API access, Telegram messaging, ORCID record writing, Zenodo publishing, payment/account entitlement. |
| Главный security risk | Redirect/callback confusion, account takeover через email collision, token leak в frontend/logs, over-scoping, authorization state replay, incorrect provider token validation. |
| Главный domain risk | Ошибочно трактовать external profile или ORCID iD как доказательство авторства, proof validity или академической claim correctness. |
| Главный product risk | Назвать Manus или Zenodo «sign in» без подтверждённого identity contract; это должно быть раздельным provider capability. |
| Мера снижения | Shared typed provider adapter, server-side verifier, per-provider `AuthenticationCapability`, separate Link/Connect UI, contract tests и security redaction tests. |

## 6. Обязательные входы до Шага 2

Архитектура и implementation не начинаются до явного пользовательского `ОК` для этой спецификации и до подтверждения следующих deployment facts. Значения credential не передаются в issue, Git commit, Markdown, chat, unit tests или браузерную форму.

| Вход | Владелец | Нужен для |
|---|---|---|
| Canonical public HTTPS domain и callback route namespace | Product owner | Регистрация exact redirect URIs у Google, Telegram, ORCID и Manus. |
| Google OAuth Web client ID/secret в защищённой server environment | Product owner | Google OIDC sign-in. |
| Telegram bot, Allowed URLs, Client ID/secret от BotFather | Product owner | Telegram OIDC sign-in. |
| ORCID Public API sandbox credentials, затем production client credentials | Product owner | ORCID OIDC sign-in/link; first testing cannot use production record. |
| Manus Team owner/admin decision, Open App client registration и minimal scopes | Product owner | Отдельный Connect Manus path. |
| Official Zenodo client/OAuth authorization-code registration evidence | Product owner + research | Только после этого возможен design «Connect Zenodo»; до него feature blocked. |
| Privacy notice, ToS links, account-deletion/identity-unlink language | Product owner | Consent screen, sign-in UI и production launch. |
| Canonical HTTPS RP ID/domain и supported browser/device policy | Product owner | WebAuthn passkey/Face ID-capable registration and authentication; no external client secret is required. |

## 7. Следующий этап после «ОК»

После явного подтверждения следует только **Шаг 2 — System Architecture**. Он должен задать DI-first interfaces, provider capabilities, authorization attempt repository, session interface, external identity record, token vault boundary, webhook/publish boundary, DTOs, typed statuses и migration plan — без implementation code. Затем требуется отдельное `ОК`; только после него создаются adversarial QA tests, и лишь затем implementation.

## References

[1]: https://developers.google.com/identity/openid-connect/openid-connect "Google OpenID Connect"
[2]: https://core.telegram.org/widgets/login "Telegram Login and OpenID Connect"
[3]: https://info.orcid.org/documentation/api-tutorials/api-tutorial-get-and-authenticated-orcid-id/ "ORCID: Get an Authenticated ORCID iD"
[4]: https://info.orcid.org/documentation/integration-guide/orcid-oauth-sign-in-guidelines/ "ORCID OAuth Sign In Guidelines"
[5]: https://open.manus.ai/docs/v2/open-app "Manus Open App OAuth 2.0"
[6]: https://developers.zenodo.org/ "Zenodo REST API and Authentication"
[7]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API "MDN: Web Authentication API"
[8]: https://support.apple.com/en-us/102195 "Apple: About the security of passkeys"
