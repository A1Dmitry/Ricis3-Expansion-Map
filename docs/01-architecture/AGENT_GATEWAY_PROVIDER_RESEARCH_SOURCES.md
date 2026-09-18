# Agent Gateway provider research sources

**Status:** Research record for the proposed provider-agnostic Agent Gateway. It is not an approval to create providers, enable connectors, store credentials, send requests, or advertise a provider as universally free.

## Verified provider observations

| Provider | Officially documented access relevant to gateway | Free/cost boundary | Discovery/search capability | Adapter status |
|---|---|---|---|---|
| Existing Gemini Developer API | Current project server already uses `GEMINI_API_KEY` and `@google/genai`. | Gemini Free Tier is associated with an active project/free trial and select models; rate limits are project-bound and model/account dependent. | Existing project call path is text generation only; web search must not be assumed. | Existing hard-coded access candidate to extract behind `IAgentProvider`. |
| Groq | Groq publishes Free Plan rate limits and an OpenAI-compatible chat endpoint. | Limits are organization-level and subject to current account limits. No free quota permanence promise is made by this project. | `groq/compound` and `groq/compound-mini` document built-in web search and source citations. Built-in tool pricing must be checked at activation time. | Candidate for application-led autonomous tool election after user provides a Groq key and approves provider-specific review. |
| OpenRouter | A unified model API with free model variants marked `:free`. | Free variants have documented 20 RPM plus 50 RPD without purchased credits; web search can have extra costs even with free models. | A server-side `openrouter:web_search` tool has citation annotations, but search costs/requirements must be checked per selected model/engine. | Candidate inference adapter; discovery capability disabled by default until cost policy is explicitly approved. |
| Hugging Face Inference Providers | Routed provider API works with a Hugging Face user access token. | A free user has $0.10 monthly experimentation credit, subject to change; usage after credit requires paid credits. | No provider-wide web-search capability was verified in this research pass. | Candidate inference-only adapter, lower priority due to very small free credit. |
| Cloudflare Workers AI | Available on Free and Paid plans, with a catalog of 50+ open models. | Concrete per-account free allowance/limits require a separate activation-time review. | Generic model inference is documented; no provider-wide discovery search was verified here. | Candidate deployment-hosted adapter, not an immediate external API fallback. |

## Security conclusion

The gateway must treat provider availability as a run-time capability state, never a hard-coded guarantee. `free`, `quota_available`, `search_available`, `credential_configured`, `provider_approved`, `server_runtime_required`, `user_consent_required` and `structured_output_available` are separate facts. A provider can be enabled for context-only inference without being eligible for application-led `AUTO` tool election. Search must return source citations and can only create schema-validated `ProviderCandidate` records; it cannot create an adapter, store an unknown key, enable a provider, change the active default, or execute downloaded content.

## Primary sources

[1]: [Gemini OAuth quickstart](https://ai.google.dev/gemini-api/docs/oauth)
[2]: [Gemini billing](https://ai.google.dev/gemini-api/docs/billing)
[3]: [Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
[4]: [Groq rate limits](https://console.groq.com/docs/rate-limits)
[5]: [Groq Compound built-in tools](https://console.groq.com/docs/compound/built-in-tools)
[6]: [Groq web search](https://console.groq.com/docs/tool-use/built-in-tools/web-search)
[7]: [OpenRouter limits](https://openrouter.ai/docs/api_reference/limits)
[8]: [OpenRouter web search](https://openrouter.ai/docs/api_reference/responses/web-search)
[9]: [Hugging Face Inference Providers pricing](https://huggingface.co/docs/inference-providers/pricing)
[10]: [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/)
