# SIDEQUEST — Zone Purposes and Klaviyo Setup

This document explains the purpose of each SIDEQUEST location, how it connects to Klaviyo, and what must be configured in the account and application.

This document records the zone goals and account-side setup background. The current application behavior is documented in [Architecture](ARCHITECTURE.md) and [Klaviyo integration](KLAVIYO-INTEGRATION.md); account setup steps for the current showcase are in the [account runbook](KLAVIYO-ACCOUNT-RUNBOOK.md). API details reflect the official documentation reviewed on November 2, 2026.

Related material:

- [Product requirements](SIDEQUEST-PRD.md)
- [Visual concept](../ui-concepts/sidequest.png)

## 1. Shared Product Model

SIDEQUEST is an explorable, retro RPG-inspired storefront for collectible desk companions. The village contains four functional locations:

- **Market:** discover and inspect products.
- **Oracle:** receive a recommendation based on preferences.
- **Camp:** ask product and store questions.
- **Post Office:** subscribe to updates from the village.

The **backpack** is the cart and remains accessible throughout the experience. A direct **Shop view** provides an alternative to navigating the village.

All locations use the same Klaviyo account. Browser events may include an email, `anonymous_id`, or email-link `_kx` identifier; these values support attribution and are not authentication. Camp is an in-game assistant backed by the application's guarded server route, not Klaviyo's web chat widget.

The application owns the world, catalog, recommendation rules, and cart. Klaviyo receives customer preferences and activity, manages subscriptions and messaging, and can provide customer assistance through Customer Agent.

## 2. Zone Overview

| Zone | Visitor experience | Product purpose | Klaviyo connection |
| --- | --- | --- | --- |
| Market | Talk to a merchant, inspect companions, compare details, and add a product to the backpack. | Product discovery and purchase intent. | Client API product-view, `Viewed Product`, and `Added to Cart` events. |
| Oracle | Answer two or three questions and receive a companion recommendation with an explanation. | Meaningful personalization. | Save selected preferences through `/api/oracle/preferences`; record completion and product views with Client API events. |
| Camp | Speak with a character about products, shipping, returns, or the demo. | Customer assistance. | Application route `POST /api/camp/chat` plus a topic-only Client API event; no raw prompt is sent as an event property. |
| Post Office | Enter an email address and explicitly agree to receive letters from the village. | Newsletter subscription and ongoing communication. | `POST /api/subscribe` for consent; eligible flows and `?letter=` deep links are configured separately. |

Every location is optional. A visitor can browse and check out without completing the Oracle dialogue or subscribing.

## 3. Market — Product Discovery and Shopping Activity

### Visitor-facing behavior

- Display the three fictional companions: an orange dragon, a green slime, and a blue robot.
- Let the merchant introduce the shop through a short dialogue.
- Show product images, names, descriptions, prices, and availability.
- Provide **Add to bag** and **Keep exploring** actions.
- Keep the backpack synchronized with the direct Shop view.

### Application responsibilities

- Define and maintain the product catalog and stable product IDs.
- Manage cart quantities and calculate totals.
- Send a product-view event when the visitor deliberately opens a product.
- Send a cart-change event after an actual change, rather than on every render.
- Keep simulated purchases explicitly separate from real orders.

### Klaviyo connection

The browser uses Klaviyo's Client API for behavioral metrics and discovery events. The private server event route remains available for explicitly submitted allowlisted custom events; product/cart UI metrics do not require an identified profile.

Custom event contracts:

| Event | Example data |
| --- | --- |
| `Sidequest Product Viewed` | `productId`, `discoverySource`. |
| `Viewed Product` | Stable `unique_id`, catalog product and product properties. |
| `Added to Cart` | Stable `unique_id`, product/quantity/value properties. |
| `Started Checkout` | Stable `unique_id`, cart contents and total. |
| `Sidequest Demo Checkout Completed` | Demo order ID, product IDs, quantities, demo total, currency; never a real order metric. |

The `Sidequest ...` events are application-defined custom metrics; `Viewed Product`, `Added to Cart`, and `Started Checkout` use Klaviyo's standard metric names. Events do not create or synchronize catalog items in Klaviyo.

### Account setup

- Create a private API key with `events:write` permission as part of the shared key configuration below.
- Send test events and verify that they appear against the intended test profile.
- No Market-specific email automation is required for the initial demonstration.
- Additional behavioral flows can be configured later, with the appropriate subscription eligibility and purchase-exclusion conditions.

