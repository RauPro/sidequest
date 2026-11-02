# SIDEQUEST Oracle recommendations

## Account configuration

- Skill: `SIDEQUEST Oracle recommendations` at <https://www.klaviyo.com/kagent/skill/sidequest-oracle-recommendations/details>.
- Custom tool: `Get SIDEQUEST companions` (`custom:kBQBB4s7DsNY`). GET <https://sidequest.raul.engineer/catalog/klaviyo.json>, no credentials or customer variables. Keep permissions **Only in skills**.
- Attached built-in tool: `Get Profile`. Read `preferred_companion`, `desk_mood`, and `visual_style` only for an identified shopper.
- Do not use the generic Search Shop Catalog tool: it targets Converza's storefront, not SIDEQUEST.
- Current explicit preferences and budget override saved choices. Otherwise use a valid saved companion; then map bold/fantasy → ember, calm/nature → moss, curious/technology → bolt. Prices are dollars, not cents.
- Recommend only currently available products returned by the tool. Return their exact product links. No fabricated prices, dimensions, stock, shipping or order claims.
- This skill reads preferences; it does not subscribe, send messages, or modify a profile. Anonymous shoppers can browse without signing in.

## Oracle preference save

`POST /api/oracle/preferences` accepts `{ email, mood }`, where mood is `bold`, `calm` or `curious`. The server derives all three profile properties from the existing Oracle rules, writes only those properties using `POST /api/profile-import` revision `2026-10-15`, then verifies the returned properties before reporting success. Requests have the shared size, content type and same-origin checks; the private key stays server-side. Responses are never cached and do not disclose profile IDs or provider bodies.

Configuration:

- `ORACLE_PROFILE_MODE=demo` is the default: no provider request, and the UI says the preference was not sent.
- `ORACLE_PROFILE_MODE=live` enables profile saves independently of `SIDEQUEST_MODE`. Checkout, newsletter and other scaffold operations remain demo-only.
- `KLAVIYO_PRIVATE_API_KEY` needs `profiles:write`.
- `ORACLE_PROFILE_ALLOWED_EMAILS` is a comma-separated list of deliberately invited test addresses. Empty blocks all live saves.

This is an invited demo, not account authentication: knowing an allowlisted email does not prove its ownership. Do not broaden the allowlist for public use. Before a public launch, use verified sessions/email ownership, durable abuse controls, and connect that identity to the supported Customer Agent web chat login. Saving a profile here does not authenticate a separate chat session. Until that connection exists, test identified behavior using the profile selector in Klaviyo's playground.

The browser remembers only the mood locally. A save is made only after submitting the email form. Retry repeats the same three values and does not add newsletter consent, list membership or events. A timeout is reported as unconfirmed rather than success.

## Validation

- Typecheck, lint, unit/integration and production Playwright checks are required before release.
- Mocked tests cover the exact provider payload, chosen-address gate, demo isolation, malformed input, rate limits/provider failures, response verification and redaction.
- Desktop/mobile tests cover hydration, local mood persistence, truthful simulation and recoverable form errors.
- Playground cases: anonymous calm under $20 → Moss; identified saved preference → matching product; a conflicting explicit choice overrides saved preference; under $10 → no match.

References: [Klaviyo custom tools](https://help.klaviyo.com/hc/en-us/articles/51581436512155), [profile tools](https://help.klaviyo.com/hc/en-us/articles/50972391959835), [profile import](https://developers.klaviyo.com/en/reference/create_or_update_profile). Checked November 2, 2026.

## Playground evidence — November 2, 2026

The custom catalog tool returned HTTP 200 from the public SIDEQUEST feed. The new skill returned Moss ($18) with its correct link for an anonymous calm/under-$20 request, and correctly found no match under $10. For the user-selected identified test profile, Get Profile found no stored Oracle properties; the response reported that absence rather than inventing a saved choice.

The website implementation is committed and tested, but has not yet been deployed. Automatic approval review rejected uploading the existing Klaviyo private key to Vercel production and enabling persistent live profile writes without explicit authorization for that secret, destination, and scope. The user was asked to approve the production connection. Until approved and deployed, live Oracle preference saves and the saved-value end-to-end test remain pending; do not report them as complete.
