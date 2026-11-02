# Klaviyo integration

## Implemented

Next.js server-only adapters use Klaviyo's `2026-10-15` JSON:API contract. Browser paths and input names stay compatible with the scaffold; the adapter maps camelCase preferences to `preferred_companion`, `desk_mood`, and `visual_style`.

- `POST /api/identify`: upsert a profile and optional preferences. No consent or list membership is requested. A verified profile response returns HTTP 200 and `status: identified`.
- `POST /api/events`: send one of the four allowed SIDEQUEST custom events. The input `eventId` becomes `unique_id` and remains identical on retry. HTTP 202 means accepted, processing pending. Demo checkout totals stay custom properties and never populate provider revenue fields.
- `POST /api/subscribe`: require `consent: true` and submit the list subscription job with `historical_import: false`. Invited mode saves preferences first; public mode verifies bot protection and double opt-in without profile updates. HTTP 202 means accepted; neither confirmation nor email delivery is inferred.
- `GET /api/subscribe`: expose the configured mode and whether confirmation is required. Public mode verifies list readiness through a read-only Klaviyo request. Private values are never serialized.

## Public newsletter rollout

`KLAVIYO_SUBSCRIPTION_ACCESS=public` opens only newsletter signup to all visitors when `SIDEQUEST_MODE=live`. Profile identification, custom events, and Oracle email-profile saves retain their existing invited-recipient gates. The public form is not an authenticated profile session.

Public signup uses Vercel BotID Basic (`botid@1.5.12`) on both the client and server. The server fails closed if protection is unavailable or it is not running on Vercel. Each accepted browser request also reads the configured Klaviyo list and requires `opt_in_process=double_opt_in` before submitting the subscription job. The key needs `lists:read`, `lists:write`, `profiles:write`, and `subscriptions:write`. The private JSON:API adapter remains on revision `2026-10-15`; no Klaviyo SDK is installed.

Public submissions require explicit consent, reject preference changes, and skip profile upserts. This lets Klaviyo create a new profile only after the recipient confirms, rather than letting someone overwrite an existing profile by typing its email address. Confirmation establishes newsletter consent, not a website login. The UI reports acceptance and asks the visitor to check their inbox; it does not claim a confirmed subscription or delivered email.

Vercel production needs `SIDEQUEST_MODE=live`, `KLAVIYO_SUBSCRIPTION_ACCESS=public`, `KLAVIYO_PRIVATE_API_KEY`, `KLAVIYO_LIST_ID`, and `KLAVIYO_API_REVISION`. Keep the key encrypted/server-only. `NEXT_PUBLIC_KLAVIYO_SITE_ID` is a public site identifier and does not install the chat widget. Environment changes require a fresh deployment. Existing Oracle variables are independent and must be preserved. Local development and Playwright remain in demo mode.

### Production evidence — November 2, 2026

Released source commit `0806ae4` to [sidequest.raul.engineer](https://sidequest.raul.engineer), deployment `dpl_2RpQQemVCkVpnKgxtwWLxfewTSHA`. The existing encrypted production key and Oracle configuration were preserved. The list ID, API revision, public site ID, live mode, and public subscription mode are now stored in Vercel production. Deployment input came from a tracked-source archive with no local credentials or test artifacts.

- Live `GET /api/subscribe` returns HTTP 200 with `mode=live` and `confirmationRequired=true`, after reading the actual Klaviyo list with the production key.
- **SIDEQUEST Newsletter** now uses double opt-in. A recipient-free invalid API payload returned HTTP 400 rather than a missing-scope error for the locally configured subscription key.
- A direct POST without BotID proof returns HTTP 403 `request_not_verified`.
- A production-browser submission using an address rejected by server validation passed bot verification and reached the expected validation error. It created no subscription and sent no email.
- The live village, catalog feed, and public Post Office form render correctly. The browser bundle was scanned for the configured private key and contained no match.
- Typecheck, lint, 88 unit/integration tests, and all 32 Desktop Chrome/Pixel 7 browser checks passed in the final run.
- The **SIDEQUEST Welcome** flow remains Draft. Confirmation uses the existing account sender/template; no branded confirmation copy or welcome campaign was published. Actual subscription confirmation and inbox delivery were not tested.

Public signup is available to every visitor. Public Oracle recommendations remain local, while email-profile saves still use the invited test gate. Automatic shopping events and the Camp chat widget are separate features and are not enabled by this release.

## Local configuration

Keep private values in ignored `.env.local`. Demo mode makes no provider calls. For invited live testing, configure `SIDEQUEST_MODE=live`, `KLAVIYO_SUBSCRIPTION_ACCESS=invited`, the existing key/list/revision values, and `KLAVIYO_LIVE_ALLOWED_EMAILS` with the intended test addresses. Empty or non-matching allowlists block invited operations before network access. Do not use wildcard recipients.

Initial adapter verification used an isolated worktree and loaded the existing configuration in memory with one allowlisted test recipient. The test suite uses fake credentials and mocked transport. Opening profile writes publicly still requires verified email ownership; the development allowlist is not authentication. Public newsletter protection is described above.

## Retries and uncertain outcomes

Each provider operation has at most three attempts, a 15-second request budget, and a per-attempt timeout up to five seconds. Profile upserts and event calls can retry transient failures with unchanged payloads. Rate-limit responses respect `Retry-After`; waits beyond the budget return an actionable 429 instead of sleeping indefinitely.

A subscription job is not automatically replayed after a transport timeout or 5xx, because the original job may already have been accepted. The UI disables repeat submission for that uncertain outcome and tells the visitor to check status. Explicit 429 rejection may be retried within the budget. Provider bodies containing personal data are not returned or logged.

## Account configuration and evidence

Configured through the Codex embedded browser on 2026-11-02:

- Existing list: **SIDEQUEST Newsletter**, ID `UhCdqX`. Initially single opt-in; the public rollout requires double opt-in.
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
- [Klaviyo double opt-in](https://help.klaviyo.com/hc/en-us/articles/115005251108)
- [Vercel BotID setup](https://vercel.com/docs/botid/get-started)
- [BotID check levels](https://vercel.com/docs/botid/advanced-configuration)
