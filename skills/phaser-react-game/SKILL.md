---
name: phaser-react-game
description: Build or debug 2D browser games that embed Phaser in Next.js with React and TypeScript, including client-only loading, scene lifecycle, input ownership, resizing, and communication with DOM interfaces. Use for Phaser-based worlds and game/web integration; ordinary React pages do not need this skill.
---

# Phaser with React

Keep frame-by-frame simulation in Phaser and application UI in React, with Next.js App Router as the application framework for this stack. Preserve the installed engine major; do not upgrade an existing game just to match an example.

## Establish the implementation boundary

- Inspect package versions, lockfile, App Router boundaries, game mounting, and existing state ownership. For a new project, use a Next.js App Router setup and consult the official Phaser/Next.js template for engine integration. Check its dependencies and router conventions before adopting code.
- Use Context7 when available: resolve Phaser, then query the installed major and the specific API involved. If retrieved examples target another major, verify against installed types and official documentation. Do not assume a template title identifies its actual version.
- Phaser owns movement, camera, collisions, sprites, and transient scene objects. React owns navigation, product panels, forms, cart, and accessible dialogue.
- Keep application data outside scene instances. Exchange typed semantic commands such as `open-location` or `inspect-product`; avoid publishing player coordinates to React every frame.
- Load the engine through `next/dynamic` with `ssr: false` inside a Client Component. Keep runtime Phaser imports behind that boundary; `'use client'` alone does not disable prerendering. Instantiate and access browser APIs only on the client.
- Keep server endpoints and provider credentials outside the game bundle. Send intentional integration actions to Next.js Route Handlers, which validate them independently.

## Mount and restart safely

Read [lifecycle-and-input.md](references/lifecycle-and-input.md) when implementing the engine host, scene restarts, focus, or route changes.

Give each mounted host its own game instance and scoped bridge. Register listeners once with explicit cleanup. Verify development StrictMode, hot reload, and unmount/remount instead of suppressing them to hide duplicate initialization. Dispose external subscriptions on scene shutdown as well as application teardown where appropriate.

Do not recreate the game when cart contents or an open panel change. Send a command or update the relevant subscription instead. When an asynchronously loaded engine finishes after unmount, prevent it from creating an orphan canvas.

## World interaction

- Use the reference's projection deliberately; an oblique illustration does not require a mathematically isometric tilemap. For a single authored scene, layered images and explicit collision/interaction data may be sufficient.
- Define walkable areas independently of art. Choose simple bounds, grid/path data, or supported physics according to the map. A visual polygon does not automatically become a supported physics body.
- Use foot-level anchors for ground contact and appropriate depth sorting. Split foreground occluders; bridges or multiple elevation levels may need explicit depth bands and navigation connections beyond Y sorting.
- Normalize diagonal movement and use the engine's timing/physics units consistently. Do not multiply a physics velocity by delta a second time.
- For tap-to-move, use reachable paths when obstacles exist. A straight tween toward a click can pass through walls.
- Scope movement to active gameplay. Stop velocity and release held input on blur or when a panel takes focus. Preserve browser scrolling and typing outside the game.
- Convert pointer coordinates through the engine's camera/scale APIs. Define camera cropping and UI reflow for small screens instead of shrinking the whole desktop composition.

## Verify the changed behavior

Exercise one location with pointer and keyboard, open and close its panel, resize, restart the scene, and unmount/remount. Check for duplicate canvases, callbacks, continued movement while typing, and stale object references. Confirm the direct web interface still functions when the scene fails to load.

## Sources

Consulted 2026-11-02; recheck version-specific APIs during implementation.

- [Official Phaser/Next.js template](https://github.com/phaserjs/template-nextjs)
- [Next.js client-only loading](https://nextjs.org/docs/app/guides/lazy-loading)
- [Phaser documentation](https://phaser.io/oss/docs/phaser/getting-started/project-templates)
- Context7: resolved `/phaserjs/phaser` for game destruction and scene event lifecycle.
- [React effect lifecycle](https://react.dev/reference/react/useEffect)
