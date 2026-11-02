# Lifecycle and input ownership

Use a per-host adapter with a narrow interface, for example `dispatch(command)`, `subscribe(handler)`, and `dispose()`. These are suggested application boundaries, not Phaser APIs. Subscribe before exposing readiness so that initialization events are not lost. Rehydrate the current application snapshot whenever a scene becomes ready; transient events alone cannot restore state after a restart.

In Next.js, place the engine host behind a Client Component's `next/dynamic(..., { ssr: false })` boundary. Keep Phaser runtime imports in the dynamically loaded module. A normal Client Component can still be prerendered, so a top-level browser API access is not safe merely because the file says `'use client'`. Shared application state should outlive route-specific game instances; choose a common client provider when the world and Shop view occupy separate routes.

## Teardown

Track each resource where it is created: external bus listeners, DOM/window handlers, observers, timers, audio resources, and async work. Scene-owned resources and global listeners have different lifetimes. A listener on a long-lived game or application emitter can survive a scene restart and must be removed using its original callback/context.

In documented Phaser versions, `game.destroy(true)` requests destruction and removes the canvas; completion is deferred to the game loop. The second `noReturn` argument is intended for applications that will never create another game instance. Do not use `destroy(true, true)` in an ordinary React remount cycle. Check installed-version behavior before choosing recreation sequencing; listen for destruction completion where resources must not overlap.

Use effect cleanup that reverses setup. If initialization uses dynamic import, a cancellation/disposed flag must prevent a late result from mounting. Do not fix StrictMode duplication using a permanent "already initialized" flag that also blocks legitimate remounts.

## Keyboard and pointer arbitration

Represent whether gameplay currently owns input explicitly. A modal, text input, textarea, select, contenteditable region, or inactive game view should yield control to the DOM. Check key capture/default-prevention configuration as well as movement handlers: ignoring movement is insufficient if a global keyboard listener still blocks arrow keys in a form.

When ownership changes, stop current velocity and clear held-key state using supported engine APIs. Resume only after focus returns to gameplay. Overlay buttons must not also trigger canvas movement through event propagation. Native DOM controls provide focus, activation, and labels for locations even when their visual counterparts are drawn on canvas.

If a game view is hidden instead of unmounted, decide whether to sleep its scene or pause its loop/audio. Remove that pause on return and restore a valid camera/viewport. Avoid dispatching analytics from an animation update loop or a render effect.

## Acceptance scenarios

1. Mount, unmount before loading completes, then mount again: one active game and no late orphan canvas.
2. Restart a scene twice, then interact once: one application action.
3. Hold a movement key, open a form, type and use arrows: the visitor stops and form input works.
4. Change cart state repeatedly: the game instance survives and only the relevant companion display changes.
5. Resize and scroll the page, then tap a known destination: coordinates still target that destination.
6. Load the game URL directly in a production Next.js build, navigate to Shop view and back: no server-side browser API error, duplicate game, or lost cart.

Sources: [Phaser game setup](https://github.com/phaserjs/phaser/blob/master/skills/game-setup-and-config/SKILL.md), [Phaser events](https://github.com/phaserjs/phaser/blob/master/skills/events-system/SKILL.md), [React useEffect](https://react.dev/reference/react/useEffect), [Next.js lazy loading](https://nextjs.org/docs/app/guides/lazy-loading). Engine lifecycle findings were cross-checked through Context7 on 2026-11-02.
