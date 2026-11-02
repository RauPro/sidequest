# Selectable regression scenarios

Use only scenarios relevant to the changed behavior and product requirements. These describe outcomes, not required test filenames or implementation details.

| Scenario | Observable result |
| --- | --- |
| Visit a map location by pointer | Correct DOM panel opens; a background tap does not accidentally move the player through the panel |
| Open the same destination by keyboard | Visible focus, equivalent information, usable controls |
| Hold a movement key and open a form | Movement stops; typing, arrow editing, and form navigation remain functional |
| Close a modal | Focus returns to its opener or a stable equivalent; no duplicate interaction |
| Restart a scene or remount the host | One active canvas and one domain action per interaction |
| Enter a game route directly in the production Next.js build | No server-side browser API error; loading resolves to an interactive game |
| Navigate world to shop and back with client routing | Shared cart survives; game remounts without duplicate callbacks |
| Hydrate a browser-saved cart | Initial server/client markup agrees; persistence does not erase stored items |
| Send malformed or unauthorized input to a Route Handler | Appropriate failure response; no unintended provider call |
| Render two visitors with different private state | No shared server-store or cache disclosure |
| Add products from village and Shop view | Shared quantities, item count, and totals agree |
| Reload a saved cart | Valid products survive; malformed or unsupported storage does not crash the app |
| Block storage writes | Current shopping session still works |
| Complete checkout rapidly twice | One order snapshot and one completion event |
| Clear cart after checkout | Confirmation retains original line items and total |
| Retake or skip recommendation dialogue | Consistent answer handling and explanations; every intended product is reachable |
| Walk a bridge or narrow passage | Ground footprint stays within traversable geometry; occlusion changes correctly |
| Resize and scroll before a map click | Pointer coordinates still resolve to the intended world destination |
| Open on a narrow viewport | Primary controls and checkout remain reachable; no essential clipped content |
| Enable reduced motion | Optional effects reduce; core shopping remains usable |
| Fail a texture or optional service | Useful fallback remains; loading or error state is explicit |
| Provider returns timeout, 429, or validation failure | Bounded retry where appropriate; recoverable truthful UI; stable logical event ID |
| Start demo mode without provider credentials | Pages build and render; no accidental live request or secret requirement |

For performance investigations, measure the target device and the actual scenario: startup to usable scene, frame pacing while moving, and memory/listener behavior over repeated open-close cycles. Avoid inventing universal performance thresholds from a desktop run. Capture console and failed asset-request evidence when diagnosing initialization problems.

For a reference-image comparison, inspect composition, pixel scale, sprite edges, readable UI, and foreground overlap separately. Do not bless an image mismatch by regenerating the baseline before understanding it.
