# SIDEQUEST pitch and demo guide

SIDEQUEST turns a small storefront into an explorable village. The presentation should show how product discovery, customer preferences, explicit consent, cart intent, stock alerts, and support become a connected Klaviyo journey. Lead with the customer experience, then reveal the integration behind it.

The main script takes about 7–8 minutes including clicks. Text under **Say** is spoken; **Show** is the screen action. The customer scenario is hypothetical, while the features and verification evidence described here belong to the implemented project. Products and checkout are fictional demos.

## Prepare before presenting

- Open [the village](https://sidequest.raul.engineer/), [the Klaviyo flows](https://www.klaviyo.com/flows), the prepared test profile, [the catalog feed](https://sidequest.raul.engineer/catalog/klaviyo.json), and the received test emails in separate tabs.
- Use a clean browser session for the on-stage journey. Keep the identity used for the pending cart rehearsal separate: completing checkout with that identity would affect its flow filter.
- Choose **Calm → Nature** in the Oracle. This gives a consistent Moss story. Use an already authorized demo email for profile saving; new `+aliases` need explicit entries in the server allowlists before that part of the demo.
- Show a recorded Welcome rather than expecting an existing subscriber to re-enter the Welcome flow. A fresh live subscription requires explicit consent and its confirmation email.
- Keep Bolt sold out. Use the stock recording to show the completed restock cycle; changing inventory during the pitch requires a deployment and catalog sync.
- Have the clips in local `artifacts/rehearsal/` ready. They are sequences of actual captures, not recordings of the elapsed email delay. `cart-preview-verified.mp4` is a template preview; use `cart-automatic-verified.mp4` only after the follow-up has verified the automatic delivery.
- Prepare the local fallback while online with `npm run demo:build`. Start it with `npm run demo:start` and open <http://127.0.0.1:3110>. All provider operations there are simulated.

## Main pitch

### Opening

**Time:** 0:00–0:30

**Show:** The animated village. Move a few steps and point out the four destinations without opening every panel yet.

**Say:**

“SIDEQUEST is an explorable storefront where every place represents a step in the customer journey. The Market helps you discover products, the Oracle learns what you like, the Post Office handles permission to stay in touch, and Camp offers help. Klaviyo connects those interactions to profiles, events, and relevant follow-up messages. I’ll show that through one customer’s visit.”

### Meet the customer and discover a preference

**Time:** 0:30–1:25

**Show:** [Oracle](https://sidequest.raul.engineer/?visit=oracle) → **Calm — something gentle** → **Nature** → Moss.

**Say:**

“Imagine Maya is looking for a small companion for her desk. She likes the products, but she’s not sure which one fits her. The Oracle asks two simple questions and recommends Moss.

“This recommendation uses a deterministic rule. A calm mood maps to Moss, and the second answer can suggest an alternative. That makes the result quick, predictable, and easy to explain. The useful marketing signal is the preference Maya intentionally shared.”

**Show:** **Remember this reading**. Save with the approved demo identity if doing this live, then show its Klaviyo profile properties.

**Say:**

“If Maya asks us to remember the reading, the server saves `preferred_companion`, `desk_mood`, and `visual_style` to her Klaviyo profile. For this example, that’s Moss, calm, and nature. Saving a preference is a separate action from subscribing to marketing.”

### Ask for permission at the Post Office

**Time:** 1:25–2:15

**Show:** [Post Office](https://sidequest.raul.engineer/?visit=post). Point to the email field and initially unchecked consent box. Switch to the recorded confirmation and personalized Welcome.

**Say:**

“The Post Office gives Maya a clear choice: receive companion news and village updates. It uses explicit consent and double opt-in. The website reports that the request was accepted; the confirmation email completes the subscription.

“The Welcome is a native Klaviyo flow. Its template reads the saved preference, so Maya gets the Moss version. The same experience that helped her discover a product now makes the follow-up more relevant.”

**Avoid:** Submitting the form again just to force another Welcome. Its configured re-entry rule is once per profile.

### Connect shopping intent to a flow

**Time:** 2:15–3:15

**Show:** [Market](https://sidequest.raul.engineer/?visit=market) → **Show me the companions** → browse to Moss → **Add to bag**. Open the Raven Ledger with **L**. Point to `Viewed Product` and `Added to Cart`.

**Say:**

“Maya adds Moss to her bag. That creates an `Added to Cart` event with the product, image, quantity, cart contents, and a return URL. I emit it from the completed cart action, with a stable event identity for retries.

“If Maya leaves, Klaviyo’s abandoned-cart flow waits one hour. It checks that she can receive email and that no demo checkout has been completed since entering the flow. Smart Sending also controls frequency. The email can then show the companion she left behind and take her back to the shop.”

**Show:** The actual flow’s trigger, one-hour delay, filters, and email. Use the recorded email for the delayed step. Identify a preview as a preview if that is the available clip.

**Avoid:** Completing the demo order in the same abandoned-cart scenario. Use a separate identity if demonstrating the completed-order branch.

### Handle an unavailable product

**Time:** 3:15–4:05

**Show:** [Bolt](https://sidequest.raul.engineer/products/bolt). Point to **Sold out**, the disabled purchase action, and the one-time restock request. Show the catalog feed and the stock recording.

**Say:**

“Maya also likes Bolt, but it’s unavailable. She can request a one-time stock alert without joining the newsletter.

“The public catalog feed supplies stable product IDs, prices, images, and inventory. In Klaviyo, the inventory fields are mapped to its native inventory fields. The request uses the native back-in-stock subscription API. Klaviyo holds the recipient at a stock delay, then sends the alert when inventory returns. We verified that complete cycle and restored Bolt to zero stock for this demo.”

### Offer help in the same experience

**Time:** 4:05–4:50

**Show:** [Camp](https://sidequest.raul.engineer/?visit=camp). Ask: **“I want a calm SIDEQUEST companion under $20. What do you recommend?”** Follow up: **“What was its price?”** Skip email if you only need an anonymous conversation.

**Say:**

“Camp is Finn, the village guide. This panel calls Klaviyo Customer Agent through a server-side adapter and carries the conversation ID across turns. The agent’s SIDEQUEST skill uses our catalog, so its recommendations can refer to the products shown in the game.

“The connection is real, and this showcase uses Klaviyo’s preview mode. Private agent credentials stay on the server. Anonymous visitors can still ask for help.”

### Bring the customer back into the world

**Time:** 4:50–5:35

**Show:** Open the received Moss Welcome and follow its link, or use the recorded journey. It opens a letter, then **Visit Moss at the Market** opens the relevant product. The direct demonstration link is [the Moss letter](https://sidequest.raul.engineer/?letter=moss).

**Say:**

“The email brings Maya back to a specific moment in the experience. The letter deep link selects the right content, and the next action opens the matching companion at the Market.

“Klaviyo’s `_kx` parameter supports email-link attribution. The application captures it, removes it from the visible URL, and records the letter-open event. That connects discovery, follow-up, and the return visit.”

### Explain how the integration was built

**Time:** 5:35–7:15

**Show:** Keep the architecture summary below or the repository open. Then show the Raven Ledger and the three Live flows. Show configuration names only, never key values.

**Say:**

“The frontend uses Next.js, React, TypeScript, and Phaser. Phaser runs the world, movement, animation, and collision. React owns the accessible dialogue, product panels, forms, and shared bag.

“I divided the Klaviyo integration into two paths. Browser-safe Client APIs handle behavioral events and restock requests using the public Site ID. Next.js Route Handlers handle trusted operations such as profile saves, newsletter subscriptions, and Customer Agent conversations with scoped private keys.

“The server validates request shapes and supported values. Public newsletter signup and live Camp chat use Vercel BotID, and the routes have request limits. Existing-profile writes are restricted to invited test addresses because this demo doesn’t have account authentication.

“Klaviyo owns the profiles, consent state, catalog, flow delays, and email execution. The application owns the experience and the meaning of each action.

“The Raven Ledger makes the result visible. `Accepted` means the API accepted a request; confirmed inbox delivery is separate evidence. In the local fallback, it explicitly says `simulated`. That keeps the demo honest when a provider or network is unavailable.”

### Close

**Time:** 7:15–7:45

**Show:** Return to the village with the Ledger closed.

**Say:**

“SIDEQUEST demonstrates how an interactive storefront can collect useful intent, respect permission, and continue the customer journey through Klaviyo. The next production step would connect the same model to real inventory, authenticated accounts, and checkout. The business opportunity is more relevant discovery and follow-up; measuring its effect on engagement and conversion would be the next experiment.”

## What each section is for

| Section | Customer purpose | Klaviyo or application role |
| --- | --- | --- |
| Village and quest card | Orient the visitor and make discovery inviting | Location-visit events capture intentional visits; ambient animation is presentation, not a stream of tracking events |
| Market and Milo | Browse and compare Ember, Moss, and Bolt | Product views and add-to-cart events carry product IDs and discovery context |
| Oracle | Express a preference and receive a recommendation | Local deterministic recommendation; optional explicit profile save; Oracle-completed event |
| Post Office and Pip | Choose to receive updates | Explicit email consent, double opt-in, newsletter list, and personalized Welcome flow |
| Camp and Finn | Ask questions without leaving the journey | Server-mediated Customer Agent conversation; question-topic event excludes raw chat text |
| Bag and demo receipt | Keep the selection consistent across map, shop, and product routes | One persisted browser cart; `Started Checkout` and `Sidequest Demo Checkout Completed`; no real payment or `Placed Order` metric |
| Sold-out product form | Ask for a single relevant availability alert | Native back-in-stock subscription tied to a catalog variant; stock-delay flow |
| Letters | Return from email to relevant content | Validated `?letter=` routes, `_kx` attribution, letter-open event, direct product encounter |
| Raven Ledger | Understand what the integration did | A browser-session activity view with simulated, accepted, sent, failed, or skipped states; not a durable server audit system |
| Shop and product pages | Provide direct URLs and a familiar shopping route | Same bag and product IDs; readable product metadata and public assets usable by email/catalog consumers |

## Implementation details for technical questions

| Path | What it sends or does | Where to show it |
| --- | --- | --- |
| Browser → Klaviyo Client API | `Viewed Product`, `Added to Cart`, `Started Checkout`, custom discovery/letter/demo events | [`clientApi.ts`](../src/features/klaviyo/clientApi.ts), [`track.ts`](../src/features/klaviyo/track.ts), [`klaviyoMetrics.ts`](../src/domain/klaviyoMetrics.ts) |
| Browser → Klaviyo Client API | Native back-in-stock subscription, EMAIL channel, variant `$custom:::$default:::bolt` | [`backInStock.ts`](../src/features/klaviyo/backInStock.ts) |
| Browser → Next.js → Klaviyo | Oracle upsert of three derived profile properties, with response verification | [`oracle.ts`](../src/server/klaviyo/oracle.ts) |
| Browser → Next.js → Klaviyo | Newsletter job after consent validation, bot check, and double-opt-in list check | [`subscriptions.ts`](../src/server/klaviyo/subscriptions.ts), [`newsletter-list.ts`](../src/server/klaviyo/newsletter-list.ts) |
| Browser → Next.js → Customer Agent | Create a conversation; send its ID, mode, and message history; map returned message/product/handoff events | [`customerAgent.ts`](../src/server/klaviyo/customerAgent.ts) |
| Public catalog → Klaviyo | Product IDs and metadata, mapped inventory quantity and policy | [`catalog-feed.ts`](../src/domain/catalog-feed.ts), [catalog setup](PRODUCT-PAGES.md) |
| Delivered email → browser | Capture `_kx`, select a public letter, open the relevant encounter | [`identity.ts`](../src/features/klaviyo/identity.ts), [`letters.ts`](../src/domain/letters.ts), [`post.ts`](../src/features/encounters/post.ts) |

These are REST integrations with explicit JSON:API payloads, not a Klaviyo SDK dependency. Standard adapters use the pinned `2026-10-15` revision; Customer Agent uses `2026-10-15.pre`.

For the aligned Calm/Nature example, the saved profile properties are:

```json
{
  "preferred_companion": "moss",
  "desk_mood": "calm",
  "visual_style": "nature"
}
```

The profile-save endpoint currently derives these properties from the mood. The selected realm also appears in the Oracle event and can affect the local alternative recommendation; do not claim the profile endpoint independently persists every realm choice.

### Questions worth preparing

**Is the Oracle powered by AI?** Its recommendation is deterministic. Camp uses Customer Agent for conversational help. These are separate systems.

**What makes the integration more than email capture?** It connects product and location events, explicit preferences, separate consent, native inventory alerts, conversational support, and personalized return links. Show the profile, flow, received message, and return destination as evidence.

**How do you avoid duplicates?** Each logical client event gets a `unique_id` reused for its retry. Once-per-location tracking is scoped to the anonymous identity. This does not imply every operation is globally exactly-once. Ambiguous subscription outcomes are not automatically replayed.

**What is actually persisted?** Klaviyo stores provider-side profile, consent, event, and conversation data. The demo bag, remembered identity, and reading use browser storage. The Ledger is session storage. The game does not have a separate durable commerce database or cross-device cart.

**Is an email address authentication?** It is an attribution identifier. This version uses allowlists for profile writes and invited operations. A production version needs verified account ownership before allowing general updates to existing customer profiles.

**How is the server protected?** Input and origin checks, request-size limits, BotID for the relevant public routes, redacted responses, and per-instance rate limits. The in-memory limiter is best-effort, not a distributed abuse-control system.

**Does it process orders?** Checkout is simulated. The completion metric is explicitly named `Sidequest Demo Checkout Completed` with demo properties; it does not create real revenue or emit `Placed Order`.

**Why might a cart email not arrive during the pitch?** The flow waits one hour and Smart Sending can skip recipients who recently received a message. Use the prepared evidence or a fresh, correctly consented test profile. Never present an API 202 or a preview as proof of automatic delivery.

**What would you measure in a real launch?** Hypotheses include product-discovery completion, preference-save rate, confirmed opt-in rate, return visits from email, and conversion after an alert. No uplift or ROI has been measured for this demo.

## Short version

For a three-minute slot, show Oracle → Market → Ledger → received Welcome → Bolt stock recording. Keep Camp and the architecture table for questions.

“SIDEQUEST is an interactive storefront built as a small village. Imagine Maya wants a desk companion but doesn’t know which one to choose. The Oracle learns her mood and recommends Moss. If she asks us to remember that choice, we save it to her Klaviyo profile. Newsletter permission is a separate choice at the Post Office, with double opt-in.

“At the Market, product views and cart actions become Klaviyo events. The abandoned-cart flow uses that intent, a one-hour delay, and completion and consent filters. If Maya’s preferred product is unavailable, a native back-in-stock request connects her to the catalog’s inventory state.

“The Welcome can use her saved preference, and its link returns her to a Moss letter inside the village. Camp adds conversational help through Customer Agent. The Ledger shows whether each operation was simulated, accepted, or failed.

“I built two integration paths: browser-safe Client APIs for events and stock requests, and server-side Route Handlers for private profile, subscription, and agent operations. Klaviyo handles the customer data and email automation; the game gives those signals a meaningful context. Checkout is a demo, while the tested profile, consent, event, Welcome, and stock-email integrations are real.”

## Evidence and recovery during the pitch

Consult the dated [account runbook](KLAVIYO-ACCOUNT-RUNBOOK.md#verified-rollout--november-3-2026) for flow IDs, settings, and delivery status. Use the final test and production verification report supplied with this release for build-specific results.

If the network fails, switch to the prepared localhost demo and say: “This is the same interaction running locally. The Ledger marks these operations as simulated. Here is the recorded provider-side result from the live rehearsal.” Keep the original live outcome and the current simulation clearly labeled.

If time is short, use the direct `?visit=` links rather than walking between buildings. Use recorded delivery for the timed flows. Do not edit production keys, reset inventory, or change flow delays during the presentation.
