---
name: klaviyo-game-commerce
description: Implement or validate Klaviyo profiles, custom events, and explicit email subscription in game-like web storefronts, with demo/live separation, server-held credentials, stable event identities, and truthful delivery states. Use when Klaviyo is requested or already part of the project; this skill does not authorize campaigns or test email sends by itself.
---

# Klaviyo for interactive commerce

Read the requested integration contract and existing adapter before adding endpoints. Keep the browser experience usable without identification or live services. Distinguish catalog discovery, profile identification, marketing subscription, and purchasing as separate operations.

## Verify the current contract

Resolve Klaviyo in Context7 when available and query the specific endpoint or behavior needed. Confirm exact request schema, API revision, scopes, and response semantics in the current official reference or SDK types before writing an adapter. Context7 excerpts can simplify payloads; do not copy a flattened example into a JSON:API request without checking its required envelope.

Record the chosen revision and SDK version in implementation documentation. Do not hard-code a supposedly current revision in this reusable skill. Confirm whether the task needs a browser-safe client endpoint, a server API, or an existing native integration instead of duplicating a working pipeline.

## Application boundary

- Use explicit demo/live configuration. Demo subscription and checkout should not call the provider or imply that a message was sent.
- Keep private API keys server-side with needed scopes only. `VITE_` variables are exposed to the browser; they are not a secret store. Distinguish public site identifiers from private credentials.
- Validate the server's incoming action schema, allowed event names, and property types. Do not expose an unrestricted relay to arbitrary Klaviyo endpoints. Apply proportionate request limits to public subscription/event endpoints.
- Associate preferences with a profile only through the intended identification flow. Avoid fabricated identifiers or retroactive attribution of unrelated anonymous activity.
- Keep provider errors outside core cart mutation. Use redacted diagnostic information and correlation IDs instead of logging complete personal data or credentials.

## Events

Emit events from intentional completed domain actions, not React rendering, effect replay, or movement frames. Keep a stable logical event ID across retries. Klaviyo's documented event deduplication uses profile, metric, and `unique_id`; changing the ID on a timeout retry defeats that protection.

Keep simulated order metrics separate from real purchase metrics and revenue values. Use explicitly named demo properties when necessary. A request accepted for processing is not proof that an event is visible, a subscriber is confirmed, or an email was delivered.

## Subscription and errors

Use an explicit, initially unchecked consent choice when the product requires it. Profile creation or list association alone is not evidence of email subscription. Honor the configured confirmation process. Preserve user input after errors and display only success or pending states supported by the actual operation.

Read [contracts-and-evidence.md](references/contracts-and-evidence.md) when implementing the adapter, retries, subscription states, or a live demonstration. Do not enable a flow, send messages, or change account settings without task authorization that covers the action.

## Sources

Consulted 2026-11-02; recheck endpoint details at implementation time.

- [Events API](https://developers.klaviyo.com/en/reference/events_api_overview)
- [Consent API guidance](https://developers.klaviyo.com/en/docs/collect_email_and_sms_consent_via_api)
- [Authentication](https://developers.klaviyo.com/en/docs/authenticate_)
- [Rate limits and errors](https://developers.klaviyo.com/en/docs/rate_limits_and_error_handling)
- [Vite environment variables](https://vite.dev/guide/env-and-mode)
- Context7: resolved `/websites/developers_klaviyo_en`, queried event identity and accepted-response semantics.
