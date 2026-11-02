# Domain behavior and persistence

Adapt these boundaries to the existing project rather than forcing a store package or directory layout.

## Cart

Use domain operations such as add, set quantity, remove, and clear. Validate at those boundaries so both scene interactions and web controls behave identically. Empty state is a normal state. Decide whether setting quantity to zero removes an item or produces validation; keep the interface consistent with that decision.

Calculate line totals and subtotal from current catalog values. Keep currency conversions outside the cart unless explicitly required. Reject non-integers, non-finite values, negatives, excessive quantities, unknown IDs, and totals beyond safe arithmetic bounds. Disable unavailable products in the interface and enforce the same rule in the action.

## Storage hydration

1. Read a namespaced, versioned record once at initialization.
2. Catch access and JSON parsing failures without crashing the app.
3. Validate or migrate known schema versions. Discard unsupported fields; handle retired IDs and invalid quantities according to a documented recovery rule.
4. Commit the recovered in-memory state, then enable persistence.
5. Report persistence failure only as usefully as the product requires; keep the current session usable.

Do not persist secrets, raw payment information, or unnecessary contact data. Persisting totals is unnecessary if they can be derived. If cross-tab synchronization is in scope, define conflict behavior and avoid echoing storage updates indefinitely; do not add it to a single-tab prototype without need.

## Recommendations

Keep a versioned scoring/mapping function with supported answer IDs and deterministic ties. Exercise at least one path for every product, repeated identical answers, changed answers, and skip/incomplete input. Separate "no completed recommendation" from a real product recommendation. Use the answers actually scored in the explanation.

## Demo checkout

Capture a reviewable order snapshot containing product IDs, names, unit amounts, quantities, currency, and total. When completion begins, lock further completions and define whether cart edits are blocked. Keep the snapshot stable even if the catalog or cart later changes.

Assign one demo order ID per logical completion. Repeated clicks must not create additional orders or analytics events. The confirmation reads from the snapshot rather than a cart that may already have been cleared. Define when the cart clears and what remains visible after a reload. Do not silently retry a real payment using a new purchase identity.

## Useful checks

- Add two different products from two different views; counts and totals agree.
- Reload with a valid, corrupted, and obsolete saved cart; the application remains usable.
- Fail storage writes; shopping continues in memory.
- Complete checkout twice rapidly; exactly one snapshot and one completion event result.
- Clear the cart after completion; the confirmation retains correct items and amounts.
- Every product is reachable through valid Oracle answers, with a matching explanation.

These are application invariants, not provider API contracts. For external-store subscription details, use [React's official reference](https://react.dev/reference/react/useSyncExternalStore).
