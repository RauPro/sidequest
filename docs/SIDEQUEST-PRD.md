# SIDEQUEST — Product Requirements

> Proposed requirements for a retro game-inspired commerce experience.

## 1. Product Objective

Build an explorable, 16-bit RPG-inspired storefront where visitors discover collectible desk companions, receive a relevant recommendation, and complete a clear shopping journey.

The experience should demonstrate three strengths:

- **Distinctive design:** a coherent visual world with original characters, locations, dialogue, and interactions.
- **Useful interaction:** exploration and choices influence product discovery and recommendations.
- **Connected commerce:** customer preferences and shopping activity can support relevant communication through Klaviyo when a live integration is included.

The game world must support shopping. Visitors must also be able to browse and purchase through a direct store interface without completing a quest.

## 2. Scope and Priorities


| Priority         | Meaning                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------- |
| P0 — Core        | Required for a complete, reviewable prototype.                                           |
| P1 — Integration | Added once the core journey works, or promoted to P0 if required by the interview brief. |
| P2 — Polish      | Optional enhancements after the core and required integrations are reliable.             |




### Core scope

- One compact village map: **Willow Market**.
- One visitor character.
- Three fictional collectible desk companions.
- Four interactive locations: Market, Oracle, Camp, and Post Office.
- A backpack that acts as the cart.
- A direct **Shop view** that shares the same catalog and cart.
- A short recommendation dialogue.
- A clearly labeled simulated checkout.
- Responsive controls and an accessible alternative to map navigation.



### Out of scope for the initial version

- Combat, enemies, character leveling, or a full RPG progression system.
- Multiple maps, multiplayer, or complex quests.
- Mandatory account creation.
- Real payment processing, inventory fulfillment, or shipping operations.
- A custom CMS or large product catalog.
- Unrestricted AI behavior or autonomous purchases.



## 3. Primary User Journey

1. Enter Willow Market and understand that this is a shop for collectible desk companions.
2. Choose to explore the village or open Shop view directly.
3. Talk to the Oracle and answer a short set of preference questions.
4. Receive a recommended companion with a concise explanation.
5. Inspect the companion at the Market and add it to the backpack.
6. Review quantities and the total in the backpack.
7. Complete a clearly labeled demo checkout.
8. Optionally subscribe at the Post Office to receive relevant updates.

Visitors may skip, revisit, or exit any optional dialogue without losing their cart.

## 4. World and Navigation Requirements



### WORLD-01 — Village layout [P0]

- Display a compact illustrated village with clearly connected paths.
- Make the Market, Oracle, Camp, and Post Office visually distinct.
- Keep the map understandable without an extensive tutorial.
- Use visible labels or interaction indicators for functional locations.
- Decorative objects must not look like essential controls unless they are interactive.

**Acceptance:** A first-time visitor can locate each functional destination and understand its purpose.

### WORLD-02 — Location interaction [P0]

- Support clicking or tapping a location to open its associated interface.
- Provide keyboard-accessible controls for every location.
- Show a visible hover, focus, or selected state.
- Allow each interface to close without resetting the current journey.
- Prevent overlapping panels from obscuring essential actions.

**Acceptance:** Every location works through pointer and keyboard input; closing a panel restores a predictable state.

### WORLD-03 — Player movement [P1]

- Allow movement with arrow keys and a touch-friendly alternative.
- If tap-to-move is implemented, move toward the selected walkable destination.
- Keep the character within defined walkable areas.
- Suspend movement controls while a form field or dialogue control has focus.
- Keep direct location interaction available regardless of player movement.

**Acceptance:** The character cannot cross map boundaries, and typing in a form never moves the character.

### WORLD-04 — Direct Shop view [P0]

- Provide a persistent, clearly labeled Shop view control.
- Show the same products, prices, recommendations, and cart state as the village experience.
- Allow switching between views without losing selections.

**Acceptance:** A visitor can complete the shopping journey without navigating the game map.

## 5. Product Catalog and Market



### SHOP-01 — Product data [P0]

