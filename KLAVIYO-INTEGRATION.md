# Klaviyo integration

## Implemented

Next.js server-only adapters use Klaviyo's `2026-10-15` JSON:API contract. Browser paths and input names stay compatible with the scaffold; the adapter maps camelCase preferences to `preferred_companion`, `desk_mood`, and `visual_style`.

- `POST /api/identify`: upsert a profile and optional preferences. No consent or list membership is requested. A verified profile response returns HTTP 200 and `status: identified`.
- `POST /api/events`: send one of the four allowed SIDEQUEST custom events. The input `eventId` becomes `unique_id` and remains identical on retry. HTTP 202 means accepted, processing pending. Demo checkout totals stay custom properties and never populate provider revenue fields.
- `POST /api/subscribe`: require `consent: true`, await profile/preference persistence, then submit the list subscription job with `historical_import: false`. HTTP 202 means accepted; neither confirmation nor email delivery is inferred.
- `GET /api/subscribe`: expose only the configured mode to the form. Private values are never serialized.

## Local configuration

Keep private values in ignored `.env.local`. Demo mode makes no provider calls. For deliberate live testing, configure `SIDEQUEST_MODE=live`, the existing key/list/revision values, and `KLAVIYO_LIVE_ALLOWED_EMAILS` with the intended test addresses. Empty or non-matching allowlists block all live operations before network access. Do not use wildcard recipients.

The isolated worktree does not copy private credentials or change the main checkout's mode. Its temporary verification server loaded the existing configuration in memory with one allowlisted test recipient. The test suite uses fake credentials and mocked transport. Public launch requires a reviewed identity/abuse-control design; the development allowlist is not a substitute for authentication or a production rate limiter.

## Retries and uncertain outcomes

Each provider operation has at most three attempts, a 15-second request budget, and a per-attempt timeout up to five seconds. Profile upserts and event calls can retry transient failures with unchanged payloads. Rate-limit responses respect `Retry-After`; waits beyond the budget return an actionable 429 instead of sleeping indefinitely.

A subscription job is not automatically replayed after a transport timeout or 5xx, because the original job may already have been accepted. The UI disables repeat submission for that uncertain outcome and tells the visitor to check status. Explicit 429 rejection may be retried within the budget. Provider bodies containing personal data are not returned or logged.

## Account configuration and evidence

Configured through the Codex embedded browser on 2026-11-02:

- Existing list: **SIDEQUEST Newsletter**, ID `UhCdqX`, single opt-in.
- User-selected test profile: ID `01M6F398XE262Q8R9QNMQC00V4`. Properties: `preferred_companion=ember`, `desk_mood=bold`, `visual_style=fantasy`. Consent was left **Never subscribed**. Klaviyo's list add-profile UI added list membership without marketing subscription.
- Welcome flow: **SIDEQUEST Welcome**, ID `X5C9GD`, list-triggered with the filter “can receive email marketing because subscribed.”
- Welcome message: **SIDEQUEST Welcome — Your companion**, message ID `Tnu8cF`. Subject: “Welcome to Willow Market.” Conditional companion content includes Ember, Moss, Bolt, and fallback. Keep the flow and message in Draft.

Account configuration is separate from backend verification. No live subscription or email send is part of this setup. The live profile adapter returned HTTP 200 with the same profile ID. A live `Sidequest Product Viewed` request returned HTTP 202 and its `productId=ember`, `discoverySource=market` properties were then verified in the profile activity log. Its stable event ID was `b3696c58-6c87-4dfa-9c68-b5833c67f4da`. The pre-existing test profile/list membership does not prove subscription API delivery or automatically enter a newly created flow. Use previews for this profile; do not add past profiles or activate the flow as a workaround.

## Verification

Mocked integration tests cover payload envelopes, preference ordering, consent rejection, allowlist rejection, response validation, event identity reuse, rate-limit delays, unknown subscription outcomes, credential failures, and no-network demo behavior. A production build and browser checks cover the form's public mode and response states. Account-side profile and product-view event delivery were verified through the embedded browser. Live subscription delivery was deliberately not exercised, so that no consent or email was triggered.

The saved email renders Ember for the test profile and the fallback for a profile without a preference. Its HTML content block is versioned at `assets/email/sidequest-welcome-content.html`; the native Klaviyo footer supplies organization and unsubscribe tags. The sender name is SIDEQUEST; the existing sender email and organization/address footer are inherited from the account. Before enabling automatic sending, review those inherited details and the final storefront URL. The draft intentionally has no invented public storefront link. The supported chat widget and domain-event dispatch from the map remain separate work.

## References

- [Profile upsert OpenAPI](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/create_or_update_profile.json)
- [Event OpenAPI](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/create_event.json)
- [Subscription OpenAPI](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/bulk_subscribe_profiles.json)
- [Rate limits](https://developers.klaviyo.com/en/docs/rate_limits_and_error_handling)
- [Template conditionals](https://help.klaviyo.com/hc/en-us/articles/7655926841499)
