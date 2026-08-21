# Security Policy

## Supported version

Поддерживается только текущая patch-версия в ветке `main`. Актуальный номер версии указан в `package.json`, `src/version.ts`, README и `CITATION.cff`.

## Reporting a vulnerability

Не публикуйте секреты, access tokens, API keys, личные данные, рабочие proof sources с конфиденциальными данными или детали эксплуатируемой уязвимости в публичном issue. Создайте private security advisory в GitHub repository либо свяжитесь с владельцем репозитория через указанный в `CITATION.cff` ORCID-профиль, кратко описав риск и безопасный способ обратной связи.

Полезный отчёт содержит затронутую версию, воспроизводимый минимальный сценарий, ожидаемое и фактическое поведение, оценку воздействия и безопасный proof-of-concept без чужих секретов.

## Security invariants

RICIS3-Expansion-Map не принимает, не сохраняет и не разделяет пользовательские API keys. `GEMINI_API_KEY` допустим только server-side. Legacy key-pool endpoints остаются отключёнными. Live Telegram transport отключён, пока не будет отдельно спроектирован и проверен защищённый gateway с webhook secret, deduplication и безопасным lifecycle доставки.

Если секрет уже попал в Git history, его необходимо отозвать у провайдера. Удаление строки из текущего дерева не делает ранее раскрытый credential безопасным.
