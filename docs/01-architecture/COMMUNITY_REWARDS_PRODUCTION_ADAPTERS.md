# CommunityRewards: production adapters and activation boundary

**Статус:** архитектурная и application-layer основа реализована в release `0.4.31`; реальные referral links, account-bound balances и rewards **выключены**, пока не подключены все обязательные server-side adapters.

## Purpose

`CommunityRewards` is a product bounded context for non-transferable **RICIS App Tokens**. Tokens are not money, cryptocurrency, a payment instrument, an investment, a transferable asset or mathematical/proof evidence. They may be reserved only for explicitly configured in-app feature scopes.

The browser is an untrusted presentation client. It may copy an ordinary public application URL and query the availability status, but it cannot issue a referral code, bind an account, qualify an invitation, post a ledger credit, consume a balance or elevate Core/Lean/proof status.

> A public static deployment currently returns `503 backend_unconfigured` from `/api/community-rewards/v1/*`. This is intentional fail-closed behavior, not a broken local fallback.

## Stable domain seams

| Layer | Stable interface | Replaceable adapter responsibility |
|---|---|---|
| Identity | `IIdentityAccessPort` | Managed session, account identity, fresh authentication and new-account eligibility |
| Transaction | `ICommunityRewardsUnitOfWork` | SQL transaction and repositories with unique constraints |
| Referral code | `IReferralCodePort` | CSPRNG opaque code, keyed/server-side hash and constant-time verification |
| IDs / time | `ICommunityRewardsIdPort`, `ITimePort` | UUID/ULID provider and trusted clock |
| Abuse controls | `IRateLimitPort`, `IRiskReviewPort` | Per-action throttling, anomaly/review policy and operator review integration |
| Reward authority | `ITrustedAutomationAccessPort` | Internal worker authentication for qualification and reward posting; public browser requests are denied |
| Audit / delivery | `IRedactedAuditPort`, `INotificationOutboxPort` | Redacted event storage and transactional outbox delivery |
| Product use | `IFeatureEntitlementPort` | Feature policy before token reservation or consumption |

`CommunityRewardsApplication` owns orchestration and state transitions. It imports none of React, map/Zustand, Ricis.Core, Lean, database SDK, auth SDK, HTTP transport or vendor-specific client. This preserves SOLID dependency inversion and permits replacing adapters independently.

## Mandatory activation checklist

Real rewards may be enabled only after all controls below are implemented and covered by integration tests.

| Control | Required production behavior | Activation blocker if absent |
|---|---|---|
| Managed identity | HTTPS-only authenticated session in `HttpOnly`, `Secure`, `SameSite` cookies; authenticated account subject from server middleware | No user-bound links or dashboard |
| Durable ledger database | Append-only ledger table, referral relationship table, receipt table and idempotency table in one ACID transaction | No balance/reward posting |
| Constraints | Unique `(campaign_id, invitee_account_id)`, one reward receipt per relationship and idempotency uniqueness | No referral binding or credit posting |
| Opaque codes | Cryptographically random public code; store only keyed/HMAC or slow hash; rate-limit lookup; generic invalid response | No link issue/capture |
| Qualification worker | Server-to-server authenticated worker is the only caller allowed to transition `qualification_pending → qualified` and post rewards | No qualification/rewards |
| Abuse controls | Rate limits, self-referral check, eligibility policy, campaign caps and review queue | No reward posting |
| Audit | Redacted structured security events; never include raw code, access/session token, password, full IP or proof payload | No production activation |
| Transport | Exact allowed origin/CORS policy, JSON schema validation, request size limits and no credentials in URL | No public endpoint |
| Outbox | Commit business transaction before asynchronous email/notification delivery; replay-safe delivery | No user notification claim |

## Transaction invariant

The reward operation must have a single database transaction boundary. After a trusted worker validates the campaign, relationship, eligibility, risk decision and cap, it writes exactly two ledger rows, one reward receipt, one relationship transition and one idempotency record. A replay with the same idempotency key returns the existing receipt and writes no additional credit.

Corrections are compensating `reversal` entries. Historical ledger rows and receipts are never mutated or deleted. Feature reservation/consumption uses a separate reservation state machine and must not modify proof, graph, Core or Lean state.

## HTTP activation sequence

The current route namespace is fixed at `/api/community-rewards/v1`. Replace `registerCommunityRewardsUnavailableRoutes` only with a composition root that injects all mandatory production adapters. The replacement must retain the status endpoint and return typed failures for unauthenticated, rate-limited, invalid, expired, review and unavailable paths.

The following endpoints are intentionally **not** enabled by the static Pages app: public code issue, referral claim, qualification and reward post. When enabled server-side, each endpoint needs authentication/authorization proportional to the transition. The qualification/reward endpoints must additionally require internal service authentication and must not accept an account ID, token amount or qualification flag from the browser.

## Non-goals and trust separation

CommunityRewards does not create nodes, graph effects, cached mathematical solutions, RICIS invariants, Core computation, axioms, Lean source, Lean evidence or `LEAN_VERIFIED`. It is not a payment, transfer, wallet, exchange or investment feature. The status-line button currently copies an ordinary application URL and explains availability; it does not claim that a friend has been referred or that tokens have been awarded.

## References

[1]: https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html "OWASP Transaction Authorization Cheat Sheet"
[2]: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html "OWASP Session Management Cheat Sheet"
[3]: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html "OWASP Logging Cheat Sheet"

The activation controls follow the server-side transaction authorization, session and security-logging guidance in OWASP resources.[1] [2] [3]