Reference: [Create Event](https://developers.klaviyo.com/en/reference/create_event).

## 4. Oracle — Preferences and Recommendations

### Visitor-facing behavior

- Ask two or three concise questions about desk mood, visual style, or companion personality.
- Recommend a companion using explicit rules.
- Explain how the recommendation relates to the visitor's answers.
- Allow the visitor to retake the quiz or inspect another product.

### Application responsibilities

- Implement the initial recommendation logic inside SIDEQUEST.
- Ensure different answer combinations can produce different recommendations.
- Preserve the answers locally while the visitor remains unidentified.
- Once the visitor provides an email through the intended identification flow, associate the preferences with the correct profile.

### Klaviyo connection

When a visitor explicitly saves preferences, `POST /api/oracle/preferences` derives and stores the supported profile properties:

```json
{
  "preferred_companion": "ember",
  "desk_mood": "bold",
  "visual_style": "fantasy"
}
```

This is an example of the custom properties only, not a complete API request body.

The browser records `Sidequest Oracle Completed` and relevant product views through the Client API. Profile properties represent current preferences; the completion event records a particular interaction.

### Account setup

- Create or update a test profile with the proposed custom properties.
- Verify the values under **Audience → Profiles → select the profile → Details**.
- After a property exists on at least one profile, use it in segment conditions or flow filters.
- Optionally create a segment for visitors whose `preferred_companion` equals `ember`. Account for marketing subscription status when using that segment for email.

The initial recommendation is calculated by SIDEQUEST. Klaviyo uses the resulting preference for segmentation and communication.

References: [Create or Update Profile](https://developers.klaviyo.com/en/reference/create_or_update_profile), [Custom profile properties](https://help.klaviyo.com/hc/en-us/articles/115000250912).

## 5. Camp — Customer Assistance

### Visitor-facing behavior

- Let visitors approach or click a friendly character to request help.
- Answer questions about the companions and the store's supplied policies.
- Keep the character's personality consistent with the village while making answers clear.
- Answer with clear, demo-safe information about the companions and store policies.

### Optional future Customer Agent web chat

The current in-game Camp route does not use Customer Agent. If a separate web-chat integration is authorized later:

1. Open **Customer Agent** and complete its initial setup if prompted.
2. Under **Knowledge**, add or review product information, FAQs, store policies, webpages, or documents.
3. Configure **Guidance**: brand summary, tone, communication rules, and when the agent should escalate.
4. Review active skills and their integration requirements. Disable capabilities that the demo cannot actually support.
5. Configure the fallback or human handoff destination.
6. Under **Settings → Web chat**, configure appearance, visibility, and routing.
7. Test representative questions before enabling the web chat channel for visitors.

### Application connection

The current Camp encounter sends a structured topic and question to `POST /api/camp/chat`, protected by route validation and rate limiting. The application records only the topic in the Client API event. No external chat widget is loaded.

Optional future setup references: [Customer Agent setup](https://help.klaviyo.com/hc/en-us/articles/37659268052635), [Web chat setup](https://help.klaviyo.com/hc/en-us/articles/33660391549211), [Customer Hub and web chat JavaScript API](https://help.klaviyo.com/hc/en-us/articles/52225531809819).

## 6. Post Office — Subscription and Welcome Messages

### Visitor-facing behavior

- Present subscription as receiving letters, new companion announcements, or recommendations from the village.
- Explain what messages the visitor can expect.
- Request an email address and explicit marketing consent.
- Display validation, loading, confirmation-required, success, and failure states accurately.

### Application responsibilities

- Validate the form.
- In invited mode, save the visitor's existing Oracle preferences before requesting subscription.
- In public mode, verify BotID and double opt-in configuration without upserting a profile.
- Request subscription only after the visitor accepts it.
- Do not interpret a product view, quiz answer, or checkout action as marketing consent.
- Keep the page usable while the subscription is being processed.

### Klaviyo connection

Use `POST /api/subscribe`; its server-only Klaviyo adapter submits the subscription job to the intended list.

If the list uses double opt-in, the visitor must confirm the email before subscription completes. The UI must distinguish a submitted request from a confirmed subscription.

Creating a profile or adding a profile to a list is not interchangeable with collecting a valid marketing subscription.

### Account setup

1. Open **Audience → Lists & segments**.
2. Create a list named **SIDEQUEST Newsletter**.
3. Open the list and find **Settings → Details → List ID**.
4. Save the List ID in the application's configuration.
5. Review the list's opt-in configuration and prepare the confirmation experience if applicable.
6. Create the welcome flow described below.

References: [Find a List ID](https://help.klaviyo.com/hc/en-us/articles/115005078647), [Bulk Subscribe Profiles](https://developers.klaviyo.com/en/reference/bulk_subscribe_profiles).

## 7. Shared API Configuration

In the organization menu, open **Settings → API keys** and create a private key named **SIDEQUEST Development**.

Required scopes for server-side profile, event, and subscription operations:

| Scope | Purpose |
| --- | --- |
| `profiles:write` | Create or update profiles and their preferences. |
| `events:write` | Record product, cart, and Oracle activity. |
| `lists:read` | Verify list readiness and opt-in settings for public newsletter signup. |
| `lists:write` | Support the subscription operation that adds profiles to the selected list. |
| `subscriptions:write` | Request the marketing subscription. |

Additional read permissions are needed only if the implementation adds API-based retrieval or verification. Optional catalog synchronization would require its own endpoint-specific permissions.

Keep the private key in server-side environment configuration, outside source control and browser bundles. The public Site ID is used by browser Client API events and back-in-stock requests; it is not a substitute for the private key on server-side endpoints.

Server API base URL: `https://a.klaviyo.com`.

The referenced profile, event, and subscription endpoints currently document the `2026-10-15` revision. Pin the chosen supported revision consistently in implementation and follow each endpoint's request schema.

Reference: [Create a private API key](https://help.klaviyo.com/hc/en-us/articles/7423954176283), [API overview](https://developers.klaviyo.com/en/reference/api_overview).

## 8. Welcome Flow Configuration

Create a flow named **SIDEQUEST Welcome** in **Flows**.

### Behavior

1. Trigger when an eligible new subscriber joins **SIDEQUEST Newsletter**.
2. Read the profile's `preferred_companion` property.
3. Use conditional content or branches for the selected companion.
4. Send a general welcome when the preference is missing.

Example message concept:

> Ember welcomes you to Willow Market. Meet your fiery desk companion and explore the rest of the village.

Prepare the email content and sender settings, and ensure marketing subscription eligibility is respected.

### Testing states

- **Draft:** use while editing. Draft messages do not schedule recipients.
- **Manual:** use when testing flow behavior and reviewing scheduled messages. Messages are not sent automatically.
- **Live:** use when the configured flow is ready to send automatically to its intended audience.

Saving Oracle properties before requesting subscription reduces the risk that a new subscriber reaches the welcome flow before the preference is available. Still include a missing-preference fallback.

Reference: [Getting started with flows](https://help.klaviyo.com/hc/en-us/articles/115002774932).

## 9. Visitor Identity and Data Flow

Visitors can explore without providing an email address. Client API events may use an email, `anonymous_id`, or `_kx` when available; these values are for attribution, not authentication.

### Before identification

- Keep the current Oracle answers and cart in local application state.
- Do not fabricate email addresses or assume that an anonymous visitor is already a Klaviyo profile.
- Do not require newsletter subscription to use the store.

### When a visitor submits information

1. Profile and Oracle writes remain behind the server-side mode and recipient gates.
2. Save preferences only when the visitor submits the Oracle form.
3. Send event data with stable event IDs; do not infer an authenticated profile from client identifiers.
4. Request email subscription only after explicit consent.
5. Allow the configured welcome flow to act when subscription and list-entry conditions are met.

Any retrospective session-event synchronization should be an explicit implementation decision with appropriate disclosure and consent handling, rather than an assumption that Klaviyo automatically imports all anonymous activity.

Camp uses an application Route Handler and does not load a Klaviyo web-chat widget.

## 10. End-to-End Demonstration

1. Visit the Oracle and receive an Ember recommendation.
2. Inspect Ember at the Market and add it to the backpack.
3. Subscribe at the Post Office using a test address controlled by the tester.
4. Complete email confirmation if double opt-in is enabled.
5. Open the Klaviyo profile and show the saved companion preference and relevant events.
6. Preview or review the corresponding welcome email, depending on the flow's state.
7. Ask the Camp character a product question and verify the in-game server response; the Client API event contains only the selected topic, not the raw question.

An accepted API request is not always evidence that asynchronous processing has completed. Verify the resulting profile, event, subscription, or message state in Klaviyo before claiming that step is complete.

## 11. Setup Checklist

- [ ] Private API key created with the required scopes.
- [ ] Private key stored only in server-side configuration.
- [ ] SIDEQUEST Newsletter list created and its List ID recorded.
- [ ] Test profile contains the Oracle properties.
- [ ] Market and Oracle test events appear on the correct profile.
- [ ] Welcome flow contains companion-specific content and a general fallback.
- [ ] Opt-in and subscription confirmation behavior are understood and tested.
- [ ] Customer Agent knowledge and guidance are configured, if included.
- [ ] Camp route and failure fallback are accessible; no external web-chat widget is required for this showcase.
- [ ] Missing configuration and service failures have useful UI fallbacks.
- [ ] Demo orders remain separate from real purchases and revenue reporting.
- [ ] The complete journey works without requiring game navigation or newsletter subscription.
