# Adapter contracts, retries, and evidence

## Define the application contract first

For each event, specify trigger, allowed properties, identity source, logical event ID, demo/live mode, and failure behavior. Keep product/answer IDs stable and include a recommendation rule version when interpreting preferences depends on it. Exclude per-frame telemetry and unneeded free-form personal information.

A server adapter translates this internal contract to the exact provider schema. Check required JSON:API nesting, headers, revision, and SDK method signatures using current documentation. An instructional excerpt is not a substitute for the full endpoint contract. Use a supported API revision intentionally rather than a date guessed from the current calendar.

In Next.js, place HTTP handling in the relevant `app/api/.../route.ts` and provider work in a `server-only` module using private `process.env` values. Validate browser inputs before invoking the adapter. Keep subscription/event mutations out of page rendering and static generation. A server-capable deployment is required for these live endpoints; static export cannot execute them.

For a prototype, persist only the retry state needed by the requirement. Production durability may need a server queue/outbox, but do not introduce that infrastructure to a mocked demo. In either case, retain the original logical event identity during retries and prevent duplicate UI submissions while an operation is pending.

Do not rely on a Next.js process-global queue or detached promise to survive serverless request completion or restarts. Await the required operation, or use durable infrastructure when delivery guarantees require it. Check runtime compatibility before choosing Edge for a provider SDK.

## Retry policy

Honor `Retry-After` for 429 responses. For transient transport/5xx failures, use bounded exponential backoff with jitter and the same operation identity where the endpoint supports deduplication. Stop after the configured attempt/time budget and surface a recoverable state. Validation, authentication, and scope errors require correction rather than repeated blind retries.

If a POST times out, its result may be unknown. Do not manufacture success or immediately create a fresh logical operation. Verify the endpoint's retry/idempotency behavior or reconcile state. Event deduplication does not automatically apply to all subscription, campaign, or flow APIs.

## Subscription state

Represent input validation, submission in progress, request accepted, confirmation pending when established by the flow, verified subscription, and failure as distinct states where the product needs them. Never infer confirmed subscription from profile existence, list membership, or a generic accepted response. Distinguish lack of account access from a verified failure.

Keep consent separate from checkout and recommendation answers. For live tests, use only the intended account and authorized recipient; creating a subscription can trigger existing account automations. Check the configured behavior before a live mutation, using authorization already supplied by the user rather than repeatedly asking for it.

## Evidence and verification

Mocked tests should cover payload validation, repeat events, missing configuration, timeouts, rate limits, malformed provider responses, and subscription failure. Use fake recipients and keys in fixtures; avoid captured production payloads.

For an authorized live demonstration, record a redacted logical event ID, action time, selected API revision, provider acknowledgement, and account-side observation. Clearly label the strongest verified state: local simulation, request accepted, account record observed, message queued, or message delivered. A preview does not establish sending, and sending does not establish delivery.

Keep test/demo metrics out of real revenue automation. Do not modify production flows as cleanup for a prototype unless explicitly in scope.

Sources: [Events API](https://developers.klaviyo.com/en/reference/events_api_overview), [consent handling](https://developers.klaviyo.com/en/docs/collect_email_and_sms_consent_via_api), [rate limits and errors](https://developers.klaviyo.com/en/docs/rate_limits_and_error_handling). Queue design and the internal event contract are application recommendations, not Klaviyo guarantees.