- Include three original fictional products: an orange dragon, a green slime, and a blue robot.
- Use **Ember** as the working name for the dragon; other names may be finalized during implementation.
- Give each product a stable ID, name, description, price, currency, image or sprite, availability state, and recommendation tags.
- Keep prices and product information consistent across every view.
- Treat all product and fulfillment information as demo content until real information is supplied.

**Acceptance:** Each product can be inspected, and its price matches the catalog, product panel, cart, and order summary.

### SHOP-02 — Merchant and product details [P0]

- Present a friendly merchant who introduces the shop through a short dialogue.
- Open a product panel containing the product image, name, description, price, and availability.
- Provide clear **Add to bag** and **Keep exploring** actions.
- Let visitors switch between products without restarting the experience.
- Prevent adding unavailable products and explain the unavailable state.

**Acceptance:** A visitor can compare all three products and add an available item with immediate visible feedback.

### SHOP-03 — Companion feedback [P2]

- After adding a companion to the backpack, optionally show its sprite following the player.
- Keep this behavior synchronized with cart contents and define which companion follows when several are selected.
- Make clear that adding a companion to the backpack does not complete a purchase.

**Acceptance:** The visual companion corresponds to a selected product and disappears or updates when that product is removed.

## 6. Oracle and Personalization



### ORACLE-01 — Preference dialogue [P0]

- Ask two or three concise questions through an RPG-style dialogue.
- Use preferences relevant to the catalog, such as desired desk mood, visual style, or companion personality.
- Allow visitors to go back, skip, or retake the dialogue.
- Preserve completed answers when switching between the world and Shop view during the session.

**Acceptance:** The dialogue is short, reversible, and does not require an email address.

### ORACLE-02 — Meaningful recommendation [P0]

- Map answers to products through explicit, deterministic rules for the initial version.
- Ensure different answer combinations can recommend different products.
- Explain the recommendation using the visitor's actual choices.
- Provide a direct action to inspect the recommended product.
- Allow visitors to choose another product freely.

**Acceptance:** At least one valid answer combination recommends each product; repeating the same answers produces the same result.

### ORACLE-03 — Optional quest [P2]

- Frame product discovery as a short quest: **Find your desk companion**.
- Reflect actual progress, such as completing the Oracle dialogue or inspecting a product.
- Do not require quest completion to browse, subscribe, or check out.

**Acceptance:** Quest progress responds to completed actions and never blocks shopping.

## 7. Camp and Customer Assistance



### HELP-01 — In-world support [P0]

- Provide a friendly character at the Camp who offers product and store information.
- Include predefined topics such as product details, shipping, returns, and how the demo works.
- Use supplied or explicitly fictional demo policies; do not invent real delivery or return promises.
- Preserve the brand's voice while keeping answers clear.

**Acceptance:** Each predefined topic returns an appropriate answer without requiring a live AI service.

### HELP-02 — Live conversational assistance [P1]

- Connect a supported chat service only when the assignment and available account support it.
- Keep responses grounded in approved product and policy information.
- Indicate loading, failure, and unavailable states.
- Provide a useful FAQ fallback if the service fails.
- Do not present scripted answers as evidence of a working AI integration.

**Acceptance:** The live path can be demonstrated, and service failure leaves basic support available.

## 8. Backpack and Checkout



### CART-01 — Cart behavior [P0]

- Show a persistent bag control with a clearly defined item count.
- Support adding products, changing positive integer quantities, and removing products.
- Show line items, quantities, unit prices, and the total.
- Handle an empty cart with a useful return-to-shopping action.
- Use one shared cart state across the map and Shop view.
- Preserve the demo cart across page reloads using suitable local persistence.
- Calculate amounts accurately, using integer minor currency units or equivalent decimal-safe handling.

**Acceptance:** Quantities, item count, and totals remain correct after additions, removals, view changes, and reloads.

### CHECKOUT-01 — Demo checkout [P0]

- Clearly identify the flow as a simulated purchase.
- Present a reviewable order summary before completion.
- Avoid collecting real payment details.
- Show an explicit demo confirmation and define what happens to the cart afterward.
- Prevent repeated clicks from creating duplicate demo completions.
- Keep transactional details separate from marketing subscription choices.

