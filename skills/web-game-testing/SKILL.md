---
name: web-game-testing
description: Validate browser games with DOM interfaces using targeted Vitest logic tests and Playwright journeys, including canvas interaction, input focus, lifecycle leaks, persistence, responsive behavior, and service failures. Use for meaningful game/web regression checks; do not add broad test suites for purely decorative edits.
---

# Web game verification

Inspect the existing test runner, package scripts, engine version, and affected behavior. Use existing infrastructure where suitable. Select checks based on the change instead of installing every tool or repeating all suites for each edit.

## Choose the right layer

| Behavior | Useful verification |
| --- | --- |
| Cart arithmetic, quantity validation, recommendation rules | Pure domain tests, using Vitest if the project uses Vite and has no established runner |
| Storage recovery and integration adapters | Focused tests with invalid data and controlled failures |
| Navigation, dialogs, checkout, view synchronization | Playwright browser journeys with user-facing assertions |
| Movement, collision, camera transforms, input ownership | Real browser engine run with observable player/scene behavior |
| Sprite alignment, occlusion, visual fidelity | Rendered inspection and a few stable reference screenshots |

Do not use a DOM emulator as evidence that WebGL rendering, physics, or real keyboard arbitration works. Browser-device emulation also does not establish real phone performance or GPU compatibility.

## Test the actual journey

Use semantic role/name locators for web controls and retrying assertions for observable readiness. Isolate storage and network fixtures per test. Wait for a scene-ready signal or loaded UI, not a fixed sleep; continuously running games may never reach a useful network-idle state.

At least one relevant test should exercise a real canvas interaction. A DOM navigation shortcut can validate the fallback route but does not prove map hotspots or movement work. If canvas state is otherwise opaque, a development/test-only read-only adapter may expose readiness, coordinates, and scene identity. It must not replace actual user input or enable production-only cheats.

Read [journey-matrix.md](references/journey-matrix.md) to select regression cases. Do not mechanically implement every row when unrelated to the change.

## Control nondeterminism

- Use fixed test data and deterministic recommendation rules. Seed randomness only where the application supports it.
- Freeze or disable decorative animation for screenshot comparison while retaining real movement for interaction tests. Wait for fonts and textures before visual capture.
- Prefer bounded state polling over global fake clocks for a running engine. Global clock substitution can break animation frames, physics, and readiness.
- Mock external providers at the request boundary for failure handling and deterministic browser tests. Label these results as mocked; they do not establish account-side delivery.
- Use configured test recipients/accounts for any explicitly authorized live integration test. Do not send real messages merely to make a test pass.

## Report what was verified

Run the relevant logic tests, browser checks, production build, and typecheck when the code change warrants them. Do not infer type safety from Vite transpilation alone. Report failed or unavailable checks precisely. For visual work, inspect an actual render; a passing build is not visual QA.

Capture enough evidence to distinguish implementation failure from an unsupported browser test environment. Re-run or expand checks only when a new change or unresolved concern justifies it.

Sources consulted 2026-11-02: [Playwright practices](https://playwright.dev/docs/best-practices), [device emulation](https://playwright.dev/docs/emulation), [Vitest guide](https://vitest.dev/guide/). Consult installed-version docs for runner configuration and clock APIs.