**Acceptance:** The visitor can complete a demo order, recognize that no payment occurred, and see the correct items and total.

### CHECKOUT-02 — Real commerce integration [P1, only if requested]

- Replace simulated behavior with the required payment or commerce provider.
- Validate pricing and availability on a trusted backend.
- Handle payment success, cancellation, failure, and duplicate callbacks.
- Show purchase success only after confirmed provider success.

**Acceptance:** The required provider's test flow works end to end before any production purchasing is enabled.

## 9. Post Office and Email Subscription



### EMAIL-01 — Subscription interface [P0]

- Present subscription as receiving letters or updates from the village.
- Explain what the visitor will receive.
- Request only necessary information, initially an email address.
- Include an explicit marketing consent control that is not preselected.
- Provide accessible validation, loading, success, and failure states.
- In prototype mode, clearly state that no subscription or email delivery takes place.
- Do not assume that using the Oracle or completing checkout means agreeing to marketing.

**Acceptance:** Invalid input is explained clearly, consent is explicit, and demo behavior cannot be mistaken for a real subscription.

### EMAIL-02 — Live subscription [P1]

- Connect the form to the configured Klaviyo subscription destination.
- Respect the account's configured subscription and confirmation process.
- Show a successful or pending-confirmation state only when supported by the integration response.
- Handle duplicate attempts and service failures gracefully.

**Acceptance:** A test submission produces the expected account state, with evidence available for the demo.

## 10. Klaviyo Integration Requirements [P1]

The following is a proposed integration contract. Final event names, fields, and API behavior must be checked against the selected integration and current documentation during implementation.

### Customer preferences

- Associate preferences with an identified profile only when the visitor supplies an identifier through an intended flow.
- Keep anonymous exploration usable without requiring identification.
- Suggested custom properties: `preferred_companion`, `desk_mood`, and `visual_style`.
- Do not treat profile identification as marketing consent.



### Suggested custom events


| Event                               | Trigger                                 | Suggested properties                                            |
| ----------------------------------- | --------------------------------------- | --------------------------------------------------------------- |
| `Sidequest Oracle Completed`        | A completed recommendation dialogue     | Answer IDs, recommended product ID, recommendation rule version |
| `Sidequest Product Viewed`          | A deliberate product detail interaction | Product ID, discovery source: market, oracle, or shop view      |
| `Sidequest Bag Updated`             | A cart change                           | Product IDs, quantities, cart value, currency                   |
| `Sidequest Demo Checkout Completed` | A completed simulated checkout          | Demo order ID, product IDs, quantities, demo total, currency    |


- Keep simulated order events explicitly separate from real purchase events and revenue reporting.
- Avoid duplicate events caused by rerenders or repeated completion clicks.
- Do not send an event for every movement frame or decorative interaction.
- Demonstrate one useful automation, such as a welcome message relevant to the chosen companion, if the assignment requires email automation.
- Keep private API credentials on the server and out of browser code, source control, and client logs.
- Make missing configuration and service errors visible during testing without exposing secrets.

**Acceptance:** A reviewer can trace a specific test action to the corresponding profile property or event. Any email demonstration distinguishes preview, queued, and delivered states.

## 11. Visual and Interaction Design



### DESIGN-01 — Art direction [P0]

- Use an original 16-bit RPG-inspired visual language.
- Maintain consistent pixel scale, palette, character proportions, and interface framing.
- Use original or appropriately licensed assets; avoid depending on recognizable Nintendo characters or copied game maps.
- Give each location a clear identity through shape, color, signage, and character placement.
- Keep essential text readable rather than imitating tiny console text exactly.
- Maintain strong hierarchy between the world, dialogue, product information, and primary actions.



### DESIGN-02 — Environmental polish [P2]

- Add a small number of purposeful animations: water, lanterns, idle characters, or companion movement.
- Make sound optional and user-controlled.
- Respect reduced-motion preferences.
- Keep animation and sound from interfering with forms or shopping controls.



### Visual reference

- [SIDEQUEST concept image](../ui-concepts/sidequest.png)
- The image is the visual target for the village and HUD. Match its composition, perspective, scene detail, lighting, characters, and interface framing as closely as practical, without sacrificing usability, accessibility, or the core journey.



## 12. Accessibility and Responsive Behavior



### ACCESS-01 — Input and semantics [P0]

- Make all essential actions operable by keyboard, mouse, and touch.
- Use semantic controls and visible focus indicators.
- Label form fields and associate validation messages with their inputs.
- Move focus appropriately when opening and closing dialogs; allow dismissal with Escape where appropriate.
- Do not communicate selection, availability, or errors through color alone.
- Expose cart updates and important status changes to assistive technology without announcing continuous game movement.
- Provide a text-based route to all commerce functions through Shop view and accessible navigation.



### ACCESS-02 — Responsive layout [P0]

- Support narrow mobile screens and desktop layouts without clipping essential content.
- Reflow product and dialogue panels for small screens.
- Keep primary actions within reach and provide comfortable touch targets.
- Avoid requiring hover, precise pixel targeting, or a physical keyboard.

**Acceptance:** The complete shopping journey works on a narrow mobile viewport and through keyboard-only navigation.

## 13. Reliability and Implementation Constraints

- Keep catalog data, recommendation rules, cart state, and integration code separate enough to explain and change independently.
- Use a clear source of truth for product prices and cart contents.
- Keep loading and failure states explicit.
- Preserve shopping functionality if optional animation or chat fails.
- Optimize images, sprite sheets, and scene detail so the world becomes usable promptly.
- Avoid unnecessary network requests during movement or animation.
- Separate demo mode from live integration mode through explicit configuration.
- Provide setup instructions and an environment-variable example without secrets.
- Choose the implementation stack according to the actual assignment; no game engine or frontend framework is mandated by this brief.



## 14. Validation Checklist

- [ ] Each map location opens the correct interface.
- [ ] Shop view provides an independent path through the shopping journey.
- [ ] Different Oracle answers can recommend all three products.
- [ ] Recommendation explanations match the answers supplied.
- [ ] Product details and prices are consistent across views.
- [ ] Cart quantities, count, removal, and totals work correctly.
- [ ] Cart state survives view changes and page reloads.
- [ ] Demo checkout clearly indicates that no payment occurs.
- [ ] Subscription validation and consent behave as specified.
- [ ] Loading and error states are understandable and recoverable.
- [ ] Essential actions work with keyboard and touch input.
- [ ] The mobile layout keeps all essential content and actions available.
- [ ] Optional animation respects reduced-motion preferences.
- [ ] Live integrations, if included, are verified through account-side evidence.
- [ ] Demo order events cannot be mistaken for real revenue.
- [ ] No private credentials appear in client code or logs.

Prioritize meaningful checks of recommendation rules, cart calculations, and integration failures. Do not spend limited interview time testing decorative implementation details.

## 15. Delivery Plan


| Iteration                  | Deliverable                                                               | Completion condition                                                |
| -------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1 — Complete shopping path | Catalog, product panel, shared cart, demo checkout, and direct Shop view  | A visitor can finish the shopping journey.                          |
| 2 — Explorable world       | Village map, clickable locations, merchant dialogue, and support topics   | Every important map destination leads to a useful function.         |
| 3 — Personalization        | Oracle dialogue, recommendation rules, and subscription interface         | Choices meaningfully change the recommended product.                |
| 4 — Connected experience   | Required Klaviyo profile, event, subscription, or automation integration  | A test action has verifiable downstream evidence.                   |
| 5 — Game polish            | Movement, companion follower, environmental animation, and optional quest | Enhancements preserve accessibility and the complete shopping path. |




## 16. Final Deliverables

- A runnable application with documented setup instructions.
- A clear description of implemented features and remaining limitations.
- Original or licensed assets and any necessary attribution.
- Environment-variable documentation without credentials.
- A brief explanation of state management, recommendation rules, and integration boundaries.
- Evidence of meaningful validation.
- A short demonstration that follows one visitor from discovery to cart, checkout, and any verified integration.



## Definition of Done

The agreed core journey works from discovery through demo checkout, all required integrations have verifiable behavior, users can recover from errors, and the experience remains usable without game navigation. Visual polish strengthens this journey without preventing its completion.